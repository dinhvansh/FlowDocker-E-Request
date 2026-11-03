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

Bounded list: GET /api/v1/apps/:appId/forms?after=<uuid> returns at most 50 title/id/version summaries plus nextCursor; it uses identical session/capability/RLS checks. Invalid cursors return 400, no SQL detail. HTTP storage adapter tests use the actual server/database; no UI wiring in this slice.

## Local identity (development)
POST /api/v1/session/login accepts login/password and returns an opaque one-hour token with Cache-Control no-store. Password verifiers use scrypt N=131072/r=8/p=1 with random salt; comparisons are timing-safe. Login limits requests per IP and concurrent expensive derivations. Unknown/disabled accounts share INVALID_CREDENTIALS. POST /api/v1/session/logout revokes the presented token. Tokens remain a host-session concern, never stored by the Forms repository. No public registration or account/role-grant endpoint.
Run npm run backend:seed once to create a synthetic Forms-only author; random credentials go to ignored backend-demo.local.json and are never printed. Existing accounts/files are retained. This is not Entra/OAuth, password recovery, MFA, production identity governance or Teams authentication. OAuth/webhook configuration is deferred per owner. The login/session RLS returning-context regression, invalid password, logout, inactive membership and rate limiting are tested over HTTP/PostgreSQL.

## Visible Form Studio storage
Current UI offers optional Server storage in Forms, backed by this API through Vite's same-origin /api development proxy. Run backend:dev alongside the existing web dev server; use the synthetic bootstrap account from the ignored local file. Tokens are memory-only, so reload requires sign-in. Local save and server save are separate; loading a server form makes a new working copy, and stale updates never silently overwrite. Local storage is not reset or automatically uploaded. Browser E2E evidence and limits: docs/105. Production reverse-proxy/HTTPS and OAuth are still deployment work.

## Immutable authoring publication
POST /api/v1/apps/:appId/forms/:id/publish requires expectedVersion, current forms:edit and separate forms:publish capabilities. The original validator rejects incomplete or invalid schemas with 422. Same draft revision is idempotent, concurrent publish serializes on the draft row. GET /api/v1/apps/:appId/form-versions/:versionId is an authoring-only read. Published JSON has canonical SHA-256, independent immutable version number and audit. Runtime has no UPDATE/DELETE grant on form_versions; draft changes/deletion retain versions. This is not request-type/workflow publication. HTTP/PostgreSQL tests: output/backend-publication-tests.log.
