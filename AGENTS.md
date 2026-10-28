# AI Agent / Contributor Guide — FlowDocker E-Request

## Project status
This repo currently contains **DESIGN DOCUMENTATION ONLY**. Do not claim application code, unit tests, integration tests, build, deployment, UAT or CI are done when they do not exist.

## Read first
1. `README.md` for scope.
2. `docs/15-DECISIONS-AND-QUESTIONS.md` for confirmed decisions and unresolved policies.
3. `docs/02-ARCHITECTURE.md` for ownership/transaction boundaries.
4. `docs/08-SEQUENCE-DIAGRAMS.md` for eight flows.
5. `docs/13-IMPLEMENTATION-ROADMAP.md` and `docs/14-ACCEPTANCE-TESTS.md` for exit gates.

## Non-negotiables
- The V1 application is **FlowDocker E-Request**. Do not reuse E-Office Workflow Runtime V2; new workflow integration targets Synergy Codes Workflow Builder CE + Temporal after POC.
- **Dynamic Forms:** Form.io JS Core candidate; preserve schema version, validation and field ACL at backend, regardless of UI behavior.
- **Workflow:** Admin IF/ELSE and parallel approval; graph drafts must be validated/compiled before executing. Never run arbitrary JS in admin-defined expressions.
- **Approval:** Single source of truth in PostgreSQL. Web and custom Teams Bot use one authenticated, idempotent decision API; transactional state/audit/outbox; durable Temporal signaling.
- **Teams:** Custom Bot ≠ native Teams Approvals. Avoid unverified Graph beta dependency and design around possible company DLP restrictions.
- **Payment:** approved is **not** paid. Finance settlement distinct.
- **PDF:** only from approved immutable revision; generation failure must not rewrite approval history.
- **Word review / ONLYOFFICE / digital signing:** explicitly V2; do not install as a required V1 dependency.
- **Data:** no actual employee records, bank details, production credentials, private company configuration in this public repo.
- **Licenses:** verify exact pinned versions/editions; no unsupported assertions that whole stack is unrestricted/white-label.
- **Testing:** no fake/mocked result may be called E2E production evidence; cite SHA, commands and actual logs.

## Implementation quality rules
- Prefer modular app boundaries and additive DB migrations; do not destructively reset real datasets.
- Task transition under DB transaction/row lock; durable outbox event and idempotency key; workers retry and reconcile.
- API checks tenant, actor, role, field mask, task assignment, request revision on every read/mutation.
- Before feature work produce impact map: schema/API/UI/Temporal/Teams/storage/security/migration/tests.
- Build small vertical slices; when a PR fails tests, do not merge until addressed; distinguish CI PASS vs owner QA.
- Keep all diagrams/docs aligned whenever runtime contracts change.

## Git process
Inspect branch status/main/working tree before mutation; preserve unrelated changes; use focused PRs, explicit commits and acceptance evidence. Do not silently merge implementation PRs unless authorized.

## Reporting convention
Use **DONE** only for verified implemented+tested outcomes and **IN PROGRESS / NOT DONE** for everything else. Docs being committed are not proof the system exists.

## Initial assignment
After owner agreement, POC the Form.io JS Core builder/render package and Synergy Codes CE with Temporal using real PostgreSQL tasks. Prove a Payment Request IF/ELSE route on a disposable environment, then proceed according to roadmap.


## Mandatory Authorization Skill (added 2026-10-27)
For every change to users, departments, roles, request data, workflow task assignment, Teams approvals, Finance, downloads, exports, SQL and API guards, **read [`.agents/skills/authorization-design/SKILL.md`](.agents/skills/authorization-design/SKILL.md)** first. Follow docs/20 through docs/24 and db/design reference SQL. Maintain deny-by-default, tenant-scoped composite FKs, active-task assignee binding, field-level JSONB projection, audit/outbox and PostgreSQL RLS. RLS is defense in depth and cannot prevent a compromised shared DB role from spoofing untrusted session GUCs. Never claim reference DDL is a production migration.

## Mandatory Master Data Integration Skill
When building forms with lookups, org/manager assignment, identity mappings, vendors, companies, cost centers, finance master, external connectors, scheduled sync or worker: read [Master Data Skill](.agents/skills/master-data-integration/SKILL.md) and docs/25–29. Use canonical PostgreSQL master, safe source key mapping, durable checkpoints, quality quarantine, soft inactivation and authorization. Epicor integration is READ-ONLY and has no verified schema/API yet. Never assume a particular source cursor or mutate ERP. Reference 003/004 SQL is **not a deployed migration**.

## Required Connection Manager implementation review
Before implementing Administration → Master Data → Connections or any new connector, read docs/30–33, db/design/005_connections_extension.sql, and the master-data-integration skill. Connection is a reusable secure auth/endpoint profile; source/pipeline are separate entities. Implement real bounded Test Connection (network, TLS, auth, permissioned read), version-bound credential testing, least-privilege vault reference, staged credential rotation, dependency impact on Disable, and separate Sync Wizard/initial sync. No mock connection test can be called DONE; no source writes.

## Mandatory node-based Master Data Flow Studio design (2026-10-28)
If working on master source synchronizations, Parse JSON, Split Items, data mapping, Join/Lookup, preview, RAW/STAGING or canonical Upsert, read docs/34 through docs/38 and db/design/006_node_sync_graphs.sql. The master sync graph is **NOT** the human approval workflow. Use `@xyflow/react` for new original UI subject to MIT notices; do NOT copy/embed n8n editor code under an assumed permissive license. Graph compiler must typecheck fields and prohibit arbitrary JS/SQL/HTTP. Verify idempotent page staging, data lineage, checkpoint rules, per-node preview with redaction, graph-version pinning and cross-company/tenant isolation. Reference SQL remains DESIGN; no tests run.

## MANDATORY: Build a reusable FlowDocker Component System (owner requirement, 2026-10-28)
For **ALL UI work** on Connections, Form Studio, Master Data Flow Studio, Approval Workflow Studio, Tasks, dashboard, visual field mapping or node editors: FIRST read [`.agents/skills/flowdocker-component-system/SKILL.md`](.agents/skills/flowdocker-component-system/SKILL.md), [Component Library Architecture](docs/39-FLOWDOCKER-COMPONENT-LIBRARY.md) and [Extraction Acceptance](docs/40-COMPONENT-EXTRACTION-ACCEPTANCE.md).

- Own our original reusable FlowDocker components: public, typed props/events, CSS tokens, accessible states, examples/stories and tests; do not hardcode E-Request API routes/Temporal/Epicor in generic components.
- Plan a shared `@flowdocker/ui`, `@flowdocker/flow-canvas`, `@flowdocker/field-mapper` and domain adapters as workspace packages when API stabilizes. Extract from the first stable feature **during development**, not only after every screen is finished.
- Master Sync Flow and Request Approval Workflow share **visual primitives** only, never business execution engines or permission checks.
- Every feature PR must include a `Reusable component impact` section and state which parts were added, reused or left domain-specific, plus Storybook/test/consumer evidence where applicable.
- No copy-paste near-duplicate node cards or mapping components. No copied n8n code; honor React Flow/shadcn third-party license/NOTICE. Do not publish packages or imply ownership of upstream code without legal/licensing review.
- Do not call a component `platform-ready` or `DONE` without documented Props, isolated example, tests, and a second host (or an explicit pending status).

## CRITICAL: Reusable FlowDocker Application Platform, not just UI components (2026-10-28)
Owner requirement: build a reusable **application shell/foundation** so future apps write only their domain business functions. Before coding any E-Request platform module or a new FlowDocker app, **read [`.agents/skills/flowdocker-app-platform/SKILL.md`](.agents/skills/flowdocker-app-platform/SKILL.md) and docs/41–46**.

- Platform foundation must cover App Shell, Identity/Organization, Permission Builder, Master Data Builder, Connections/Sync, Forms/Approval, Audit/Notifications and existing reusable UI kit; package boundaries are proposals until tested.
- Reuse **frontend and backend service contracts**. A visual permission matrix is NOT enforcement; backend PDP/PEP + DB-grants/row scope and field projection remain mandatory. Tenant/app scope is explicit and deny-by-default.
- Every application registers its `AppManifest` resource/action catalog, compatible platform APIs, master schemas and implemented business commands. Manifest actions without backend handlers are invalid.
- Master Data Builder owns metadata/field classification and can generate safe local catalog CRUD; HR/ERP external masters stay source-owned/read-only, and finance/asset lifecycle transactions remain typed domain handlers.
- No cross-application automatic data sharing, no blanket Tenant Admin data access, no arbitrary JS/SQL rules, no fallback to insecure generic EAV for sensitive transactions.
- Implement platform features incrementally **inside E-Request first** while building a second independent synthetic IT Assets reference consumer; no premature empty `flowdocker-platform` repo/npm publish.
- Every feature PR states reusable foundation vs domain-specific core, version/migration impact, and proof from docs/45. Report DESIGN DONE separately from IMPLEMENTATION NOT DONE.
