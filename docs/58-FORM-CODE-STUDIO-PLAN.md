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
