import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import pg from "pg";
import { createHash, randomUUID } from "node:crypto";
import { isFormDefinition } from "../../../packages/form-builder/src/schema.ts";
import { registerLogin } from "./login.ts";
import { registerPublication } from "./publication.ts";
import { registerTasks } from "./tasks.ts";
import { registerWorkflowPublication } from "./workflow-publication.ts";
import { registerRequests } from "./requests.ts";
import { ApiFailure } from "./session.ts";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createApi(pool: pg.Pool) {
  const api = Fastify({ bodyLimit: 1024 * 1024, logger: false });
  api.register(async (instance) => registerLogin(instance, pool));
  registerPublication(api, pool);
  registerTasks(api, pool);
  registerWorkflowPublication(api, pool);
  registerRequests(api, pool);
  api.setErrorHandler((error, request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    reply.code(status).send({
      error: {
        code:
          error instanceof ApiFailure
            ? error.code
            : status === 500
              ? "INTERNAL_ERROR"
              : "INVALID_REQUEST",
        correlationId: request.id,
      },
    });
  });
  api.get("/api/v1/health", async () => {
    await pool.query("SELECT 1");
    return { status: "ok" };
  });
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    if (
      !/^[a-z][a-z0-9.-]{0,79}$/.test(appId) ||
      (id !== undefined && !uuid.test(id))
    )
      return reply.code(400).send({ error: { code: "INVALID_ID" } });
    const bearer = request.headers.authorization;
    if (!bearer || !/^Bearer [a-f0-9]{64}$/.test(bearer))
      return reply.code(401).send({ error: { code: "UNAUTHENTICATED" } });
    const hash = createHash("sha256").update(bearer.slice(7)).digest("hex");
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("SELECT set_config('app.session_hash',$1,true)", [hash]);
      const session = await db.query(
        "SELECT tenant_id,actor_id FROM fd.sessions WHERE token_hash=$1 AND expires_at>now()",
        [hash],
      );
      if (!session.rowCount)
        return reply.code(401).send({ error: { code: "UNAUTHENTICATED" } });
      const { tenant_id, actor_id } = session.rows[0];
      await db.query(
        "SELECT set_config('app.tenant_id',$1,true),set_config('app.actor_id',$2,true),set_config('app.app_id',$3,true)",
        [tenant_id, actor_id, appId],
      );
      const member = await db.query(
        "SELECT 1 FROM fd.members WHERE active AND $1=ANY(capabilities)",
        [`${appId}:forms:edit`],
      );
      if (!member.rowCount)
        return reply.code(403).send({ error: { code: "FORBIDDEN" } });
      if (request.method === "GET") {
        if (!id) {
          const after = (request.query as { after?: string }).after;
          if (after !== undefined && !uuid.test(after))
            return reply.code(400).send({ error: { code: "INVALID_CURSOR" } });
          const rows = await db.query(
            "SELECT id,definition->'title' AS title,version FROM fd.form_drafts WHERE ($1::uuid IS NULL OR id > $1::uuid) ORDER BY id LIMIT 51",
            [after ?? null],
          );
          return {
            items: rows.rows.slice(0, 50),
            nextCursor: rows.rows.length > 50 ? rows.rows[49].id : null,
          };
        }
        const row = await db.query(
          "SELECT id,definition,version FROM fd.form_drafts WHERE id=$1",
          [id],
        );
        return row.rowCount
          ? row.rows[0]
          : reply.code(404).send({ error: { code: "NOT_FOUND" } });
      }
      const body = request.body as {
        definition?: unknown;
        expectedVersion?: unknown;
      } | null;
      if (
        !body ||
        !Number.isSafeInteger(body.expectedVersion) ||
        (body.expectedVersion as number) < 0 ||
        (request.method !== "DELETE" && !isFormDefinition(body.definition))
      )
        return reply
          .code(400)
          .send({ error: { code: "INVALID_FORM_OR_VERSION" } });
      let result;
      if (request.method === "POST") {
        if (body.expectedVersion !== 0)
          return reply.code(400).send({ error: { code: "INVALID_VERSION" } });
        result = await db.query(
          "INSERT INTO fd.form_drafts(tenant_id,app_id,id,definition,version) VALUES ($1,$2,$3,$4,1) ON CONFLICT DO NOTHING RETURNING version",
          [tenant_id, appId, id, body.definition],
        );
      } else if (request.method === "PUT") {
        result = await db.query(
          "UPDATE fd.form_drafts SET definition=$1,version=version+1,updated_at=now() WHERE id=$2 AND version=$3 RETURNING version",
          [body.definition, id, body.expectedVersion],
        );
      } else {
        result = await db.query(
          "DELETE FROM fd.form_drafts WHERE id=$1 AND version=$2 RETURNING version",
          [id, body.expectedVersion],
        );
      }
      if (!result.rowCount)
        return reply.code(409).send({ error: { code: "VERSION_CONFLICT" } });
      const version = result.rows[0].version;
      await db.query(
        "INSERT INTO fd.audit(tenant_id,actor_id,app_id,resource_id,action,version) VALUES ($1,$2,$3,$4,$5,$6)",
        [tenant_id, actor_id, appId, id, request.method, version],
      );
      await db.query("COMMIT");
      return reply
        .code(request.method === "POST" ? 201 : 200)
        .send({ id, version, operationId: randomUUID() });
    } finally {
      try {
        await db.query("ROLLBACK");
      } finally {
        db.release();
      }
    }
  };
  api.route({
    method: ["GET", "POST", "PUT", "DELETE"],
    url: "/api/v1/apps/:appId/forms/:id",
    handler,
  });
  api.get("/api/v1/apps/:appId/forms", handler);
  return api;
}
