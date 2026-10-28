# AI Agent / Contributor Guide — FlowDocker E-Request

## Project status
This repo contains design documentation and a **frontend PR 1 prototype with synthetic browser-local data**. Do not claim backend services, authorization enforcement, migrations, deployment, UAT or CI are done when they do not exist. Frontend build/test evidence must cite actual commands and SHA.

## Read first
1. `README.md` for scope.
2. `docs/15-DECISIONS-AND-QUESTIONS.md` for confirmed decisions and unresolved policies.
3. `docs/02-ARCHITECTURE.md` for ownership/transaction boundaries.
4. `docs/08-SEQUENCE-DIAGRAMS.md` for eight flows.
5. `docs/13-IMPLEMENTATION-ROADMAP.md` and `docs/14-ACCEPTANCE-TESTS.md` for exit gates.

## Non-negotiables
- The V1 application is **FlowDocker E-Request**. Do not reuse E-Office Workflow Runtime V2; new workflow integration targets Synergy Codes Workflow Builder CE + Temporal after POC.
- **Dynamic Forms (owner update, docs/57 and Issue #3):** keep the original FlowDocker Forms engine. Redesign the designer using SurveyJS Creator/Fillout as UX research references only; no Form.io integration or comparison POC for this task. Preserve schema version, validation and field ACL at backend, regardless of UI behavior.
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

Owner requirement: finish and verify each planned PR slice, commit it and push its branch to GitHub before starting the next slice. Report the pushed branch/commit and distinguish a pushed branch from an opened pull request. Do not leave completed slices only on the local machine.

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

## MANDATORY FIVE-STAGE UX/UI PROCESS — OWNER REQUIREMENT 2026-10-28
For ANY frontend/UI/UX design, audit, prototype or design-to-code task: **FIRST read** [`.agents/skills/flowdocker-ux-design-process/SKILL.md`](.agents/skills/flowdocker-ux-design-process/SKILL.md), [Five-Stage Process](docs/47-UX-RESEARCH-TO-DESIGN-TO-CODE.md), [V1 Demo Audit](docs/48-V1-PROTOTYPE-AUDIT-AND-UX-RESEARCH.md) and [Redesign Brief](docs/49-FLOWDOCKER-UI-REDESIGN-BRIEF.md). The stages, in order: **1 UX Research → 2 UI/UX Design → 3 Design Audit → 4 Interactive Prototype → 5 Design to Code**. Use upstream [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) guidance, but do not claim the original skill/datasets are installed or searched if they are not. No fabricated users/benchmarks.

Never go straight from prompt to generated dashboard HTML with a giant hero and repetitive cards. Use operational task-first layouts for admin consoles, compact data tables, real contextual inspectors, meaningful states, accessibility, keyboard alternatives to drag, demo labels for mocks, then convert reviewed prototype to FlowDocker reusable typed components and real backend authorization. Per-step artifacts/review/QA evidence are required. A working HTML demo is not production code.


## ADR-016: Choose the UI toolkit that FITS the UX — Ant Design is NOT mandatory
**Owner instruction 2026-10-28.** FIRST read [UI Stack Selection Principles](docs/50-UI-STACK-SELECTION-PRINCIPLES.md) alongside the five-stage UX skill and screen redesign brief. Do NOT assume Ant Design is the required platform framework. Compare libraries against each screen's interactions, information density, keyboard/accessibility, bundle impact, design freedom, maintenance/license and reusable FlowDocker ownership. Prefer task-appropriate headless/composable primitives wrapped in `@flowdocker/*` components. Candidate POC: shadcn/ui + one base layer (Radix **or** Base UI), TanStack Table for data-grid logic, React Flow for node canvas, dnd-kit for field mapping, design tokens and Storybook. These are **candidates, not mandatory installed packages**. An Ant Design component may be used when justified by real UX/testing; avoid forcing the entire product into Ant visual design or mixing overlapping primitive systems without architecture review.

## Mandatory shadcn/ui skill — owner requirement
For all UI implementation, read [the official shadcn skill](.agents/skills/shadcn/SKILL.md) and the relevant linked rules alongside the FlowDocker UX/component skills. The current selected foundation is shadcn/ui (new-york), Radix, Tailwind v4 and Lucide; preserve React Flow for graph canvases.

- Reuse the public `@flowdocker/ui` components first. Add upstream primitives under `packages/ui/src/components/ui` and expose shared typed wrappers when needed; avoid separate copies per screen.
- Inspect `components.json` and run `npx shadcn@latest info --json` before component additions; use `npx shadcn@latest docs <component>` for current APIs. Do not blindly rerun init, change the primitive base or overwrite customized components.
- Preserve FlowDocker semantic tokens, existing public contracts, Vietnamese/English translations, keyboard accessibility and reduced-motion support. Use shared variants and tokens to keep screens consistent.
- The vendored skill comes from [shadcn-ui/ui](https://github.com/shadcn-ui/ui/tree/main/skills/shadcn). Preserve upstream attribution; skill examples are reference material, not application source.

## Mandatory bilingual UI — owner requirement
Every new or modified screen/component must support Vietnamese and English through `@flowdocker/i18n`. This applies to navigation, visible labels, buttons, dialogs, placeholders, tooltips, accessible names, loading/empty/error states, notifications, validation and simulation results. Keep whole sentences and parameterized messages in the shared dictionaries; do not concatenate translated fragments or freeze translations at module load/state initialization. Translate presentation only: keep API enums, technical IDs, user-entered data and persisted domain values unchanged. New demo node labels may declare optional labelKey/detailKey; unknown/custom node text stays verbatim.

Run `npm run i18n:check` (also included in `npm run lint`) and test changed journeys in both languages before reporting completion. The check detects direct JSX text, literal UI attributes and missing literal translation keys; dynamic messages and new third-party accessible labels still require review. Preserve the language picker design: flag + VI/EN code in the trigger, native language names with flags in its menu and a tinted selected row, language preference persistence, current draft input and reduced-motion behavior. See docs/54-BILINGUAL-I18N-FOUNDATION.md.

## FORMS USER DECISION 2026-10-28 — preserve engine, redesign UI from researched benchmarks
When working on `packages/form-builder` or `apps/e-request-web/src/forms.tsx`, first read **`docs/57-FORMS-UX-BENCHMARK-REDESIGN.md`** and GitHub Issue #3. Owner confirms: keep **original FlowDocker Forms engine**, 33 field type schema, runtime and reusable package; do **NOT** discard/rebuild it or force Form.io conversion. For Form Designer UX, study SurveyJS Creator V2 Toolbox + real design canvas + Property Grid and Fillout clean form presentation; use inspiration only, no copied code/assets. Replace current schema/table-centric primary editor with **WYSIWYG interactive form canvas** using common underlying field-rendering components. Keep palette, inspector, undo/redo, nested/repeating fields, typed logic, local preview, a11y and keyboard alternative. Before declaring DONE supply before/after screenshots, tested 1366×768 and mobile, real build/unit/browser evidence and owner approval. Do not merge without owner.
