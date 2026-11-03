import type pg from "pg";
import { createHash } from "node:crypto";
export class ApiFailure extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(code);
  }
}
export interface ActorTransaction {
  db: pg.PoolClient;
  tenantId: string;
  actorId: string;
  appId: string;
  requireCapability(capability: string): Promise<void>;
}
/** The caller never supplies trusted actor/tenant IDs. Context cannot escape a transaction. */
export async function withActor<T>(
  pool: pg.Pool,
  bearer: string | undefined,
  appId: string,
  capability: string,
  action: (context: ActorTransaction) => Promise<T>,
): Promise<T> {
  if (!/^[a-z][a-z0-9.-]{0,79}$/.test(appId))
    throw new ApiFailure(400, "INVALID_ID");
  if (!bearer || !/^Bearer [a-f0-9]{64}$/.test(bearer))
    throw new ApiFailure(401, "UNAUTHENTICATED");
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    await db.query("SELECT set_config('app.session_hash',$1,true)", [
      createHash("sha256").update(bearer.slice(7)).digest("hex"),
    ]);
    const session = await db.query(
      "SELECT tenant_id,actor_id FROM fd.sessions WHERE token_hash=current_setting('app.session_hash',true) AND expires_at>now()",
    );
    if (!session.rowCount) throw new ApiFailure(401, "UNAUTHENTICATED");
    const { tenant_id: tenantId, actor_id: actorId } = session.rows[0];
    await db.query(
      "SELECT set_config('app.tenant_id',$1,true),set_config('app.actor_id',$2,true),set_config('app.app_id',$3,true)",
      [tenantId, actorId, appId],
    );
    async function requireCapability(value: string) {
      const member = await db.query(
        "SELECT 1 FROM fd.members WHERE active AND $1=ANY(capabilities)",
        [`${appId}:${value}`],
      );
      if (!member.rowCount) throw new ApiFailure(403, "FORBIDDEN");
    }
    await requireCapability(capability);
    const result = await action({
      db,
      tenantId,
      actorId,
      appId,
      requireCapability,
    });
    await db.query("COMMIT");
    return result;
  } finally {
    try {
      await db.query("ROLLBACK");
    } finally {
      db.release();
    }
  }
}
