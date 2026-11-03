# Approval runtime vertical slice plan

IN PROGRESS. Preserve original Forms engine; older Form.io mentions in docs/19
are superseded by owner decision in docs/57. No borrowed E-Office runtime.

First prove a real Temporal worker interprets a bounded typed plan containing
approval, condition, parallel ALL and terminal nodes; no arbitrary JS/SQL.
Definition/version and request input are pinned. API owns PostgreSQL tasks and
decisions; Temporal only orchestrates activity calls and waits. A signal is a
wakeup, never a trusted approval: each continuation reads the committed decision.
Worker restart/replay must retain pending work. Webhook/OAuth transport is deferred
per owner; do not label outbound notification as authenticated inbound approval.

Impact: isolated Temporal dev service/volume, SDK and worker process, reusable
typed compiler/interpreter, workflow/task/request tables, non-owner worker role,
authenticated API, audit/outbox. UI editor/consumer added after backend paths
work. Existing browser drafts and form versions retained. Dev Temporal persistence
is distinct from the business PostgreSQL source of truth; no production HA claim.

Acceptance: below/above threshold, parallel ALL not early, invalid graph rejected,
immutable version pinning, wrong actor/revision deny, exactly one race winner,
idempotent retry, worker restart/replay and durable outbox retry. External services
are not mocked and called E2E. Test-only records are synthetic and bounded.

## Verified engine POC

`npm run approval:test` passes against real Temporal and PostgreSQL, including
threshold routes, parallel ALL, wakeup safety, restart/replay, RLS denial,
rejection cancellation and inactive-assignee BLOCKED cleanup. Fixture decisions
use the migration account, not a human decision API. See worker README for limits.
`npm run typecheck`, `npm run lint`, focused compiler tests and existing backend
HTTP tests are the regression gates for this backend-only slice.

Pinned SDK packages: @temporalio/{client,common,worker,workflow} 1.25.0.
Pinned local container temporalio/temporal 1.4.1 digest is in compose.backend.yml;
reports server 1.28.0/UI 2.39.0. This is a development service, not production HA.
Full slice remains IN PROGRESS: human APIs/outbox/publication UI are next.
