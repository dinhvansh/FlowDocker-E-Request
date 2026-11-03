import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import type pg from "pg";
import { randomBytes, createHash } from "node:crypto";
import { verifyPassword } from "./password.ts";

export async function registerLogin(api: FastifyInstance, pool: pg.Pool) {
  await api.register(rateLimit, { global: false });
  let pending = 0;
  api.post(
    "/api/v1/session/login",
    { config: { rateLimit: { max: 8, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const body = request.body as {
        login?: unknown;
        password?: unknown;
      } | null;
      if (
        !body ||
        typeof body.login !== "string" ||
        !/^[a-z0-9][a-z0-9._-]{2,79}$/.test(body.login) ||
        typeof body.password !== "string" ||
        body.password.length > 256
      )
        return reply.code(401).send({ error: { code: "INVALID_CREDENTIALS" } });
      if (pending >= 2)
        return reply.code(429).send({ error: { code: "TRY_LATER" } });
      pending++;
      let db: pg.PoolClient | undefined;
      try {
        db = await pool.connect();
        await db.query("BEGIN");
        await db.query("SELECT set_config('app.login_name',$1,true)", [
          body.login,
        ]);
        const accounts = await db.query(
          "SELECT tenant_id,actor_id,salt,verifier FROM fd.local_accounts WHERE login_name=$1",
          [body.login],
        );
        const account = accounts.rows[0];
        const valid = await verifyPassword(
          body.password,
          account?.salt ?? "0".repeat(64),
          account?.verifier ?? "0".repeat(128),
        );
        if (!account || !valid)
          return reply
            .code(401)
            .send({ error: { code: "INVALID_CREDENTIALS" } });
        await db.query(
          "SELECT set_config('app.tenant_id',$1,true),set_config('app.actor_id',$2,true)",
          [account.tenant_id, account.actor_id],
        );
        const member = await db.query("SELECT 1 FROM fd.members WHERE active");
        if (!member.rowCount)
          return reply
            .code(401)
            .send({ error: { code: "INVALID_CREDENTIALS" } });
        const token = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        await db.query("SELECT set_config('app.session_hash',$1,true)", [
          tokenHash,
        ]);
        const inserted = await db.query(
          "INSERT INTO fd.sessions(token_hash,tenant_id,actor_id,expires_at) VALUES ($1,$2,$3,now()+interval '1 hour') RETURNING expires_at",
          [tokenHash, account.tenant_id, account.actor_id],
        );
        await db.query("COMMIT");
        return reply
          .header("cache-control", "no-store")
          .send({ accessToken: token, expiresAt: inserted.rows[0].expires_at });
      } finally {
        pending--;
        if (db) {
          try {
            await db.query("ROLLBACK");
          } finally {
            db.release();
          }
        }
      }
    },
  );
  api.post("/api/v1/session/logout", async (request, reply) => {
    const bearer = request.headers.authorization;
    if (!bearer || !/^Bearer [a-f0-9]{64}$/.test(bearer))
      return reply.code(401).send({ error: { code: "UNAUTHENTICATED" } });
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("SELECT set_config('app.session_hash',$1,true)", [
        createHash("sha256").update(bearer.slice(7)).digest("hex"),
      ]);
      await db.query(
        "DELETE FROM fd.sessions WHERE token_hash=current_setting('app.session_hash',true)",
      );
      await db.query("COMMIT");
      return reply.code(204).send();
    } finally {
      try {
        await db.query("ROLLBACK");
      } finally {
        db.release();
      }
    }
  });
}
