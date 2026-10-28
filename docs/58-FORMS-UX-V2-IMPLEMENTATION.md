# Form Studio UX V2 — implementation and evidence

## 1. UX Research

Owner input: docs/57 and GitHub issue #3, read 2026-10-28. The operator must see and edit an actual form while configuring fields. No interviews or timed usability study have been conducted. SurveyJS Creator V2 informs toolbox/design/property separation; Fillout informs clear input states and contextual editing. Official documentation was consulted; no source, package, assets or branding from either product is incorporated.

## 2. UI/UX Design

Use the existing shadcn/Radix wrappers, tokens and VI/EN dictionaries. A grouped searchable toolbox, a real runtime-backed field canvas and a contextual inspector form the workbench. The form catalog is collapsible so it does not become a fourth permanent pane. Designer/Preview/Logic/JSON are explicit modes. Canvas and preview support compact device widths; phone editing switches between panes. Outline remains an optional structural tool. Insert points and move buttons supplement drag and keyboard sorting.

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
