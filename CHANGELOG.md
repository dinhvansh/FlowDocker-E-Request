# Changelog

## Unreleased — Design baseline (2026-10-27)
- Created FlowDocker E-Request product definition and V1 scope.
- Documented dynamic Form.io-based authoring, Synergy Codes Workflow Builder CE and Temporal execution target, typed IF/ELSE, human task semantics and single-decision Web/Teams integration.
- Added Payment Request and Business Trip reference flows, eight Mermaid sequence diagrams, logical data model and API proposal, initial QA matrix.
- Documented license risks/validation gates and operations checklist.
- Deferred ONLYOFFICE collaborative Word review and digital signing to V2.

**No app source, production services, CI status or operational readiness claimed.**

- Design addendum: scoped RBAC/ABAC, request access grants, field security, PostgreSQL RLS, physical reference DDL, 28 negative authorization cases and standard Codex authorization-design Agent Skill. Reference SQL has not been applied or tested.

- Documented Master Data **Connections** screen, reusable credentials vs separate Sync Pipeline, four-step Connection wizard, five-step Sync wizard, six Mermaid sequences, API/security contracts, 20 test cases and versioned reference SQL 005. All are design, not implemented/tested.

- Designed visual node-based **Master Data Flow Studio** inspired by n8n UX (not its code): drag/drop JSON mapping, optional Parse JSON, Split Items, Filter, Lookup/Join, Validate, canonical Upsert, RAW/STAGING barrier, typed batch engine, 5 sequence diagrams, 27 QA cases and SQL reference 006. **Design only, not tested.**

- Added owner requirement for reusable FlowDocker-owned component library: shared UI tokens/primitives, flow canvas and field mapper, separated sync/approval domain adapters, Storybook/typed API/a11y quality gates and Codex Agent Skill. **Design only; no component packages or tests.**

- Architectural design addendum: **FlowDocker Application Platform** reusable shell/business module registry, Master Data Builder, Permission Builder (policy simulation and backend PDP/PEP), App Manifest/extension contract, reference PostgreSQL 007, multi-app IT Assets portability QA, and Codex Agent Skill. **Design only, no implementation.**

- Added owner-mandated **UX Research → UI/UX Design → Design Audit → Interactive Prototype → Design to Code** process, UI/UX Pro Max-linked local agent skill, heuristic findings from existing HTML demo screenshots, and task-first enterprise redesign brief. **Documents and audit only — no user interviews, redesigned UI prototype or production code.**


- Owner clarified UI framework selection: **Ant Design is optional, NOT a platform-wide mandate.** Added ADR-016 for task-based technology evaluation, headless/composable candidates and FlowDocker-owned design consistency. No new libraries installed or UI code written.
