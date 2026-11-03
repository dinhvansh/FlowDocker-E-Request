import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { createHash, randomUUID } from "node:crypto";
import { ApiFailure, withActor } from "./session.ts";
import { canonicalJson, readPublishedForm } from "./publication.ts";
import {
  validRuntimeValues,
  prepareValues,
  validatePreview,
  submissionValues,
  evaluateRule,
} from "../../../packages/form-builder/src/engine.ts";
import {
  compareDecimal,
  type ExposedFields,
  type Scalar,
} from "../../../packages/approval-runtime/src/plan.ts";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const scalarTypes = [
  "text",
  "textarea",
  "email",
  "url",
  "phone",
  "number",
  "currency",
  "date",
  "datetime",
  "time",
  "checkbox",
  "select",
  "radio",
];
const decorationTypes = ["content", "image", "divider", "alert", "button"];
export function registerRequests(api: FastifyInstance, pool: pg.Pool) {
  api.post("/api/v1/apps/:appId/requests", async (request, reply) => {
    const { appId } = request.params as { appId: string };
    const key = request.headers["idempotency-key"];
    const body = request.body as Record<string, unknown> | null;
    if (typeof key !== "string" || !uuid.test(key))
      throw new ApiFailure(400, "INVALID_IDEMPOTENCY_KEY");
    if (
      !body ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (k) => !["workflowVersionId", "values"].includes(k),
      ) ||
      typeof body.workflowVersionId !== "string" ||
      !uuid.test(body.workflowVersionId) ||
      !validRuntimeValues(body.values)
    )
      throw new ApiFailure(400, "INVALID_REQUEST_VALUES");
    const workflowVersionId = body.workflowVersionId.toLowerCase(),
      values = body.values;
    const checksum = createHash("sha256")
      .update(canonicalJson({ workflowVersionId, values }))
      .digest("hex");
    const result = await withActor(
      pool,
      request.headers.authorization,
      appId,
      "requests:submit",
      async (ctx) => {
        await ctx.requireCapability("forms:use");
        await ctx.db.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          [
            `request-submit:${ctx.tenantId}:${appId}:${ctx.actorId}:${key.toLowerCase()}`,
          ],
        );
        const previous = await ctx.db.query(
          "SELECT id,revision,input_checksum FROM fd.request_revisions WHERE idempotency_key=$1",
          [key],
        );
        if (previous.rowCount) {
          if (previous.rows[0].input_checksum !== checksum)
            throw new ApiFailure(409, "IDEMPOTENCY_CONFLICT");
          return {
            created: false,
            id: previous.rows[0].id,
            revision: previous.rows[0].revision,
          };
        }
        const workflow = await ctx.db.query(
          "SELECT form_version_id,plan,exposed_fields FROM fd.workflow_versions WHERE id=$1",
          [workflowVersionId],
        );
        if (!workflow.rowCount) throw new ApiFailure(404, "NOT_FOUND");
        const version = workflow.rows[0];
        const formRow = await ctx.db.query(
          "SELECT definition FROM fd.form_versions WHERE id=$1",
          [version.form_version_id],
        );
        const form = readPublishedForm(formRow.rows[0]?.definition);
        if (!form) throw new ApiFailure(422, "INVALID_FORM");
        if (
          form.fields.some(
            (f) =>
              (!scalarTypes.includes(f.type) &&
                !decorationTypes.includes(f.type)) ||
              f.defaultValueSource ||
              f.numbering ||
              f.dataSource,
          )
        )
          throw new ApiFailure(422, "UNSUPPORTED_SUBMISSION_SCHEMA");
        for (const name of Object.keys(values)) {
          const field = form.fields.find((f) => f.key === name);
          if (
            !field ||
            !scalarTypes.includes(field.type) ||
            field.calculation ||
            field.readOnly ||
            field.disabled
          )
            throw new ApiFailure(422, "FORBIDDEN_FIELD_WRITE");
        }
        const prepared = prepareValues(form, values);
        for (const name of Object.keys(values)) {
          const field = form.fields.find((f) => f.key === name)!;
          if (
            !evaluateRule(field.visibleWhen, prepared) ||
            evaluateRule(field.disabledWhen, prepared, false)
          )
            throw new ApiFailure(422, "FORBIDDEN_FIELD_WRITE");
        }
        if (validatePreview(form, prepared).length)
          throw new ApiFailure(422, "FORM_VALIDATION_FAILED");
        const submitted = submissionValues(form, prepared);
        const input: Record<string, Scalar> = {};
        for (const [name, type] of Object.entries(
          version.exposed_fields as ExposedFields,
        )) {
          const value = submitted[name];
          if (type === "boolean") {
            if (typeof value !== "boolean")
              throw new ApiFailure(422, "INVALID_CONDITION_VALUE");
            input[name] = value;
          } else if (type === "decimal") {
            if (typeof value !== "string" && typeof value !== "number")
              throw new ApiFailure(422, "INVALID_CONDITION_VALUE");
            try {
              compareDecimal(String(value), "0");
            } catch {
              throw new ApiFailure(422, "INVALID_CONDITION_VALUE");
            }
            input[name] = String(value);
          } else {
            if (typeof value !== "string")
              throw new ApiFailure(422, "INVALID_CONDITION_VALUE");
            input[name] = value;
          }
        }
        const id = randomUUID();
        await ctx.db.query(
          "INSERT INTO fd.request_revisions(tenant_id,app_id,id,owner_id,workflow_version_id,form_version_id,values_json,input_checksum,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            ctx.tenantId,
            appId,
            id,
            ctx.actorId,
            workflowVersionId,
            version.form_version_id,
            submitted,
            checksum,
            key,
          ],
        );
        await ctx.db.query(
          "INSERT INTO fd.approval_runs(tenant_id,app_id,id,owner_id,plan,input,exposed_fields,request_revision_id) VALUES($1,$2,$3,$4,$5,$6,$7,$3)",
          [
            ctx.tenantId,
            appId,
            id,
            ctx.actorId,
            version.plan,
            input,
            version.exposed_fields,
          ],
        );
        await ctx.db.query(
          "INSERT INTO fd.approval_start_outbox(id,tenant_id,app_id,run_id) VALUES($1,$2,$3,$4)",
          [randomUUID(), ctx.tenantId, appId, id],
        );
        await ctx.db.query(
          "INSERT INTO fd.audit(tenant_id,actor_id,app_id,resource_id,action,version) VALUES($1,$2,$3,$4,'REQUEST_SUBMIT',1)",
          [ctx.tenantId, ctx.actorId, appId, id],
        );
        return { created: true, id, revision: 1 };
      },
    );
    return reply.code(result.created ? 201 : 200).send(result);
  });
  api.get("/api/v1/apps/:appId/requests/:id", async (request) => {
    const { appId, id } = request.params as { appId: string; id: string };
    if (!uuid.test(id)) throw new ApiFailure(400, "INVALID_ID");
    return withActor(
      pool,
      request.headers.authorization,
      appId,
      "requests:submit",
      async (ctx) => {
        const row = await ctx.db.query(
          "SELECT id,revision,workflow_version_id,form_version_id,values_json FROM fd.request_revisions WHERE id=$1",
          [id],
        );
        if (!row.rowCount) throw new ApiFailure(404, "NOT_FOUND");
        return row.rows[0];
      },
    );
  });
}
