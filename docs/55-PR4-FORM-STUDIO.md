# PR 4 — Form Studio: local schema designer and preview

Base SHA: `5dc8d5d`. Scope: frontend prototype, synthetic definitions; no Form.io integration, server submission, approval runtime or publication. This is the next proposed frontend slice after PR 3, not a previously approved numbered backend plan.

## 1. UX Research
Desk review: docs/03, 39–50 and owner requests for consistent shadcn UI and Vietnamese/English. Assumed actor: app administrator. Tasks: create a definition, add typed fields, edit properties, reorder without dragging, validate, preview and save/reopen. No interviews or operator usability study performed.

## 2. UI/UX Design
Reuse the existing catalog/editor/inspector workbench. Definition list at left, field table or preview in center, field properties at right. Use existing FlowDocker shadcn/Radix controls and tokens; no additional UI foundation. On narrow viewports panels stack. Field labels support explicit vi/en values; technical keys remain unchanged. Preview values stay in memory and are never submitted or persisted. Definition edits require explicit Save; switching dirty definitions requires confirmation.

## 3. Design Audit
- P1: Form Studio is absent. Add discoverable navigation and link from Application Builder.
- P1: Drag-only ordering excludes keyboard users. Provide Move up/down buttons.
- P1: Invalid or duplicate keys must not silently become valid forms. Schema validation gates save/preview.
- P1: Stale preview inputs can misrepresent a changed schema. Reset preview on schema or definition changes.
- P0 for deployment: client validation is not authorization or server validation. Disable publication, identify local demo scope. No real financial values, identity, files, external lookups or execution expressions.

## 4. Interactive Prototype
Synthetic purchase intake and IT equipment request definitions. Text, multiline text, number, date, checkbox and select. Creation, search, field add/delete/reorder, bilingual labels, required flags and select choices. Preview checks required values, finite numbers and allowlisted choices. Storage errors and malformed local drafts must be visible and must not overwrite storage on load.

## 5. Design to Code / Impact map
`@flowdocker/form-builder`: typed schema contracts, pure validators, controlled `FormPreview` and `FormDesigner` with onChange. Host adapter owns local persistence and synthetic fixtures. `@flowdocker/ui` owns shared FieldGroup. No DB/API/Temporal/Teams/migration changes; no permissions granted by form/module selection. Existing forms module still includes the unimplemented Approval Studio, so its combined availability remains false.

Reusable component impact: reuse Button/Field/Input/Select/Checkbox/Tabs/DataTable/Notice, export FieldGroup, add a private form-builder package with no E-Request imports. Field now connects hints/errors through aria-describedby (including Select); checkbox width remains intrinsic inside a vertical Field. Public API and isolated example documented in its README. The host keeps Form Studio mounted while navigating other modules and warns on reload with unsaved schema changes. Retain the React root in Vite hot data to avoid creating a second root when main is invalidated. Production readiness and real second-app backend portability remain NOT DONE.

## Verification
Executed on the PR 4 working tree based on `5dc8d5d`:

- `npm run typecheck`, `npm run lint` (including i18n check), `npm test`: PASS, 9 files / 30 tests. Tests cover duplicate/reserved keys, bilingual requirements, malformed storage, date/number/choice validation, storage write denial, language-switch preservation and unsaved-discard confirmation.
- `npm run build` and `npm run format:check`: PASS. Vite reports a main chunk size warning (~502 KB before gzip / 160 KB gzip); code splitting remains an optimization opportunity.
- Playwright Chromium: required preview inputs show three errors; switching VI → EN retains sample input; edit/save/reload retains definition; create new form, add two fields, move up, delete a field, save/reload retains one field. Valid equipment preview passes with text, number and checked required checkbox. No real submission occurs.
- Clean browser session: no page errors during language/theme change and valid preview. Width checks at 768 and 375 px show no document overflow. Checkbox measured <=20 px after the layout fix. Earlier hot-edit errors were followed by a clean reload; these are not production E2E results.
- Screenshots visually reviewed: [1440 Vietnamese](../output/playwright/pr4-forms-1440-vi.png), [1440 English dark](../output/playwright/pr4-forms-1440-en-dark.png), [375 English dark](../output/playwright/pr4-forms-375-en-dark.png).

Owner design review, all-breakpoint/zoom accessibility audit, standalone example browser QA, Form.io POC, server validation/field ACL, immutable versions and real request submission remain NOT DONE. No backend/security completion is claimed.
