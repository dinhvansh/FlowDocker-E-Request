# Fixed person default picker

Base `91a3eec`, Forms branch; owner correction: fixed person defaults must be selected by name instead of typing an ID.

## Research → Design → Audit

Owner screenshot shows a raw Default person ID input with no person selection. Replace it with the existing searchable PeoplePicker and rename the fixed mode to Select specific people. Current creator mode stays available. Use the field's registered provider or manual options, never a second hardcoded directory. Single selection stores one stable ID; multi selection stores IDs as an array.

Audit loading, empty, missing/error sources, obsolete saved IDs, clear default, keyboard interaction and read-only inspector. Do not silently erase IDs after a source error/change. If a dependency has no configured default value, explain why the dependent source cannot load options.

## Impact / reusable component impact

Shared reusable Forms person-default editor; shared choice loading hook extracted from runtime so abort/debounce/bounds/states are consistent. Designer injects registered providers and dependency defaults. No schema/API/auth/storage/Temporal/Teams/migration changes. Only presentation of existing defaults changes. No new connector or library. Documentation, targeted regression tests and browser journey will accompany the slice.

## Prototype → Code

Use the existing local app with synthetic organization options. Verify fixed single/multiple defaults, current-creator alternative, preview, undo and source states. Check VI/EN, light/dark, 1440×900, 1366×768 and 390×844. Record actual command results below; no production/CI or owner acceptance claim.

## Executed verification — 2026-10-29

Source: base `91a3eec` plus the changes in the commit containing this report.

- `npm run typecheck`: PASS.
- `npm run lint` including i18n check: PASS.
- `npm run format:check`: PASS.
- `npm test -- --maxWorkers=1`: PASS, 90 tests / 22 files.
- Targeted `npx vitest run packages/form-builder/src/person-default.test.tsx --maxWorkers=1`: PASS, 5 tests. Covers single-ID selection/clear, multiple IDs, provider retry/dependency/AbortSignal, preserving unavailable saved IDs, and aborting stale source responses. Test locators were corrected for existing translated messages and concatenated accessible descriptions before the successful run.
- `npm run build`: PASS; existing main chunk size warning (>500 kB) remains.
- `npm run build:forms`: PASS, 57 bundled license entries.
- `git diff --check`: PASS.
- Browser: `npx --yes --package @playwright/cli playwright-cli -s=forms-person-default run-code --filename output/playwright/forms-person-default-picker-qa.cjs`: PASS, with the organization sample open on the Data inspector. Real interactions covered email search, fixed single-person default, local preview/validation, undo/redo, two-person defaults, switching to/from current creator, VI/light 1440×900, EN/dark 1366×768 and mobile 390×844 without page overflow. QA changes were discarded, not saved.
- Screenshots: `output/playwright/forms-person-default-1440-vi-light.png`, `forms-person-default-1366-en-dark.png`, `forms-person-default-390-en-dark.png`.

Public inspector props add optional `providers` and `sourceDefaults`; source loading uses the same abortable, bounded runtime hook. Search locally filters at most 500 source results, consistent with runtime. No new Graph/HR connector or production identity flow. The standalone form host inherits this UI via FormDesigner; a separate browser journey for that host was not executed. Owner visual acceptance remains pending; no merge performed.
