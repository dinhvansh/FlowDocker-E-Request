# Immutable workflow/form binding

IN PROGRESS. Backend-only additive slice; original designer/drafts retained.
Impact: workflow version table, checksum/deduplicated typed plan publication,
immutable form-version FK, server-derived condition field types, scoped capability
and RLS, audit; no Temporal/UI/Teams behavior changes yet. Existing plan compiler
is reused rather than executing editor JSON or admin code.

POST /api/v1/apps/:appId/workflows/:id/publish accepts formVersionId, plan and
conditionFields (explicit top-level form keys). Requires workflows:publish plus
forms:edit. GET .../workflow-versions/:id requires workflows:publish. Publication
is serialized per workflow and identical content deduplicates. Both snapshots
remain pinned after later authoring changes. No workflow draft editor integration
or automatic request execution is claimed here.

Membership validation uses a narrow boolean SQL function with fixed SQL and
explicit tenant/actor/capability checks, no arbitrary query interface. It exposes
no member profile/capabilities. Request-time revalidation still remains mandatory.
Reusable impact: typed plan compiler shared; form field exposure derivation and
version storage remain server adapters. Negative HTTP/SQL tests required.

## Verification and limits

Real HTTP/PostgreSQL publication test now also covers workflow permission denial,
unknown condition fields, foreign-tenant assignee rejection, missing form version,
concurrent deduplication, immutable form binding after edits, cross-tenant read
denial, SQL mutation denial and unscoped membership-function denial.
`npm run backend:test` passes all 3 integration cases. Compiler unit tests cover
UUID case normalization/duplicate detection as well as bounded typed plans.

Regression found: published storage snapshot uses PUBLISHED while original engine
schema accepts only DRAFT. `readPublishedForm` now verifies the published envelope
and validates an in-memory copy with the engine discriminator; stored snapshots
and their checksums stay unchanged. This boundary is reused by future submission.

Only explicitly selected top-level scalar fields can drive conditions at present.
Nested/repeating columns and org-based dynamic assignee resolution need later
typed adapters. No editor graph adapter, request submission or publication UI is
included in this backend slice. No external service or production acceptance.
