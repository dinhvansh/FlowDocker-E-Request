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
