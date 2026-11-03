import pg from "pg";
import { createApi } from "./server.ts";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
const role = await pool.query(
  "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
);
if (role.rows[0].rolsuper || role.rows[0].rolbypassrls)
  throw new Error("Unsafe runtime database role");
const unsafe = await pool.query(
  "SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='fd' AND c.relkind='r' AND (pg_get_userbyid(c.relowner)=current_user OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity)",
);
if (unsafe.rowCount) throw new Error("Unsafe runtime table ownership or RLS");
const api = createApi(pool);
await api.listen({ host: "127.0.0.1", port: 3001 });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await api.close();
    await pool.end();
  });
