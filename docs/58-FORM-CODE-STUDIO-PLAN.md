# Form Code Studio implementation plan

## Contract
- The visual designer and code view edit the same FormDefinition, including all field settings.
- Valid code updates the canvas immediately. Invalid intermediate code stays editable while the canvas retains the last valid form.
- Keep all existing drag/drop, field inspectors and runtime capabilities.
- No Apply button, arbitrary JavaScript execution or backend dependency.

## Slices
1. Shared schema editor and live visual editing, invalid-code recovery and identity preservation.
2. Dedicated code editor: syntax colors, JSON schema autocomplete, precise diagnostics, undo history and split layout.
3. Field selection maps to code locations; code locations select fields; preserve cursor and unsaved drafts.
4. Consolidate advanced configuration and test-data preview using the existing engine.
5. AI-ready schema documentation and exportable context; actual provider integration is a separate step.
6. Responsive, VI/EN, light/dark and keyboard audit with browser screenshots.

Each finished slice is verified, committed and pushed before the next slice.

## Impact map and UX decision (2026-10-31)
- Shared forms tooling: source model/editor are domain-adapter components in form-builder; FormsPage is an app-specific host. Existing Button/Notice/Tabs/FieldGroup are reused. No business endpoints in the editor.
- Schema: existing FormDefinition unchanged. API/Temporal/Teams/migrations: no change. Storage: existing browser-local form drafts. Security: strict JSON, bounded import, existing schema/rule validators; no code execution or new privileges. Tests: source model, host editing, real browser journeys.
- UX Research: owner feedback explicitly requests a hybrid authoring workflow for admins and AI-assisted JSON. References remain docs/57; no new interviews or comparative benchmark claims.
- UI/UX Design: one designer instance beside a lazy-loaded code panel, narrow screens stack. Live valid edits; invalid drafts retained, visual mutation/save blocked until repaired. Format action is optional, never Apply.
- Design Audit: initial stacked textarea/duplicate designer loses useful context and separate history. Fix with persistent single designer, CodeMirror cursor/history and inline diagnostics. P1: invalid code must participate in unsaved guard/save prevention.
- Interactive Prototype: same synthetic purchase/expense examples in app; keyboard completion, code/canvas sync, error repair and previews form the QA scenarios. Owner visual acceptance remains pending.
- Design to Code: CodeMirror 6 (MIT), jsonc-parser 3.3.1 (MIT), @lezer/highlight 1.2.3 (MIT), direct versions pinned. Upstream code remains third-party. New editor export is an optional package subpath, not yet claimed platform-ready.

## Slice 2 evidence
- One persistent visual designer; dedicated lazy code editor alongside it, syntax colors, folding, search, undo/redo, JSON property/enum completion, format action and localized error list.
- Syntax diagnostics point at the offending token; duplicate/unsupported keys and identity changes have exact ranges; semantic issues identify the field; generic shape errors identify the document.
- Host test: 5 passed, including valid edit → title change, invalid raw draft preserved across tabs. Typecheck and lint/i18n passed. Additional source-model tests recorded in subsequent verification log.

## Slice 3 evidence
- Optional controlled FormDesigner selectedFieldId/onSelectField API; code cursor resolves deepest nested field, canvas/outline selection reveals source position without stealing editor focus.
- Source reconciliation patches changed JSON paths and preserves unrelated formatting. Editor is retained across tab and language changes; external source patches map the cursor and preserve undo history.
- Typecheck PASS; 8 focused tests PASS (host/source model). Real browser code date selection → inspector and canvas category selection → code PASS; script output/playwright/code-studio-selection-qa.cjs and screenshot code-studio-selection-1440.png.
- Audit follow-up: code mode currently shows palette/canvas/inspector vertically inside the narrow half, causing excess scroll. Address panel presentation in slice 6; no visual acceptance claim yet.

## Slice 4 evidence
- Code workspace has Canvas / Test data views. FormTestPreview reuses FormPreview, prepareValues and validatePreview; input JSON, resolved defaults/calculations, validation feedback and reset are local only.
- Invalid test JSON stays visible and retains previous valid engine inputs. Existing runtime size/depth/prototype-key bounds apply. Test values survive valid schema edits; activating a different form resets them.
- Existing field inspector remains available for all configuration; no alternate engine or new schema. Synthetic calculation fixture verifies amount 3 → 6.00 and 7 → 14.00; malformed JSON retains 14.00. The engine intentionally serializes decimal results as strings.
- Typecheck and lint/i18n PASS. Focused preview/host tests verified before commit. Backend and real submit remain outside this frontend slice.

## Slice 5 evidence
- AI assistance disclosure, editable requested change, copy/download context and expandable schema reference. Copy errors have a download fallback. No network/AI provider call.
- Versioned authoring reference covers every FormDefinition/FormField configuration key and all 34 current types. Context preserves identity, dependencies, bilingual labels, scope/limit rules and safe formula constraints. It intentionally does not export host identities, provider rows, credentials or test values; defaults authored into schema remain authored configuration.
- Export boundary: browser-local schema authoring only, no tenant/request API or backend authorization change. Authorization-design skill read; production export authorization remains unimplemented as before.
- Unit test covers property/type contract coverage and synthetic context generation. Typecheck/lint and focused suite checked before commit. Remaining final slice covers browser download/clipboard paths, layout and reusable standalone harness.

## Slice 6 implementation and evidence
- Compact split workbench, optional editor-owned CSS, localized CodeMirror search/fold/diagnostics phrases, accessible keyboard exit, exact partial-token Tab acceptance, mobile toolbar wrapping.
- Independent forms example and standalone @flowdocker/forms 0.3.0 optional editor export with preserved dependency notices. No new engine/schema version or backend.
- Browser script PASS at 1440x900,1366x768,390x844; VI/light, EN/dark and reduced-motion interaction. Clipboard/download and independent example host PASS. See docs/84-FORM-CODE-STUDIO-ACCEPTANCE.md for actual evidence and limits.
- Pushed slices: foundation 0f6ab6c; editor 1f12b17; selection/source preservation 823d761; local test data 6f5d6b0; AI context f68e2aa. Final QA commit follows those slices on the existing PR #6 branch. All planned frontend slices are implemented; owner visual review remains pending.

### Final checks
- Full suite: 37 files / 148 tests PASS. Final host regression after adding visual-title→source synchronization: 5 host tests PASS. Typecheck, lint/i18n, formatting, application build and standalone forms build PASS.
- Final host update centralizes all visual updates (including VI/EN form title) through source reconciliation and blocks title edits while source is invalid. Existing formatting survives reopening Code Studio.
- Standalone package prepared at dist/flowdocker-forms-0.3.0.tgz; generated artifacts are local build outputs, not an npm publication. Dependency inventory contains 76 bundled upstream license entries. No merge/deployment/backend/AI service claim.
