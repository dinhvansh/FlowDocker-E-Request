# FlowDocker Application Platform — Phased Delivery & Acceptance

**Status: Planned / no platform runtime implementation.** Owner wants shell shared across apps; do not postpone all reuse to project end, but do not block E-Request domain delivery on an entire speculative ERP-wide platform.

## Build-order: a **vertical platform slice** first
| Phase | Work | Gate — what must be proven |
|---|---|---|
| F0 | Shared App Shell + design tokens + module manifest/registry | second synthetic module routes/menus without E-Request imports; auth & 403/404 boundaries |
| F1 | Identity/Organization + permission PDP/PEP core | two tenants/apps, roles/scopes, negative API tests, current membership revocation |
| F2 | Permission Builder UI: role matrix, typed conditions, row/field policy, simulation, publish | deny-by-default enforced on real API/list/export/field; no UI-only policy |
| F3 | Master Data Builder: local catalog typed schema/CRUD/lookup + versioning | Asset Category and Expense Type created via metadata; cross-app isolation and indexed validation |
| F4 | Connection Manager + Flow Studio source/staging/mapping | real approved read-only source, idempotent apply and strict cursor QA, no public secrets |
| F5 | Form Studio + Approval Workflow reusable adapters | E-Request Payment/Trip E2E; host-specific logic stays in domain |
| F6 | **Second consumer portability POC**: synthetic IT Assets module | no fork/copy of platform; own resource/actions/catalog/domain handler, tests pass |
| F7 | Packaging/version matrix, docs, backcompat/a11y/performance/security | CI, Storybook, SBOM, migration and upgrade tests before separate repo/registry decision |

These stages are **deliverables with tests, not implemented statuses or a promise about exact percentage of reused code**.

## Minimum platform QA matrix
| ID | Test | Expected |
|---|---|---|
| PLAT-01 | New app manifest registers module with navigation | route appears only with correct capability |
| PLAT-02 | Non-admin directly calls hidden route API | denied server-side |
| PLAT-03 | Same `master.category` name in different apps/tenants | no cross-app data leak |
| PLAT-04 | Register unimplemented action via manifest | policy cannot authorize missing handler |
| PLAT-05 | App A admin grants role in App B | rejected unless explicitly authorized cross-app |
| PLAT-06 | Role matrix editing/publish | immutable version and reviewer/audit |
| PLAT-07 | Policy test simulation ALLOW/DENY | explanatory result, no real impersonation |
| PLAT-08 | API enforcement diverges from UI simulation | fails contract gate |
| PLAT-09 | Employee reads another's request/bank fields | denied/masked |
| PLAT-10 | User becomes inactive while token cached | backend denies new command |
| PLAT-11 | Manager without pending task tries Teams approval | deny |
| PLAT-12 | Master Builder publishes Asset Category | safe catalog CRUD/list/lookup and audit |
| PLAT-13 | External-owned Vendor edited through generic catalog API | forbidden |
| PLAT-14 | Invalid required field/unique business key in catalog | validation/unique constraint error |
| PLAT-15 | Catalog schema version changes field type | migration approval required; old reads preserved |
| PLAT-16 | Catalog export sees sensitive fields | masked/denied |
| PLAT-17 | Two different app shells import same platform components | no app-private import dependencies |
| PLAT-18 | IT Assets domain `asset.assign` uses same platform PDP/audit | action authorized and recorded |
| PLAT-19 | Sync Flow failing at transform after staging | replay safe, checkpoint not skipped |
| PLAT-20 | Same company/vendor key appears across tenant/company | scoped correctly |
| PLAT-21 | Permission Builder policy lowers sensitive classification | blocked by mandatory baseline/approval |
| PLAT-22 | Runtime DB role accidentally owns protected table / BYPASSRLS | CI/security gate fails |
| PLAT-23 | Disable source with dependencies | pipeline impact confirmed; no data erased |
| PLAT-24 | Platform package built/tested independently of E-Request | succeeds and public exports validated |

## Split 'standard' vs 'custom' without overgeneralization
**Standard / reusable:** shell/menu, design tokens, UI controls, catalog designer/CRUD, SSO adapter, role matrix/policy admin, scoped CRUD helpers, logs/audit, connector configuration, graph visual editor, generic status panels.

**Always domain code where necessary:** payment settlement/invoices, special approval policy and processor, asset chain of custody, HR compliance, legal contract version/signature and source-specific ERP mapping. Generic metadata does not replace business invariants or sensitive data flows.

## Failing conditions / blockers
- New app requires copying `src/components` from E-Request rather than importing platform public APIs.
- Permission policy exists only as frontend UI check, not backend.
- Generic `master_records` used for sensitive financial transactions with no FK/field security.
- Package requires production Epicor/Teams just to render or run unit tests.
- Role change has no safe revocation/invalid cache pathway.
- A new master entity has no field classification, owner or migration plan.
- No second independent consumer/evidence but component declared platform-ready.

## Evidence template
For each stage: exact commit SHA, package API exports, Storybook/demo route, migration IDs, test command and actual output, sanitized data fixture, negative tests, design decision approvals, security findings, target environment and CI links.

## Repository strategy
The **single source of truth stays in `dinhvansh/FlowDocker-E-Request` during architecture and first consumer build**. Once package contracts are stable and second app POC passes, propose separate `flowdocker-platform` / `flowdocker-components` repos or private packages; require owner explicit choice first. Do not create empty repos or announce packages available prematurely.

## Relation to V1 priorities
Do not pause E-Request's Payment Request and Business Trip vertical slices to build a giant framework. Implement reusable foundations **as the feature needs them**, with an acceptance requirement that each stable reusable unit becomes a package with tests. Some capabilities (generic master catalog builder and permission simulation) can roll out in increments with clearly labelled incomplete state.
