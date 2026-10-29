# Form data source picker

Base: `0a7e1f4`, branch `feat/forms-field-ux-layout`.

## UX Research → UI/UX Design → Design Audit

Owner evidence: the provider-code text box does not explain how to choose data. Owner approved a named source picker with descriptions.

Design: replace free-text provider entry with the existing shared Select. Offer manual choices and host-registered sources with bilingual names; explain the selected source beneath the control. Show a saved but unavailable source without deleting or silently replacing it. Static choices appear only in manual mode. Preserve default values and the saved schema. Keep the dependency setting for existing dependent providers.

Audit: do not imply an arbitrary name or URL connects data. Only registered runtime adapters may be selected. Internal master and synthetic demo data must be distinguishable. An unavailable source stays visible with an explanation. Accessible control names, keyboard navigation and read-only behavior use shared primitives.

## Impact / reusable component impact

- Reusable Forms designer: additive optional `dataSources` metadata (provider ID, VI/EN label and description), passed to the inspector. Provider callbacks remain runtime-owned. Unknown metadata falls back to the registered ID.
- E-Request adapter: supplies human-readable metadata for the three adapters already implemented. No new connector, permission, organization data, request records or network call.
- Schema/API/storage/migration/security/Temporal/Teams: unchanged. Provider ID remains the stored value; display metadata is never persisted in a form.
- Shared Select reused; no new primitive or dependency. Not a claim of platform production readiness.

## Interactive Prototype → Design to Code

The existing local app is the interactive prototype. Verify source changes, manual options, unavailable sources, undo and runtime lookup; check VI/EN, light/dark and desktop/mobile. Execution results will be recorded below after running them. Owner visual acceptance remains pending.

## Executed verification — 2026-10-29

Local source: base `0a7e1f4` plus the changes in the commit containing this report.

- `npm run typecheck`: PASS.
- `npm run lint` including i18n check: PASS.
- `npm run format:check`: PASS.
- `npm test -- --maxWorkers=1`: PASS, 80 tests / 20 files. Three new tests cover unavailable saved sources, changing source without retaining the old dependency, and returning to manual choices without deleting options/defaults.
- `npm run build`: PASS; existing main chunk warning (>500 kB) remains.
- `npm run build:forms`: PASS, 57 bundled license entries.
- `git diff --check`: PASS.
- Browser: `npx --yes --package @playwright/cli playwright-cli -s=forms-source-picker run-code --filename output/playwright/forms-data-source-picker-qa.cjs`: PASS. Named source selection, manual/dynamic editor switching, actual synthetic company lookup in Preview, undo to the original provider, VI/light 1440×900, EN/dark 1366×768 and mobile 390×844 without document overflow. No form was saved during QA; two undo operations restored its definition.
- Screenshots: `output/playwright/forms-data-source-1440-vi-light.png`, `forms-data-source-1366-en-dark.png`, `forms-data-source-390-en-dark.png`. Animations disabled for stable captures; normal UI retains the existing shared Select animations.

Browser QA found the first inspector group collapsing when manual options appeared as a sibling. A shared FieldGroup now wraps the controls; the complete source-switch journey passed after the fix. Test script locator corrections for required labels and translated theme controls were also applied before the successful run.

These are local frontend results, not CI/backend integration evidence. No external connector was implemented. Owner visual acceptance and a production second consumer remain pending; the standalone source example documents the additive API.
