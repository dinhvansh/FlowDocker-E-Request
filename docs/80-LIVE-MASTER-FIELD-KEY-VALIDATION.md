# Live Master field key validation

Base 72a37aa; clean branch. Owner screenshot shows currency name accepted and autosaved until manual Check.

## UX Research → UI/UX Design
Show inline required/format/duplicate feedback as the user types. Explain lowercase letters/numbers/underscore, starting with a letter, with currency_name example. Keep invalid text editable so users can correct it; do not silently strip/rename. Commit valid changed key on blur/Enter, Escape restores saved key. Invalid text is never sent to onSave.

## Design Audit
Existing persisted invalid keys display error immediately; no automatic migration. Use one shared identifier predicate with validateEntity. Duplicate comparison excludes selected field by stable ID. Keep existing Check as full schema validation. Error associated through shared Field/aria-invalid, localized VI/EN. Failed commits keep edit/retry. Switching field drops uncommitted text, not stored data.

## Impact map
Reusable master-builder internal key editor, shared app-contracts identifier validation helper; optional/no public prop break. Existing onSave promises retained, patchField returns it to editor. No schema/storage format, API/backend/Temporal/Teams/auth/migration change. Tests: immediate invalid/duplicate feedback, no save invalid, valid blur/Enter, Escape, failure. Browser live error without Check, correction persistence, languages/themes/mobile. No backend identifier enforcement claim.

## Interactive Prototype → Design to Code
Existing Master Builder is harness; shared Field/Input reused. Internal typed editor is not a new platform-ready public component. Actual QA follows; owner review pending.

## Actual QA (2026-10-30)
- `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`: PASS.
- `npm test -- --maxWorkers=2`: 130 tests, 32 files PASS. First run found two test assertions incorrectly expecting aria-invalid="false" rather than the shared Field's omitted attribute; corrected the assertions, reran all tests successfully.
- Playwright CLI `master-key-live-qa.cjs`: PASS immediate format/required/duplicate feedback before Check, invalid blur/Enter does not persist, Escape restores, corrected Enter persists after reload. Synthetic catalog only; original browser storage restored in finally.
- Screenshots visually inspected: master-key-1440-vi.png (light), master-key-1366-en-dark.png, master-key-390-en-dark.png. No document horizontal overflow on mobile; inspector stacks below schema. Console contained React development info only.
- UI changes remain browser-local prototype functionality. Owner visual approval and production backend enforcement remain pending.
- `npm run build` and `npm run build:forms`: PASS; app build retains the existing >500 kB chunk size advisory.
