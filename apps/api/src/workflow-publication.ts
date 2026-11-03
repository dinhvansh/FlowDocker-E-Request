import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { createHash, randomUUID } from "node:crypto";
import { ApiFailure, withActor } from "./session.ts";
import { canonicalJson, readPublishedForm } from "./publication.ts";
import {
  compileApprovalPlan,
  type ApprovalStep,
  type ExposedFields,
} from "../../../packages/approval-runtime/src/plan.ts";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function registerWorkflowPublication(
  api: FastifyInstance,
  pool: pg.Pool,
) {
  api.post(
    "/api/v1/apps/:appId/workflows/:id/publish",
    async (request, reply) => {
      const { appId, id } = request.params as { appId: string; id: string };
      const body = request.body as Record<string, unknown> | null;
      if (
        !uuid.test(id) ||
        !body ||
        Array.isArray(body) ||
        Object.keys(body).some(
          (k) => !["formVersionId", "plan", "conditionFields"].includes(k),
        ) ||
        typeof body.formVersionId !== "string" ||
        !uuid.test(body.formVersionId) ||
        !Array.isArray(body.conditionFields) ||
        body.conditionFields.length > 100 ||
        !body.conditionFields.every((k) => typeof k === "string") ||
        new Set(body.conditionFields).size !== body.conditionFields.length
      )
        throw new ApiFailure(400, "INVALID_WORKFLOW");
      const formVersionId = body.formVersionId;
      const result = await withActor(
        pool,
        request.headers.authorization,
        appId,
        "workflows:publish",
        async (ctx) => {
          await ctx.requireCapability("forms:edit");
          const form = await ctx.db.query(
            "SELECT definition FROM fd.form_versions WHERE id=$1",
            [formVersionId],
          );
          if (!form.rowCount) throw new ApiFailure(404, "NOT_FOUND");
          const definition = readPublishedForm(form.rows[0].definition);
          if (!definition) throw new ApiFailure(422, "INVALID_FORM");
          const exposed: ExposedFields = {};
          for (const key of body.conditionFields as string[]) {
            const field = definition.fields.find((f) => f.key === key);
            if (
              !field ||
              ![
                "text",
                "select",
                "radio",
                "number",
                "currency",
                "checkbox",
              ].includes(field.type)
            )
              throw new ApiFailure(422, "INVALID_CONDITION_FIELD");
            Object.defineProperty(exposed, key, {
              value: ["number", "currency"].includes(field.type)
                ? "decimal"
                : field.type === "checkbox"
                  ? "boolean"
                  : "text",
              enumerable: true,
            });
          }
          let plan;
          try {
            plan = compileApprovalPlan(body.plan, exposed);
          } catch {
            throw new ApiFailure(422, "INVALID_PLAN");
          }
          const assignees = new Set<string>();
          const visit = (steps: ApprovalStep[]) => {
            for (const step of steps) {
              if (step.kind === "approval")
                step.assignees.forEach((a) => assignees.add(a));
              else if (step.kind === "if") {
                visit(step.then);
                visit(step.else);
              } else step.branches.forEach(visit);
            }
          };
          visit(plan.steps);
          if (
            !(
              await ctx.db.query(
                "SELECT fd.valid_workflow_assignees($1::uuid[]) AS valid",
                [[...assignees]],
              )
            ).rows[0].valid
          )
            throw new ApiFailure(422, "INVALID_ASSIGNEES");
          const checksum = createHash("sha256")
            .update(
              canonicalJson({
                formVersionId: formVersionId.toLowerCase(),
                plan,
                exposedFields: exposed,
              }),
            )
            .digest("hex");
          await ctx.db.query(
            "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
            [`workflow-publish:${ctx.tenantId}:${appId}:${id.toLowerCase()}`],
          );
          const existing = await ctx.db.query(
            "SELECT id,version,checksum FROM fd.workflow_versions WHERE workflow_id=$1 AND checksum=$2",
            [id, checksum],
          );
          if (existing.rowCount) return { created: false, ...existing.rows[0] };
          const version = Number(
            (
              await ctx.db.query(
                "SELECT coalesce(max(version),0)+1 AS version FROM fd.workflow_versions WHERE workflow_id=$1",
                [id],
              )
            ).rows[0].version,
          );
          const versionId = randomUUID();
          await ctx.db.query(
            "INSERT INTO fd.workflow_versions(tenant_id,app_id,id,workflow_id,version,form_version_id,plan,exposed_fields,checksum,published_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
            [
              ctx.tenantId,
              appId,
              versionId,
              id,
              version,
              body.formVersionId,
              plan,
              exposed,
              checksum,
              ctx.actorId,
            ],
          );
          await ctx.db.query(
            "INSERT INTO fd.audit(tenant_id,actor_id,app_id,resource_id,action,version) VALUES($1,$2,$3,$4,'WORKFLOW_PUBLISH',$5)",
            [ctx.tenantId, ctx.actorId, appId, id, version],
          );
          return { created: true, id: versionId, version, checksum };
        },
      );
      return reply.code(result.created ? 201 : 200).send(result);
    },
  );
  api.get("/api/v1/apps/:appId/workflow-versions/:id", async (request) => {
    const { appId, id } = request.params as { appId: string; id: string };
    if (!uuid.test(id)) throw new ApiFailure(400, "INVALID_ID");
    return withActor(
      pool,
      request.headers.authorization,
      appId,
      "workflows:publish",
      async (ctx) => {
        const row = await ctx.db.query(
          "SELECT id,workflow_id,version,form_version_id,plan,exposed_fields,checksum FROM fd.workflow_versions WHERE id=$1",
          [id],
        );
        if (!row.rowCount) throw new ApiFailure(404, "NOT_FOUND");
        return row.rows[0];
      },
    );
  });
}
