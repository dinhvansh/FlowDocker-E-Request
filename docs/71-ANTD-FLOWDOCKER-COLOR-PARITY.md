# Match Ant preview to FlowDocker colors

Base `a0420cd`; owner requests equal colors for comparison.

## UX Research → UI/UX Design → Design Audit

The previous Ant trial used native blue and darker backgrounds, making color preference compete with component comparison. Match primary, tinted selection, text, backgrounds and borders to the existing `.fd-app` light/dark palette. Preserve Ant spacing, shapes and interactions. Use ConfigProvider tokens and the theme algorithm, without global `.ant-*` overrides. Status success/warning/error colors remain semantic.

## Interactive Prototype → Design to Code

Shared theme adapter inside the opt-in Ant presentation only. Preview label uses theme tokens instead of fixed blue. No public props, schema, save behavior, evaluator, API, migration or backend permission changes. Reuses existing palette values and native Ant components; main shadcn route is unchanged.

## Actual local QA

`npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`, `npm run build`: PASS. Existing Vite chunk warnings remain.

Browser script `output/playwright/permissions-antd-brand-qa.cjs`: PASS. Computed primary button background exactly matches the shared shell brand in both themes: light rgb(180,35,45), dark rgb(255,115,124). The check waits for the normal theme transition to finish; its initial immediate check captured an intermediate color. Verified simulation opens/runs/closes, VI/EN, 1440x900 light, 1366x768 dark and 390x844 dark, without document horizontal overflow. Screenshots accompany the script; desktop light visually inspected. No role data saved. No unit suite repeat for this palette-only change; prior slice's 91-test result remains its own evidence. Owner visual approval pending; no CI/production authorization claim or merge.
