# API foundation 0.1.0

Implemented local authoring API, not a complete backend or release.

From the repository root (Node 24+, Docker):

```powershell
npm run backend:setup
npm run backend:up
npm run backend:migrate
npm run backend:test
npm run backend:dev
```

Setup creates ignored `.env.backend.local` with random local passwords. Existing
configuration and Docker volume are retained. PostgreSQL is isolated on loopback
55432; no existing database is reused. Migrations are checksummed and serialized;
reruns are no-ops, changed applied files fail. No reset command is provided.

API listens on loopback 3001. `/api/v1/health` checks the database. Authenticated
`GET/POST/PUT/DELETE /api/v1/apps/:appId/forms/:id` uses UUID resource IDs,
`Authorization: Bearer <opaque token>`, and current database membership with
`<appId>:forms:edit`. POST requires `{definition,expectedVersion:0}`; PUT/DELETE
requires the current expectedVersion. Definition is validated using the original
Forms schema. Concurrent changes return VERSION_CONFLICT; successful mutations
write metadata-only audit in the same transaction. No secrets or form values in
error responses/audit. Schema IDs inside definitions need not be UUIDs.

Tokens are SHA-256 hashed, expire, and are never accepted as actor/tenant IDs.
Production token issuance/OAuth is NOT implemented. Integration tests create
short-lived synthetic sessions through the migration account, exercise real HTTP
and the non-owner runtime role, then remove only their own fixtures. No public
seed/login bypass endpoint exists. UI remains on browser storage; no silent
upload or migration of user drafts.

RLS forces tenant/app bounds and current authoring capability; independent API
checks apply. Context is transaction-local. As documented in docs/23, the shared
SQL role can change session variables: RLS is defense in depth, not a substitute
for API authentication. Runtime cannot read audit or create memberships. Startup
rejects superuser/BYPASSRLS, table ownership and disabled RLS.

Evidence: output/backend-foundation-tests.log (HTTP CRUD, invalid schema,
cross-tenant/app reads, two-writer conflict, restart persistence, revocation,
expiry, pooled context clearing, transactional audit); typecheck/lint/build.
No browser E2E, Temporal, Teams, PDF, restore or release gate passed here.
Second independent backend consumer remains pending. See docs/104.
