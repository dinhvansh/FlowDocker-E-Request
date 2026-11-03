import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import pg from "pg";
import { createApi } from "./server.ts";

test("authenticated decisions: assignment, isolation, race, idempotency and atomic audit/outbox", async () => {
  const admin = new pg.Pool({
    connectionString: process.env.MIGRATION_DATABASE_URL,
  });
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });
  const api = createApi(pool);
  const address = await api.listen({ host: "127.0.0.1", port: 0 });
  const tenant = randomUUID(),
    foreign = randomUUID();
  const actor = randomUUID(),
    peer = randomUUID(),
    outsider = randomUUID();
  const tokens = [actor, peer, outsider].map(() =>
    randomBytes(32).toString("hex"),
  );
  const runId = randomUUID(),
    taskId = randomUUID(),
    second = randomUUID();
  const url = `${address}/api/v1/apps/e-request/tasks`;
  const headers = (i = 0) => ({
    authorization: `Bearer ${tokens[i]}`,
    "content-type": "application/json",
  });
  const decide = (
    decision: string,
    key = randomUUID(),
    expectedVersion = 1,
    i = 0,
    id = taskId,
  ) =>
    fetch(`${url}/${id}/decision`, {
      method: "POST",
      headers: { ...headers(i), "idempotency-key": key },
      body: JSON.stringify({ decision, expectedVersion }),
    });
  try {
    for (const [i, member] of [actor, peer, outsider].entries()) {
      const t = i === 2 ? foreign : tenant;
      await admin.query(
        "INSERT INTO fd.members(tenant_id,id,capabilities) VALUES($1,$2,$3)",
        [t, member, ["e-request:tasks:decide"]],
      );
      await admin.query(
        "INSERT INTO fd.sessions(token_hash,tenant_id,actor_id,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')",
        [createHash("sha256").update(tokens[i]).digest("hex"), t, member],
      );
    }
    await admin.query(
      "INSERT INTO fd.approval_runs(tenant_id,app_id,id,owner_id,plan,input,exposed_fields) VALUES($1,'e-request',$2,$3,$4,$5,$6)",
      [
        tenant,
        runId,
        actor,
        { schemaVersion: 1, steps: [] },
        { secret: "must never leak" },
        {},
      ],
    );
    await admin.query(
      "INSERT INTO fd.approval_work_items(tenant_id,app_id,id,run_id,step_id,assignee_id) VALUES($1,'e-request',$2,$3,'first',$4),($1,'e-request',$5,$3,'second',$4)",
      [tenant, taskId, runId, actor, second],
    );
    assert.equal((await fetch(url)).status, 401);
    assert.equal(
      (await fetch(`${url}/${taskId}`, { headers: headers(1) })).status,
      404,
    );
    assert.equal((await decide("APPROVED", randomUUID(), 1, 1)).status, 404);
    assert.equal((await decide("APPROVED", randomUUID(), 1, 2)).status, 404);
    assert.equal(
      (await fetch(`${url}?after=invalid`, { headers: headers() })).status,
      400,
    );
    const listing = (await (
      await fetch(url, { headers: headers() })
    ).json()) as { items: Record<string, unknown>[] };
    assert.equal(listing.items.length, 2);
    assert.deepEqual(Object.keys(listing.items[0]).sort(), [
      "id",
      "run_id",
      "status",
      "step_id",
      "version",
    ]);
    assert.equal((await decide("APPROVED", randomUUID(), 2)).status, 409);
    assert.equal(
      (
        await fetch(`${url}/${taskId}/decision`, {
          method: "POST",
          headers: { ...headers(), "idempotency-key": randomUUID() },
          body: JSON.stringify({
            decision: "APPROVED",
            expectedVersion: 1,
            actorId: peer,
          }),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(`${url}/${taskId}/decision`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ decision: "APPROVED", expectedVersion: 1 }),
        })
      ).status,
      400,
    );
    const keys = [randomUUID(), randomUUID()];
    const attempts = await Promise.all([
      decide("APPROVED", keys[0]),
      decide("REJECTED", keys[1]),
    ]);
    assert.deepEqual(attempts.map((r) => r.status).sort(), [200, 409]);
    const winningIndex = attempts.findIndex((r) => r.status === 200);
    const result = await attempts[winningIndex].json();
    const winningDecision = winningIndex === 0 ? "APPROVED" : "REJECTED";
    assert.deepEqual(
      await (await decide(winningDecision, keys[winningIndex])).json(),
      result,
    );
    assert.equal(
      (
        await decide(
          winningIndex === 0 ? "REJECTED" : "APPROVED",
          keys[winningIndex],
        )
      ).status,
      409,
    );
    assert.equal(
      (await decide(winningDecision, keys[winningIndex], 1, 0, second)).status,
      409,
    );
    const sameKey = randomUUID();
    const repeats = await Promise.all([
      decide("APPROVED", sameKey, 1, 0, second),
      decide("APPROVED", sameKey, 1, 0, second),
    ]);
    assert.deepEqual(
      repeats.map((r) => r.status),
      [200, 200],
    );
    assert.deepEqual(await repeats[0].json(), await repeats[1].json());
    for (const table of ["task_decisions", "approval_outbox", "audit"]) {
      assert.equal(
        (
          await admin.query(
            `SELECT count(*)::int AS count FROM fd.${table} WHERE tenant_id=$1`,
            [tenant],
          )
        ).rows[0].count,
        2,
      );
    }
    await admin.query(
      "UPDATE fd.members SET active=false WHERE tenant_id=$1 AND id=$2",
      [tenant, actor],
    );
    assert.equal(
      (await decide(winningDecision, keys[winningIndex])).status,
      403,
    );
    assert.equal((await fetch(url, { headers: headers() })).status, 403);
    // No scoped context may expose tasks or pinned request input.
    assert.equal(
      (await pool.query("SELECT id FROM fd.approval_work_items")).rowCount,
      0,
    );
    await assert.rejects(
      pool.query("SELECT input FROM fd.approval_runs"),
      /permission denied/,
    );
    await assert.rejects(
      pool.query("DELETE FROM fd.task_decisions"),
      /permission denied/,
    );
  } finally {
    await api.close();
    await pool.end();
    for (const table of [
      "approval_outbox",
      "task_decisions",
      "audit",
      "approval_work_items",
      "approval_runs",
      "sessions",
      "members",
    ])
      await admin.query(
        `DELETE FROM fd.${table} WHERE tenant_id=ANY($1::uuid[])`,
        [[tenant, foreign]],
      );
    await admin.end();
  }
});
