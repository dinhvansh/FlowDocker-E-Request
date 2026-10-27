# Master Data Sync — QA Test Matrix

**Status: planned tests; not run.** Use synthetic companies/vendors/users and mock external services until explicitly permitted to connect.

| ID | Area | Scenario | Pass criteria |
|---|---|---|---|
| MD-01 | Graph | initial multi-page /users/delta with nextLink | all records upserted once, terminal deltaLink persisted |
| MD-02 | Graph | delta updates and @removed | mapped account inactivated, not hard-deleted |
| MD-03 | Graph | invalid/expired delta cursor | safe rebaseline, no mass deactivation |
| MD-04 | Graph | Graph 429 throttling | Retry-After honored, retries bounded |
| MD-05 | People | same display name/email for two users | no auto-merge, external identity keys distinct |
| MD-06 | HR mapping | Entra dept conflicts with HR authoritative dept | HR-owned field wins, conflict audited |
| MD-07 | HR mapping | manager cycle (A→B→A) | reject mapping and block assignment |
| MD-08 | HR mapping | employee with no stable Entra link | cannot create approver task |
| MD-09 | ERP | vendor same code in two different companies | distinct canonical records |
| MD-10 | ERP | duplicate (company,vendor key) with conflicting payload | quarantine, no random update |
| MD-11 | ERP | table has no trusted cursor | full snapshot diff and reconcile (no guessed SysRevID) |
| MD-12 | ERP | stale/incremental UPSERT but deleted source record | full reconcile detects tombstone safely |
| MD-13 | ERP | read-only account tries write | no write permissions granted |
| MD-14 | Cursor | worker dies after staging page | restart no missing/duplicate canonical rows |
| MD-15 | Cursor | worker dies during promotion | checkpoint and applied rows remain consistent |
| MD-16 | Concurrency | scheduled sync overlaps manual sync | one active lease; no conflicting commit |
| MD-17 | Quality | sudden 50% missing in snapshot | guard threshold blocks mass disable |
| MD-18 | Schema | source drops required key column | quarantine and alert; no silent zeros |
| MD-19 | Finance | vendor inactive but present in old request | old request displays snapshot; new submit blocked |
| MD-20 | Finance | vendor from wrong company selected via forged API | reject |
| MD-21 | Finance | user changes amount/beneficiary while sync changes | request snapshotted immutably |
| MD-22 | Authorization | employee requests all vendor-bank fields | API omits finance-sensitive values |
| MD-23 | Authorization | sync worker tries another tenant | deny / scoped run identity required |
| MD-24 | Assignment | manager terminated with pending task | revoke access, expire Teams card, reassign/manual block |
| MD-25 | Assignment | directory stale beyond policy | activation blocks, explicit error |
| MD-26 | Lookup | external source outage | last-known-good allowed only for noncritical lookup |
| MD-27 | Governance | HR override written into Entra-owned identity | denied; correction via source |
| MD-28 | Governance | duplicate manual source alias | owner approval and audit required |
| MD-29 | Recoverability | staging TTL purge | token checkpoint and canonical data survive |
| MD-30 | Recoverability | DB restore mid-sync | idempotent replay, no wrong inactive state |
| MD-31 | Security | Graph delta token exposed in API/log | redacted and encrypted at rest |
| MD-32 | Identity | employee inactive in source while login session alive | backend rejects decision after timely revalidation |
| MD-33 | Runbook | sync RUNNING exceeds timeout | lease expires and operator alert, safe replay |
| MD-34 | RLS | admin user guesses other tenant vendor/list | deny / tenant-scoped |
| MD-35 | Workflow | manager changes after decision | historical decision unaffected; new tasks use configured policy |

## Evidence expectations
Record SHA, connector config version, run ID, cursor before/after (redacted), tenant fixture, expected and actual canonical hash, inserted/updated/inactivated/quarantined counts, auth DB role, environment and status. DO NOT claim sync success from a mocked source alone.

## Hard P0 gates
Prove at least one true Graph test tenant delta, one actual approved Epicor read-only projection test, HR mapping signoff, worker fail/retry, manual sync concurrency, two-company vendor key separation, invalid manager workflow blockage, and authorized lookup masking before production. Real company endpoints and field maps **not provided**.
