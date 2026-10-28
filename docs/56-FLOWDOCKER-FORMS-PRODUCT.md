# FlowDocker Forms — owner-directed reusable UI product

Owner explicitly authorized continuing the original form builder toward broad Form.io-like UI coverage and extracting a reusable product (2026-10-28). This supersedes the earlier Form.io-first UI choice for this work only. Form.io POC and approval/backend work remain independent roadmap items.

## Research and measurement
Reference: Form.io builder/renderer component catalog, not the Form.io API server, hosting, PDF or enterprise ecosystem. Upstream package metadata checked: `@formio/js` 5.7.0, MIT, repository https://github.com/formio/formio.js. No Form.io source or branding is copied into this implementation.

“90%” is a target requiring a frozen comparison inventory, weighting, integration tests and owner acceptance. It is not established by implementing 18 convenient checkboxes or counting field types. The following inventory records concrete UI acceptance families; completing it alone must not be advertised as independently verified 90% parity with Form.io. Keep unsupported behavior explicit.

### Acceptance inventory
| Family | Required behavior | Evidence |
|---|---|---|
| Basic input | text, multiline, email, URL, phone, password, numeric, date/time | See implementation and evidence below |
| Choice | select, radio, multi-select, checkbox, checkbox group | See implementation and evidence below |
| Display | bilingual labels/help/placeholders, default values, disabled/read-only | See implementation and evidence below |
| Layout | sections, columns, tabs/steps, responsive widths | See implementation and evidence below |
| Repeating data | nested repeat rows, add/remove, limits and row validation | See implementation and evidence below |
| Conditional UI | typed show/hide, required and disabled rules; no JS | See implementation and evidence below |
| Calculations | typed references and arithmetic/aggregate operations; cycle detection | See implementation and evidence below |
| Validation | bounds, length, typed format, cross-field/date checks, summary/inline | See implementation and evidence below |
| File UI | chooser, size/type/count checks, injected upload/remove states | See implementation and evidence below |
| Signature | pointer capture and keyboard-accessible typed alternative | See implementation and evidence below |
| Builder | searchable palette, drag ordering, keyboard ordering, nested placement | See implementation and evidence below |
| Editing | duplicate, delete, undo/redo, stable keys and references | See implementation and evidence below |
| Schema | bounded versioned JSON import/export, migration, reject unsafe nodes | See implementation and evidence below |
| Runtime | controlled values, reset, validation and submit callback, read-only host policy | See implementation and evidence below |
| Extension | typed custom renderer, injected data providers, loading/error/cancellation | See implementation and evidence below |
| Portability | standalone build, declarations, no app imports, two hosts | See implementation and evidence below |
| Delivery | archive/tarball, install smoke test, notices and dependency inventory | See implementation and evidence below |
| Quality | VI/EN, light/dark, mobile, keyboard, meaningful unit/integration/browser QA | See implementation and evidence below |

## Design and audit
Assumed users: form designer and end user. No invented interviews. Preserve compact FlowDocker workbench, shadcn/Radix tokens, explicit local draft status. Add categorized palette, schema outline, selected properties and runtime preview. Reorder uses drag handle plus keyboard/move controls. Containers remain typed; never execute imported JS/HTML/URLs. External data and file operations are callbacks owned by the integrating app, with visible unavailable/error states if absent. Browser field access rules are presentation only; never claim backend authorization.

## Impact map and extraction
Shared package `@flowdocker/form-builder` evolves as original FlowDocker Forms. E-Request adapter keeps local drafts. Standalone distribution bundles shared original wrappers/i18n plus permissively licensed dependencies, with React as a peer. No database/API/Temporal/Teams/approval/migration changes. Package remains unpublished; user may reuse or negotiate commercial distribution of original work while upstream license notices remain required. Do not label third-party code proprietary or invent a complete commercial license/customer rights without owner terms.

Each implementation slice is verified, committed and pushed before the next. This document tracks the product scope and evidence, not a completed 90% claim.

## Implemented UI and verification evidence (2026-10-28)

Status: **UI toolkit implemented and extracted; full Form.io 90% parity NOT VERIFIED**. There are 33 original field types. Evidence covers the behaviors below; it does not certify every property/edge case of Form.io. Customer acceptance, backend production enforcement and commercial customer license terms remain separate.

| Acceptance family | Implemented evidence |
|---|---|
| Inputs and choices | 33-type schema catalogue; required/email/URL/phone/number/date/time/choice validation in engine; builder adds typed fields |
| Display and layout | bilingual labels/help/placeholders, read-only/disabled; columns, sections, tabs, layout tables, wizard; address and date parts |
| Structured/repeating data | object namespaces, nested rows, min/max/uniqueness checks; namespace and repeated decimal tests |
| Conditional UI | all/any visibility/required/disabled; stale hidden values removed; browser priority reason shown/required |
| Calculations | Decimal.js arithmetic/aggregates; forward references; aggregate and namespace cycle detection; browser two-row sum 0.50 |
| Validation | schema/type/format/bounds/comparison; summary and inline issues; malformed signatures, forged file metadata, cyclic/oversized values rejected |
| Files/signatures | injected upload/remove, pending blocks submit, stale upload callbacks preserve other edits; pointer strokes and typed signature |
| Builder/editing | palette search; drag handles; dnd-kit keyboard sensor; move buttons; parent selection; subtree clone; delete; undo/redo |
| Schema | v1 draft compatibility, v2 export, bounded import, unsupported executable properties rejected |
| Runtime | controlled values; async submit/error recovery; raw duplicate/read-only submit guards; reset; wizard step validation |
| Extensions | provider ID registry, query/dependency/AbortSignal, stale cancellation test; custom React control registry; no arbitrary URLs/scripts |
| Portability | E-Request host; packed React-only independent consumer builds with skipLibCheck=false; editable source builds outside repository |
| Delivery | private @flowdocker/forms 0.2.0 tarball; source export script; README/OWNERSHIP; 53 dependency/source license entries including Inter OFL and shadcn MIT |
| Quality | main repo: 10 files / 49 tests; extracted source: 5 files / 34 tests; typecheck, lint/i18n, formatting and both builds pass; browser VI/EN, light/dark, 390px overflow checks |

Commands actually executed:

- Main repository: npm run typecheck; npm run lint; npm test; npm run format:check; npm run build; npm run build:forms.
- Independent source outside repository: npm install; npm run typecheck; npm test; npm run build. 34 tests pass without E-Request or any of its source packages.
- Independent consumer: npm install ./flowdocker-forms-0.2.0.tgz; npm run build. Type declarations checked with skipLibCheck=false, no workspace aliases.
- Playwright CLI: fill priority form, conditional required reason, two repeated rows, decimal aggregate 0.50, radio/checkbox/tags, typed signature, VI/EN, dark theme, standalone submit, builder undo/redo, desktop/mobile screenshots and 390px page-width assertion.

Browser artifacts live under output/playwright/forms-*.png. These are synthetic browser-local checks, not production E2E/UAT. A missing demo favicon was corrected; no app runtime exception was observed in the checked flows. Builds report the existing >500kB JS chunk advisory; no build failure. JS library is about 515kB uncompressed / 142kB gzip; CSS includes embedded fonts and global Tailwind preflight. Host-style isolation is not claimed.

Release commit/remote verification and delivered archive hashes are recorded in the accompanying release report after commit. No GitHub PR was opened automatically and no npm publication was performed.

## Form.io catalogue comparison and remaining gaps

Reference catalogue: https://api.github.com/repos/formio/formio.js/contents/src/components?ref=v5.7.0 . This is an independently implemented behavior comparison, not source/schema compatibility.

| Form.io component family | FlowDocker counterpart | Scope and difference |
|---|---|---|
| textfield, textarea, email, url, phonenumber, password, number, currency | matching typed fields | common browser input/validation; no full input-mask/property editor parity |
| checkbox, select, radio, selectboxes, tags | checkbox, select, radio, checkboxes/multiselect, tags | static bilingual choices and injected async providers; no arbitrary provider URLs |
| datetime, day, time | date/datetime, day, time | native controls and real date-part validation; no full calendar/timezone configuration suite |
| address | address | structured manual input; geocoder/map integration not implemented |
| file, signature, survey | file, signature, survey | adapters/pending/error UI, drawn/typed signature, 1–5 survey; external storage adapters are host responsibility |
| container, datamap, datagrid | container, keyvalue, repeat | nested objects, key/value records and repeat rows; no Form.io data format compatibility |
| editgrid | repeat | inline editing only; row save/cancel/collapsed editor parity not implemented |
| columns, table, tabs, fieldset | columns, table, tabs, section | responsive layout; tables use 1–3 columns; no arbitrary table cell spanning |
| panel, well | section | shared grouping; collapsible panel/well-specific property set not implemented |
| content, alert, hidden, button | content, alert, hidden, button | escaped text, severity, defaults, submit/reset; no admin HTML/JS or arbitrary actions |
| html | trusted host custom renderer extension only | no raw HTML editor/import execution |
| form | host composition/custom renderer only | no remote nested Form.io form loader |
| recaptcha | no built-in adapter | host extension required; no CAPTCHA verification service supplied |

There is no conversion from this matrix into a blanket 90% score. Advanced Form.io logic/property editors, rich HTML, remote nested forms, edit-grid transactions, geocoding, CAPTCHA, all third-party provider variants, formal accessibility certification, customer UAT and complete visual parity are NOT DONE. The original owner's 90% target remains a product acceptance target, not a verified marketing claim.

### Reusable component impact

Added original schema/engine/designer/runtime/provider and extraction scripts, reused @flowdocker/ui and @flowdocker/i18n, exposed FormsProvider/FormsLanguagePicker/FormsButton for the portable host. Domain-specific E-Request draft storage stays in the application adapter. No backend API, DB migration, Temporal, Teams or approval implementation changed. Standalone source includes only form-builder, ui and i18n packages; no E-Request source dependency.

Final portable-package browser pass: structured address/date/object/table values submit as expected; uncontrolled language switch updates the provider lang attribute; keyboard Space/ArrowDown/Space reorders a field; undo/redo and 390px no-page-overflow assertion pass. Final screenshots: forms-release-runtime-vi.png, forms-release-runtime-en-dark.png, forms-release-designer-en-dark.png and forms-release-mobile-en-dark.png. The release consumer console had no runtime error or resource error after the favicon correction.

## UX direction decision (2026-10-28): KEEP original engine, redesign Designer
The owner has confirmed **continue the original FlowDocker Forms schema, rule engine and renderer**. No Form.io switch, replacement, engine rewrite or Form.io comparison POC is required for the current UX task. UX benchmark: **SurveyJS Creator V2** for toolbox–live canvas–property grid and Designer/Preview/Logic flow; **Fillout** for a clean, high-quality real form canvas and direct field editing. Learn interaction patterns; do not copy protected source, branded screens, proprietary assets or pixel-for-pixel styling. Mandatory designer brief and acceptance: [docs/57-FORMS-UX-BENCHMARK-REDESIGN.md](57-FORMS-UX-BENCHMARK-REDESIGN.md); tracking [Issue #3](https://github.com/dinhvansh/FlowDocker-E-Request/issues/3). Owner dislikes current UI. **Redesigned UI NOT DONE; no code changes claimed.**
