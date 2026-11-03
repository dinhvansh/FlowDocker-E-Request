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
