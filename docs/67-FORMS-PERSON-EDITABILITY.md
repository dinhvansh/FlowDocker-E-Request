# Person editability in both default modes

Base `65e2c5c`, Forms branch.

## Research → Design → Audit → Prototype → Code

Owner cannot see Allow changing person for a fixed person default. The inspector incorrectly gates this existing control on current-creator mode. Show it for every person field in the existing Basic/Data default settings, independent of default mode. Keep the shared Checkbox and existing `readOnly` mapping. No engine, schema, API, identity, permission, migration, storage, Teams or Temporal change. UI read-only does not replace backend authorization.

Reusable component impact: one conditional removed in shared AdvancedProperties; FormDesigner/FieldInspector consumers inherit the behavior. Verify named fixed defaults can be locked in Preview and unlocked again, mode changes retain the setting, VI/EN and desktop/mobile. Owner visual acceptance remains pending. Execution evidence follows.

## Executed verification

Verified on base `65e2c5c` plus the change in the commit containing this report:

- `npm run typecheck`: PASS.
- `npm run lint` (including i18n): PASS.
- `npm run format:check`: PASS.
- `npm test -- --maxWorkers=1`: PASS, 90 tests across 22 files.
- `npm run build`: PASS; existing main chunk size warning remains.
- `npm run build:forms`: PASS, 57 bundled license entries.
- `git diff --check`: PASS.
- Named Playwright CLI session `forms-person-default`, script `output/playwright/forms-person-editability-qa.cjs`: PASS. Fixed default An Demo is disabled in Preview when unchecked and enabled when checked; switching default modes preserves the setting.
- Screenshots in `output/playwright/forms-person-editability-*`: VI/light 1440x900, EN/dark 1366x768, EN/dark mobile 390x844. No document horizontal overflow. Desktop screenshot visually inspected.

Browser QA used synthetic data, discarded its own edits and restored the purchase sample. These are local frontend results. Owner acceptance is pending; no merge or backend enforcement claim.
