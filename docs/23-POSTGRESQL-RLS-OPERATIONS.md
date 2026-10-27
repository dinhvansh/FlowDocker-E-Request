# PostgreSQL RLS — Runtime, Security Limits, Operations

**Status:** Reference approach, not applied. See [002_rls_policies.sql](../db/design/002_rls_policies.sql) for SQL.

## 1. What RLS actually provides
PostgreSQL RLS adds row filters to supported statements for tables with `ENABLE ROW LEVEL SECURITY`. Multiple PERMISSIVE policies may be combined with OR: review full effective policies. Owner and BYPASSRLS roles normally bypass row policies; `FORCE ROW LEVEL SECURITY` covers owners, but superusers and BYPASSRLS still bypass. A missing policy means **default deny** (subject to privilege rules).

## 2. Runtime role topology
```text
e_request_owner        NOLOGIN, schema/table owner, not used by API
e_request_app          LOGIN, SELECT/INSERT/UPDATE as explicitly GRANTed
e_request_worker       LOGIN, permission-limited service actions, scoped by tenant/job
e_request_migrator     CI/deployment-only role, DDL with restricted credentials
```
No day-to-day API, Teams Bot or Temporal worker connects as PostgreSQL superuser, owner or BYPASSRLS.

## 3. Transaction-local context
The application, **after verified user session and local tenant membership**, sets DB context inside *each transaction*:

```sql
BEGIN;
SELECT set_config('app.tenant_id', '11111111-1111-4111-8111-111111111111', true);
SELECT set_config('app.actor_user_id', '22222222-2222-4222-8222-222222222222', true);
SELECT id, request_no FROM ereq.requests ORDER BY created_at DESC LIMIT 20;
COMMIT;
```
The third argument `true` is transaction-local (SET LOCAL behavior). Connection-pool reads **must stay on that same transaction connection**; do not call `SET` at session scope. Tenant unset => RLS denies rows.

**Security limitation:** Any SQL that executes as this application role may modify these custom GUCs. They are **not tamper-proof security identities**. RLS based on GUCs is defense in depth behind authenticated API endpoints with parameterized SQL; it **does not** independently defeat arbitrary SQL injection or protect end users who can connect directly to the shared DB role. Stronger assurance can require per-tenant DB roles, signed context and restricted security-definer functions with code review. Never expose the DB endpoint to employee clients.

## 4. RLS policy coverage
- `requests SELECT`: tenant and (creator or active explicit REQUEST_READ grant).
- `request_access_grants SELECT`: tenant and grantee user (to support request RLS).
- `approval_tasks SELECT`: tenant and current assigned user.
- `request_revisions SELECT`: tenant and visible parent request.
- `attachments/artifacts SELECT`: tenant and visible parent request, **then additional API sensitivity restriction**.
- Other tables may have tenant-only RLS in the reference; this is **not sufficient** for financial confidentiality. Grant table read only to authorized backend module identities and add table-specific action/field rules before production.
- Finance processing is through purpose-bound business commands; no broadly granted raw table SELECT.

## 5. Policy lifecycle
1. Apply DDL via migration role.
2. Grant minimum table privileges to app role; enable and FORCE RLS on protected tables.
3. Review effective `pg_policies`, `relrowsecurity`, `relforcerowsecurity`, and actual `current_user`.
4. Test as **non-owner, non-BYPASSRLS e_request_app**, not as postgres or migration role.
5. Run two-tenant and same-tenant cross-owner tests, including direct SQL and transaction pooling.
6. On policy change, update policy version, audit and rerun regression tests.

## 6. Risks that must be closed
- A table owner accidentally used as runtime DB user.
- Missing tenant predicate on a JOIN, foreign key or batch export.
- SQL functions marked SECURITY DEFINER with unsafe `search_path` or overly broad grants.
- Test failures hidden by an all-powerful test DB user.
- Plain JSONB carrying bank details accessible to generic row readers.
- Trigger or background worker bypassing access grant revocation.
- RLS referencing related tables with cyclic policies causing recursion.
- Query planner/performance implications of grant lookups on large datasets.

## 7. Reference validation commands
```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles
WHERE rolname IN ('e_request_app','e_request_worker','e_request_owner');
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='ereq' AND c.relkind='r';
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname='ereq';
```

## 8. Verification of data queries
List/count/export/pagination and attachments must apply the same visibility policy. Never fetch all JSONB then filter on frontend; row access first, purpose-bound field projection second. Use synthetic fixtures for all tests, not production company data.

## References
- [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL SET](https://www.postgresql.org/docs/current/sql-set.html)
