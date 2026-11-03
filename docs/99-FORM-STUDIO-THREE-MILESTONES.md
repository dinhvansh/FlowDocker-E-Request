# Three Form Studio milestones

Owner 2026-11-03 requests all three directions, without stopping between slices. Keep original engine, visual designer and two-way Code Studio.

1. **Logic Studio**: shared rule inventory/editor, scope-aware dependency navigation, safe local scenarios/results using the actual engine. Preserve original rule controls; no arbitrary JS or AI provider. Commit/push after tests/browser/build.
2. **Advanced layout**: column-ratio presets and direct resize, responsive stacked mobile layout, reusable layout controls plus schema/code authoring compatibility. Preserve field types and nested drag/drop. Commit/push after checks.
3. **Templates and versions**: separate template creation flow and bounded browser-local immutable design snapshots, compare and restore into draft with unsaved protection. Existing saved form schema remains authoritative. No server publication, production history, multi-user concurrency or request-data migration claim. Commit/push after checks.

## UX Research → UI/UX Design → Design Audit

Owner wants a larger coherent improvement, rather than isolated indicators. Current logic tab is a designer with one field inspector; relationships and full-form scenarios are not visible. Current columns only support equal widths. Catalog examples are editable forms, lacking explicit use-as-template and design history. Use compact Inter/token styling, existing shadcn/Radix controls, VI/EN, light/dark and mobile. No fabricated research/interviews. Preserve engine/runtime/schema controls and existing data; additive optional schema changes only where needed for ratios. Owner visual acceptance remains pending after implemented prototype checks.

## Impact map / reusable component impact

Domain-independent Forms components/model helpers in form-builder; app owns local catalog/history persistence and navigation. No application endpoints, Temporal, Teams, backend authorization or production storage added. Shared platform/UI components reused. Browser-local config only, synthetic tests. No new dependency, external network or npm publication. Each slice has its own evidence below.

## Slice 1 — Logic Studio implementation

Reusable `FormLogicStudio` has typed preview/definition/selection callbacks, inventory/search/filter, reused AdvancedProperties rule editor, bidirectional dependency navigation and existing FormTestPreview scenarios. Safe tokenizer supplies expression references; row/object local scopes shadow root identifiers, transparent layouts retain scope. Missing references are visible. It does not add a new validator or arbitrary code. First host E-Request and standalone examples harness wired; independent host acceptance pending. Code-invalid/read-only guards prevent definition mutation. Existing visual/code editor preserved.

Evidence: `npm run typecheck`, `npm run lint`, `npm run format:check`; focused Vitest model + test-preview 6 tests / 2 files and Logic Studio UI 1 test / 1 file PASS. App build and forms-library build PASS, version 0.5.7 / 76 bundled notices. Browser CLI actual VI/light 1440x900, EN/dark 1366x768 and 390x844: dependency navigation, engine scenario 2*15=30.00, no horizontal overflow/page errors; synthetic screenshots and assertion script under output/playwright/logic-studio-*. A notice margin overflow found during QA was fixed before final run. Owner visual acceptance remains pending; no backend/security/publishing claim.

## Slice 2 — Advanced columns

Optional columnRatios weights (integers 1..100, matching count, columns layouts only) are validated and preserved in JSON/schema completion/source reconciliation. Existing drafts remain equal width. Shared ColumnLayoutEditor provides compact presets, canvas divider dragging, arrow/Shift-arrow/Home/End keys and live proportions. One pointer gesture creates one undo checkpoint; canceled gestures restore original weights. Inspector presets use the same component. Runtime and canvas share columnStyle; nested equal columns reset inherited templates; mobile stacks. Additive FormCanvas.onPatch optional history argument; package 0.5.8. No backend/migration required.

Evidence: 12 tests / 3 files PASS (column ratios, schema, code-model), typecheck/lint/i18n/format PASS; app build and forms library build PASS (76 notices). Actual browser VI/light 1440, EN/dark 1366 and 390: 1:2 rendered in canvas/preview, keyboard and multi-move pointer resizing, single-step undo to original proportions, no overflow/page errors and mobile stacking. Screenshots/script/logs output/playwright/column-ratios-*. Owner visual acceptance remains pending.

## Slice 3 — Template library and design snapshots

Catalog now has a dedicated Template library view over the seven synthetic examples. Preview/name/create assigns independent form and recursive field IDs while retaining field-key bindings. It uses the existing unsaved-draft guard and does not silently save. Form options (…) → Design history captures named configuration snapshots explicitly. Bounded validated storage preserves corrupt/existing data on failure without pruning. Compare shows form settings, added/removed/changed fields and positions with expandable before/after JSON; labels remain clear on mobile. Snapshot preview reuses FormPreview. Restore requires confirmation, re-reads the snapshot, clears stale recovery, updates visual/code state and leaves saved drafts untouched until Save draft. Delete requires confirmation. See docs/100 for limits and contracts. App-owned adapter/UI only; reusable Forms package stays 0.5.8.

Evidence: final `npx vitest run apps/e-request-web/src/forms.test.tsx apps/e-request-web/src/form-versions.test.ts apps/e-request-web/src/form-history.test.tsx apps/e-request-web/src/form-drafts.test.ts --testTimeout=120000` PASS **17 tests / 4 files**, 146.65s. The host diagnostics test was corrected to locate the panel through the toolbar's aria-controls, since both the form and selected-field inspector legitimately expose diagnostics. Typecheck/lint/i18n/format PASS; final app build PASS **36.76s**. Actual browser VI/light 1440x900, EN/dark 1366x768 and 390x844: capture/reload/compare expanded metadata, keyboard-focusable diff, 12px control text, cancel/confirm restore, saved draft untouched, confirm deletion, template copy with fresh IDs, unsaved-copy cancellation preserves the active design; no horizontal overflow/page errors. Synthetic screenshots/assertions output/playwright/form-history-* and template-library-*. Existing browser storage keys/recovery restored by the isolated QA script.

All three frontend slices are implemented and verified. Pushed slices 1/2: 9bcb924 on feat/forms-logic-studio, 79df45b on feat/forms-column-ratios. Slice 3 is on feat/forms-templates-history and includes both predecessors. Pushed branches are not opened PRs and have not been merged. Owner visual acceptance, backend/security enforcement/publication/concurrent shared history remain NOT DONE.
