import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { randomUUID } from "node:crypto";
import { ApiFailure, withActor, type ActorTransaction } from "./session.ts";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const projection = "id,run_id,step_id,status,version";
export function registerTasks(api: FastifyInstance, pool: pg.Pool) {
  api.get("/api/v1/apps/:appId/tasks", async (request) => {
    const { appId } = request.params as { appId: string };
    const after = (request.query as { after?: string }).after;
    if (after !== undefined && !uuid.test(after))
      throw new ApiFailure(400, "INVALID_CURSOR");
    return withActor(
      pool,
      request.headers.authorization,
      appId,
      "tasks:decide",
      async (ctx) => {
        const rows = await ctx.db.query(
          `SELECT ${projection} FROM fd.approval_work_items WHERE ($1::uuid IS NULL OR id>$1) ORDER BY id LIMIT 51`,
          [after ?? null],
        );
        return {
          items: rows.rows.slice(0, 50),
          nextCursor: rows.rows.length > 50 ? rows.rows[49].id : null,
        };
      },
    );
  });
  api.get("/api/v1/apps/:appId/tasks/:id", async (request) => {
    const { appId, id } = request.params as { appId: string; id: string };
    if (!uuid.test(id)) throw new ApiFailure(400, "INVALID_ID");
    return withActor(
      pool,
      request.headers.authorization,
      appId,
      "tasks:decide",
      async (ctx) => {
        const row = await ctx.db.query(
          `SELECT ${projection} FROM fd.approval_work_items WHERE id=$1`,
          [id],
        );
        if (!row.rowCount) throw new ApiFailure(404, "NOT_FOUND");
        return row.rows[0];
      },
    );
  });
  api.post("/api/v1/apps/:appId/tasks/:id/decision", async (request) => {
    const { appId, id } = request.params as { appId: string; id: string };
    if (!uuid.test(id)) throw new ApiFailure(400, "INVALID_ID");
    const key = request.headers["idempotency-key"];
    if (typeof key !== "string" || !uuid.test(key))
      throw new ApiFailure(400, "INVALID_IDEMPOTENCY_KEY");
    const body = request.body as Record<string, unknown> | null;
    if (
      !body ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (k) => !["decision", "expectedVersion"].includes(k),
      ) ||
      !["APPROVED", "REJECTED"].includes(body.decision as string) ||
      !Number.isSafeInteger(body.expectedVersion) ||
      (body.expectedVersion as number) < 1 ||
      (body.expectedVersion as number) >= 2147483647
    )
      throw new ApiFailure(400, "INVALID_DECISION");
    return withActor(
      pool,
      request.headers.authorization,
      appId,
      "tasks:decide",
      async (ctx) => {
        // Serialize a key even when concurrently used for different tasks.
        await ctx.db.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          [
            `decision:${ctx.tenantId}:${appId}:${ctx.actorId}:${key.toLowerCase()}`,
          ],
        );
        const receipt = await ctx.db.query(
          "SELECT task_id,decision,expected_version,version FROM fd.task_decisions WHERE idempotency_key=$1",
          [key],
        );
        if (receipt.rowCount) {
          const row = receipt.rows[0];
          if (
            row.task_id !== id.toLowerCase() ||
            row.decision !== body.decision ||
            row.expected_version !== body.expectedVersion
          )
            throw new ApiFailure(409, "IDEMPOTENCY_CONFLICT");
          return {
            id: row.task_id,
            status: row.decision,
            version: row.version,
          };
        }
        const visible = await ctx.db.query(
          "SELECT run_id FROM fd.approval_work_items WHERE id=$1",
          [id],
        );
        if (!visible.rowCount) throw new ApiFailure(404, "NOT_FOUND");
        const runId = visible.rows[0].run_id as string;
        await lockRun(ctx, runId);
        const run = await ctx.db.query(
          "SELECT status FROM fd.approval_runs WHERE id=$1",
          [runId],
        );
        const item = await ctx.db.query(
          `SELECT ${projection} FROM fd.approval_work_items WHERE id=$1`,
          [id],
        );
        if (!item.rowCount || !run.rowCount)
          throw new ApiFailure(404, "NOT_FOUND");
        if (
          run.rows[0].status !== "RUNNING" ||
          item.rows[0].status !== "PENDING" ||
          item.rows[0].version !== body.expectedVersion
        )
          throw new ApiFailure(409, "TASK_CONFLICT");
        const version = (body.expectedVersion as number) + 1;
        const changed = await ctx.db.query(
          "UPDATE fd.approval_work_items SET status=$2,version=$3 WHERE id=$1 AND status='PENDING' AND version=$4",
          [id, body.decision, version, body.expectedVersion],
        );
        if (changed.rowCount !== 1) throw new ApiFailure(409, "TASK_CONFLICT");
        await ctx.db.query(
          "INSERT INTO fd.task_decisions(tenant_id,app_id,actor_id,idempotency_key,task_id,decision,expected_version,version) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            ctx.tenantId,
            appId,
            ctx.actorId,
            key,
            id,
            body.decision,
            body.expectedVersion,
            version,
          ],
        );
        await ctx.db.query(
          "INSERT INTO fd.audit(tenant_id,actor_id,app_id,resource_id,action,version) VALUES($1,$2,$3,$4,$5,$6)",
          [
            ctx.tenantId,
            ctx.actorId,
            appId,
            id,
            `TASK_${body.decision}`,
            version,
          ],
        );
        await ctx.db.query(
          "INSERT INTO fd.approval_outbox(id,tenant_id,app_id,run_id,task_id,actor_id) VALUES($1,$2,$3,$4,$5,$6)",
          [randomUUID(), ctx.tenantId, appId, runId, id, ctx.actorId],
        );
        return { id: id.toLowerCase(), status: body.decision, version };
      },
    );
  });
}
async function lockRun(ctx: ActorTransaction, runId: string) {
  await ctx.db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
    `approval-run:${ctx.tenantId}:${ctx.appId}:${runId}`,
  ]);
}
