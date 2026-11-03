import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const db = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
});
if (
  !process.env.MIGRATION_DATABASE_URL ||
  !/^[a-f0-9]{64}$/.test(process.env.FD_RUNTIME_PASSWORD ?? "") ||
  !/^[a-f0-9]{64}$/.test(process.env.FD_WORKER_PASSWORD ?? "")
)
  throw new Error("Run backend:setup and load local configuration.");
await db.connect();
try {
  await db.query("SELECT pg_advisory_lock(761104)");
  const role = await db.query(
    "SELECT 1 FROM pg_roles WHERE rolname='fd_runtime'",
  );
  if (!role.rowCount)
    await db.query(
      `CREATE ROLE fd_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD '${process.env.FD_RUNTIME_PASSWORD}'`,
    );
  const workerRole = await db.query(
    "SELECT 1 FROM pg_roles WHERE rolname='fd_worker'",
  );
  if (!workerRole.rowCount)
    await db.query(
      `CREATE ROLE fd_worker LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD '${process.env.FD_WORKER_PASSWORD}'`,
    );
  await db.query(
    "CREATE TABLE IF NOT EXISTS public.fd_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const directory = new URL("../apps/api/migrations/", import.meta.url);
  for (const name of readdirSync(directory)
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(new URL(name, directory), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const prior = await db.query(
      "SELECT checksum FROM public.fd_migrations WHERE name=$1",
      [name],
    );
    if (prior.rowCount) {
      if (prior.rows[0].checksum !== checksum)
        throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    await db.query("BEGIN");
    try {
      await db.query(sql);
      await db.query(
        "INSERT INTO public.fd_migrations(name,checksum) VALUES ($1,$2)",
        [name, checksum],
      );
      await db.query("COMMIT");
      console.log(`Applied ${name}`);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await db.end();
}
