# Forms Designer — owner redesign implementation

## 1. UX Research

Owner brief received in this task, plus Issue #3 and docs/56–57. Baseline: `29ab384`, clean working tree, based on `facdc72` (`origin/feat/forms-ui-product` remains at that commit). Branch `feat/forms-designer-ux-v2` preserves all prior PR #4 work. PR #1/#2 are outside scope. No interview or production usability study is claimed.

Official references inspected in Chromium: SurveyJS Creator end-user interface documentation (toolbox, adorners, property categories, preview and typed rules) and Fillout getting-started documentation (direct question editing and preview). Inspiration only; no packages, source or branded assets from either are used. Local UI/UX Pro Max search `enterprise form builder keyboard focus inline editing --domain ux -n 5` emphasized visible focus, unobscured focus and keyboard task order. Owner-approved Inter 12/400 controls remain the typography source of truth.

## 2. UI/UX Design

Journey: create/open → insert/drag → select/edit in place → configure properties/logic → fill preview → validate → save/reopen. Preserve catalog/editor separation from owner feedback. The canvas uses the runtime renderer. Add inline label editing with Enter/blur commit, Escape cancellation and one undo step; compact contextual inspector navigation; real repeating tables for simple rows, with stacked mobile presentation and existing complex nested fallback. Display valid drop targets. Keep conditional authoring fields visible, runtime conditions effective.

## 3. Design Audit / impact map

| Priority | Observed issue                                                      | Correction / acceptance                                                                  |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| P1       | Field selection still requires navigating to inspector to rename    | Edit selected label on canvas; keyboard alternative; undo restores it                    |
| P1       | Expense repeat renders vertically as cards                          | Real table headers/rows/cells in designer and runtime; two rows calculate correctly      |
| P1       | Six inspector tabs take several rows at laptop widths               | Context header and one category selector; labels/required first, technical key afterward |
| P1       | Drop position lacks a clear field indicator                         | Mark valid target and insertion intent, preserve container-cycle guard                   |
| P1       | Payment fixture lacks explicit currency/amount/description controls | Complete synthetic fixture without changing engine contracts                             |
| P2       | Large designer mixes property forms and orchestration               | Extract typed contextual FieldInspector; retain shared AdvancedProperties logic          |

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

| Flow                        | Actual operations and results                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create                      | Dialog creates a new draft; keyboard Enter inserts a textbox; inline label retains focus; Required updates real input; Undo/Redo; Save; reload; reopen from catalog restores field.                                                                                                                                                                                                                    |
| Nested drag                 | Pointer drags Email from toolbox into columns; existing children survive; Undo removes insertion. Pointer drag also reorders Vendor among nested siblings with a valid-target indicator. Escape cancels label edit.                                                                                                                                                                                    |
| New repeating table         | Toolbox creates repeat; container selector inserts currency child; root currency field configured with Sum and `lines.amount`; preview rows 0.20 + 0.30 produce 0.50. This was authored through controls, not injected state.                                                                                                                                                                          |
| Payment                     | Change visibility condition using the option label; Preview applies it; Undo restores advance-only visibility. Missing inputs produce an error summary. Company/dependent department providers load; vendor/amount/advance reason and two expense rows filled; total 0.50; local validation succeeds. Removing first row gives 0.30; minimum row removal disabled. Saved payment reopens after reload. |
| Responsive/themes/languages | All 16 combinations: 1366×768, 1440×900, 1920×1080, 390×844 × VI/EN × Light/Dark. Screenshot each; document scrollWidth equals viewport width throughout. Mobile preview and stacked expense rows inspected.                                                                                                                                                                                           |
| Independent source          | Separate source directory served at port 5182, outside repository; Payment renders and injected company/dependent department providers work.                                                                                                                                                                                                                                                           |

These are separate connected verification flows, not a claim that the entire payment schema was hand-built in one continuous recording. Saved drafts are opened from the catalog after reload; startup currently opens the first stored draft. Browser scripts were corrected where selectors assumed a host-only wrapper or a unique manually reused title. Earlier duplicate-ID console errors occurred before the fixture correction; corrected Payment and new-draft journeys completed afterward.

### Screenshots

- Before: [1366 baseline](../output/playwright/forms-redesign-before-1366.png).
- After: [1366 VI Light](../output/playwright/forms-redesign-after-1366-vi-light.png), [1440 VI Light](../output/playwright/forms-redesign-after-1440-vi-light.png), [1920 EN Dark](../output/playwright/forms-redesign-after-1920-en-dark.png), [390 VI Light](../output/playwright/forms-redesign-after-390-vi-light.png).
- Runtime: [payment table with 0.50](../output/playwright/forms-redesign-payment-table.png), [mobile repeat](../output/playwright/forms-redesign-preview-table-390.png), [independent host](../output/playwright/forms-redesign-isolated-host.png).
- Full 16-combination results: `output/playwright/forms-redesign-matrix-result.txt`; screenshots use `forms-redesign-after-{width}-{vi|en}-{light|dark}.png`.

### Verification results

| Command                                                  | Result                                                    |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `npm run typecheck`                                      | PASS                                                      |
| `npm run lint`                                           | PASS, includes i18n check                                 |
| `npm test -- --maxWorkers=1`                             | PASS — 13 files, 59 tests                                 |
| `npm run format:check`                                   | PASS                                                      |
| `npm run build`                                          | PASS — existing large-chunk advisory remains              |
| `npm run build:forms`                                    | PASS — JS/CSS/declarations and 57 bundled license entries |
| Independent source `npm install`, typecheck, test, build | PASS — 8 files, 44 tests; no E-Request source required    |

Three new regression checks cover inline label history/focus/cancellation, real repeat table/calculated total/minimum rows and complete payment fixture validity. Initial full run hit the 5-second timeout in the existing multi-step canvas test; two interactive canvas journey tests now have explicit 15-second limits. Assertions were retained; no global timeout or skipped tests. Final run passes. Logs: `output/forms-redesign-{typecheck,lint,tests,format,build,build-forms}.log`.

Independent editable source: `C:\Users\van.nguyendinh\Documents\Codex\2026-10-28\d-andros-portal-d-c-d-3\work\forms-designer-ux-v2`. Re-export with `node scripts/export-forms-source.mjs <new-absolute-directory>`. Run `npm install`, `npm run typecheck`, `npm test -- --maxWorkers=1`, `npm run build`, `npm run dev` there. Repository: `npm install`, `npm run dev` (or `npm run examples:forms` for the isolated example).

### Practical limits / owner review

Local draft/preview remains frontend-only. File upload requires a host adapter and is explicitly unavailable in the example; no submission/backend success is simulated. Complex repeated layouts use stacked rows. Formula source identifiers remain an advanced text input with validation. The package still includes global font/preflight styles, so embedding hosts must review style interaction. No production accessibility certification, commercial licensing terms, publishing, backend enforcement or quantified equivalence to another product is claimed. Owner visual acceptance and merge are pending. PR #1/#2 remain untouched.

### Follow-up field UX slice

The follow-up slice adds a reusable searchable `Combobox` built from the existing Radix/shadcn Popover and shared FlowDocker primitives. Runtime select fields and the designer's parent-container picker now support filtering without changing persisted values or provider contracts. The inspector exposes a persistent **Layout position** group with searchable parent selection and explicit move up/down actions. All 33 toolbox types now carry a consistent Lucide type icon in the palette and outline; the field-type schema and renderer contracts remain unchanged.

Browser evidence: the Purchase Request category picker filtered `văn` to `Văn phòng phẩm`; the layout picker displayed an explicit empty state for an unmatched group; 1366 and 390 screenshots are in `output/playwright/forms-upgrade-1366.png` and `forms-upgrade-390.png`, with no horizontal overflow at 390px. The new UI test covers filtering and selection. Verification after this slice: **14 files / 60 tests PASS**, typecheck/lint/i18n/format PASS, application and portable forms builds PASS. Existing chunk-size advisory remains.

### Layout simplification follow-up

Removed decorative plus icons from the toolbox and canvas insert actions while preserving their accessible text labels and keyboard actions. The layout position panel now exposes **Fields per row** directly for `columns` and `table` containers; values 1, 2 and 3 map to the existing `FormField.columns` contract. Desktop canvas uses the selected grid, while the existing mobile breakpoint collapses to one column. Browser evidence: `output/playwright/forms-layout-3-columns.png` shows three payment fields in one row with the inspector set to `3 fields`.

### Drag and drop polish follow-up

Palette dragging now keeps the field visible in a floating preview card while the pointer moves across the canvas. Valid field targets receive a restrained highlight, and column/group containers expose a dedicated bottom drop zone with a clear insertion message. Dropping on the container appends the new field to that group while preserving the existing children; cancelling the gesture leaves the schema unchanged. The interaction uses the existing dnd-kit engine and keeps the existing keyboard insert actions.

Browser evidence: `output/playwright/forms-dnd-during.png` captures the Email preview over the highlighted payment-details column layout at 1440×900. The browser journey reported `preview: 1`, `active: 1`, and `inserted: 1`; the focused canvas regression suite remains green.

### Repeating table usability correction (2026-10-29)

Research evidence: owner screenshot shows six columns squeezed into a narrow designer, broken words and overflowing inline actions. Task: configure a 4–7 column repeating table without losing readable inputs or discovering row limits in unrelated property categories.

Design/audit: keep real runtime inputs on canvas; contain horizontal scrolling inside the table on desktop, retain stacked rows on phones, and wrap selected-cell actions inside their cell. Keep all simple leaf column counts tabular instead of silently switching to cards above six. Complex nested field layouts continue to use the existing stacked presentation. Add a contextual repeat settings section with min/max row controls, column type insertion, column selection and keyboard-operable reorder buttons.

Reusable component impact: `RepeatField` presentation and exported `FieldInspector` are reused; inspector adds optional typed `onSelectField` and `onAddColumn` callbacks. Designer owns history and selection. No schema/engine/storage/API/Temporal/Teams/security/migration change. No new dependencies. New seven-column renderer regression test preserves actual controls and accessible table semantics.

Interactive prototype / code evidence: added three columns to the synthetic Payment table through the new inspector (five total); table viewport 570px, content 948px at 1440px, document width 1425px (no global overflow). Inspector screenshots at 1366×768, 1440×900 and 390px; all report no horizontal page overflow. Changed maximum rows to two, reordered Number before Date, added Email while retaining repeat selection, and preview Add row disables at two rows. VI Light designer and EN Dark runtime/mobile inspected. Screenshots: `output/playwright/repeat-improved-1440.png`, `repeat-settings-{1366,1440,390}.png`, `repeat-preview-en-dark.png`, `repeat-preview-mobile-en-dark.png`. These are focused combinations, not a full theme/language/device matrix. Owner visual acceptance remains pending; no merge.

Validation: full pre-regression suite 14 files / 60 tests PASS; new focused repeat suite 2 tests PASS. Typecheck, lint/i18n, format, app build and forms build PASS. Existing app chunk-size advisory remains.

### Portrait / landscape form presentation (2026-10-29)

Owner task: wide repeating tables need a wider form presentation. Design: a visible Form orientation selector beside undo/redo, independent of Desktop/Mobile preview. Audit: orientation must persist with each definition, survive export/import, respect read-only and never force desktop widths on a phone. Interactive React prototype uses the shared Select with bilingual Portrait/Landscape labels and the same paper presentation in designer and application preview.

Reusable component impact: optional `FormDefinition.orientation: portrait | landscape`; missing value defaults to portrait. The safe schema guard validates the enum. Export/import preserve it; existing definitions stay valid. Additive metadata under the current schema version; no data/engine/calculation changes or migration. Older library consumers that reject unknown properties need this updated library before reading definitions containing orientation. `FormRenderer` exposes `data-orientation` for standalone styling. No PDF/print pipeline is implemented by this setting.

Browser evidence: at 1440px preview measured Portrait=760px, Landscape=1120px; 390px preview has no page overflow. Saved Landscape, reloaded, and confirmed the selector restored Landscape. VI designer and EN preview exercised. Screenshots: `output/playwright/form-orientation-designer.png`, `form-landscape-1440.png`, `form-landscape-mobile.png`. Test verifies both orientations round-trip and rejects an invalid orientation. Typecheck, lint/i18n, format and portable forms build pass; 7 focused schema/app tests pass. Owner visual acceptance pending.

Final orientation gate: full suite 14 files / 62 tests PASS; app build PASS (existing chunk-size advisory), portable forms build PASS; typecheck/lint/i18n/format PASS.

### Automatic repeating-table entry rows (2026-10-29)

UX Research: owner feedback identifies awkward Add row placement and requests spreadsheet-like entry with unused blank rows discarded. UI/UX Design: place Add row at the right of a compact table footer; offer an explicit per-table automatic-entry setting. Design Audit: inserting a real blank row would trigger required validation and inflate stored data, so the final entry row is virtual. Preserve numeric zero, partly filled row validation, min/max row limits, read-only behavior and keyboard entry. Blank real rows are removed when focus moves to another control outside the row, excluding popup interactions; a null blur target does not remove data.

Interactive Prototype / Design to Code: shared RepeatField and FieldInspector implement the behavior for desktop tables and stacked mobile rows using the existing FlowDocker primitives and semantic tokens. Optional `FormField.autoRows` defaults off; existing forms retain manual behavior. Enable it under the repeating-table settings. Typing meaningful data materializes the virtual row and prepares the next entry; unused virtual rows never enter controlled values or validation. Add row focuses the final entry in automatic mode. No engine rewrite, new dependency, API, storage, Temporal, Teams or security change. Updated strict schema guard accepts the optional boolean; older strict consumers need the updated package before reading definitions that include it.

Verification: typecheck, lint/i18n, format, app build and portable forms build PASS; full test suite 14 files / 64 tests PASS. Browser journey at 1440x900 confirmed one trailing placeholder, Add row focus inside it, numeric zero retained and cleared row removal after leaving; 390x844 had no page overflow. Evidence: `output/playwright/repeat-auto-qa.cjs`, `repeat-auto-footer-1440.png`, `repeat-auto-footer-mobile.png`. This slice exercised VI Dark desktop/mobile, not a full theme/language matrix. Existing app chunk-size advisory remains. Owner visual acceptance pending.

### Localized currency entry (2026-10-29)

UX Research: owner feedback identifies unreadable ungrouped money amounts. UI/UX Design: group digits during entry, using VI `1.234.567,89` and EN `1,234,567.89`; calculated and disabled amounts use the same presentation. Design Audit: retain canonical decimal strings, trailing zeroes and precision without converting through JavaScript Number; preserve existing engine validation/min/max/integer rules. Currency inputs now expose textbox semantics and a decimal mobile keyboard; plain numeric fields retain spinbuttons. Enter/paste amounts using the active locale separators.

Interactive Prototype / Design to Code: reusable typed CurrencyInput in @flowdocker/ui composes the existing Input and i18n provider; currency runtime fields reuse it in designer, standalone renderer and repeating tables. Caret restoration supports editing within grouped values. No new dependency, schema, API, storage, calculation engine, Temporal, Teams or security change. Existing canonical values require no migration. Public props: value (canonical string), onValueChange, standard input accessibility/disabled/placeholder props; no currency rounding is imposed.

Verification: typecheck, lint/i18n, format, app build and portable forms build PASS. Full suite: 15 files / 66 tests PASS, including exact large values beyond safe integer range, negatives, zero, clearing, locale changes, caret and existing repeat calculations. Browser at 1440x900 confirmed entered money and calculated total both read `1.234.567,89`, switching to EN yielded `1,234,567.89`; at 390x844 no page overflow. Dark-mode evidence: `output/playwright/currency-grouping-{vi,en,mobile}.png`; reproducible journey `currency-grouping-qa.cjs`. No complete theme/device matrix claimed. Existing app bundle-size advisory remains; owner visual acceptance pending.
