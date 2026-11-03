import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";
import { Client, Connection } from "@temporalio/client";
import {
  Worker,
  NativeConnection,
  bundleWorkflowCode,
  Runtime,
  DefaultLogger,
} from "@temporalio/worker";
import { createApprovalActivities, type RunRef } from "./activities.ts";
import { createApi } from "../../api/src/server.ts";
import { dispatchDecisionWakeups, dispatchApprovalStarts } from "./outbox.ts";
import {
  compileApprovalPlan,
  type ApprovalPlan,
} from "../../../packages/approval-runtime/src/plan.ts";

test(
  "real Temporal and scoped PostgreSQL: both branches, parallel ALL, wakeup safety, restart and replay",
  { timeout: 120000 },
  async () => {
    assert.ok(process.env.WORKER_DATABASE_URL);
    Runtime.install({ logger: new DefaultLogger("WARN") });
    const admin = new pg.Pool({
      connectionString: process.env.MIGRATION_DATABASE_URL,
    });
    const pool = new pg.Pool({
      connectionString: process.env.WORKER_DATABASE_URL,
      max: 4,
    });
    const apiPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const api = createApi(apiPool);
    const apiAddress = await api.listen({ host: "127.0.0.1", port: 0 });
    const connection = await Connection.connect({ address: "127.0.0.1:7233" });
    const native = await NativeConnection.connect({
      address: "127.0.0.1:7233",
    });
    const client = new Client({ connection });
    const tenantId = randomUUID(),
      owner = randomUUID(),
      manager = randomUUID(),
      head = randomUUID();
    const tokens = new Map(
      [owner, manager, head].map((id) => [id, randomBytes(32).toString("hex")]),
    );
    const taskQueue = `poc-${randomUUID()}`;
    const bundle = await bundleWorkflowCode({
      workflowsPath: fileURLToPath(new URL("./workflows.ts", import.meta.url)),
    });
    let worker: Worker | undefined;
    let running: Promise<void> | undefined;
    const handles: ReturnType<typeof client.workflow.getHandle>[] = [];
    const makeWorker = async () => {
      worker = await Worker.create({
        connection: native,
        taskQueue,
        workflowBundle: bundle,
        activities: createApprovalActivities(pool),
        shutdownGraceTime: "2 seconds",
      });
      running = worker.run();
    };
    async function eventually<T>(
      read: () => Promise<T>,
      ready: (value: T) => boolean,
    ): Promise<T> {
      const until = Date.now() + 20000;
      while (Date.now() < until) {
        const value = await read();
        if (ready(value)) return value;
        await delay(100);
      }
      throw new Error("Timed out waiting for durable workflow state");
    }
    const rows = (runId: string) =>
      admin
        .query(
          "SELECT id,step_id,status,version,assignee_id FROM fd.approval_work_items WHERE tenant_id=$1 AND run_id=$2 ORDER BY step_id",
          [tenantId, runId],
        )
        .then((result) => result.rows);
    const status = (runId: string) =>
      admin
        .query(
          "SELECT status FROM fd.approval_runs WHERE tenant_id=$1 AND id=$2",
          [tenantId, runId],
        )
        .then((result) => result.rows[0]?.status);
    async function start(
      plan: ApprovalPlan,
      amount: string,
      beforeStart?: (ref: RunRef) => Promise<void>,
    ) {
      const ref: RunRef = { tenantId, appId: "e-request", runId: randomUUID() };
      const compiled = compileApprovalPlan(plan, { amount: "decimal" });
      await admin.query(
        "INSERT INTO fd.approval_runs(tenant_id,app_id,id,owner_id,plan,input,exposed_fields) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [
          tenantId,
          ref.appId,
          ref.runId,
          owner,
          compiled,
          { amount },
          { amount: "decimal" },
        ],
      );
      await beforeStart?.(ref);
      const handle = await client.workflow.start("approvalRun", {
        taskQueue,
        workflowId: `approval-${ref.runId}`,
        args: [ref],
        workflowExecutionTimeout: "2 minutes",
      });
      handles.push(handle);
      return { ref, handle };
    }
    async function decide(taskId: string, decision = "APPROVED") {
      const task = await admin.query(
        "SELECT assignee_id,version FROM fd.approval_work_items WHERE tenant_id=$1 AND id=$2",
        [tenantId, taskId],
      );
      const result = await fetch(
        `${apiAddress}/api/v1/apps/e-request/tasks/${taskId}/decision`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${tokens.get(task.rows[0].assignee_id)}`,
            "content-type": "application/json",
            "idempotency-key": randomUUID(),
          },
          body: JSON.stringify({
            decision,
            expectedVersion: task.rows[0].version,
          }),
        },
      );
      assert.equal(result.status, 200, await result.text());
    }
    try {
      await admin.query(
        "INSERT INTO fd.members(tenant_id,id) VALUES ($1,$2),($1,$3),($1,$4)",
        [tenantId, owner, manager, head],
      );
      for (const [actor, token] of tokens) {
        await admin.query(
          "UPDATE fd.members SET capabilities=$3 WHERE tenant_id=$1 AND id=$2",
          [
            tenantId,
            actor,
            actor === owner
              ? [
                  "e-request:forms:edit",
                  "e-request:forms:publish",
                  "e-request:forms:use",
                  "e-request:workflows:publish",
                  "e-request:requests:submit",
                ]
              : ["e-request:tasks:decide", "e-request:requests:submit"],
          ],
        );
        await admin.query(
          "INSERT INTO fd.sessions(token_hash,tenant_id,actor_id,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')",
          [createHash("sha256").update(token).digest("hex"), tenantId, actor],
        );
      }
      const role = await pool.query(
        "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
      );
      assert.equal(role.rows[0].rolsuper, false);
      assert.equal(role.rows[0].rolbypassrls, false);
      assert.equal(
        (await pool.query("SELECT * FROM fd.approval_runs")).rowCount,
        0,
      );
      await assert.rejects(
        pool.query("SELECT * FROM fd.sessions"),
        /permission denied/,
      );
      assert.equal(
        (
          await pool.query(
            "UPDATE fd.approval_work_items SET status='APPROVED'",
          )
        ).rowCount,
        0,
      );
      await makeWorker();
      const conditional: ApprovalPlan = {
        schemaVersion: 1,
        steps: [
          {
            id: "amount_gate",
            kind: "if",
            field: "amount",
            operator: "gt",
            value: "100.00",
            then: [{ id: "head", kind: "approval", assignees: [head] }],
            else: [{ id: "manager", kind: "approval", assignees: [manager] }],
          },
        ],
      };
      for (const [amount, expectedStep] of [
        ["99.99", "manager"],
        ["100.01", "head"],
      ]) {
        const { ref, handle } = await start(conditional, amount);
        const items = await eventually(
          () => rows(ref.runId),
          (value) => value.length === 1,
        );
        assert.equal(items[0].step_id, expectedStep);
        const constrained = await pool.connect();
        try {
          await constrained.query("BEGIN");
          await constrained.query(
            "SELECT set_config('app.tenant_id',$1,true),set_config('app.app_id',$2,true),set_config('app.run_id',$3,true)",
            [ref.tenantId, ref.appId, ref.runId],
          );
          await assert.rejects(
            constrained.query(
              "UPDATE fd.approval_work_items SET status='APPROVED' WHERE id=$1",
              [items[0].id],
            ),
            /row-level security/,
          );
        } finally {
          await constrained.query("ROLLBACK");
          constrained.release();
        }
        await handle.signal("decisionWake");
        await delay(200);
        assert.equal(await status(ref.runId), "RUNNING");
        assert.equal((await rows(ref.runId))[0].status, "PENDING");
        await decide(items[0].id);
        assert.equal((await dispatchDecisionWakeups(pool, client)).failed, 0);
        assert.equal(await handle.result(), "APPROVED");
        assert.equal(await status(ref.runId), "APPROVED");
      }
      const parallel: ApprovalPlan = {
        schemaVersion: 1,
        steps: [
          {
            id: "both",
            kind: "parallel",
            branches: [
              [{ id: "finance", kind: "approval", assignees: [manager] }],
              [{ id: "department", kind: "approval", assignees: [head] }],
            ],
          },
        ],
      };
      const { ref, handle } = await start(parallel, "10");
      const items = await eventually(
        () => rows(ref.runId),
        (value) => value.length === 2,
      );
      await decide(items[0].id);
      await dispatchDecisionWakeups(pool, client);
      await delay(200);
      assert.equal(await status(ref.runId), "RUNNING");
      worker!.shutdown();
      await running;
      await makeWorker();
      await decide(items[1].id);
      await dispatchDecisionWakeups(pool, client);
      assert.equal(await handle.result(), "APPROVED");
      assert.equal((await rows(ref.runId)).length, 2);
      assert.equal(await status(ref.runId), "APPROVED");
      const history = await handle.fetchHistory();
      assert.ok((history.events?.length ?? 0) > 10);
      await Worker.runReplayHistory(
        { workflowBundle: bundle },
        history,
        handle.workflowId,
      );
      await assert.rejects(
        createApprovalActivities(pool).loadRun({
          ...ref,
          tenantId: randomUUID(),
        }),
        /Run unavailable/,
      );
      const rejected = await start(parallel, "10");
      const rejectedItems = await eventually(
        () => rows(rejected.ref.runId),
        (value) => value.length === 2,
      );
      await decide(rejectedItems[0].id, "REJECTED");
      await dispatchDecisionWakeups(pool, client);
      assert.equal(await rejected.handle.result(), "REJECTED");
      assert.deepEqual(
        (await rows(rejected.ref.runId)).map((item) => item.status).sort(),
        ["CANCELLED", "REJECTED"],
      );
      const delayed = await start(
        {
          schemaVersion: 1,
          steps: [{ id: "delayed", kind: "approval", assignees: [manager] }],
        },
        "10",
        async (ref) => {
          const taskId = randomUUID();
          await admin.query(
            "INSERT INTO fd.approval_work_items(tenant_id,app_id,id,run_id,step_id,assignee_id) VALUES($1,$2,$3,$4,'delayed',$5)",
            [tenantId, ref.appId, taskId, ref.runId, manager],
          );
          await decide(taskId);
          const failure = await dispatchDecisionWakeups(pool, client);
          assert.equal(failure.failed, 1);
          assert.equal(
            (
              await admin.query(
                "SELECT delivered_at FROM fd.approval_outbox WHERE tenant_id=$1 AND run_id=$2",
                [tenantId, ref.runId],
              )
            ).rows[0].delivered_at,
            null,
          );
          // Advance only this test event's backoff; original committed decision stays intact.
          await admin.query(
            "UPDATE fd.approval_outbox SET lease_until=now()-interval '1 second' WHERE tenant_id=$1 AND run_id=$2",
            [tenantId, ref.runId],
          );
        },
      );
      assert.equal(await delayed.handle.result(), "APPROVED");
      const retried = await dispatchDecisionWakeups(pool, client);
      assert.equal(retried.failed, 0);
      assert.equal(retried.delivered, 1);
      assert.equal(
        (
          await admin.query(
            "SELECT attempts FROM fd.approval_outbox WHERE tenant_id=$1 AND run_id=$2",
            [tenantId, delayed.ref.runId],
          )
        ).rows[0].attempts,
        2,
      );
      // Published form -> request API -> durable start -> actual worker -> decision API.
      const formId = randomUUID(),
        workflowId = randomUUID();
      const ownerHeaders = {
        authorization: `Bearer ${tokens.get(owner)}`,
        "content-type": "application/json",
      };
      const definition = {
        schemaVersion: 2,
        id: "runtime_sample",
        title: { vi: "Kiểm thử", en: "Test" },
        version: 1,
        status: "DRAFT",
        fields: [
          {
            id: "amount",
            key: "amount",
            label: { vi: "Tiền", en: "Amount" },
            type: "currency",
            required: true,
            options: [],
          },
          {
            id: "total",
            key: "total",
            label: { vi: "Tổng", en: "Total" },
            type: "currency",
            required: true,
            readOnly: true,
            calculation: {
              operator: "add",
              fields: ["amount"],
              expression: "amount * 2",
            },
            options: [],
          },
        ],
      };
      const save = await fetch(
        `${apiAddress}/api/v1/apps/e-request/forms/${formId}`,
        {
          method: "POST",
          headers: ownerHeaders,
          body: JSON.stringify({ definition, expectedVersion: 0 }),
        },
      );
      assert.equal(save.status, 201, await save.text());
      const published = await fetch(
        `${apiAddress}/api/v1/apps/e-request/forms/${formId}/publish`,
        {
          method: "POST",
          headers: ownerHeaders,
          body: JSON.stringify({ expectedVersion: 1 }),
        },
      );
      assert.equal(published.status, 201);
      const formVersion = (await published.json()) as { id: string };
      const workflowPublished = await fetch(
        `${apiAddress}/api/v1/apps/e-request/workflows/${workflowId}/publish`,
        {
          method: "POST",
          headers: ownerHeaders,
          body: JSON.stringify({
            formVersionId: formVersion.id,
            conditionFields: ["total"],
            plan: {
              schemaVersion: 1,
              steps: [
                {
                  id: "request_review",
                  kind: "approval",
                  assignees: [manager],
                },
              ],
            },
          }),
        },
      );
      assert.equal(
        workflowPublished.status,
        201,
        await workflowPublished.clone().text(),
      );
      const workflowVersion = (await workflowPublished.json()) as {
        id: string;
      };
      const submit = (values: unknown, key = randomUUID()) =>
        fetch(`${apiAddress}/api/v1/apps/e-request/requests`, {
          method: "POST",
          headers: { ...ownerHeaders, "idempotency-key": key },
          body: JSON.stringify({
            workflowVersionId: workflowVersion.id,
            values,
          }),
        });
      assert.equal(
        (await submit({ amount: "10", unknown: "forged" })).status,
        422,
      );
      assert.equal((await submit({ amount: "10", total: "1" })).status, 422);
      assert.equal((await submit({ amount: "invalid" })).status, 422);
      assert.equal((await submit({})).status, 422);
      const requestKey = randomUUID();
      const submitted = await submit({ amount: "10.00" }, requestKey);
      assert.equal(submitted.status, 201, await submitted.clone().text());
      const requestRecord = (await submitted.json()) as {
        id: string;
        revision: number;
      };
      const retry = await submit({ amount: "10.00" }, requestKey);
      assert.equal(retry.status, 200);
      assert.equal(
        ((await retry.json()) as { id: string }).id,
        requestRecord.id,
      );
      assert.equal((await submit({ amount: "11.00" }, requestKey)).status, 409);
      const requestUrl = `${apiAddress}/api/v1/apps/e-request/requests/${requestRecord.id}`;
      const requestData = (await (
        await fetch(requestUrl, { headers: ownerHeaders })
      ).json()) as { values_json: unknown; form_version_id: string };
      assert.deepEqual(requestData.values_json, {
        amount: "10.00",
        total: "20.00",
      });
      assert.equal(requestData.form_version_id, formVersion.id);
      const changedDefinition = {
        ...definition,
        fields: definition.fields.map((f) =>
          f.key === "total"
            ? {
                ...f,
                calculation: {
                  operator: "add",
                  fields: ["amount"],
                  expression: "amount * 3",
                },
              }
            : f,
        ),
      };
      assert.equal(
        (
          await fetch(`${apiAddress}/api/v1/apps/e-request/forms/${formId}`, {
            method: "PUT",
            headers: ownerHeaders,
            body: JSON.stringify({
              definition: changedDefinition,
              expectedVersion: 1,
            }),
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await fetch(
            `${apiAddress}/api/v1/apps/e-request/forms/${formId}/publish`,
            {
              method: "POST",
              headers: ownerHeaders,
              body: JSON.stringify({ expectedVersion: 2 }),
            },
          )
        ).status,
        201,
      );
      assert.deepEqual(
        await (await fetch(requestUrl, { headers: ownerHeaders })).json(),
        requestData,
      );
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::int AS count FROM fd.request_revisions WHERE tenant_id=$1",
            [tenantId],
          )
        ).rows[0].count,
        1,
      );
      assert.equal(
        (
          await admin.query(
            "SELECT input FROM fd.approval_runs WHERE tenant_id=$1 AND id=$2",
            [tenantId, requestRecord.id],
          )
        ).rows[0].input.total,
        "20.00",
      );
      assert.equal(
        (
          await fetch(requestUrl, {
            headers: { authorization: `Bearer ${tokens.get(head)}` },
          })
        ).status,
        404,
      );
      assert.deepEqual(await dispatchApprovalStarts(pool, client, taskQueue), {
        claimed: 1,
        delivered: 1,
        failed: 0,
      });
      const requestHandle = client.workflow.getHandle(
        `approval-${requestRecord.id}`,
      );
      handles.push(requestHandle);
      const requestTasks = await eventually(
        () => rows(requestRecord.id),
        (value) => value.length === 1,
      );
      await decide(requestTasks[0].id);
      await dispatchDecisionWakeups(pool, client);
      assert.equal(await requestHandle.result(), "APPROVED");
      // Simulate crash after start but before acknowledging: no duplicate execution.
      await admin.query(
        "UPDATE fd.approval_start_outbox SET delivered_at=NULL,lease_until=NULL WHERE tenant_id=$1 AND run_id=$2",
        [tenantId, requestRecord.id],
      );
      assert.equal(
        (await dispatchApprovalStarts(pool, client, taskQueue)).delivered,
        1,
      );
      assert.equal((await rows(requestRecord.id)).length, 1);
      await assert.rejects(
        apiPool.query("UPDATE fd.request_revisions SET revision=2"),
        /permission denied/,
      );
      await admin.query(
        "UPDATE fd.members SET active=false WHERE tenant_id=$1 AND id=$2",
        [tenantId, head],
      );
      const blocked = await start(parallel, "10");
      await assert.rejects(
        blocked.handle.result(),
        /Workflow execution failed/,
      );
      assert.equal(await status(blocked.ref.runId), "BLOCKED");
      assert.ok(
        (await rows(blocked.ref.runId)).every(
          (item) => item.status === "CANCELLED",
        ),
      );
    } finally {
      for (const handle of handles) {
        try {
          if ((await handle.describe()).status.name === "RUNNING")
            await handle.cancel();
        } catch {
          /* test cleanup only */
        }
      }
      if (worker && worker.getState() === "RUNNING") {
        worker.shutdown();
        await running;
      }
      await native.close();
      await connection.close();
      await pool.end();
      await api.close();
      await apiPool.end();
      for (const table of [
        "approval_start_outbox",
        "approval_outbox",
        "task_decisions",
        "audit",
        "sessions",
      ])
        await admin.query(`DELETE FROM fd.${table} WHERE tenant_id=$1`, [
          tenantId,
        ]);
      await admin.query(
        "DELETE FROM fd.approval_work_items WHERE tenant_id=$1",
        [tenantId],
      );
      await admin.query("DELETE FROM fd.approval_runs WHERE tenant_id=$1", [
        tenantId,
      ]);
      for (const table of [
        "request_revisions",
        "workflow_versions",
        "form_versions",
        "form_drafts",
      ])
        await admin.query(`DELETE FROM fd.${table} WHERE tenant_id=$1`, [
          tenantId,
        ]);
      await admin.query("DELETE FROM fd.members WHERE tenant_id=$1", [
        tenantId,
      ]);
      await admin.end();
    }
  },
);
