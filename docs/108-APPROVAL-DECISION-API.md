# Authenticated decision API and durable wakeup

IN PROGRESS. Backend-only slice; existing browser data/UI untouched.

Impact map: additive migration for immutable per-actor idempotency receipts and
metadata-only outbox; scoped API work-item read/decision; transaction-local actor
and current capability checks; row-locked run/task transitions; audit and outbox
in the same transaction. Temporal receives a retryable wakeup after commit.
No Teams/webhook identity is trusted. No request payload is returned in task
summaries; request field projections belong to the later submission slice.

Public routes: GET /api/v1/apps/:appId/tasks (bounded cursor), GET .../tasks/:id,
POST .../tasks/:id/decision. Require tasks:decide capability and active assignment.
Decision body has only decision APPROVED/REJECTED and expectedVersion; UUID
Idempotency-Key is required. Identical retry returns the saved result; changed
payload with the same key conflicts. No generic form/admin permission bypass.

Reusable foundation: existing actor transaction and audit boundaries reused;
decision and Temporal event delivery remain domain adapters. No UI changes.

Verification: real HTTP/PostgreSQL isolation, revocation, unassigned actor denial,
stale version, idempotent retry, opposite-decision race, atomic audit/outbox and
real Temporal wakeup retry. This does not complete submission or request UI.

## Verified implementation

`npm run backend:test`: 3 real HTTP/PostgreSQL integration tests pass; includes
same-tenant unassigned/cross-tenant denial, current-member revocation, stale
version, unknown actor/body rejection, opposite-decision race, concurrent exact
retry, immutable receipts, request-column SQL denial, audit/outbox counts.

`npm run approval:test`: real HTTP decision using synthetic seeded sessions,
PostgreSQL, outbox and Temporal passes. Missing workflow delivery retains event;
retry succeeds after execution exists/completes. Restart/replay, conditional and
parallel paths, rejection and inactive-assignee cleanup remain covered.
No browser login/UAT or external Teams/OAuth claim. Migration 005 is additive.

API and worker activities share a transaction advisory lock for each run, so
terminal completion/cancellation and human decisions cannot interleave writes.
Idempotency uses an independent actor/key lock, then the run lock; no network
calls occur while either database transaction is open. Work-item metadata only
is exposed, never pinned input/plan. Dispatcher has metadata-only global queue
access as a trusted service, not a human role.

Known limits: system activity transitions still need their own audited event
stream; request revisions/field projections and published workflow binding are
pending. Development runtime is not HA; restore/UAT/release gates remain open.
