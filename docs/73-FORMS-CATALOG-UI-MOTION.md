# Form catalog UI and motion

Base `615c644`; branch `feat/forms-field-ux-layout`, clean and aligned with origin before changes. Scope: catalog only, following owner screenshot feedback. Ant comparison stays paused.

## 1. UX Research
Owner evidence: at 1070×884 the form catalog is a flat set of names with weak hierarchy and much unused space. Primary task is to find a form, recognize its structure, and open the designer or create a draft. No interviews or quantified usability claims. Read docs/57, current forms host/catalog CSS. UI/UX Pro Max local UX search `enterprise form template library subtle motion reduced motion`: respect reduced motion, avoid continuous/excessive movement, choose timing by purpose.

## 2. UI/UX Design
Compact heading with existing create/resume/local-only actions; bounded search plus contextual result count. Responsive document tiles show an illustrative miniature using the first visible field labels, actual form name, existing top-level field count/version, draft status and an explicit Open designer cue. Illustrations are decorative, not live inputs or actual form screenshots. No additional permanent buttons or menus. One grid entrance and interaction feedback on the hovered/focused tile; no loop, no external motion dependency.

## 3. Design Audit
P1 weak recognition → document miniatures and readable names. P1 dense three-column text at the owner's width → min-width-aware grid, two columns there, one on mobile. Preserve keyboard-native buttons, visible focus and complete accessible names; don't require hover to discover the action. Search count is one atomic polite status. Reduced-motion immediately renders final state with transforms/animations disabled. Existing empty state and storage errors retained.

## Impact map (before code)
- Schema/API: no changes to form definitions, exports or server contracts.
- UI: host catalog presentation extracted into a typed app-level FormCatalog; shared SearchInput/Badge/EmptyState retained. Existing create/open/resume/dirty-discard journeys preserved.
- Temporal/Teams: no impact.
- Storage/migration: existing draft key/behavior unchanged; no added writes or tracking.
- Security: synthetic local catalog; no publication, new permissions or real records.
- Tests: existing FormsPage journey suite; browser open/search/empty/create/cancel/resume/keyboard, VI/EN, light/dark, 1440/1366/1070/mobile, reduced motion.

## 4. Interactive Prototype
React implementation on the existing route. Browser screenshots and actual results will be recorded after execution. Owner visual acceptance pending.

## 5. Design to Code / Reusable component impact
Use existing shared controls and semantic FlowDocker tokens; isolate catalog CSS from designer and platform chrome. FormCatalog is a typed host presentation component (not a new platform package); the portable Forms engine remains untouched. No dependency additions, no new primitive or package publish. No backend/platform-ready claim.

## Executed verification

Evidence: base `615c644` plus this slice's source. `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check` and `npm run build`: PASS. Build retains the existing >500 kB chunk warning. No dependency additions. Scoped CSS was formatted separately with Prettier because the root format glob covers app TS/TSX only.

`npm test -- apps/e-request-web/src/forms.test.tsx apps/e-request-web/src/form-drafts.test.ts --maxWorkers=1`: PASS, 2 files / 6 tests. Initial concurrent test/build run timed out in one existing 5-second FormsPage journey; reran the same tests unchanged after build completed, all passed. Full unrelated suite not rerun for this presentation-only change.

Browser Chromium named isolated session `forms-catalog`: `output/playwright/forms-catalog-motion-qa.cjs` PASS. Search/count/no-results, create dialog empty-name rejection and cancel, keyboard Enter opens designer, back/resume, mobile last item open/back, VI/EN and light/dark. No page errors or document horizontal overflow at 1440×900, 1366×768, 1070×884, 390×844. At owner width, confirmed two columns. Verified hover transforms and that reduced-motion disables grid animation and card/thumbnail/arrow transforms. QA restores original draft storage/language/theme. Existing `forms-catalog-qa.cjs` retained.

Visual iteration found old global catalog-grid CSS winning equal-specificity selectors and incorrectly placing search beside cards; strengthened the scoped catalog container rule and retested. Initial browser script used a Vietnamese accessible-name locator after switching English; corrected the script to address the same catalog element across locales, then full rerun passed.

Screenshots visually reviewed at desktop, owner width and mobile dark:
- [1440 VI/light](../output/playwright/forms-catalog-1440-vi-light.png)
- [1366 VI/light](../output/playwright/forms-catalog-1366-vi-light.png)
- [1070 owner width](../output/playwright/forms-catalog-1070-vi-light.png)
- [1440 EN/dark](../output/playwright/forms-catalog-1440-en-dark.png)
- [390 EN/dark](../output/playwright/forms-catalog-390-en-dark.png)

DONE: catalog presentation/motion and the verified local journeys above. Owner acceptance, CI and production integration remain NOT DONE. No new engine/backend/security functionality is claimed.
