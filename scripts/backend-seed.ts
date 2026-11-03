import pg from "pg";
import { randomUUID, randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
import { createPassword } from "../apps/api/src/password.ts";
const path = "backend-demo.local.json";
const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString || new URL(connectionString).hostname !== "127.0.0.1")
  throw new Error(
    "Synthetic seed requires the isolated loopback development database",
  );
if (existsSync(path))
  throw new Error(
    "Local demo credentials already exist; retained without changes",
  );
const db = new pg.Client({ connectionString });
await db.connect();
try {
  const login = "demo-admin";
  const prior = await db.query(
    "SELECT 1 FROM fd.local_accounts WHERE login_name=$1",
    [login],
  );
  if (prior.rowCount)
    throw new Error("Demo account already exists; no account was overwritten");
  const tenantId = randomUUID(),
    actorId = randomUUID();
  const password = randomBytes(24).toString("base64url");
  const credential = await createPassword(password);
  await db.query("BEGIN");
  await db.query(
    "INSERT INTO fd.members(tenant_id,id,capabilities) VALUES ($1,$2,$3)",
    [tenantId, actorId, ["e-request:forms:edit"]],
  );
  await db.query(
    "INSERT INTO fd.local_accounts(login_name,tenant_id,actor_id,salt,verifier) VALUES ($1,$2,$3,$4,$5)",
    [login, tenantId, actorId, credential.salt, credential.verifier],
  );
  writeFileSync(
    path,
    JSON.stringify({ login, password, tenantId, actorId }, null, 2),
    { flag: "wx", mode: 0o600 },
  );
  await db.query("COMMIT");
  console.log(
    "Synthetic author account created. Credentials are in ignored backend-demo.local.json, not printed.",
  );
} finally {
  await db.end();
}
