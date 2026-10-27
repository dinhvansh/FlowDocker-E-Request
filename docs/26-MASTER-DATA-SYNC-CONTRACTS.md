# Master Data Sync — Connector Contracts & Algorithms

**Status: DESIGN ONLY.** Schedule values below are INITIAL DEFAULTS FOR POC, not production SLAs.

## Connectors
| Connector | Bootstrap | Incremental mode | Baseline proposed frequency | Recovery |
|---|---|---|---|---|
| Microsoft Graph user directory | `GET /users/delta` (v1.0) and follow all next links | follow stored full `@odata.deltaLink`; process adds/updates/deletes | every 15–30 minutes; risk/tenant budget dependent | token invalid → scoped re-baseline without deleting users immediately |
| Manager relationship | explicit `/users/{id}/manager` fetch or approved supported Graph relationship delta strategy | targeted refresh for changed users + periodic reconciliation | hourly/daily initially, plus refresh at task activation if needed | missing relation → blocked assignment; never approve to unknown manager |
| HR source | approved HR API / trusted SFTP CSV | change version or full snapshot diff if no cursor | daily, after HR batch | checksum + completeness + manual conflict review |
| Epicor vendor/company/financial lookup | Epicor REST v2/BAQ (preferred if allowed), else SQL views using SELECT-only account | stable server cursor (last modified + PK), or full/sliced reconcile if no safe cursor | every 30–60 min or overnight by domain | cursor drift/full scan, source unavailability and exceptions |
| Controlled local catalog | import/UI (Finance or HR owner) | versioned local changes | immediately on approved publish | undo as new version, maintain audit |

These are **reference connector types**, not proof that the company's ERP endpoints, licenses or HR feed are configured. Epicor supports versioned REST/BAQ/OData; read-only SQL views are an alternative only if DBA/ERP owner authorizes them.

## Standard connector interface
```typescript
type Change = { externalKey: string; operation: "UPSERT" | "DELETE"; sourceVersion?: string;
  payload: unknown; observedAt: string };
interface MasterConnector {
  discover(): Promise<{entityTypes: string[]; cursorMode: "DELTA_TOKEN"|"KEYSET"|"FULL_SNAPSHOT"}>;
  fetchPage(cursor: string|null, pageSize: number): Promise<{
    records: Change[]; nextPageCursor?: string; completedCheckpoint?: string; checksum?: string
  }>;
}
```
Actual protocol modules use only allowlisted outbound URLs, credentials in secret manager, read-only permissions, rate-limit/backoff/jitter and correlation IDs.

## Sync pipeline
```text
SCHEDULE/TRIGGER
  → acquire per (tenant, source, entity) singleton lock / lease
  → create sync_run RUNNING with checkpoint_before
  → fetch pages into bounded staging with source ID + external key + hashes
  → validate schema, FK dependencies, required keys, duplicate keys and source version
  → normalize source enum/date/decimal and resolve company/employee foreign keys
  → diff against canonical/source mapping
  → quarantine unresolved records with safe error codes (no secrets in logs)
  → if quality gates pass, promote as idempotent bounded DB transactions
  → emit master_change_events + audit only for real changes
  → persist completed checkpoint and SUCCESS/PARTIAL stats
  → reconcile cache and preview lookups
```
**Checkpoint rule:** only advance a connector's authoritative checkpoint **after all of its covered pages are durably staged and the selected apply policy has completed**. A cursor never advances past unhandled changes silently. For a partially applicable batch, either stop with unchanged checkpoint and retry safely, or track durable per-record pending/retry state explicitly.

## Graph special handling
1. Start with `/v1.0/users/delta` and supported `$select` values, follow `@odata.nextLink` until a terminal `@odata.deltaLink`; keep the returned link opaque and encrypted because it includes state token.
2. Handle deleted/removed entities as **soft inactivation candidates**; do not hard-delete historical employees or tasks.
3. Entra `accountEnabled=false` signals account status; reconcile prompt revocation of sessions/decisions.
4. Do not assume `manager` relationship is returned identically with user delta by default; use documented supported options and explicit `/users/{id}/manager` lookups as needed.
5. Map immutable `(entra_tenant_id, object_id)` → internal user, not email/UPN/displayName.
6. API access scopes/app registration require IT tenant-admin review, least privilege, throttling monitoring.

## Epicor special handling
- Preferred: **read-only** Epicor REST/BAQ endpoints exposing *approved projection* of company, vendor, cost center and GL metadata.
- Fallback: specific SQL Server views with service account granted `SELECT` only, paged queries and source-safe isolation. Never insert/update/delete ERP for this sync.
- Incremental WHERE predicate, cursor and ties must be field-proven. For a suitable composite cursor:
```sql
-- PSEUDOCODE; column names are illustrative, NOT assumed Epicor schema!
SELECT TOP (@batch_size) external_key, modified_version, display_name, is_active
FROM dbo.vw_ERequest_VendorMaster
WHERE (modified_version > @last_version)
   OR (modified_version = @last_version AND external_key > @last_key)
ORDER BY modified_version, external_key;
```
- If there is no reliable monotonic version/time AND unique key, use full page scan + hash diff + reconciliation, not invented `SysRevID` logic. Deletion is **not** discoverable by incremental UPSERT-only cursors without tombstones; periodically reconcile all keys.
- Composite vendor external key includes company + vendor business key and stable source ID; mapping explicit, not company display name.
- Never sync sensitive payment bank account data unless business purpose, permission model, encryption and retention are approved.

## Schedules and consistency
Scheduler issues run commands; worker durable queue/Temporal activity executes bounded pages; PostgreSQL is read cache/source-of-truth for E-Request workflow; no API request waits synchronously on external ERP in normal path. On source error, use last-known-good data with stale banner for noncritical lookup, but **fail-closed** for critical assignee/finance eligibility checks beyond approved freshness.

## Sample scheduling policy (tunable)
```yaml
entra_users: {mode: delta, every_minutes: 30, critical_for: [login, approver_active]}
entra_managers: {mode: targeted_refresh, every_minutes: 60, critical_for: [assignment]}
hr_org: {mode: api_or_file, every_hours: 24, critical_for: [department, employment]}
epicor_vendors: {mode: rest_baq_or_readonly_sql, every_minutes: 60, critical_for: [vendor_eligibility]}
epicor_finance_codes: {mode: rest_baq_or_readonly_sql, every_hours: 4, critical_for: [payment_validation]}
reconcile_all_keys: {every_hours: 24}
```
These values do not promise a security revocation time; fast account termination needs separate control.

## Retry, concurrency and failures
- Use per-connector lease and fencing token; idempotent `(tenant_id, source_id, entity_type, external_key, source_revision/hash)` applied once.
- Exponential backoff honoring Graph Retry-After, no unbounded flooding.
- Stage and validate before merge; cannot roll back a Graph page fetch but can safely repeat it.
- A source row changing during a full scan is resolved by repeat/delta and revision semantics.
- Duplicates/conflicts → quarantine; never choose randomly.
- Missing source feed or partial file must not mass-delete canonical records; require complete snapshot marker and large-delete approval threshold.
- Changes to user active status invalidate authorization/cache projections; notifies assignment reconciliation.

## References
- [Microsoft Graph users delta](https://learn.microsoft.com/en-us/graph/delta-query-users)
- [Microsoft Graph delta overview](https://learn.microsoft.com/en-us/graph/delta-query-overview)
- [Graph manager API](https://learn.microsoft.com/en-us/graph/api/user-list-manager?view=graph-rest-1.0)
- [Epicor REST API](https://www.epicor.com/en-us/products/enterprise-resource-planning-erp/kinetic/tools-and-technology/open-rest-api/)
- [Epicor BAQ](https://www.epicor.com/en-us/products/enterprise-resource-planning-erp/kinetic/tools-and-technology/business-activity-queries/)

## Connection setup is separate from pipeline run
Connection life cycle, versioned secret, health checks, dependency impact and real Test Connection are specified in [Connections UX](30-CONNECTIONS-UX-FLOWS.md) and [API/Data Contracts](32-CONNECTIONS-API-DATA-CONTRACT.md). A test must not update a pipeline run cursor. One active connection can supply multiple entity-specific pipelines with independent mapping/checkpoints. Initial sync only begins after a pipeline is explicitly published and run; enable recurring schedule separately. Refer to [sequence diagrams](31-CONNECTIONS-SEQUENCE-DIAGRAMS.md).
