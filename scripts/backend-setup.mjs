import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
const target = ".env.backend.local";
if (existsSync(target)) {
  console.log("Existing backend configuration retained.");
} else {
  const password = randomBytes(32).toString("hex");
  const runtime = randomBytes(32).toString("hex");
  writeFileSync(
    target,
    `FD_DB_PASSWORD=${password}\nFD_RUNTIME_PASSWORD=${runtime}\nMIGRATION_DATABASE_URL=postgres://fd_migrator:${password}@127.0.0.1:55432/flowdocker\nDATABASE_URL=postgres://fd_runtime:${runtime}@127.0.0.1:55432/flowdocker\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log("Local backend configuration generated; no credentials printed.");
}
