# Native navigation links

Base 0b6c439, clean branch feat/forms-field-ux-layout. Owner screenshot: right-click sidebar cannot open destination because navigation items are buttons.

## UX Research
Observed owner task: open any navigation destination in another tab while preserving current workspace. Native browser link context menu and modified click are expected.

## UI/UX Design
Use anchors with real href for every sidebar destination and profile, plus workspace quick links. Keep normal click callback/mobile drawer closing and current-page semantics. Let browser handle right/middle/Ctrl/Meta/Shift clicks untouched. No custom context menu or forced target=_blank.

## Design Audit
Plain Enter activates link; modified clicks must not call onPageChange or reset current forms. Keep title/query parameters in hash URLs, selected styles, focus indicator, VI/EN/light-dark/mobile. Action buttons and in-page property tabs remain controls, not new-page destinations.

## Impact map
Reusable AppShell: optional getPageHref(PageId) string, default #page. No existing required props removed; no schema/API/storage/worker/Temporal/Teams/auth/DB change. Workspace quick links consume native anchors; CSS retains current appearance. Test semantic href, active state, plain vs modified/right/middle activation and profile destination; browser popup target route/back/mobile/languages. Existing forms stay mounted per current host logic.

## Interactive Prototype / Design to Code
Existing app is browser harness. Shared shell owns native link semantics; host retains routing. No dependency or second navigation framework. Backend/data-sharing unchanged. QA evidence follows; no owner approval/merge implied.


## Actual QA (2026-10-30)
- `npm run build`, `npm run build:forms`: PASS (existing app chunk-size warning remains).
- `npm run typecheck`, `npm run lint` (i18n), `npm run format:check`: PASS.
- `npm test -- --maxWorkers=2`: PASS, 120 tests / 29 files. New AppShell tests cover all eight hrefs, active semantics, native modified/right/middle/default-prevented behavior and custom host destination function. Earlier test used wrong English profile label; corrected to actual translation.
- `output/playwright/native-navigation-qa.cjs`: PASS. Real Ctrl+click opens #master in another browser page; middle click opens #connections. Original page URL stays unchanged. Right click does not navigate; all normal routes work, Enter works in English/dark, mobile menu closes after normal selection. Earlier browser script matched an extra form-catalog aside; narrowed to .fd-sidebar.
- Screenshots at 1440×900 VI/light and 1366×768 EN/dark; desktop sidebar visually inspected. Mobile 390×844 interaction exercised. Browser chrome's native context-menu items are not captured by page screenshots; native anchor semantics retained with no contextmenu interception.
- Public AppShell addition: `getPageHref?(page: PageId): string`, default `#${page}`. Host must supply a destination compatible with its routing when overriding. Plain unmodified primary clicks call existing onPageChange; modified/middle/right actions use native browser handling. Existing required props unchanged. AppShell tests include a second host URL shape; no platform-ready claim.
