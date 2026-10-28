---
name: flowdocker-app-platform
description: Design and implement reusable FlowDocker application foundations: app shell, module manifests, master data builder, policy/permission builder, backend authorization contracts and testable business extension modules. Use for any new FlowDocker app or E-Request platform infrastructure rather than app-specific business features.
compatibility: FlowDocker E-Request repository, planned TypeScript/React/Node.js/PostgreSQL workspace modules.
---

# FlowDocker Application Platform — Agent Skill

## Owner goal
Build the **application shell and reusable platform services once**, so future FlowDocker apps add only domain-specific resources, handlers, tables, forms and workflows. Do not limit reuse to JSX. Do not overengineer as a SaaS platform before E-Request's first vertical slice works.

## Read first
- `docs/41-FLOWDOCKER-APPLICATION-PLATFORM.md`
- `docs/42-REUSABLE-MASTER-DATA-BUILDER.md`
- `docs/43-REUSABLE-PERMISSION-BUILDER.md`
- `docs/44-APP-MODULE-CONTRACT.md`
- `docs/45-PLATFORM-ACCEPTANCE-AND-ROADMAP.md`
- `docs/39-FLOWDOCKER-COMPONENT-LIBRARY.md`, `docs/40-COMPONENT-EXTRACTION-ACCEPTANCE.md`
- `docs/20-24` security design; `docs/25-38` master/connector/sync/graph design

## Mandatory engineering workflow
1. Classify proposed feature **shared platform** vs **domain-specific business** and record integration boundary.
2. Register app/module with a typed validated manifest: appId, routes, resource/actions, master entities, handler names and compatible package versions.
3. Centralize reusable app chrome, OIDC/organization, module navigation, tenant/app scoping, audit/notification and error handling.
4. Master Data Builder: typed entity definition registry, field metadata/classification, source-of-truth, data owner, validation, read-only mirror vs editable local catalog, versioned publish and secure CRUD/lookup.
5. Permission Builder: derive resources/actions only from registered backend handlers; build roles, scopes, ABAC typed predicates, field read/write/mask, test access simulation, reviewed policy publish.
6. Enforce permission on **backend PEP/PDP** with row/field masking and query constraints, plus tenant-aware PostgreSQL RLS where applicable. A menu guard or simulated UI result is never sufficient.
7. Strictly prohibit arbitrary admin-defined JS/SQL, free-form endpoint execution, blanket superuser access, or auto-privilege from display role names.
8. Keep Data Sync Flow and human Approval Workflow execution separate even if sharing a graph canvas.
9. Implement E-Request as first consumer; test same platform module package in a synthetic second app (e.g. IT Assets) **without copying or importing E-Request-specific code**.
10. Build testable public package exports, docs, stories, migrations, negative API/SQL tests, version compatibility, attribution and CI.
11. Don't automatically create new repositories or publish npm packages; wait for stable APIs/actual second consumer and owner instruction.
12. Report only **DESIGN DONE** or **IMPLEMENTATION DONE** with SHA+test evidence. Never describe written docs as functional software.

## Definition of done for reusable platform modules
- Builds and typechecks with no E-Request domain imports.
- App-module manifest validated against implemented backend handlers, not merely navigation labels.
- Real server authorization and tenant/app isolation verified with negative tests.
- Builder revisions/versioning/rollback; sensitive field projection and source governance enforced.
- At least two independent synthetic or real app contexts consume the same public API.
- No secrets/employee/finance source data committed to public Git.
- Real working code and tests. A design-only README does **not** pass.

## Related skills
Read `.agents/skills/flowdocker-component-system/SKILL.md`, `.agents/skills/authorization-design/SKILL.md`, and `.agents/skills/master-data-integration/SKILL.md` for their respective boundaries.
