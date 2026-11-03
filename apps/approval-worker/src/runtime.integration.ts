import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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
    const connection = await Connection.connect({ address: "127.0.0.1:7233" });
    const native = await NativeConnection.connect({
      address: "127.0.0.1:7233",
    });
    const client = new Client({ connection });
    const tenantId = randomUUID(),
      owner = randomUUID(),
      manager = randomUUID(),
      head = randomUUID();
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
          "SELECT id,step_id,status,version FROM fd.approval_work_items WHERE tenant_id=$1 AND run_id=$2 ORDER BY step_id",
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
    async function start(plan: ApprovalPlan, amount: string) {
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
      const handle = await client.workflow.start("approvalRun", {
        taskQueue,
        workflowId: `approval-${ref.runId}`,
        args: [ref],
        workflowExecutionTimeout: "2 minutes",
      });
      handles.push(handle);
      return { ref, handle };
    }
    async function fixtureApprove(taskId: string) {
      // This POC commits synthetic decisions as test fixture setup, not an authenticated human API.
      const result = await admin.query(
        "UPDATE fd.approval_work_items SET status='APPROVED',version=version+1 WHERE tenant_id=$1 AND id=$2 AND status='PENDING'",
        [tenantId, taskId],
      );
      assert.equal(result.rowCount, 1);
    }
    try {
      await admin.query(
        "INSERT INTO fd.members(tenant_id,id) VALUES ($1,$2),($1,$3),($1,$4)",
        [tenantId, owner, manager, head],
      );
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
        await fixtureApprove(items[0].id);
        await handle.signal("decisionWake");
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
      await fixtureApprove(items[0].id);
      await handle.signal("decisionWake");
      await delay(200);
      assert.equal(await status(ref.runId), "RUNNING");
      worker!.shutdown();
      await running;
      await makeWorker();
      await fixtureApprove(items[1].id);
      await handle.signal("decisionWake");
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
      await admin.query(
        "UPDATE fd.approval_work_items SET status='REJECTED',version=version+1 WHERE tenant_id=$1 AND id=$2",
        [tenantId, rejectedItems[0].id],
      );
      await rejected.handle.signal("decisionWake");
      assert.equal(await rejected.handle.result(), "REJECTED");
      assert.deepEqual(
        (await rows(rejected.ref.runId)).map((item) => item.status).sort(),
        ["CANCELLED", "REJECTED"],
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
      await admin.query(
        "DELETE FROM fd.approval_work_items WHERE tenant_id=$1",
        [tenantId],
      );
      await admin.query("DELETE FROM fd.approval_runs WHERE tenant_id=$1", [
        tenantId,
      ]);
      await admin.query("DELETE FROM fd.members WHERE tenant_id=$1", [
        tenantId,
      ]);
      await admin.end();
    }
  },
);
