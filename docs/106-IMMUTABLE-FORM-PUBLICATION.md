# Immutable form publication

IN PROGRESS. Additive form_versions table, independent forms:publish capability,
authoring publish/read routes, checksums and transactional audit. Reuse original
schema validator; drafts may remain incomplete but cannot be published invalid.
Serialise on the draft row; expected draft version required. Publishing the same
draft revision returns the same immutable version. Updating/deleting a draft
does not mutate or delete published snapshots. Runtime role gets no UPDATE/DELETE
on versions. Tenant/app RLS and current membership/capabilities apply.

Shared impact: transaction/session helper for future domain APIs. Existing Forms
UI, draft APIs, browser storage, Temporal/Teams and submission state unchanged.
Canonical checksum sorts JSON object keys recursively; arrays retain order.
No workflow binding or request-type release is implied by authoring publication.

Tests: HTTP invalid schema/permission/version/tenant, concurrent publish dedupe,
V1 retained after draft update/V2 publish and draft deletion, immutable runtime
privileges, audit. Real PostgreSQL non-owner role, no mock publication evidence.
UI integration and owner review pending until separately recorded.

Verification: real HTTP/PostgreSQL integration tests 2/2 PASS (including existing auth/CRUD regression). Publication test covers invalid schema, missing grant, stale draft, duplicate concurrent publication, hash readback, cross-tenant deny, V1 preserved after V2 and draft deletion, SQL mutation deny and two audit events. Typecheck and lint/i18n PASS. No workflow binding, UI publication or production claim. Details output/backend-publication-tests.log.
