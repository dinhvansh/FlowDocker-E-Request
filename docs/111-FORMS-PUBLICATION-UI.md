# Form Studio server publication

IN PROGRESS. Preserve original designer, browser drafts and optional server login.

## UX Research

Existing user requests require visual editing plus durable backend operation.
Current server-storage modal already supports save/open/conflict recovery but
offers no real publication control. Use this established task surface; no new
screen or decorative dashboard. This is task/code evidence, not user research
interviews or a fabricated benchmark.

## UI/UX Design

Reuse Modal/FieldGroup/Button/Notice. Show publish alongside server save. Require
fresh server capability and exact working-copy/save snapshot match; local edits
disable publish with a save-first explanation. Show immutable published version
and identifier in a wrapping notice. No automatic grant or save/publish combo.

## Design Audit

Permission denial must explain publication specifically. Revocation remains
backend authoritative. Conflict never overwrites or auto-publishes; session loss
retains work. Existing Inter 12/18px, shared gaps/touch sizing and VI/EN required.

## Interactive Prototype

Current app is the interaction harness; test authorized publish, denial, changed
copy guard, stale remote version and mobile/VI/EN before acceptance. All actions
call real APIs, no fake publish success. Owner visual acceptance remains pending.

## Design to Code / impact

Additive HTTP repository publish/capability contract, API permission query, host
modal composition, translations. No DB migration/Temporal/Teams/data reset.
Reusable adapter is in Forms; app binding/permission feedback remains host code.
No new primitive or duplicate UI component. Second independent backend consumer
and production acceptance remain pending.

## Actual verification

Real browser VI desktop/dark: publish 201, unsaved/changed-copy disabled guard,
stale-server 409 with retained draft, immutable snapshot checksum and sign-out;
no page exceptions. EN mobile/dark and desktop/light: real publish, forms-only
account denied, no modal horizontal overflow, computed Inter 12px/18px. Mobile
actions use the shared 44px control token. Screenshots and sanitized scripts/logs
are under output/playwright/form-publication*. Existing owner account permissions
were not elevated; a separate synthetic publisher tenant was used.

Full frontend suite 236 tests/53 files passes; real backend suite 3 tests passes,
including shared HTTP publish/permission methods. Typecheck/lint/i18n/format,
application build and standalone Forms 0.5.12 build pass. Existing application
chunk-size advisory remains. No owner visual acceptance or project-release claim.

The dev server had retained an old CSS transform after edits; restart loaded the
current stylesheet. Dedicated `npm run dev:local` now fixes port 5174 explicitly,
avoiding npm argument forwarding accidentally starting another port. Existing
browser drafts were preserved. This is development tooling, not a deployment.
