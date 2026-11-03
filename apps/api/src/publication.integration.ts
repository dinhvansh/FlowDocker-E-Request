import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import pg from "pg";
import { createApi } from "./server.ts";
import { canonicalJson } from "./publication.ts";
import { createHttpFormRepository } from "../../../packages/form-builder/src/http-storage.ts";

test("publication is permissioned, validated, deduplicated, immutable and tenant-scoped", async () => {
  const admin = new pg.Pool({
    connectionString: process.env.MIGRATION_DATABASE_URL,
  });
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
  });
  const api = createApi(pool);
  const address = await api.listen({ host: "127.0.0.1", port: 0 });
  const tenant = randomUUID(),
    actor = randomUUID(),
    otherTenant = randomUUID(),
    otherActor = randomUUID(),
    id = randomUUID();
  const token = randomBytes(32).toString("hex"),
    otherToken = randomBytes(32).toString("hex");
  const hashes = [token, otherToken].map((value) =>
    createHash("sha256").update(value).digest("hex"),
  );
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
  const endpoint = `${address}/api/v1/apps/e-request/forms/${id}`;
  const definition = {
    schemaVersion: 2,
    id: "sample",
    title: { vi: "Test", en: "Test" },
    version: 1,
    status: "DRAFT",
    fields: [
      {
        id: "name",
        key: "name",
        label: { vi: "Tên", en: "Name" },
        type: "text",
        required: true,
        options: [],
      },
      {
        id: "amount",
        key: "amount",
        label: { vi: "Số tiền", en: "Amount" },
        type: "currency",
        required: true,
        options: [],
      },
    ],
  };
  const publish = (expectedVersion: number) =>
    fetch(endpoint + "/publish", {
      method: "POST",
      headers,
      body: JSON.stringify({ expectedVersion }),
    });
  const repository = createHttpFormRepository({
    baseUrl: address,
    appId: "e-request",
    getAccessToken: () => token,
  });
  try {
    await admin.query(
      "INSERT INTO fd.members(tenant_id,id,capabilities) VALUES ($1,$2,$5),($3,$4,$5)",
      [tenant, actor, otherTenant, otherActor, ["e-request:forms:edit"]],
    );
    await admin.query(
      "INSERT INTO fd.sessions(token_hash,tenant_id,actor_id,expires_at) VALUES ($1,$2,$3,now()+interval '1 hour'),($4,$5,$6,now()+interval '1 hour')",
      [hashes[0], tenant, actor, hashes[1], otherTenant, otherActor],
    );
    assert.equal(
      (
        await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            definition: { ...definition, fields: [] },
            expectedVersion: 0,
          }),
        })
      ).status,
      201,
    );
    assert.equal((await publish(1)).status, 403);
    assert.equal(await repository.publicationPermission(), false);
    await assert.rejects(
      repository.publish(id, 1),
      (error) => (error as { status: number }).status === 403,
    );
    await admin.query(
      "UPDATE fd.members SET capabilities=$3 WHERE tenant_id=$1 AND id=$2",
      [tenant, actor, ["e-request:forms:edit", "e-request:forms:publish"]],
    );
    assert.equal((await publish(1)).status, 422);
    assert.equal(await repository.publicationPermission(), true);
    assert.equal(
      (
        await fetch(endpoint, {
          method: "PUT",
          headers,
          body: JSON.stringify({ definition, expectedVersion: 1 }),
        })
      ).status,
      200,
    );
    assert.equal((await publish(1)).status, 409);
    const concurrent = await Promise.all([publish(2), publish(2)]);
    assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 201]);
    const copies = (await Promise.all(concurrent.map((r) => r.json()))) as {
      id: string;
      checksum: string;
      version: number;
    }[];
    assert.equal(copies[0].id, copies[1].id);
    assert.equal(copies[0].checksum, copies[1].checksum);
    assert.deepEqual(await repository.publish(id, 2), {
      id: copies[0].id,
      version: copies[0].version,
      checksum: copies[0].checksum,
    });
    const versionUrl = `${address}/api/v1/apps/e-request/form-versions/${copies[0].id}`;
    const original = (await (await fetch(versionUrl, { headers })).json()) as {
      definition: typeof definition;
      checksum: string;
    };
    assert.equal(original.definition.status, "PUBLISHED");
    // Workflow publication pins this immutable form version, never a draft ID.
    const workflowId = randomUUID();
    const workflowEndpoint = `${address}/api/v1/apps/e-request/workflows/${workflowId}/publish`;
    const plan = {
      schemaVersion: 1,
      steps: [
        {
          id: "threshold",
          kind: "if",
          field: "amount",
          operator: "gt",
          value: "100",
          then: [{ id: "high", kind: "approval", assignees: [actor] }],
          else: [{ id: "low", kind: "approval", assignees: [actor] }],
        },
      ],
    };
    const workflowBody = {
      formVersionId: copies[0].id,
      conditionFields: ["amount"],
      plan,
    };
    const publishWorkflow = (body: unknown = workflowBody) =>
      fetch(workflowEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    assert.equal((await publishWorkflow()).status, 403);
    await admin.query(
      "UPDATE fd.members SET capabilities=array_append(capabilities,'e-request:workflows:publish') WHERE tenant_id=$1 AND id=$2",
      [tenant, actor],
    );
    assert.equal(
      (await publishWorkflow({ ...workflowBody, conditionFields: ["unknown"] }))
        .status,
      422,
    );
    assert.equal(
      (
        await publishWorkflow({
          ...workflowBody,
          plan: {
            schemaVersion: 1,
            steps: [{ id: "bad", kind: "approval", assignees: [otherActor] }],
          },
        })
      ).status,
      422,
    );
    assert.equal(
      (await publishWorkflow({ ...workflowBody, formVersionId: randomUUID() }))
        .status,
      404,
    );
    const workflows = await Promise.all([publishWorkflow(), publishWorkflow()]);
    assert.deepEqual(
      workflows.map((r) => r.status).sort(),
      [200, 201],
      JSON.stringify(await Promise.all(workflows.map((r) => r.clone().json()))),
    );
    const workflowVersions = (await Promise.all(
      workflows.map((r) => r.json()),
    )) as { id: string; version: number; checksum: string }[];
    assert.equal(workflowVersions[0].id, workflowVersions[1].id);
    const workflowUrl = `${address}/api/v1/apps/e-request/workflow-versions/${workflowVersions[0].id}`;
    const frozenWorkflow = (await (
      await fetch(workflowUrl, { headers })
    ).json()) as { form_version_id: string; exposed_fields: unknown };
    assert.equal(frozenWorkflow.form_version_id, copies[0].id);
    assert.deepEqual(frozenWorkflow.exposed_fields, { amount: "decimal" });
    await admin.query(
      "UPDATE fd.members SET capabilities=array_append(capabilities,'e-request:workflows:publish') WHERE tenant_id=$1 AND id=$2",
      [otherTenant, otherActor],
    );
    assert.equal(
      (
        await fetch(workflowUrl, {
          headers: { authorization: `Bearer ${otherToken}` },
        })
      ).status,
      404,
    );
    await assert.rejects(
      pool.query("UPDATE fd.workflow_versions SET version=99"),
      /permission denied/,
    );
    assert.equal(
      (
        await pool.query(
          "SELECT fd.valid_workflow_assignees($1::uuid[]) AS valid",
          [[actor]],
        )
      ).rows[0].valid,
      false,
    );
    assert.equal(
      original.checksum,
      createHash("sha256")
        .update(canonicalJson(original.definition))
        .digest("hex"),
    );
    assert.equal(
      (
        await fetch(versionUrl, {
          headers: { authorization: `Bearer ${otherToken}` },
        })
      ).status,
      404,
    );
    const changed = {
      ...definition,
      title: { vi: "Version 2", en: "Version 2" },
    };
    assert.equal(
      (
        await fetch(endpoint, {
          method: "PUT",
          headers,
          body: JSON.stringify({ definition: changed, expectedVersion: 2 }),
        })
      ).status,
      200,
    );
    const second = await publish(3);
    assert.equal(second.status, 201);
    assert.equal(((await second.json()) as { version: number }).version, 2);
    assert.deepEqual(
      await (await fetch(workflowUrl, { headers })).json(),
      frozenWorkflow,
    );
    assert.deepEqual(
      await (await fetch(versionUrl, { headers })).json(),
      original,
    );
    assert.equal(
      (
        await fetch(endpoint, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ expectedVersion: 3 }),
        })
      ).status,
      200,
    );
    assert.deepEqual(
      await (await fetch(versionUrl, { headers })).json(),
      original,
    );
    await assert.rejects(
      pool.query("UPDATE fd.form_versions SET checksum=$1 WHERE id=$2", [
        "0".repeat(64),
        copies[0].id,
      ]),
      /permission denied/,
    );
    await assert.rejects(
      pool.query("DELETE FROM fd.form_versions WHERE id=$1", [copies[0].id]),
      /permission denied/,
    );
    const audit = await admin.query(
      "SELECT count(*)::int AS count FROM fd.audit WHERE tenant_id=$1 AND action='FORM_PUBLISH'",
      [tenant],
    );
    assert.equal(audit.rows[0].count, 2);
  } finally {
    await api.close();
    await pool.end();
    for (const table of [
      "audit",
      "workflow_versions",
      "form_versions",
      "form_drafts",
      "sessions",
      "members",
    ])
      await admin.query(
        `DELETE FROM fd.${table} WHERE tenant_id=ANY($1::uuid[])`,
        [[tenant, otherTenant]],
      );
    await admin.end();
  }
});
