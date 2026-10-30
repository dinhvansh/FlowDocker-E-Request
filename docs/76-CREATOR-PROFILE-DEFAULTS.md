# Creator profile defaults

Base d574d7d, branch feat/forms-field-ux-layout, clean before work. Owner authorizes upgrading existing defaults, preserving engine.

## UX Research
Owner wants profile information reused in forms like the existing current creator. Current UI only supports person/currentUser. Synthetic profile has name, email, employee code, department and position; manager is unavailable (HR placeholder is not real manager data).

## UI/UX Design
Default selector in Basic/Data: fixed value or a compatible creator attribute. Text/textarea/hidden support name/email/employee code/department/position/manager name; email supports email; person supports creator/manager ID. Existing person controls preserved. Context defaults expose Allow editing (existing readOnly), source hint and missing-attribute notice. No new field type.

## Design Audit
Stable person IDs only, no identity join by name/email. Manager absent stays absent; never insert the HR warning as a person. Explicit saved/cleared values win; context is not exported. Reject unsupported source/type combinations and simultaneous literal defaults. No dynamic paths/JS. Editing UI is not authorization. Submission snapshots here are returned values only; real server immutable revision remains pending.

## Impact map
Schema: additive defaultValueSource enum variants; optional typed currentUser profile in FormRuntimeContext; legacy currentUser valid. API: host injection only, no endpoint. UI: shared creator-default editor and notices; E-Request synthetic context. Storage: same draft key; source enum only. Temporal/Teams/security: no execution/authorization changes. No DB migration. Tests: compatibility, nested/repeat, saved/cleared precedence, missing manager, validation/readOnly/reset, UI source switching, browser VI/EN/light/dark/responsive. Older strict clients require upgrade.

## Interactive Prototype
Existing local designer/runtime is prototype harness; browser interaction evidence to follow. No fabricated research or owner acceptance.

## Design to Code
Reusable schema/engine/editor remain host-independent. E-Request supplies synthetic profile only; standalone host demonstrates typed context. No new dependencies or engine. Backend identity validation, HR connectivity, immutable server history and production authorization NOT DONE.


## Actual verification — 2026-10-30

- `npm run build`: PASS (existing >500kB chunk warning).
- `npm run build:forms`: PASS, declarations and standalone package prepared.
- `npm run typecheck`: PASS.
- `npm run lint` including bilingual check: PASS.
- `npm run format:check`: PASS.
- `npm test -- --maxWorkers=2`: PASS, 114 tests / 27 files. New tests cover every attribute, stable multi-manager ID, nested/repeating defaults, saved/cleared precedence, missing required manager, access filtering, snapshot preservation, schema roundtrip/rejections, source switching, editing lock, submission and reset. Earlier new-fixture iterations failed due to a wrong attribute index and duplicate field ID; fixtures corrected, no assertion/time limit weakened.
- `output/playwright/forms-creator-profile-qa.cjs`: PASS in actual local browser. Chooses creator name, disables editing, saves/reopens, checks five profile values, missing manager notice (no HR placeholder), reset, VI/EN/light/dark at 1440×900, 1366×768 and 390×844. Earlier locator matched hidden canvas and runtime notices; scoped to runtime form before successful rerun.
- Screenshots: `output/playwright/forms-creator-profile-1440-vi-light.png`, `forms-creator-profile-1366-vi-light.png`, `forms-creator-profile-1366-en-dark.png`, `forms-creator-profile-390-en-dark.png`. Desktop inspector source/editing control and mobile preview visually inspected; no horizontal page overflow.

### Usage
Select a Text field → Basic or Data → Default value source → Creator full name / employee code / department / job title / manager name. Email fields offer Creator email; Person fields offer Current form creator / Creator direct manager. Use Allow editing value (or Allow changing person) to control UI editing. Missing profile attributes remain empty with notice and normal required validation. Backend connectors, authentication, server-enforced locked values and immutable request revision storage remain NOT DONE. Owner visual acceptance pending; no merge.
