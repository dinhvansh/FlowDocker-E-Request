# Ant Design permissions comparison

Base `d2eb323`. Owner asks to try Ant Design and compare the visual result.

## UX Research → UI/UX Design

Use the same two-column role workspace and identical grants/scope/field rules/access evaluator to isolate component presentation. New preview URL uses `?permission-ui=antd#permissions`; standard URL retains the shared shadcn screen. Reuse the existing shell. Ant Design 6.6.8 and icons 6.3.4 have MIT licenses and React peer ranges compatible with installed React 19.2.0. Runtime versions pinned exactly. No ProComponents/Pro scaffold/charts needed for this small fixed capability matrix.

## Design Audit → Interactive Prototype

Ant Table for matrix, Menu for roles, Select for scope, Tabs, Form.Item, Checkbox, Button, Tag, Alert and Modal. Use native Ant blue and ConfigProvider dark/default algorithms, existing Inter font, VI/EN locale and labels. Compare actual control appearance, table spacing and interaction rather than replacing CSS colors alone. Load preview lazily to keep Ant code out of the normal route's initial bundle.

## Design to Code / Reusable component impact

Extract a shared internal permission view model; both presentations call the same grant/scope/create handlers and access evaluator. Preserve public default PermissionBuilder props and existing domain storage. Add a separate opt-in preview export. No duplicate policy logic, schema/API/migration/Temporal/Teams/backend authorization changes. Preview is browser-local synthetic data and does not enforce server permissions. Existing shadcn components remain the main app toolkit until owner chooses otherwise.

Executed QA and acceptance follow. Owner visual preference remains pending.

## API / design review

Used installed `antd` CLI version-matched component API queries and Table basic demo, Ant Design Enterprise UI/UX reference, local UI/UX Pro Max search (`enterprise admin roles permissions table compact Ant Design --domain ux`) and fetched Web Interface Guidelines. Reviewed labeled controls, keyboard dialog opening/closing/focus restoration, reduced motion, semantic headings and native Ant control states. Secondary/placeholder colors are set centrally in ConfigProvider for readability. Dropdowns contain only 3–6 synthetic choices; `virtual={false}` intentionally exposes their real accessible options. CLI flags four generic large-list performance warnings for this setting, zero deprecated/a11y/usage findings. This is not a formal accessibility certification.

Native Ant theme is intentionally blue for comparison. Existing app shell remains the shared FlowDocker shell. `?permission-ui=antd#permissions` opts in; `/#permissions` stays on shadcn. Both presentations use the same browser-local role storage. Preview does not add a second policy engine.

## Executed QA (local frontend)

- `npm run typecheck`: PASS.
- `npm run lint` including i18n: PASS.
- `npm run format:check`: PASS.
- Browser `permissions-antd`, script `output/playwright/permissions-antd-qa.cjs`: PASS; role search/empty state/selection, actual grants/scope edits, field MASK/DENY, versions, create/cancel/no implicit grants, owner DENY → owner ALLOW → different-tenant DENY, keyboard Enter/Escape and focus return. No page errors during completed QA.
- Default shadcn `permissions-ux-qa.cjs` regression after shared-model extraction: PASS.
- Screenshots `permissions-antd-*`: 1440x900 VI/light, 1366x768 VI/light and EN/dark, 390x844 EN/dark, simulation desktop/mobile. Desktop light/dark and mobile simulation visually inspected. No document horizontal overflow at tested narrow widths; matrix scroll stays local. Dialog body can scroll on mobile.
- Named QA sessions restore their original synthetic role storage. No automated edit to the owner's current browser state.
- Exact installed packages: antd 6.6.8 and icons 6.3.4, MIT license files preserved. npm installation reported zero audit vulnerabilities. Full release licensing/SBOM review is outside this visual trial.

Full-suite/build results and pushed commit follow. Owner preference/acceptance is pending; no merge.

## Final gates

`npm test -- --maxWorkers=1`: PASS, 91 tests / 22 files on repeat. First run had 90 pass / 1 Form Studio host test timeout at its existing 5000ms limit while the first Ant build was running. No assertion or test timeout setting was changed; complete rerun passed.

Final `npm run build`: PASS. Ant preview is a separate lazy chunk (773.32kB / 251.50kB gzip); existing main chunk is 818.16kB / 260.05kB gzip. Vite reports chunks >500kB. This trial adds bundle cost when opened and has not been adopted as the app-wide toolkit.

Final semantic heading check: PASS, preview has an h1. Local frontend checks refer to base `d2eb323` plus the change in the commit containing this report. No CI/backend authorization or owner visual approval claim.
