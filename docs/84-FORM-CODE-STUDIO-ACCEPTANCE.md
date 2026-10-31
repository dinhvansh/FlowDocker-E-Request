# Hybrid Form Code Studio — implementation and browser evidence

Date: 2026-10-31. Branch: feat/forms-field-ux-layout. Existing open PR: https://github.com/dinhvansh/FlowDocker-E-Request/pull/6. No merge performed.

## Scope and workflow
The same FormDefinition is edited by the existing visual designer and optional Code Studio. All existing schema, settings, drag/drop, inspector and safe calculation/validation logic remain. Valid code synchronizes immediately, without Apply. Invalid source retains the last valid canvas, participates in the unsaved guard, and blocks visual mutations and saving until repaired. Invalid source is an in-session draft, not a persisted recovery file.

User journey: Forms → open/create form → Code Studio. Code on the left, Canvas/Test data on the right. The designer uses Field library/Canvas/Field properties panes when embedded in the split layout. Narrow screens stack the two areas. Normal visual design remains unchanged. Click a field to reveal its source; cursor inside a field selects that field, including nested children. Visual changes patch JSON paths instead of replacing unrelated whitespace. Editor keeps cursor/history across app tabs and locale changes. Schema/field IDs remain data, not executable code.

Ctrl+Space opens property/enum suggestions, Tab accepts the selected suggestion and replaces the full partial token, including when editing inside an existing string. Escape dismisses suggestions; Tab can leave the editor. Search, folding and diagnostics labels are localized. Format code is optional. A separate read-only JSON tab remains for existing export workflows.

Test data reuses FormPreview/prepareValues. JSON input and resolved defaults/calculations are visible in an expandable section; invalid JSON keeps the previous valid inputs. Validation is performed by the existing FormPreview, with its actual dynamically loaded choices, avoiding a second checker with stale/missing option sets. No submissions are sent to a backend. Authored form schemas and the test data are separate.

AI assistance exports requested changes + current form + complete authoring reference + allowed provider IDs. The copy/download actions are local; there is no AI service call. Host identity, provider records, credentials and test values are not included. Authored defaults/labels in the form configuration are included. The reference schema is guidance; existing runtime import and semantic guards remain authoritative.

## Reusable component impact
- Domain adapter: FormCodeStudio (controlled source/selection/events), code-model helpers, AI authoring reference/context and FormTestPreview in @flowdocker/form-builder.
- Reused primitives: @flowdocker/ui Button, Tabs, Field/FieldGroup, Textarea and Notice. Existing FormDesigner adds optional compact/controlled selection props; defaults preserve existing consumers.
- App-specific host: E-Request FormsPage owns local drafts, providers, navigation and save guards.
- Second synthetic host: packages/form-builder/examples/main.tsx; browser loaded at localhost:5176 with code and visual editing, no E-Request imports.
- Additive version 0.3.0. No schema/storage migration. Standalone build exports @flowdocker/forms/code-studio and its helpers, plus the existing main forms API/styles. Package remains private/unpublished. CodeMirror/jsonc-parser remain third-party, not FlowDocker-owned.
- No API/Temporal/Teams/DB/security enforcement changes. Production publication, permission enforcement, sequence allocation, AI integration and commercial terms remain outside this frontend implementation.

## Executed checks
- npm run typecheck: PASS.
- npm run lint (including i18n:check): PASS.
- npm run format:check: PASS.
- npm test -- --maxWorkers=2 --testTimeout=15000: PASS, 37 files / 148 tests. Final host-only regression after centralizing title/source updates: 5 tests PASS.
- npm run build: PASS. Code Studio is lazy-loaded (~434 kB minified); existing large main/optional Ant preview chunk advisory remains.
- npm run build:forms: PASS, @flowdocker/forms 0.3.0, optional code entry, generated declarations and 76 bundled third-party license inventory entries. Packaging checks no private workspace declaration imports.
- npm audit --omit=dev: zero advisories. Full audit reports 11 moderate development-tool advisories through minimatch/ESLint/TypeScript-ESLint. No new editor runtime advisory. The suggested automatic fix includes incompatible tool downgrades; not applied in this UI slice. Full/runtime reports are retained under output/playwright/code-studio-*-audit.json.

## Browser evidence
Script: output/playwright/code-studio-qa.cjs, run with Playwright CLI against a fresh Vietnamese/light catalog at localhost:5174. Synthetic data only; original local storage restored. Real browser actions verified live edits, invalid-source save guard and tab retention, undo, partial-key Tab replacement, keyboard exit, source→inspector selection, visual→source edit, calculation/defaults/repeating-column sum, invalid test-input recovery and AI context download. No page errors.

Measured widths: 1440→scrollWidth1440, 1366→1366, 390→390. Routine hint typography: Inter 12px / 18px. Screenshots manually inspected:
- output/playwright/code-studio-1440-vi-light.png
- output/playwright/code-studio-1366-en-dark.png
- output/playwright/code-studio-390-en-dark.png
- output/playwright/code-studio-test-390-en-dark.png
- output/playwright/code-studio-library-host.png (independent synthetic host)

Observed local engine outputs: amount7 × default quantity2 → "14.00"; two repeating prices10+15 → "25.00"; department default resolves from demo current-user context. Both language/theme states were exercised, plus mobile/reduced motion. These are frontend synthetic checks, not production E2E or authenticated identity proof.

Additional browser check: real clipboard copy succeeded; original clipboard content restored. Independent example host loaded with synced code status and no page errors. Audit found a desktop-only panel layout and a nowrap toolbar overflowing mobile by29px; embedded panes/wrapping toolbar fixed this before final screenshots. Tab acceptance initially hit CodeMirror's interaction delay; immediate Tab acceptance is now explicitly configured and verified. Owner visual acceptance is still pending; no acceptance or merge is inferred from these checks.

## Delivery
Reusable local package: dist/flowdocker-forms-0.3.0.tgz (npm pack, not published). Package metadata/integrity and file inventory are retained in output/playwright/code-studio-package.json. Source and synthetic evidence are committed on the existing Forms branch; the final QA commit includes this log. Commit IDs are also available in git history. Owner review/merge remains separate.
