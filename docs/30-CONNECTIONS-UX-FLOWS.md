# Master Data → Connections — Functional UX Specification (V1)

**STATUS: DESIGN ONLY / no code, connection, test, or synchronization exists.** Date: 2026-10-27.

## 0. Concept: Connection != Data Source != Sync Pipeline
| Object | Meaning | One-to-many relationship |
|---|---|---|
| Connector Type | Plugin protocol implementation: SQL Server, Epicor REST, Entra Graph, HR API, SFTP/CSV | One type → many connections |
| **Connection** | Named environment endpoint + authenticated secret reference + network/TLS settings, a secure reusable credential profile | One connection → several master sources |
| **Master Source** | Specific authoritative logical dataset and owner: Epicor Company, Vendor, Cost Center; Entra Users, HR Employees | One logical source → selected sync pipeline(s) |
| **Sync Pipeline** | Which entity/view/BAQ/Graph endpoint, selected fields, PK/cursor, mapping, mode, schedule, target, DQ policies | One connection can serve several pipelines |
| Sync Run | One execution with status, metrics, checkpoint, staging, exception outcomes | Pipeline → many runs |
| Canonical Master | Validated in-app tenant-scoped master (user, vendor, cost center, company) | Used by Form.io/Workflow |

Creating/testing/saving a connection NEVER automatically reads all tables, starts sync or enables arbitrary SQL. The initial connection may be saved as DRAFT without permission to synchronize. `Tested` means the specified test assertions passed; not production readiness.

## 1. Primary screen — Administration > Master Data > Connections
```text
┌────────────────────────────────────────────────────────────────────┐
│ MASTER DATA > CONNECTIONS                           + NEW CONNECTION│
├────────────────────────────────────────────────────────────────────┤
│ All 4    Active 2   Draft 1   Error 1      [Search...] [Type] [Env] │
│                                                                    │
│ Name                  Type         State      Last Test    Used By  │
│ Epicor ERP            SQL Server   Active     2 min ago    3 syncs  │
│ Microsoft Entra       Graph API    Active     1 hr ago     2 syncs  │
│ HR Master             REST API     Draft      Never        0 syncs  │
│ Finance ERP           Epicor REST  Error      Failed       1 sync   │
│                                                                    │
│ [Epicor ERP selected]                                               │
│ Overview | Configuration | Access | Used By | Health | Audit         │
│ Host: ********  DB: ***     Credential: Stored securely             │
│ Last test: SUCCESS / auth & read check     Last sync: separate field │
│ Actions: Test • Create Sync • Rotate Secret • Edit • Disable        │
└────────────────────────────────────────────────────────────────────┘
```
**Dummy rows only.** Sensitive endpoints/passwords are masked; source names and field metadata subject to role policies.

### Connection list columns
Name, connector type, environment (DEV/QA/PROD), scope/tenant, status, last successful health check, last test result, credential expiry metadata (never value), number of dependent sources/pipelines, owner, created/updated dates and actions. Status filters and pagination. Status is independent of pipeline run status.

### Detail tabs
- Overview: capabilities, health, last test, endpoint-safe summary, owner and read-only badge.
- Configuration: metadata edit with optimistic version; secret always `•••• stored`, never retrievable.
- Access: permissions per role, department/tenant, operational owner; immutable permission-change audit.
- Used By: pipelines, entity, enabled/suspended, last sync, impact analysis.
- Health: test history, latency, DNS/TLS/auth/permission failures; restricted sanitized error codes.
- Audit: who changed what, credential rotation and disablement; **no secrets, tokens, SQL row payloads**.

## 2. Wizard A — Create Connection (4 steps)
**Step 1: Choose Connector** cards: Microsoft Entra Graph, Epicor REST/BAQ, SQL Server read-only (Epicor view), HR REST API, managed SFTP import/file import. Manual catalog is not a connection; it belongs to Administration > Local Catalog. User chooses logical name, environment, tenant, owner. Optional display test icon.

**Step 2: Configure Endpoint & Authentication**
- Entra Graph: Entra tenant ID, application/client ID, auth method (client secret or certificate in external secrets manager), Graph scope/permissions status; no email password or interactive personal token.
- Epicor SQL Server: hostname/port, database, secure TLS verify by default, SQL/approved identity mode, service account secret, approved schema/view whitelist; **never accept client-supplied arbitrary SQL as execution instructions**. No insecure trust-certificate toggle in production without documented exception.
- Epicor REST/BAQ: base HTTPS URL, auth mode, approved company context, API token/secret reference, endpoint whitelist, TLS strict, timeout; avoid storing full token in database.
- HR API: HTTPS base, pagination auth method, resource prefix, stable external employee key, owner.
- File import/SFTP: allowlisted managed endpoint/path, verified host key/credentials, file format and schedule, checksum/manifest policy. Upload CSV itself is separate one-time import workflow.

**Step 3: Test Connection**
Real bounded test (DNS/connect → TLS validation → authentication → minimally authorized READ/metadata probe → capability result). Output per-step PASS/FAIL, sanitized fault, elapsed time, access scope, discovered safe capabilities (not entire database). Invalid password, expired secret, denied SELECT/Graph scope = failed. SQL read-only policy cannot be proven solely by a SELECT: DBA must attest restricted login/database permissions; integration account must not possess DML privileges. Test requests have timeout, rate limit and cancellation, and never output credentials or sample sensitive rows. Successful Test on version N should be invalidated if config/credential changes.

**Step 4: Save & Activate**
Save masked config + *secret vault reference*, owner, environment, version and test result. `Save Draft` always possible if authorized; `Activate` only if passing real test of current config and operational policy. Offer buttons `Finish` and `Create Sync Pipeline →`. Even ACTIVE connection does **not** begin ingestion. Audit creation/activation.

## 3. Wizard B — Create Sync Pipeline (5 steps, separate from connection)
1. **Select Connection + Entity**: pick approved ACTIVE connection and canonical data domain (Entra User, HR Employee, Company, Vendor, Cost Center). Specify source business owner and company scope. Prevent unauthorized dataset/tenant mix.
2. **Discover Source**: browse approved Graph entity, BAQ, allowlisted SQL view or HR endpoint; preview schema and bounded synthetic/redacted rows; select stable primary/composite key, mandatory company key, selected fields. No `SELECT *` ingestion. `Schema Discovery` test is separate from `Connection Test`.
3. **Field Mapping + Ownership**: map source fields to canonical types, format/conversion, status lifecycle and relationships; check required keys and field SoT priority. Only allowlisted transformations, no arbitrary JS. Validate duplicates, foreign keys and multi-company. Show sampled errors and exclusions.
4. **Sync Strategy + Schedule**: Initial Full (bootstraps), Incremental (Graph delta or validated keyset) **if supported**; if no safe cursor, choose Full Snapshot Diff + Reconciliation. Select pagination, interval, throttle, retry, deletion/inactivation guard, stale-data threshold, effective-date policy. Do not silently switch Full → Incremental or skip changes.
5. **Dry Run + Publish**: read bounded/sandbox sample or complete safe preview (clearly identify extent), stage/validate and show inserted/updated/unchanged/quarantined/inactivated **predictions** without changing canonical data. Reviewer approves mapping+schedule. Publish `PAUSED` by default; operator separately clicks `Run Initial Sync`, reviews result and activates recurring schedule. Disallow accidental mass deactivation.

## 4. Connection lifecycle and actions
```text
DRAFT --Test pass--> TESTED --Activate--> ACTIVE
DRAFT --Test fail--> DRAFT (latest result FAIL)
ACTIVE --Probe fail--> DEGRADED (or ERROR if unusable)
TESTED / ACTIVE --Credentials changed--> REVALIDATION_REQUIRED
ACTIVE --Disable (impact review)--> DISABLED
DISABLED --Test current config + Activate--> ACTIVE
```
Connection `health` and administrative `enabled` are independent: `ACTIVE + ERROR` may show as DEGRADED. Avoid a single status accidentally enabling sync on failure.

- **Edit Endpoint**: show dependency impact, save new draft config version, test that version, activate transactionally. Existing live version remains until switched or manually disabled.
- **Rotate Credentials**: input new secret to vault, test with staged ref, then atomic promote. On failure keep old ref if still valid and alert; audit fingerprints/actor but not values.
- **Disable/Delete**: for any used connection, show dependent pipelines and require confirm; disable stops *future* scheduled runs, cancels or drains running run under policy. Hard delete blocked while dependencies/history exist; use soft disable/archive.
- **Test Again**: does not change master data or advance sync checkpoint.
- **Access**: form designers cannot view host/credentials unless they have connection:read_metadata; pipeline operators may choose an approved connection without viewing secrets.

## 5. Human journeys (operator)
**Example Epicor vendor**
`Connections → New → SQL Server → Configure TLS/read-only service account → Test real connection → Save/Activate → Create Sync → Select Vendor + Company → Discover approved view → Map CompanyCode + VendorID + Name + Active → choose Full Snapshot Diff OR proven incremental → Dry Run → Review → Run Initial Sync → Enable schedule → Form Studio Lookup: Vendors`.

**Example Entra**
`Connections → New → Entra Graph → app registration/tenant/client secret ref → Test authorized Graph query → Save → Create Sync: Users → select identity fields/Graph delta → Map immutable object ID → Dry Run → Initial Delta Bootstrap → Store encrypted deltaLink → Enable schedule`.

**Example HR**
`Connections → New HR REST or SFTP → Test source access → Sync HR Employees + Org Relationships → Map employee ID to verified Entra ID (not name) → review department/manager conflicts → apply confirmed records → enable task-assignee lookup`.

## 6. Guards
No credentials exposed on logs/API/React state after save; secret version has least privilege; encrypted secret references and rotation. No external write operations to Epicor. Only approved safe metadata discovery, ACL for source owner. Approval routing blocked on missing/untrusted manager or stale critical catalog, rather than choosing random admin. Never rewrite historical approvals.

## 7. Permissions
See [Connections API/Data](32-CONNECTIONS-API-DATA-CONTRACT.md). Proposed capabilities `connection:list`, `connection:create`, `connection:read_metadata`, `connection:test`, `connection:edit`, `connection:rotate_secret`, `connection:activate`, `connection:disable`, `pipeline:create`, `pipeline:map`, `pipeline:dry_run`, `pipeline:publish`, `pipeline:run`, `pipeline:manage_schedule`, `sync:read_status`, `sync:resolve_exception`. Scope by tenant/environment/data domain. Avoid giving all permissions to generic System Admin by default.

## 8. API/DB states and test gates
[API/Data Contract](32-CONNECTIONS-API-DATA-CONTRACT.md) · [6 Sequence Diagrams](31-CONNECTIONS-SEQUENCE-DIAGRAMS.md) · [Master Data QA](29-MASTER-DATA-TEST-PLAN.md). No UI, backend, vault or SQL migrations were run for this specification.
