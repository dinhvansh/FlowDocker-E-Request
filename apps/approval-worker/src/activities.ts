import type pg from "pg";
import { randomUUID } from "node:crypto";
import { ApplicationFailure } from "@temporalio/common";
import type {
  ApprovalPlan,
  ExposedFields,
  Scalar,
} from "../../../packages/approval-runtime/src/plan.ts";
export interface RunRef {
  tenantId: string;
  appId: string;
  runId: string;
}
export function createApprovalActivities(pool: pg.Pool) {
  async function scoped<T>(
    ref: RunRef,
    action: (db: pg.PoolClient) => Promise<T>,
  ): Promise<T> {
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      await db.query(
        "SELECT set_config('app.tenant_id',$1,true),set_config('app.app_id',$2,true),set_config('app.run_id',$3,true)",
        [ref.tenantId, ref.appId, ref.runId],
      );
      const run = await db.query(
        "SELECT id FROM fd.approval_runs WHERE id=$1",
        [ref.runId],
      );
      if (!run.rowCount)
        throw ApplicationFailure.nonRetryable(
          "Run unavailable",
          "RUN_UNAVAILABLE",
        );
      const result = await action(db);
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
  return {
    loadRun: (ref: RunRef) =>
      scoped(ref, async (db) => {
        const row = await db.query(
          "SELECT plan,input,exposed_fields FROM fd.approval_runs WHERE id=$1",
          [ref.runId],
        );
        return row.rows[0] as {
          plan: ApprovalPlan;
          input: Record<string, Scalar>;
          exposed_fields: ExposedFields;
        };
      }),
    activateApproval: (ref: RunRef, stepId: string, assignees: string[]) =>
      scoped(ref, async (db) => {
        const active = await db.query(
          "SELECT id FROM fd.members WHERE id=ANY($1::uuid[]) AND active",
          [assignees],
        );
        if (active.rowCount !== assignees.length)
          throw ApplicationFailure.nonRetryable(
            "Approver unavailable",
            "APPROVER_UNAVAILABLE",
          );
        for (const assignee of assignees)
          await db.query(
            "INSERT INTO fd.approval_work_items(tenant_id,app_id,id,run_id,step_id,assignee_id) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(tenant_id,app_id,run_id,step_id,assignee_id) DO NOTHING",
            [
              ref.tenantId,
              ref.appId,
              randomUUID(),
              ref.runId,
              stepId,
              assignee,
            ],
          );
        const items = await db.query(
          "SELECT id FROM fd.approval_work_items WHERE run_id=$1 AND step_id=$2 ORDER BY id",
          [ref.runId, stepId],
        );
        return items.rows.map((row) => row.id as string);
      }),
    readDecision: (ref: RunRef, taskIds: string[]) =>
      scoped(ref, async (db) => {
        const rows = await db.query(
          "SELECT status FROM fd.approval_work_items WHERE id=ANY($1::uuid[]) AND run_id=$2",
          [taskIds, ref.runId],
        );
        if (rows.rowCount !== taskIds.length)
          throw ApplicationFailure.nonRetryable(
            "Task unavailable",
            "TASK_UNAVAILABLE",
          );
        if (
          rows.rows.some(
            (row) => row.status === "REJECTED" || row.status === "CANCELLED",
          )
        )
          return "REJECTED" as const;
        return rows.rows.every((row) => row.status === "APPROVED")
          ? ("APPROVED" as const)
          : ("PENDING" as const);
      }),
    cancelPending: (ref: RunRef) =>
      scoped(ref, async (db) => {
        await db.query(
          "UPDATE fd.approval_work_items SET status='CANCELLED' WHERE run_id=$1 AND status='PENDING'",
          [ref.runId],
        );
      }),
    finishRun: (ref: RunRef, status: "APPROVED" | "REJECTED" | "BLOCKED") =>
      scoped(ref, async (db) => {
        await db.query("UPDATE fd.approval_runs SET status=$1 WHERE id=$2", [
          status,
          ref.runId,
        ]);
      }),
  };
}
