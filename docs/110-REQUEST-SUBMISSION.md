# Request submission foundation

IN PROGRESS. Additive backend slice: owner-only immutable request revision,
published workflow/form binding, server calculation/validation, transactional run
and durable workflow-start outbox. Reuses original Forms engine and actor scope.
No UI changes or data migration. No Teams transport changes.

POST /api/v1/apps/:appId/requests requires requests:submit and forms:use plus UUID
Idempotency-Key, body workflowVersionId/values only. Identical retry returns the
same request; changed input/key conflicts. GET .../requests/:id requires
requests:submit and ownership; active approvers have task metadata only until an
explicit request field policy/projection is implemented. No raw task data read.

First safe submission subset is top-level scalar fields and authored decoration.
Unknown keys, hidden/disabled/derived writes and unsupported file/person/lookup/
nested/numbering/context sources are rejected, not silently trusted. Server
recomputes calculated values. Advanced designer features remain intact but cannot
yet submit to this backend subset. Full schema/policy support remains NOT DONE.

Tests must exercise real HTTP/PostgreSQL/Temporal create-start-decision, owner
isolation, unknown/forbidden writes, recomputation, invalid values, immutable
binding, exact retries and durable start deduplication. No mock E2E claim.

## Verified implementation

`npm run approval:test` passes the real HTTP/PostgreSQL/Temporal chain: save and
publish original form, publish workflow, reject unknown/derived/invalid/missing
values, submit exactly once, recalculate total from 10 to 20 on server, preserve
request snapshot after new form formula/version, deny another owner's read,
dispatch durable start, activate task, decide over authenticated HTTP, complete
approval, then replay start event without creating another workflow/task.
Synthetic sessions are seeded by the administrator; browser sign-in/UAT remains
pending. Existing conditional/parallel/restart/replay tests still pass.
`npm run backend:test`, lint and typecheck pass. No full UI regression needed for
this backend-only slice. Full designer schema submission remains NOT DONE.

Start events use the same leased dispatcher mechanism as decision wakeups, with
an internal table allowlist. Workflow ID reuse is REJECT_DUPLICATE; an already
started execution acknowledges a repeated start. External calls happen after
claim commit, never inside a business transaction. Local worker loop dispatches
starts before wakeups. First revision is immutable; revision/return/resubmit
lifecycle and actor-specific field projection are future slices.
