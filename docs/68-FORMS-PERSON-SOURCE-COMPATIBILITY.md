# Person source compatibility and real selection QA

Base: `be22bf4`; implementation is in the commit containing this report.

## UX Research

Owner screenshot shows a person field with current-creator default pointing at `demo.departments`, without a company dependency. This provider returns no people, so enabling editability cannot supply person choices. Reproduction with `organization.people` successfully opens choices. Prior slice only checked enabled/disabled state in Preview; this slice verifies actual selection and retained values.

## UI/UX Design

Limit person fields to person-compatible sources and manual people lists. Preserve an existing incompatible source until the designer explicitly chooses another source. Explain how to recover in VI/EN. Other choice fields keep their existing source options.

## Design Audit

P1: allowing Company/Department sources on a person field creates a misleading empty picker and unresolved current-person ID. Fix source compatibility metadata in the host and shared inspector. Do not silently rewrite persisted forms or defaults.

## Interactive Prototype

Named Playwright session `forms-person-default`, script `output/playwright/forms-person-change-qa.cjs`: current-creator mode, enable changes, select An Demo on canvas, search/select Binh Demo, lock/unlock, and select An Demo in Preview. Verify incompatible sources are absent from the person inspector. Test VI/light 1440x900, EN/dark 1366x768, mobile 390x844; screenshots accompany this report. QA discards its own changes and saves no forms.

## Design to Code / Reusable component impact

Shared `FormDataSource` gains optional host metadata `kind: person | record`; this metadata is not persisted in form schemas. Existing consumers without metadata stay compatible. Shared `DataSourceEditor` filters record sources only for person fields and retains unsupported saved configuration with recovery guidance. E-Request marks its three sources. Shared PeoplePicker/runtime/engine behavior is reused.

Impact: UI and additive exported TypeScript metadata only. No schema version, migration, API, provider execution, identity, storage, Temporal, Teams or permission enforcement change. This filter is UX guidance, not authorization. Original Forms engine remains intact.

## Verification

- Browser script: PASS, actual changes retained on canvas and Preview, lock/unlock, compatible source choices, VI/EN/light/dark and three viewport sizes. Desktop screenshot visually inspected. Browser console contains only React DevTools informational messages.
- `npm run typecheck`: PASS after correcting an unsupported test selector option caught by the initial run.
- `npm run lint` including i18n: PASS.
- `npm run format:check`: PASS.
- `npm run build`: PASS, existing main chunk >500kB warning remains.
- `npm run build:forms`: PASS, 57 bundled license entries.
- Full test results follow.

These are local frontend checks with synthetic data. Owner visual acceptance is pending; no merge or production backend claim.

- `npm test -- --maxWorkers=1`: PASS, 91 tests across 22 files (including incompatible saved-source preservation and explicit recovery).
- `git diff --check`: PASS. Desktop and mobile screenshots visually inspected.
