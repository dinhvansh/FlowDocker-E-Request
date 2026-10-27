# Connections — API, Data Contracts, Authorization & Acceptance

**DESIGN ONLY / not implemented or tested.** Date: 2026-10-27. Complements [UX](30-CONNECTIONS-UX-FLOWS.md), [Sequences](31-CONNECTIONS-SEQUENCE-DIAGRAMS.md) and source/pipeline reference schema [003](../db/design/003_master_data_schema.sql).

## 1. Core entities
`master_connections`: tenant_id, id, name, environment, connector_type, owner_id, current_active_version_id, admin_enabled, health_state, row_version, timestamps.

`master_connection_versions`: tenant_id, id, connection_id, version_no, endpoint_config_json **allowlisted and sanitized**, **vault_secret_ref (not plaintext)**, metadata fingerprint, lifecycle state, created_by, created_at. Secret manager stores actual credentials outside PostgreSQL. Never include a reversible encrypted password string in public APIs.

`master_connection_test_runs`: tenant_id, id, connection_version_id, secret_ref_fingerprint/version, started_at, finished_at, sanitized test results (DNS/TLS/auth/read/capabilities), duration_ms, result, tested_by, expires_at. Actual secret, Graph token, request Authorization header and raw source rows are never stored.

`master_sources`: logical authoritative entity/source connected to a connection; may be one of several sources using same connection. Add `connection_id` to existing `master_sources` with tenant-safe FK. Existing `secret_reference` column on `master_sources` is **legacy design** and must be deprecated/backfilled; never maintain two independent credential sources.

`master_sync_pipelines` / `master_sync_runs` / `master_sync_checkpoints`: existing logical pipeline/run records in [003](../db/design/003_master_data_schema.sql); add reviewed `pipeline_config_versions` to hold selected source catalog, field mapping, approved schema checksum, PK/cursor strategy, schedule, deletion guard, freshness policy, publish reviewer and version. Connection should survive multiple independent pipelines.

## 2. States
Connection administrative lifecycle:
- `DRAFT`: safe metadata and optional credential ref stored; no sync.
- `TESTED`: current config + candidate credentials passed bounded network/TLS/auth/read checks.
- `ACTIVE`: approved, current version tested, allowed for selected pipelines.
- `REVALIDATION_REQUIRED`: changed endpoint/auth, previous success no longer valid for new version.
- `DISABLED`: operator pause; pipelines cannot start new runs.

Independent health: `UNKNOWN`, `HEALTHY`, `DEGRADED`, `FAILED`. UI may show `ACTIVE · DEGRADED` without accidentally clearing operator disablement. `TESTED` expires when config changes and potentially after a policy-defined age.

Pipeline: `DRAFT`, `VALIDATED`, `PAUSED`, `BOOTSTRAPPING`, `ACTIVE`, `FAILED`, `DISABLED`. Only an explicit activation enables scheduling.

## 3. Proposed endpoints (NOT existing)
| Method | URI | Permission | Notes |
|---|---|---|---|
| GET | `/api/v1/master-data/connector-types` | master.connection:list | safe provider metadata |
| GET | `/api/v1/admin/master-connections` | master.connection:list | tenant-filtered, no secret |
| POST | `/api/v1/admin/master-connections` | master.connection:create | creates DRAFT/version; secret directly to vault |
| GET | `/api/v1/admin/master-connections/{id}` | master.connection:read_metadata | public config + redaction only |
| PATCH | `/api/v1/admin/master-connections/{id}/draft` | master.connection:edit | new version, expected row version; no live overwrite |
| POST | `/api/v1/admin/master-connections/{id}/tests` | master.connection:test | actual restricted bounded test; config version |
| GET | `/api/v1/admin/master-connections/{id}/tests` | master.connection:read_health | sanitized test history |
| POST | `/api/v1/admin/master-connections/{id}/activate` | master.connection:activate | test matches version/secret; extra policy checks |
| POST | `/api/v1/admin/master-connections/{id}/rotate-secret` | master.connection:rotate_secret | stage→test→promote with rollback |
| GET | `/api/v1/admin/master-connections/{id}/dependencies` | master.connection:read_metadata | pipeline impact list |
| POST | `/api/v1/admin/master-connections/{id}/disable` | master.connection:disable | pending/running run policy |
| POST | `/api/v1/admin/master-sources` | master.pipeline:create | bind connection + logical entity |
| GET | `/api/v1/admin/master-sources/{id}/discover` | master.pipeline:discover | approved metadata/read only |
| PUT | `/api/v1/admin/master-pipelines/{id}/draft` | master.pipeline:map | mapping/mode/schedule, no execution |
| POST | `/api/v1/admin/master-pipelines/{id}/dry-run` | master.pipeline:dry_run | preview, never canonical writes |
| POST | `/api/v1/admin/master-pipelines/{id}/publish` | master.pipeline:publish | immutable definition and reviewer |
| POST | `/api/v1/admin/master-pipelines/{id}/run` | master.pipeline:run | explicit initial/one-off sync |
| POST | `/api/v1/admin/master-pipelines/{id}/enable-schedule` | master.pipeline:manage_schedule | only after successful bootstrap |
| GET | `/api/v1/admin/master-pipelines/{id}/runs` | master.sync:read_status | separate from test history |

**No arbitrary SQL editor, external URL callback or opaque `executeQuery` endpoint** is offered to Form Designer or Sync Operator.

## 4. Example safe payloads
### Create SQL Server Connection DRAFT
```json
{
  "name": "Epicor ERP Read Only",
  "connectorType": "MSSQL_READONLY",
  "environment": "QA",
  "endpointConfig": {
    "host": "example.internal.invalid",
    "port": 1433,
    "database": "EXAMPLE_DB",
    "encrypt": true,
    "verifyCertificate": true,
    "readAllowlist": ["approved_view_name"]
  },
  "secretInput": {
    "authType": "SQL_PASSWORD",
    "username": "readonly_example",
    "password": "<transient redacted>"
  }
}
```
`secretInput` is one-time-only, never echoed, logged or retained in form state beyond submission. Real endpoints and credentials must not be stored in public Git.

### Safe read response
```json
{
  "id": "connection_uuid",
  "name": "Epicor ERP Read Only",
  "connectorType": "MSSQL_READONLY",
  "environment": "QA",
  "adminEnabled": false,
  "lifecycle": "DRAFT",
  "health": "UNKNOWN",
  "activeVersion": null,
  "credentials": { "configured": true, "canReveal": false },
  "lastTest": null,
  "dependentPipelines": 0
}
```

### Test result response
```json
{
  "testRunId": "test_uuid",
  "connectionVersionId": "version_uuid",
  "result": "FAILED",
  "checks": [
    { "name": "NETWORK", "status": "PASS" },
    { "name": "TLS", "status": "PASS" },
    { "name": "AUTH", "status": "PASS" },
    { "name": "READ_PROBE", "status": "FAIL", "errorCode": "READ_PERMISSION_DENIED" }
  ],
  "sensitiveDetailsRedacted": true
}
```
Use `Idempotency-Key` on mutations, `expectedVersion` on edit/activate/disable, bounded timeouts and correlation IDs. Test result must bind exact config + vault-secret versions, not just same connection ID.

## 5. Security / operational decisions
- Connector endpoints need outbound allowlist, DNS rebinding protection, TLS validation, timeouts and SSRF guard. No `localhost`, cloud metadata addresses or private ranges **unless explicitly defined as approved internal target**; company ERP lives on private network so blanket private-IP ban is wrong. Resolve/re-resolve and compare to allowed network range.
- No source write permissions; SQL Server service principal granted `SELECT` on approved views only. Probing with SELECT proves **read access**, not lack of INSERT/UPDATE/DELETE; permission review must be performed separately.
- Per-tenant vault isolation. Password/client secret only in vault; masked API. Rotation staged, tested, atomically promoted, tracked audit.
- `master_connections` and tests are admin-only; generic form users see only a safe canonical lookup API.
- Sync test/dry-run needs limits (row/page/time/data-volume) to prevent source overload and costs.
- Only enable schedule after an initial sync and review; no fallback to default schema/table/cursor that could silently sync wrong data.
- Deactivating connection blocks new schedules; running jobs cancel or drain with explicit policy; durable outbox, leases and cursor protected.
- Error UI distinguishes `NETWORK_ERROR`, `TLS_INVALID`, `AUTH_FAILED`, `READ_PERMISSION_DENIED`, `THROTTLED`, `SOURCE_SCHEMA_DRIFT`, `SECRET_EXPIRED`, `CHECKPOINT_INVALID`, `TENANT_SCOPE_MISMATCH`.

## 6. Suggested permission roles
| Role | Can create/test/edit? | Can rotate/activate/disable? | Can map/publish pipeline? | Can run/review sync? |
|---|---|---|---|---|
| Integration Admin | Yes, tenant-scoped | Yes, with audit/impact review | Yes | Yes |
| Source Owner/Steward | View safe config, test per grant | No by default | Can approve entity/field ownership | Can review exception/quality |
| Sync Operator | Metadata view only | No by default | Create drafts and mappings if scoped | Run authorized pipelines and monitor |
| Form Designer | No | No | Choose **published canonical lookup only** | No |
| Workflow Designer | No | No | Choose **published active assignee/catalog only** | No |
| Employee/Approver | No | No | No | No |
| System Admin | Not automatically! must have explicit Integration Admin right | Not automatically | Not automatically | Incident support if granted |

## 7. Connections acceptance test matrix (not executed)
| Test | Scenario | Expected |
|---|---|---|
| CON-01 | Configure + save DRAFT | no sync starts |
| CON-02 | Wrong password | AUTH_FAILED and no ACTIVE |
| CON-03 | TLS certificate invalid | test fails |
| CON-04 | SQL user can connect but lacks SELECT on approved view | READ_PERMISSION_DENIED |
| CON-05 | Test success with config V1, endpoint changed to V2 | V1 result cannot activate V2 |
| CON-06 | Test success but credential rotated | test invalidated until candidate tested |
| CON-07 | Create two Sync pipelines sharing one connection | separate schemas/checkpoints and schedules |
| CON-08 | Disabling connection with 3 active pipelines | impact dialog + no future runs |
| CON-09 | Secret retrieved via read API | never exposed |
| CON-10 | Unauthorized Form Designer queries connection list | forbidden |
| CON-11 | SSRF to metadata/local unauthorized endpoint | rejected |
| CON-12 | Failed dry run | canonical and checkpoint unchanged |
| CON-13 | Vendor mapping missing company key | cannot publish |
| CON-14 | Unsupported cursor field selected | refuse incremental, offer full diff |
| CON-15 | Unexpected mass deactivation | quarantine/reviewer required |
| CON-16 | Job overlap on same pipeline | single lease, no competing checkpoint |
| CON-17 | Rotate candidate fails | old reference remains active |
| CON-18 | Wrong tenant connection used in pipeline | deny |
| CON-19 | External source down after prior success | health DEGRADED, existing canonical data retained with freshness guard |
| CON-20 | SQL read-only user attempts source DML through integration | no DML surfaces, source account lacks privileges |

For release, exact environment, SHA, executable test logs, DBA/source owner permission proof, tenant isolation and sanitized evidence are required. **No test passes are claimed here.**
