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
