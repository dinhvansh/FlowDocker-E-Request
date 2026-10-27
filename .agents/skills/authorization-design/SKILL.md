---
name: authorization-design
description: Design and audit E-Request authorization across RBAC, scoped permissions, ABAC, field security, PostgreSQL RLS, Web/Teams decisions and background workers. Use whenever adding roles, permission checks, data tables, organization scopes, new APIs or request/task workflows.
compatibility: For coding agents with access to the FlowDocker E-Request repository and a PostgreSQL 16+ test environment.
---

# Authorization Design — FlowDocker E-Request

## Trigger
Read this skill before implementing or reviewing login, identity, roles, departments, request CRUD, task approval, finance, form publication, field-level permissions, tenant data, export/download or Teams integration.

## Method
1. Read `docs/20-AUTHORIZATION-ARCHITECTURE.md`, `docs/21-PERMISSION-MATRIX.md`, `docs/22-DATA-LAYER-PHYSICAL-DESIGN.md`, `docs/23-POSTGRESQL-RLS-OPERATIONS.md` and `docs/24-AUTHORIZATION-TEST-PLAN.md`.
2. Inspect actual migrations, models, APIs and actor claims. When none exist, label output as **design**, never implemented.
3. List actors (employee, active task assignee, finance reviewer/operator, form/workflow admin, tenant admin, auditor, Teams bot, Temporal worker).
4. List actions per resource, not just navigation links: LIST, READ, CREATE, EDIT_DRAFT, SUBMIT, DECIDE, RETURN, CANCEL, PUBLISH, MARK_PAID, DOWNLOAD, EXPORT and ADMINISTER.
5. Determine identity, scope and resource relationship: tenant → department/request type → request owner/task assignee/explicit grant → business state/revision → field sensitivity.
6. Define API authorization and server-side field projections. Web hiding a field **does not** restrict data; do not return raw `data_jsonb`.
7. Design relational constraints (composite tenant FKs, immutable revisions, revocation, expected-version, idempotency) and RLS policies. PostgreSQL runtime role must not own protected tables or have BYPASSRLS.
8. Confirm Web & Teams submit the **same business command** with verified real actor, never a trusted user ID supplied by a card.
9. Test grants, revocation, cross-tenant, same-tenant cross-owner, field access, direct SQL, stale task and concurrent web-vs-Teams decisions.
10. Give exact migration/test commands and reproducible evidence with commit SHA. **No evidence = NOT DONE.**

## Mandatory review questions
- Can user A guess another employee's request ID and read its data or attachments?
- Can a Manager see a request without a current task or explicit right?
- Can Finance read bank details outside assigned processing scope?
- Can Tenant Admin read document contents by default?
- Can a deactivated approver still approve through a cached Teams card?
- Can a malicious POST add a hidden bank/accounting field?
- Can two actors win opposite decisions simultaneously?
- Can workers cross tenant boundaries when retrying?
- Can session context leak through pooled PostgreSQL connections?
- Are exports, counts, PDF URLs and logs subject to the same restrictions?

## Guardrails
Deny by default. Validate Entra subject, tenant and local active membership. No human end user direct SQL as the shared API account. No `eval` policy expressions. Do not expose company secrets in this PUBLIC repo. Transactional audit+outbox for transitions. RLS complements, never replaces, authorization in the API.

## References
- [Agent Skills format specification](https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx).
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
