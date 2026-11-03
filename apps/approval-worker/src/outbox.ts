import type pg from "pg";
import type { Client } from "@temporalio/client";
import { randomUUID } from "node:crypto";
import { WorkflowExecutionAlreadyStartedError } from "@temporalio/common";

/** Claim and commit before networking; lease permits recovery after process death.
 * Delivery is at-least-once. decisionWake never carries a trusted decision. */
export async function dispatchDecisionWakeups(pool: pg.Pool, client: Client) {
  return dispatch(pool, "approval_outbox", async (event) => {
    const handle = client.workflow.getHandle(`approval-${event.run_id}`);
    try {
      await handle.signal("decisionWake");
    } catch (error) {
      const description = await handle.describe();
      if (description.status.name === "RUNNING") throw error;
    }
  });
}
export async function dispatchApprovalStarts(
  pool: pg.Pool,
  client: Client,
  taskQueue = "flowdocker-approval-v1",
) {
  return dispatch(pool, "approval_start_outbox", async (event) => {
    try {
      await client.workflow.start("approvalRun", {
        taskQueue,
        workflowId: `approval-${event.run_id}`,
        workflowIdReusePolicy: "REJECT_DUPLICATE",
        args: [
          {
            tenantId: event.tenant_id,
            appId: event.app_id,
            runId: event.run_id,
          },
        ],
      });
    } catch (error) {
      if (!(error instanceof WorkflowExecutionAlreadyStartedError)) throw error;
    }
  });
}
async function dispatch(
  pool: pg.Pool,
  table: "approval_outbox" | "approval_start_outbox",
  deliver: (event: {
    id: string;
    tenant_id: string;
    app_id: string;
    run_id: string;
  }) => Promise<void>,
) {
  const lease = randomUUID();
  const claimed = await pool.query(
    `WITH candidates AS (
       SELECT id FROM fd.${table} WHERE delivered_at IS NULL
       AND (lease_until IS NULL OR lease_until<now())
       ORDER BY created_at,id LIMIT 10 FOR UPDATE SKIP LOCKED
     ) UPDATE fd.${table} o SET lease_id=$1,lease_until=now()+interval '30 seconds',attempts=attempts+1
       FROM candidates c WHERE o.id=c.id RETURNING o.id,o.tenant_id,o.app_id,o.run_id`,
    [lease],
  );
  let delivered = 0;
  let failed = 0;
  for (const event of claimed.rows) {
    try {
      await deliver(event);
      const result = await pool.query(
        `UPDATE fd.${table} SET delivered_at=now(),lease_id=NULL,lease_until=NULL WHERE id=$1 AND lease_id=$2 AND delivered_at IS NULL`,
        [event.id, lease],
      );
      delivered += result.rowCount ?? 0;
    } catch {
      failed++;
      // Keep the durable event and bounded backoff; never record external payload/errors.
      await pool.query(
        `UPDATE fd.${table} SET lease_id=NULL,lease_until=now()+interval '5 seconds' WHERE id=$1 AND lease_id=$2 AND delivered_at IS NULL`,
        [event.id, lease],
      );
    }
  }
  return { claimed: claimed.rowCount ?? 0, delivered, failed };
}
