# Backend delivery ledger

Status: IN PROGRESS, not project completion or production acceptance.

Owner authorized completion of the listed system modules followed by repeated
end-to-end verification and fixes. Preserve the existing original Forms engine.
Teams uses an API/webhook adapter with OAuth 2.0 configuration deferred by owner;
an outgoing webhook does not authenticate approval decisions.

## Delivery order and impact

1. Close current document-region changes: branch feat/forms-document-regions,
   commit 55af5ed, pushed; pointer-drop and owner acceptance still pending.
2. API foundation: isolated PostgreSQL, checksummed additive migrations,
   non-owner runtime role, transaction-local RLS, hashed opaque sessions,
   current membership/grants, authoring draft CRUD and audit. This changes
   schema/API/storage/security, not Temporal/Teams or existing browser storage.
   Shared database/session primitives; Forms is the first domain consumer.
3. Connect existing Studio through an explicit storage adapter; retain/export
   local drafts and resolve version conflicts without silent overwrites.
4. Immutable publication, typed workflow compiler, real Temporal execution,
   submission/revisions/tasks/decision concurrency and transactional outbox.
5. Master and permission administration backed by APIs, Finance, files/PDF,
   MCP authenticated adapters, webhook/OAuth connection configuration.
6. Browser E2E, database isolation, restart/retry/race and restore tests;
   regression tests for each defect. Release runbook and external acceptance.

## Acceptance boundaries

No UI-only permission, memory-only backend, unsigned callback or mocked worker
is evidence of real authorization or durable workflow. External OAuth/Teams
delivery remains NOT DONE until configured and exercised against a test service.
No production deployment or automatic merge is authorized by these local tests.
Every implemented slice is committed and pushed before starting the next slice.

Foundation verification: npm run backend:test passed using a real loopback HTTP listener and PostgreSQL non-owner role; migration rerun preserved state. npm run typecheck, npm run lint and npm run build passed. Runtime audit reported zero advisories; 11 moderate developer-tool advisories remain. See apps/api/README.md for missing gates. No browser/API integration yet.

Storage transport slice: added paginated authorized form summaries and reusable optional HTTP repository (Forms 0.5.11). Tested against real HTTP/PostgreSQL; malformed cursor regression and stale client save included. Existing local UI untouched. Login/session issuance and visible storage choice remain the next slice.

Local identity slice: added scrypt-based synthetic local account login, expiring/revocable opaque sessions, bounded login attempts, and explicit local-only bootstrap. Test caught session INSERT RETURNING blocked by missing RLS token context; fixed by setting transaction-local session hash before INSERT, test retained. Backend HTTP tests, lint/i18n and typecheck pass. UI wiring and OAuth remain pending.

Visible storage slice: Form Studio now has Server storage modal with local test sign-in, actual server save/read/update/delete/logout, bounded catalog and conflict recovery. No automatic browser-data migration; server-loaded documents are new working copies and use existing unsaved guard. VI/EN, dark mobile, real database browser CRUD, conflict/revocation and browser-offline tests passed; full frontend suite 233 tests passed after repairing five stale index-based assertions. Details docs/105. Remaining: immutable publication/workflow execution/submission/tasks, master/permission service administration, Finance/files/PDF, authenticated MCP and webhook/OAuth adapters, restore/release gates.

Immutable authoring publication API: implemented and tested on real PostgreSQL; separate permission, server validation, concurrent dedupe, immutable snapshots/checksum and audit. See docs/106. Workflow binding and visible publication controls remain next; submission/tasks/Temporal still pending.

Temporal engine POC: real conditional/parallel execution, durable wait/restart,
replay, rejection/inactive-assignee cleanup and non-owner worker RLS verified.
See docs/107 and apps/approval-worker/README.md. Fixture decisions are not human
API E2E. Submission/task API/outbox/UI and remaining modules are still pending.

Authenticated task decisions and durable wakeup: implemented HTTP metadata
read/list and assignee-only decision with optimistic version, exact idempotency,
atomic audit/outbox and leased delivery outside transactions. Real HTTP/database/
Temporal retry/restart/replay tests pass; sessions are synthetic test fixtures,
not browser sign-in evidence. See docs/108. Request submission/version binding,
workflow publication/runtime UI and remaining service modules still pending.

Workflow publication API now pins an immutable form version, validates typed
conditions/active tenant assignees, deduplicates under concurrent publication and
stores a checksum plus audit. Negative HTTP/SQL tests pass (docs/109). Published
form/engine discriminator compatibility fixed with an in-memory read adapter.
Editor integration, submission/runtime UI and remaining service modules pending.

Request submission foundation: immutable owner revision pins published workflow/
form; server validates/recomputes a restricted scalar schema, rejects unknown or
derived writes, commits run/audit/start event atomically, starts Temporal durably
and deduplicates replay. Real backend create-to-approval chain passes (docs/110).
Full nested/person/master/file/numbering submission, field projections, browser
runtime UI and remaining modules are NOT DONE.

Visible form publication is now available in the server-storage modal, guarded
by actual publication permission and exact saved-copy match. Real VI/EN desktop/
mobile browser publication, conflict, immutable snapshot and denied-account
journeys pass; 236 frontend tests and 3 backend tests pass. Forms adapter is
0.5.12. Details/evidence docs/111. Workflow authoring/request/task UI, full schema
submission and remaining service modules are still pending.

Typed condition value UI (Forms 0.5.13): inspector/Logic Studio now reuse host
choice providers for person and Master Data operands, save stable IDs and reset
the operand on source changes. Date/time/number/boolean controls, loading/error/
retry and missing saved choice states verified. 245 frontend tests pass; real
synthetic VI/EN desktop/mobile UI verified (docs/112). No backend expansion or
Teams connection; runtime submission and remaining service gates still pending.
