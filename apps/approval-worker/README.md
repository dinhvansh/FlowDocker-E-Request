# Approval engine POC

`@flowdocker/approval-runtime` validates a bounded typed plan; the Temporal worker
orchestrates it. PostgreSQL holds pinned input and authoritative work-item state.
No user JavaScript/SQL is executed. A wake signal only prompts a database read.

Local prerequisites: `npm run backend:setup`, `npm run backend:up`,
`npm run backend:migrate`. Run `npm run approval:test` for the real isolated
Temporal/PostgreSQL integration. It bundles and starts its own worker, creates
synthetic fixtures and cleans those fixtures afterwards. Existing ERP storage
and browser drafts are not used.

Public plan: schemaVersion 1; approval, typed if/else and parallel ALL steps.
Assignees are canonical member UUIDs. Maximum 100 steps, depth 8, 2–8 parallel
branches and 1–16 assignees per approval. Exact decimal comparison avoids binary
floating point. Activity transactions set tenant/app/run scope locally. Worker
cannot read sessions or approve tasks; it can create pending work, cancel pending
work and finish its scoped run. Unknown/inactive approvers block execution;
parallel branches settle before pending tasks are cancelled.

Evidence: threshold routes, parallel ALL, untrusted wakeup, restart, history replay,
rejection cancellation, inactive approver blocking and direct SQL/RLS denial.
The integration currently commits decisions using the migration account solely as
test fixture setup. This is **not authenticated human approval E2E**.

Pending: human decision API, submission/version binding, transactional outbox,
editor graph adapter, runtime UI, audited transitions and recovery operations.
The pinned Temporal CLI development server uses persistent SQLite; it is not a
production HA deployment. If database cleanup itself is unavailable, an activity
failure remains visible in Temporal and needs reconciliation; no recovery SLA is
claimed. OAuth and Teams connection are deferred.

Reusable foundation impact: the plan/compiler package has no E-Request imports;
worker storage activities are domain adapters. Second-consumer and production
acceptance remain pending. No UI component changes in this slice.
