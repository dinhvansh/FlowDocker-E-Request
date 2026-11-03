# Live authoring validation panel

## UX Research

Owner selected continued Form Studio refinement. Latest observed failure: disabled save and a generic preview warning hid the causes. Preview now exposes messages; design-mode diagnostics remain behind a menu, lack field labels, and are easy to miss. User task: locate all configuration errors, open the affected field, fix it and save without losing unsaved work. No new interviews or benchmark claims.

## UI/UX Design → Design Audit

Compact toolbar validation button shows live error count (or Check when valid), next to Save. It toggles one bounded, scrollable diagnostics panel. Reuse shared buttons/notices and original validation; list field label + technical key + translated issue, with a visible edit arrow. Clicking opens designer/field inspector; form-level title issues open name settings. Live validation updates the count and list; zero errors shows a success state. Preview uses the same reusable list. Keep existing Code Studio and drag/drop.

## Impact map / reusable component impact

Forms presentation primitive: typed FormSchemaIssues(issues, fields, onEditIssue?) used by host and runtime. App adapter owns navigation; generic component owns labels/list only. Optional existing preview callback remains. No schema/validation-engine/API/Temporal/Teams/backend/security/storage migration; recovery and manual save unchanged. Version 0.5.5. No external dependency. Owner visual acceptance pending; no platform-ready claim.

## Interactive Prototype → Design to Code

Current app and isolated tests are harnesses. Recovered synthetic invalid form → live count → open panel → choose nested field → inspector → repair → list/count clear → save. Preview shares the diagnostic UI. Verify VI/EN, light/dark, 1440×900, 1366×768, 390×844; keyboard and long-label wrapping. Actual evidence appended after execution.

## Actual verification — 2026-11-03

- New public `FormDesigner.inspectionRequest` opens/focuses the inspector; increment revision to reopen the same target. Controlled host also selects field ID. Host resets this navigation request when activating another form.
- Typecheck PASS. Lint/i18n and format check PASS.
- First targeted run: 12 PASS / 2 failed. Found duplicate nested status regions in the new list (fixed), plus the existing lazy Code Studio journey exceeded 60s during concurrent build/import; actual jsdom geometry warnings recorded in the initial log. Final rerun with 120s per-test budget: **14 tests / 3 files PASS**, 226.19s. Files: shared issue list, runtime preview, application Forms host.
- Browser PASS: live count, keyboard toggle/issue activation, nested field names/keys, automatic inspector focus, mobile inspector activation, live resolution to valid state, save repaired schema and preview. Screenshots inspected at VI/light 1440×900, EN/dark 1366×768 and 390×844 plus mobile inspector. No page errors or document horizontal overflow. Original synthetic-session storage restored.
- Browser audit found the inherited Notice margin caused 3px overflow; scoped margin/sizing fixed. Removed duplicate status role, preserving shared Notice announcement. QA saved fixture from one viewport made next identical repair unchanged; reset synthetic saved drafts between scenarios and reran all successfully. Singular English copy corrected and final browser scenarios repeated.
- Existing Code Studio validation remains responsible for unfinished source syntax; this list uses authoritative FormDefinition validation without changing rules or bypassing save guards.
- App build PASS (1m 9s), existing bundle-size advisory. Final library/package outcome recorded below after completion. Owner visual approval remains pending. Frontend/local synthetic evidence only; no backend or production claim.
- Final Forms build PASS (44.29s), 76 bundled license entries; `npm pack ./dist/forms-library --pack-destination ./dist --json` PASS, local `flowdocker-forms-0.5.5.tgz`. Post-cleanup typecheck/format and diff checks PASS. No npm publication or merge.
