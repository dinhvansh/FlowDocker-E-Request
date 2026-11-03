import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { createHash, randomUUID } from "node:crypto";
import {
  validateFormDefinition,
  isFormDefinition,
  type FormDefinition,
} from "../../../packages/form-builder/src/schema.ts";
import { ApiFailure, withActor } from "./session.ts";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Publication status is a storage envelope; original engine accepts DRAFT only.
 * Restore its authoring discriminator in memory, without rewriting the snapshot. */
export function readPublishedForm(value: unknown): FormDefinition | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as Record<string, unknown>).status !== "PUBLISHED"
  )
    return null;
  const definition = { ...value, status: "DRAFT" };
  return isFormDefinition(definition) &&
    !validateFormDefinition(definition).length
    ? definition
    : null;
}
/** JSON keys are sorted recursively so checksum does not depend on key insertion order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (key) =>
            JSON.stringify(key) +
            ":" +
            canonicalJson((value as Record<string, unknown>)[key]),
        )
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function registerPublication(api: FastifyInstance, pool: pg.Pool) {
  api.get(
    "/api/v1/apps/:appId/forms/publication-permission",
    async (request) => {
      const { appId } = request.params as { appId: string };
      return withActor(
        pool,
        request.headers.authorization,
        appId,
        "forms:edit",
        async (ctx) => {
          const row = await ctx.db.query(
            "SELECT $1=ANY(capabilities) AS allowed FROM fd.members WHERE id=$2 AND tenant_id=$3 AND active",
            [`${appId}:forms:publish`, ctx.actorId, ctx.tenantId],
          );
          return { canPublish: row.rows[0]?.allowed === true };
        },
      );
    },
  );
  api.post("/api/v1/apps/:appId/forms/:id/publish", async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    if (!uuid.test(id)) throw new ApiFailure(400, "INVALID_ID");
    const expected = (request.body as { expectedVersion?: unknown } | null)
      ?.expectedVersion;
    if (!Number.isSafeInteger(expected) || (expected as number) < 1)
      throw new ApiFailure(400, "INVALID_VERSION");
    const result = await withActor(
      pool,
      request.headers.authorization,
      appId,
      "forms:edit",
      async (ctx) => {
        await ctx.requireCapability("forms:publish");
        const draft = await ctx.db.query(
          "SELECT definition,version FROM fd.form_drafts WHERE id=$1 FOR UPDATE",
          [id],
        );
        if (!draft.rowCount) throw new ApiFailure(404, "NOT_FOUND");
        if (draft.rows[0].version !== expected)
          throw new ApiFailure(409, "VERSION_CONFLICT");
        const existing = await ctx.db.query(
          "SELECT id,version,checksum FROM fd.form_versions WHERE form_id=$1 AND draft_version=$2",
          [id, expected],
        );
        if (existing.rowCount) return { created: false, ...existing.rows[0] };
        const definition = draft.rows[0].definition;
        if (
          !isFormDefinition(definition) ||
          validateFormDefinition(definition).length
        )
          throw new ApiFailure(422, "FORM_VALIDATION_FAILED");
        const next = await ctx.db.query(
          "SELECT coalesce(max(version),0)+1 AS version FROM fd.form_versions WHERE form_id=$1",
          [id],
        );
        const version = Number(next.rows[0].version);
        const published = { ...definition, status: "PUBLISHED", version };
        const checksum = createHash("sha256")
          .update(canonicalJson(published))
          .digest("hex");
        const versionId = randomUUID();
        await ctx.db.query(
          "INSERT INTO fd.form_versions(tenant_id,app_id,id,form_id,version,draft_version,definition,checksum,published_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            ctx.tenantId,
            appId,
            versionId,
            id,
            version,
            expected,
            published,
            checksum,
            ctx.actorId,
          ],
        );
        await ctx.db.query(
          "INSERT INTO fd.audit(tenant_id,actor_id,app_id,resource_id,action,version) VALUES ($1,$2,$3,$4,'FORM_PUBLISH',$5)",
          [ctx.tenantId, ctx.actorId, appId, id, version],
        );
        return { created: true, id: versionId, version, checksum };
      },
    );
    return reply.code(result.created ? 201 : 200).send(result);
  });
  api.get("/api/v1/apps/:appId/form-versions/:id", async (request) => {
    const { appId, id } = request.params as { appId: string; id: string };
    if (!uuid.test(id)) throw new ApiFailure(400, "INVALID_ID");
    // Authoring endpoint. A separately scoped forms:use endpoint accompanies requests later.
    return withActor(
      pool,
      request.headers.authorization,
      appId,
      "forms:edit",
      async (ctx) => {
        const row = await ctx.db.query(
          "SELECT id,form_id,version,definition,checksum FROM fd.form_versions WHERE id=$1",
          [id],
        );
        if (!row.rowCount) throw new ApiFailure(404, "NOT_FOUND");
        return row.rows[0];
      },
    );
  });
}
