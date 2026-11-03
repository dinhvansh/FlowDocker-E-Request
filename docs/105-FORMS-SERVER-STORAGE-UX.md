# Forms server storage integration

IN PROGRESS. Research evidence: owner requests real backend after iterating local
Studio; no interviews conducted. Existing drafts and partially typed code must
survive errors and authentication changes.

Design: one compact server-storage action outside the document itself, using
existing Modal/FieldGroup/Field/Input/Button/Notice tokens and VI/EN. Local save
continues explicitly. Session token lives in memory only. Login explains local
test accounts; no production/SSO claim. Server list is bounded and refreshable.
Opening a server definition creates a separate working copy and uses the existing
unsaved-work guard. Save creates a new server copy unless this exact local copy
is bound to a previously loaded remote ID/version. Conflict never auto-overwrites;
reload as a new copy or explicitly save another server copy. Logout clears bindings.

Audit risks: accidental overwrites, duplicate IDs, expired session, server outage,
busy actions closing the dialog, missing empty/error states, typed code not yet
applied, keyboard focus and mobile wrapping. Disable mutations for invalid or
unapplied code and while busy. Keep draft after every failure.

Reusable impact: reuse existing shared primitives and HTTP repository. The new
screen component is a Forms domain adapter, not a new platform visual primitive.
Prototype/design-to-code use actual local API and PostgreSQL, then isolated
browser QA (VI/EN, light/dark/mobile) and regression tests. Owner acceptance and
external OAuth remain pending. Existing browser storage is never reset.

## Verification

Actual isolated Playwright CLI + local API + PostgreSQL journeys passed:
login, create, update, load working copy, confirmed deletion and logout;
second HTTP writer creates a version conflict, stale UI save is disabled;
revoking the session forces login while retaining the draft. Browser offline
mode produces a connection error and retains the document. VI/light desktop and
EN/dark 390px screenshots reviewed; dialog width 358px within viewport, input
font computed Inter 12px. Offline is a browser-network simulation, not a server
crash/restore drill. Expected 409/401/offline network errors occur in these tests;
no runtime JavaScript exception observed.

Scripts and sanitized logs: output/playwright/server-storage-*-qa.ps1/log.
Use a separate playwright-cli session named server-storage and the synthetic
backend:seed credentials (ignored local file). Open the DEMO logo template in VI,
then run server-storage-qa.ps1 followed by server-storage-conflict-qa.ps1. Switch
to English/dark/mobile via UI before server-storage-offline-qa.ps1. Tests only
modify their synthetic account/server forms; user browser storage is untouched.

Full regression initially found five host tests relying on purchase sample index
zero; fixed by selecting saved definitions/fixtures by stable form ID, without
changing application persistence. Focused host suite: 9 passed. Password scrypt
callback typing was also corrected for the configured Node typings. Final full
regression, lint/format and backend gates are recorded separately after rerun.

Final gates: full Vitest suite 233/233 across 52 files PASS after stable-ID fixture fixes; real HTTP/PostgreSQL integration PASS; typecheck PASS; app and standalone Forms builds PASS. ESLint now excludes generated ignored .playwright-cli artifacts (not source); lint/i18n and formatting are rerun after that correction. Screenshot and console review distinguish expected negative HTTP responses from JavaScript failures. This is an implemented optional Forms storage slice, not completion of workflow/Teams/PDF/production.
