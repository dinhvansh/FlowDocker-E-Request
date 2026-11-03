import pg from "pg";
import { Client, Connection } from "@temporalio/client";
import { Worker, NativeConnection } from "@temporalio/worker";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { createApprovalActivities } from "./activities.ts";
import { dispatchDecisionWakeups, dispatchApprovalStarts } from "./outbox.ts";

if (!process.env.WORKER_DATABASE_URL)
  throw new Error("Missing worker database configuration");
const pool = new pg.Pool({
  connectionString: process.env.WORKER_DATABASE_URL,
  max: 5,
});
const connection = await Connection.connect({
  address: "127.0.0.1:7233",
  connectTimeout: "5 seconds",
});
const native = await NativeConnection.connect({ address: "127.0.0.1:7233" });
const client = new Client({ connection });
const worker = await Worker.create({
  connection: native,
  taskQueue: "flowdocker-approval-v1",
  workflowsPath: fileURLToPath(new URL("./workflows.ts", import.meta.url)),
  activities: createApprovalActivities(pool),
});
const abort = new AbortController();
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  abort.abort();
  if (worker.getState() === "RUNNING") worker.shutdown();
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
async function dispatchLoop() {
  while (!stopping) {
    try {
      await connection.withDeadline(Date.now() + 10000, () =>
        dispatchApprovalStarts(pool, client),
      );
      await connection.withDeadline(Date.now() + 10000, () =>
        dispatchDecisionWakeups(pool, client),
      );
    } catch {
      // Do not leak database URLs, identities or service error payloads.
      process.stderr.write(
        "Approval wakeup dispatch deferred; durable events retained.\n",
      );
    }
    try {
      await delay(1000, undefined, { signal: abort.signal });
    } catch {
      /* graceful stop */
    }
  }
}
try {
  const running = worker.run();
  await Promise.all([running.finally(stop), dispatchLoop()]);
} finally {
  stop();
  await native.close();
  await connection.close();
  await pool.end();
}
