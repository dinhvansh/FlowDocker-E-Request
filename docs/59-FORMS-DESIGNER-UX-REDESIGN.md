# Forms Designer — owner redesign implementation

## 1. UX Research

Owner brief received in this task, plus Issue #3 and docs/56–57. Baseline: `29ab384`, clean working tree, based on `facdc72` (`origin/feat/forms-ui-product` remains at that commit). Branch `feat/forms-designer-ux-v2` preserves all prior PR #4 work. PR #1/#2 are outside scope. No interview or production usability study is claimed.

Official references inspected in Chromium: SurveyJS Creator end-user interface documentation (toolbox, adorners, property categories, preview and typed rules) and Fillout getting-started documentation (direct question editing and preview). Inspiration only; no packages, source or branded assets from either are used. Local UI/UX Pro Max search `enterprise form builder keyboard focus inline editing --domain ux -n 5` emphasized visible focus, unobscured focus and keyboard task order. Owner-approved Inter 12/400 controls remain the typography source of truth.

## 2. UI/UX Design

Journey: create/open → insert/drag → select/edit in place → configure properties/logic → fill preview → validate → save/reopen. Preserve catalog/editor separation from owner feedback. The canvas uses the runtime renderer. Add inline label editing with Enter/blur commit, Escape cancellation and one undo step; compact contextual inspector navigation; real repeating tables for simple rows, with stacked mobile presentation and existing complex nested fallback. Display valid drop targets. Keep conditional authoring fields visible, runtime conditions effective.

## 3. Design Audit / impact map

| Priority | Observed issue | Correction / acceptance |
| --- | --- | --- |
| P1 | Field selection still requires navigating to inspector to rename | Edit selected label on canvas; keyboard alternative; undo restores it |
| P1 | Expense repeat renders vertically as cards | Real table headers/rows/cells in designer and runtime; two rows calculate correctly |
| P1 | Six inspector tabs take several rows at laptop widths | Context header and one category selector; labels/required first, technical key afterward |
| P1 | Drop position lacks a clear field indicator | Mark valid target and insertion intent, preserve container-cycle guard |
| P1 | Payment fixture lacks explicit currency/amount/description controls | Complete synthetic fixture without changing engine contracts |
| P2 | Large designer mixes property forms and orchestration | Extract typed contextual FieldInspector; retain shared AdvancedProperties logic |

Shared toolkit: canvas, inspector, repeat presentation and designer. Shared primitives/i18n: existing UI package. E-Request adapter: storage, navigation, synthetic providers. Schema/engine/API/DB/Temporal/Teams/security/migration: no planned change. No production backend claim; local draft and preview semantics stay explicit. No new runtime dependencies planned.

Before: `output/playwright/forms-redesign-before-1366.png`. Current prior behavior is recorded in docs/58. Gate: actual browser journeys and all six required commands plus independent source export verification. Owner visual acceptance remains pending; no automatic merge.

## 4–5. Interactive Prototype / Design to Code

The interactive implementation now uses the existing runtime controls, a contextual category selector, inline labels and valid drop indicators. The prototype was exercised in Chromium before final packaging. No owner visual approval is inferred from these checks.

### Reusable component impact

- Added exported `FieldInspector`, `FieldInspectorProps`, `InspectorSection`; integrated in FormDesigner. Typed callbacks keep history/persistence in the host.
- Added internal typed `InlineLabelEditor` and `RepeatField`, shared across designer/runtime. Simple repeats with up to six leaf fields use actual table cells; complex/nested controls keep stacked presentation. Small screens stack each row with accessible labels.
- Added optional `FormCanvas.onPatch` without changing existing callers. Labels commit on Enter/blur in one undo operation, cancel with Escape. Inline editing restores keyboard focus.
- Reused shared Button/Input/Select/Checkbox, existing DatePicker, Radix/dnd-kit, i18n dictionaries and semantic CSS tokens. No new dependency or copied reference assets.
- Synthetic payment fixture adds currency, requested amount matching total and payment description. A browser-discovered duplicate description identifier was corrected and covered by a fixture-validity regression test.
- `engine.ts` and `schema.ts` have no changes. All 33 field types, schema versions, validation, calculations, custom renderers/providers and imports/exports remain available. No migration required for this additive UI API.

### Executed browser journeys

Evidence scripts/results under `output/playwright/forms-redesign-*`:

| Flow | Actual operations and results |
| --- | --- |
| Create | Dialog creates a new draft; keyboard Enter inserts a textbox; inline label retains focus; Required updates real input; Undo/Redo; Save; reload; reopen from catalog restores field. |
| Nested drag | Pointer drags Email from toolbox into columns; existing children survive; Undo removes insertion. Pointer drag also reorders Vendor among nested siblings with a valid-target indicator. Escape cancels label edit. |
| New repeating table | Toolbox creates repeat; container selector inserts currency child; root currency field configured with Sum and `lines.amount`; preview rows 0.20 + 0.30 produce 0.50. This was authored through controls, not injected state. |
| Payment | Change visibility condition using the option label; Preview applies it; Undo restores advance-only visibility. Missing inputs produce an error summary. Company/dependent department providers load; vendor/amount/advance reason and two expense rows filled; total 0.50; local validation succeeds. Removing first row gives 0.30; minimum row removal disabled. Saved payment reopens after reload. |
| Responsive/themes/languages | All 16 combinations: 1366×768, 1440×900, 1920×1080, 390×844 × VI/EN × Light/Dark. Screenshot each; document scrollWidth equals viewport width throughout. Mobile preview and stacked expense rows inspected. |
| Independent source | Separate source directory served at port 5182, outside repository; Payment renders and injected company/dependent department providers work. |

These are separate connected verification flows, not a claim that the entire payment schema was hand-built in one continuous recording. Saved drafts are opened from the catalog after reload; startup currently opens the first stored draft. Browser scripts were corrected where selectors assumed a host-only wrapper or a unique manually reused title. Earlier duplicate-ID console errors occurred before the fixture correction; corrected Payment and new-draft journeys completed afterward.

### Screenshots

- Before: [1366 baseline](../output/playwright/forms-redesign-before-1366.png).
- After: [1366 VI Light](../output/playwright/forms-redesign-after-1366-vi-light.png), [1440 VI Light](../output/playwright/forms-redesign-after-1440-vi-light.png), [1920 EN Dark](../output/playwright/forms-redesign-after-1920-en-dark.png), [390 VI Light](../output/playwright/forms-redesign-after-390-vi-light.png).
- Runtime: [payment table with 0.50](../output/playwright/forms-redesign-payment-table.png), [mobile repeat](../output/playwright/forms-redesign-preview-table-390.png), [independent host](../output/playwright/forms-redesign-isolated-host.png).
- Full 16-combination results: `output/playwright/forms-redesign-matrix-result.txt`; screenshots use `forms-redesign-after-{width}-{vi|en}-{light|dark}.png`.

### Verification results

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, includes i18n check |
| `npm test -- --maxWorkers=1` | PASS — 13 files, 59 tests |
| `npm run format:check` | PASS |
| `npm run build` | PASS — existing large-chunk advisory remains |
| `npm run build:forms` | PASS — JS/CSS/declarations and 57 bundled license entries |
| Independent source `npm install`, typecheck, test, build | PASS — 8 files, 44 tests; no E-Request source required |

Three new regression checks cover inline label history/focus/cancellation, real repeat table/calculated total/minimum rows and complete payment fixture validity. Initial full run hit the 5-second timeout in the existing multi-step canvas test; two interactive canvas journey tests now have explicit 15-second limits. Assertions were retained; no global timeout or skipped tests. Final run passes. Logs: `output/forms-redesign-{typecheck,lint,tests,format,build,build-forms}.log`.

Independent editable source: `C:\Users\van.nguyendinh\Documents\Codex\2026-10-28\d-andros-portal-d-c-d-3\work\forms-designer-ux-v2`. Re-export with `node scripts/export-forms-source.mjs <new-absolute-directory>`. Run `npm install`, `npm run typecheck`, `npm test -- --maxWorkers=1`, `npm run build`, `npm run dev` there. Repository: `npm install`, `npm run dev` (or `npm run examples:forms` for the isolated example).

### Practical limits / owner review

Local draft/preview remains frontend-only. File upload requires a host adapter and is explicitly unavailable in the example; no submission/backend success is simulated. Complex repeated layouts use stacked rows. Formula source identifiers remain an advanced text input with validation. The package still includes global font/preflight styles, so embedding hosts must review style interaction. No production accessibility certification, commercial licensing terms, publishing, backend enforcement or quantified equivalence to another product is claimed. Owner visual acceptance and merge are pending. PR #1/#2 remain untouched.
