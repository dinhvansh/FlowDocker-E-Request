import type pg from "pg";
import type { Client } from "@temporalio/client";
import { randomUUID } from "node:crypto";

/** Claim and commit before networking; lease permits recovery after process death.
 * Delivery is at-least-once. decisionWake never carries a trusted decision. */
export async function dispatchDecisionWakeups(pool: pg.Pool, client: Client) {
  const lease = randomUUID();
  const claimed = await pool.query(
    `WITH candidates AS (
       SELECT id FROM fd.approval_outbox WHERE delivered_at IS NULL
       AND (lease_until IS NULL OR lease_until<now())
       ORDER BY created_at,id LIMIT 10 FOR UPDATE SKIP LOCKED
     ) UPDATE fd.approval_outbox o SET lease_id=$1,lease_until=now()+interval '30 seconds',attempts=attempts+1
       FROM candidates c WHERE o.id=c.id RETURNING o.id,o.run_id`,
    [lease],
  );
  let delivered = 0;
  let failed = 0;
  for (const event of claimed.rows) {
    try {
      const handle = client.workflow.getHandle(`approval-${event.run_id}`);
      try {
        await handle.signal("decisionWake");
      } catch (error) {
        // Polling may have completed the workflow before the wakeup was sent.
        // Missing/unreachable workflow still retries; a known closed execution
        // no longer needs a wakeup. Never create a workflow from an event here.
        const description = await handle.describe();
        if (description.status.name === "RUNNING") throw error;
      }
      const result = await pool.query(
        "UPDATE fd.approval_outbox SET delivered_at=now(),lease_id=NULL,lease_until=NULL WHERE id=$1 AND lease_id=$2 AND delivered_at IS NULL",
        [event.id, lease],
      );
      delivered += result.rowCount ?? 0;
    } catch {
      failed++;
      // Keep the durable event and bounded backoff; never record external payload/errors.
      await pool.query(
        "UPDATE fd.approval_outbox SET lease_id=NULL,lease_until=now()+interval '5 seconds' WHERE id=$1 AND lease_id=$2 AND delivered_at IS NULL",
        [event.id, lease],
      );
    }
  }
  return { claimed: claimed.rowCount ?? 0, delivered, failed };
}
