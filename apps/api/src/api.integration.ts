import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import pg from "pg";
import { createApi } from "./server.ts";
import {
  createHttpFormRepository,
  FormStorageError,
} from "../../../packages/form-builder/src/http-storage.ts";
import type { FormDefinition } from "../../../packages/form-builder/src/schema.ts";

test("real PostgreSQL authoring API: isolation, conflicts, revocation, audit and restart", async () => {
  assert.ok(process.env.MIGRATION_DATABASE_URL);
  assert.ok(process.env.DATABASE_URL);
  const admin = new pg.Pool({
    connectionString: process.env.MIGRATION_DATABASE_URL,
  });
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
  });
  const tenant = randomUUID(),
    otherTenant = randomUUID(),
    actor = randomUUID(),
    otherActor = randomUUID();
  const token = randomBytes(32).toString("hex"),
    otherToken = randomBytes(32).toString("hex");
  const hash = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  const id = randomUUID();
  const definition = {
    schemaVersion: 2,
    id: "example",
    title: { vi: "Test", en: "Test" },
    version: 1,
    status: "DRAFT",
    fields: [],
  };
  let api = createApi(pool);
  let address = await api.listen({ host: "127.0.0.1", port: 0 });
  const call = async (
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: unknown,
    bearer = token,
    app = "e-request",
  ) => {
    const response = await fetch(`${address}/api/v1/apps/${app}/forms/${id}`, {
      method,
      headers: {
        authorization: `Bearer ${bearer}`,
        "content-type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    return { statusCode: response.status, json: () => data };
  };
  try {
    await admin.query(
      "INSERT INTO fd.members(tenant_id,id,capabilities) VALUES ($1,$2,$5),($3,$4,$5)",
      [tenant, actor, otherTenant, otherActor, ["e-request:forms:edit"]],
    );
    await admin.query(
      "INSERT INTO fd.sessions(token_hash,tenant_id,actor_id,expires_at) VALUES ($1,$2,$3,now()+interval '1 hour'),($4,$5,$6,now()+interval '1 hour')",
      [hash(token), tenant, actor, hash(otherToken), otherTenant, otherActor],
    );
    const role = await pool.query(
      "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
    );
    assert.equal(role.rows[0].rolsuper, false);
    assert.equal(role.rows[0].rolbypassrls, false);
    const owned = await pool.query(
      "SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='fd' AND pg_get_userbyid(c.relowner)=current_user",
    );
    assert.equal(owned.rowCount, 0);
    assert.equal(
      (await fetch(`${address}/api/v1/apps/e-request/forms/${id}`)).status,
      401,
    );
    assert.equal(
      (await call("POST", { definition, expectedVersion: 0 })).statusCode,
      201,
    );
    assert.equal(
      (await call("POST", { definition, expectedVersion: 0 })).statusCode,
      409,
    );
    assert.equal((await call("GET")).json().version, 1);
    const repository = createHttpFormRepository({
      baseUrl: address,
      appId: "e-request",
      getAccessToken: () => token,
    });
    assert.deepEqual(
      (await repository.list()).items.map((row) => row.id),
      [id],
    );
    assert.equal((await repository.read(id)).version, 1);
    const otherRepository = createHttpFormRepository({
      baseUrl: address,
      appId: "e-request",
      getAccessToken: () => otherToken,
    });
    assert.deepEqual((await otherRepository.list()).items, []);
    const cursorError = await fetch(
      `${address}/api/v1/apps/e-request/forms?after=------------------------------------`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    assert.equal(cursorError.status, 400);
    // Exact cursor on the only row ends the page without repeating it.
    assert.deepEqual((await repository.list(id)).items, []);
    assert.equal((await call("GET", undefined, otherToken)).statusCode, 404);
    assert.equal(
      (await call("GET", undefined, token, "it-assets")).statusCode,
      403,
    );
    assert.equal(
      (await call("PUT", { definition: { bad: true }, expectedVersion: 1 }))
        .statusCode,
      400,
    );
    const race = await Promise.all([
      call("PUT", { definition, expectedVersion: 1 }),
      call("PUT", { definition, expectedVersion: 1 }),
    ]);
    assert.deepEqual(race.map((r) => r.statusCode).sort(), [200, 409]);
    await api.close();
    api = createApi(pool);
    address = await api.listen({ host: "127.0.0.1", port: 0 });
    assert.equal((await call("GET")).json().version, 2);
    const restarted = createHttpFormRepository({
      baseUrl: address,
      appId: "e-request",
      getAccessToken: () => token,
    });
    await assert.rejects(
      restarted.save({
        id,
        definition: definition as FormDefinition,
        version: 1,
      }),
      (error) =>
        error instanceof FormStorageError && error.code === "VERSION_CONFLICT",
    );
    assert.equal(
      (await pool.query("SELECT * FROM fd.form_drafts")).rowCount,
      0,
    );
    assert.equal((await pool.query("SELECT * FROM fd.members")).rowCount, 0);
    assert.equal((await pool.query("SELECT * FROM fd.sessions")).rowCount, 0);
    await admin.query(
      "UPDATE fd.members SET active=false WHERE tenant_id=$1 AND id=$2",
      [tenant, actor],
    );
    assert.equal((await call("GET")).statusCode, 403);
    await admin.query(
      "UPDATE fd.members SET active=true,capabilities=$3 WHERE tenant_id=$1 AND id=$2",
      [tenant, actor, []],
    );
    assert.equal((await call("GET")).statusCode, 403);
    await admin.query(
      "UPDATE fd.members SET capabilities=$3 WHERE tenant_id=$1 AND id=$2",
      [tenant, actor, ["e-request:forms:edit"]],
    );
    await admin.query(
      "UPDATE fd.sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",
      [hash(token)],
    );
    assert.equal((await call("GET")).statusCode, 401);
    await admin.query(
      "UPDATE fd.sessions SET expires_at=now()+interval '1 hour' WHERE token_hash=$1",
      [hash(token)],
    );
    assert.equal(
      (await call("DELETE", { expectedVersion: 1 })).statusCode,
      409,
    );
    assert.equal(
      (await call("DELETE", { expectedVersion: 2 })).statusCode,
      200,
    );
    assert.equal((await call("GET")).statusCode, 404);
    const audit = await admin.query(
      "SELECT action,version FROM fd.audit WHERE tenant_id=$1 ORDER BY id",
      [tenant],
    );
    assert.deepEqual(audit.rows, [
      { action: "POST", version: 1 },
      { action: "PUT", version: 2 },
      { action: "DELETE", version: 2 },
    ]);
    await assert.rejects(
      pool.query("SELECT * FROM fd.audit"),
      /permission denied/,
    );
  } finally {
    await api.close();
    await pool.end();
    // Only this run's synthetic fixtures, never truncate or reset shared data.
    await admin.query("DELETE FROM fd.audit WHERE tenant_id=ANY($1::uuid[])", [
      [tenant, otherTenant],
    ]);
    await admin.query(
      "DELETE FROM fd.form_drafts WHERE tenant_id=ANY($1::uuid[])",
      [[tenant, otherTenant]],
    );
    await admin.query(
      "DELETE FROM fd.sessions WHERE tenant_id=ANY($1::uuid[])",
      [[tenant, otherTenant]],
    );
    await admin.query(
      "DELETE FROM fd.members WHERE tenant_id=ANY($1::uuid[])",
      [[tenant, otherTenant]],
    );
    await admin.end();
  }
});
