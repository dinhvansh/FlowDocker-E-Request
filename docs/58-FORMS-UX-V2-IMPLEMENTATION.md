# Form Studio UX V2 — implementation and evidence

## 1. UX Research

Owner input: docs/57 and GitHub issue #3, read 2026-10-28. The operator must see and edit an actual form while configuring fields. No interviews or timed usability study have been conducted. SurveyJS Creator V2 informs toolbox/design/property separation; Fillout informs clear input states and contextual editing. Official documentation was consulted; no source, package, assets or branding from either product is incorporated.

## 2. UI/UX Design

Use the existing shadcn/Radix wrappers, tokens and VI/EN dictionaries. A grouped searchable toolbox, a real runtime-backed field canvas and a contextual inspector form the workbench. The form catalog and document editor are separate views so the catalog does not become a fourth permanent pane. Designer/Preview/Logic/JSON are explicit modes. Canvas and preview support compact device widths; phone editing switches between panes. Outline remains an optional structural tool. Insert points and move buttons supplement drag and keyboard sorting.

## 3. Design Audit and fix plan

Before screenshot: `output/playwright/forms-ux-v2-before.png` on the existing application.

| Finding | Planned correction |
| --- | --- |
| Schema rows obscure the resulting form | Reuse RuntimeField visuals, including nested layouts |
| Flat toolbox of 33 controls | Searchable categories with frequent controls first |
| Four permanent panes squeeze the canvas | Collapsible catalog/toolbox/inspector |
| Advanced inspector combines unrelated controls | General / Validation / Logic / Data / Appearance / Advanced sections |
| Hidden conditional fields disappear during editing | Designer reveals fields with a condition marker; Preview retains real engine behavior |
| Switching Designer/Preview loses undo history | Keep designer mounted while previewing |

## Impact and reusable component boundary

`FormCanvas` and its field overlay belong to the reusable form toolkit, using the same internal renderer as runtime. Toolbox, outline and inspector remain designer components. Local persistence, form catalog and page routing remain app adapters. Schema, engine, API, storage format, Temporal, Teams, migrations and backend permissions are unchanged. Design-only visibility must never change preview/submission behavior. No new runtime library is needed.

## 4–5. Interactive prototype / Design to Code

Implemented on `feat/forms-ux-v2`, based on `facdc72` from `feat/forms-ui-product`. `schema.ts` and `engine.ts` are unchanged. The runtime gains an internal authoring wrapper and one structural sample row in Designer only; Preview retains the existing renderer behavior. Conditional fields stay visible and marked in Designer; selecting a nested tab field reveals its tab. No schema migration or new dependency.

The app keeps its designer mounted across modes to preserve undo/redo. Its collapsed catalog opens saved drafts; reload initially opens the first saved form, so reopen a different saved form using the catalog. Imported malformed JSON is rejected without replacing the definition. Cancelling the import clears its transient error.

### Executed checks (local development, 2026-10-28)

| Command | Actual result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, including VI/EN literal check |
| `npm run format:check` | PASS |
| `npm test -- --reporter=dot` | PASS, 11 files / 53 tests |
| `npm run build` | PASS; Vite warns about the 665 KB main JS chunk |
| `npm run build:forms` | PASS; declarations and 53 bundled license entries generated |
| Independent exported source: typecheck, test, build | PASS, 6 files / 38 tests, no E-Request source required |

Four added interaction tests cover conditional authoring vs runtime visibility, positional nested insertion/label edits/undo, prevention of destructive layout conversion, and nested inline move/clone. Existing host tests retain language, persistence and failed-storage assertions, adapted to the explicit rename disclosure. The longer host journey has a 15-second test timeout after its larger DOM exceeded the previous 5-second limit under concurrent jsdom workers; assertions were retained. The browser itself exercises real controls, not jsdom layout.

### Chromium interaction evidence

CLI: `npx --yes --package @playwright/cli playwright-cli -s=formsux ...`, application `http://127.0.0.1:5174/#forms`.

- `output/playwright/forms-ux-v2-journey.cjs`: insert currency after Vendor, edit VI/EN labels, require it, save local draft, invalid preview, synthetic company provider, conditional Advance Reason, two expense rows (`0.20 + 0.30 = 0.50`), valid local-only result, return to Designer with undo retained, reload and reopen the saved draft. All assertions passed.
- `output/playwright/forms-ux-v2-responsive.cjs`: English/dark, keyboard Enter insertion, keyboard move alternative, inspector collapse, mobile pane navigation and runtime preview. No page overflow at 390 px. All assertions passed.
- `output/playwright/forms-ux-v2-drag-logic.cjs`: actual pointer drag of a nested field, check changed order in JSON, edit a typed visibility condition and observe changed Preview visibility. All assertions passed.
- `output/playwright/forms-ux-v2-final.cjs`: malformed schema rejection, Vietnamese/light at 1366×768 and 390×844, reachable mobile JSON tab, no page overflow. All assertions passed after repairs.
- Browser console log: no ERROR or WARNING entries during the session; React development informational messages were present.

Browser QA found and fixed two real issues: Enter on a palette button was intercepted by the drag sensor (separate drag handles now leave the add button usable), and an import-error notice added 2 px of page overflow (scoped notice sizing corrected). Mobile mode tabs now wrap rather than hiding JSON off the edge. Failed runs caused by incorrect test locator translations were corrected and rerun; they are not product failures or successful runs.

### Screenshots for review

- [Before](../output/playwright/forms-ux-v2-before.png)
- [1366×768 VI/light, after](../output/playwright/forms-ux-v2-final-1366-vi-light.png)
- [1440×900 EN/dark](../output/playwright/forms-ux-v2-1440-en-dark.png)
- [390×844 VI/light](../output/playwright/forms-ux-v2-final-390-vi-light.png)
- [390×844 EN/dark](../output/playwright/forms-ux-v2-390-en-dark.png)
- [Mobile runtime preview](../output/playwright/forms-ux-v2-390-preview-en-dark.png)
- [Filled payment preview](../output/playwright/forms-ux-v2-payment-preview.png)

## Delivery status

**XONG:** interactive frontend refactor, shared canvas, typed inspector, local synthetic payment scenario and the executed checks above. Reusable public APIs are documented in the form-builder README; isolated source builds and tests independently. Preserve bundled upstream notices. No SurveyJS/Fillout/Form.io runtime package or copied assets were added.

**ĐANG LÀM / pending owner:** visual acceptance and any follow-up from review. No participant usability study, formal screen-reader audit, 100+ field performance study, backend enforcement or production release is claimed. This report provides task evidence, not a percentage of another product. No automatic merge. The parked Form.io benchmark remains only in a named local stash on its prior branch.

## Owner typography follow-up

Owner approved the typography of the two Form Studio pane buttons for shared UI. Added global shared tokens: Inter, 12px, weight 400, line-height 18px. Applied to buttons, navigation controls, tabs, inputs, labels, table cells and select/dialog portal controls; headings retain their hierarchy. Control hit areas and keyboard behavior are unchanged. This is a shared UI primitive change with no schema/API impact.

Chromium computed-style sampling on Forms, Master Data, Permissions, Applications, Connections and Flow Studio confirmed Inter/12px/400 across sampled visible controls. Screenshot: `output/playwright/compact-ui-typography-1440.png`. Typecheck, lint/i18n, format check and app build passed; build retains its existing main chunk warning. This is owner preference evidence, not a user study.
Validation follow-up: initial default-worker run hit the existing 5-second canvas interaction timeout (52/53); rerun with `npm test -- --reporter=dot --maxWorkers=2` passed 11 files / 53 tests. No test assertions or timeout settings changed for this typography update.

## Owner toolbar feedback — focused editing journey

### 1. UX Research

The owner marked two stacked toolbars at 626×604: catalog/demo creation actions above document rename/validate/save/publish actions. This is direct owner feedback about unclear task order and crowded controls, not a participant usability study.

### 2. UI/UX Design

Journey: catalog → choose/create → edit actual fields → preview → save local draft. Opening a saved draft enters its editor directly. Back returns to the catalog. The document header contains its name/status, Save and options. Rename/Validate and the unavailable Publish explanation move into Form options. Import/export, form/wizard presentation and canvas width move into Tools. Desktop pane toggles and undo/redo use accessible icons; mobile pane tabs remain explicit.

### 3. Design Audit

Removed duplicated catalog actions from editing, the redundant canvas heading/device toolbar and the extra canvas-header Add action. Retained inline insertion and toolbox controls. A discard cancellation now returns to the editor with Save reachable. Successful save closes the rename disclosure; switching documents resets it. Failed save keeps the editable title and reports failure.

### 4–5. Interactive Prototype / Design to Code

Implemented directly in the existing typed React components and exercised in Chromium. `forms-focused-journey.cjs` covers catalog → create → add a real text input → save → preview, rename/save, Tools import access and responsive overflow. `forms-focused-final.cjs` covers VI/light at 626×604, 390×844, 1366×768 and 1440×900, plus EN/dark at 390×844 and 1440×900, options access, Escape dismissal and Tools import access. No horizontal page overflow was observed. In the 626×604 editor, the real input appears within the first viewport. Earlier final-check execution failed only on an incorrect Vietnamese theme-button locator; corrected and rerun successfully.

Evidence: `output/playwright/forms-focused-{626,390,1366,1440}.png` and `forms-focused-{390,1440}-en-dark.png`. The browser console contains React development informational messages without error/warning entries for these journeys.

Executed checks for this iteration: typecheck PASS; lint including i18n PASS; format check PASS; `npm test -- --reporter=dot --maxWorkers=1` PASS (11 files / 53 tests); app build PASS (existing main-chunk size warning); `npm run build:forms` PASS (53 bundled license entries). The first rerun exposed a real catalog-cancellation issue and it was fixed. A later lint run flagged the standalone browser-function entry point; its CLI-specific expression is now annotated like the existing evidence scripts, and lint passes. The browser journey uses a unique rename value so repeated executions actually modify the draft instead of waiting on the correctly disabled Save button.

Reusable component impact: designer action grouping and responsive styles live in `@flowdocker/form-builder` / shared styles; catalog, persistence and document options remain the E-Request adapter. Shared Button, Modal and Select wrappers and bilingual dictionaries are reused. No dependency, schema, engine, persistence format or public component prop change. All 33 field types remain available. The isolated source export was verified in the earlier iteration; it has not been re-exported for this toolbar change. The reusable library bundle is rebuilt locally. Owner visual acceptance remains pending; PR #4 is not merged.

## Owner tab scrollbar correction

UX Research: the owner screenshot at 626×604 shows unwanted vertical scrollbar arrows on both mode tabs and mobile pane tabs. UI/UX Design: keep their existing actions and responsive wrapping, with no vertical scrolling inside a tab row. Design Audit: Chromium measured a 35px client height against 41px scroll height; shared 40px buttons exceeded the upstream 36px list height and its underline extended outside. Horizontal auto overflow also made vertical overflow auto.

Interactive Prototype / Design to Code: shared `.fd-tabs` now has a 44px minimum height, hides vertical overflow and places the underline inside each tab. Measured client/scroll heights now both 43px at 626px. The shared Tabs primitive is the reusable boundary; no public API, schema or engine change. Browser script `output/playwright/forms-tabs-fixed.cjs` asserts no vertical tab scrolling/page overflow at 626×604, 390×844, 1366×768 and 1440×900 and verifies ArrowRight mode navigation. EN/dark was checked at 626px and 390px. Screenshots: `output/playwright/forms-tabs-fixed-*.png`. Typecheck, lint/i18n, format check, app build and forms-library build passed; app build retains its chunk-size warning. This CSS-only follow-up uses browser layout checks; the earlier 53/53 unit result predates this change and was not rerun.

## Owner date-picker follow-up

UX Research: the owner identified the browser-default date picker as inconsistent with the app. UI/UX Design: one controlled shared calendar popover, localized date presentation, month/year navigation, Today/Clear and optional hour/minute selection. Retain the original local ISO storage format; no automatic default date is written. Design Audit: runtime previously used `input[type=date]` / `datetime-local`, whose browser popup did not use the shared theme or app locale.

Interactive Prototype / Design to Code: added shadcn Calendar and Popover after inspecting registry configuration and docs; preserved the customized shared Button. Public `@flowdocker/ui` DatePicker is reused by runtime and canvas, with a second isolated UI example and documented Props in `packages/ui/README.md`. `react-day-picker` 10.0.2 and `date-fns` 4.4.0 are MIT dependencies owned by the UI package; upstream notices are retained and the library bundle collects 57 license entries. The reusable bundle grows from about 542 KB to 675 KB JS before gzip; it is not published. Schema, engine, stored values and business rules are unchanged.

Browser QA also found that selecting an unselected canvas field on pointer focus could move the popup trigger before pointer-up. Popover triggers now select their canvas field on click, while other field focus behavior remains. The calendar opens in one click. Escape focus restoration is checked after the asynchronous popup dismissal completes.

Browser journey passed 12 assertions: canvas leap-day selection; Escape focus restoration; no native date inputs in Preview; runtime hour/minute selection, date changes preserving time and clearing; popup bounds at 626×604, 390×844, 1366×768 and 1440×900; EN/dark at 1440px and 390px. QA found and fixed selecting the current day leaving the popup open (calendar selection is required; Clear is explicit) and popup clipping at the short 604px viewport (height now follows Radix available space, with scrolling when necessary). Screenshots wait for opening animations before capture. Browser scripts were rerun after those corrections. No backend submission is involved.

Unit suite: 12 files / 56 tests passed, including leap-day local ISO emission, VI/EN switching, clearing, preserving local clock time and disabled/invalid state. The first new datetime test inherited EN preference from the previous test; test cleanup now clears it. Typecheck, lint/i18n and format check passed after correcting test locator option types; app and library builds passed with the existing app chunk-size warning. Browser evidence and screenshots are in `output/playwright/forms-calendar-*`; owner visual acceptance remains pending. No percentage-of-product or production-readiness claim.
