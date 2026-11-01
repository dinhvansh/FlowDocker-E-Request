# Per-form spacing controls

## UX Research → UI/UX Design → Design Audit

Owner reports large spaces between fields and groups in the expense template, and requests self-service adjustment with dragging. Add a compact expandable Spacing panel in the designer toolbar: Compact / Standard / Custom, four labeled range controls with pixel readouts. Native ranges support pointer, touch and keyboard without introducing another primitive dependency. Use existing Field/FieldGroup/Select/Button, shared typography and neutral hover tokens.

Audit: section FieldSet gap + legend margin can add unwanted space; existing row/column gap is shared. New scoped form variables separate these concerns. Preview uses the same values as the live canvas. No change to inspector/app-wide density or repeating-table cell geometry.

## Impact map and implementation boundary

- Schema/API: optional bounded integer `spacing` metadata; existing forms without it retain current rendering. JSON authoring schema, autocomplete, import/export and validation stay aligned.
- UI: reusable spacing editor with presets, live sliders, keyboard support, one undo entry per drag, existing read-only lock.
- Storage: existing form-draft serialization; no new storage key or migration.
- Security/Temporal/Teams/backend: no change. No injected CSS/arbitrary styles; only validated numeric values.
- Reusable component impact: shared Forms metadata/editor/style helper used by FormDesigner, public FormCanvas and FormRenderer; no domain-specific imports.
- Tests: invalid/bounded metadata, visual/code round-trip, keyboard/pointer controls, rendering scopes and browser preview/save/reload/undo.

## Interactive Prototype → Design to Code

The running designer is the interactive harness; see verification notes appended after QA. Owner visual review is pending until they try the controls.

## Verification — 2026-11-01

- `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`: PASS.
- `npm test -- --maxWorkers=2 --testTimeout=15000`: **183 tests / 40 files PASS**, including 12 new spacing cases. The initial full run hit the existing lazy Code Studio test's 1-second query deadline; its cold-import query now waits up to 10 seconds. The same assertions pass in the isolated rerun and final full suite.
- `npm run build` and `npm run build:forms`: PASS; existing application chunk warnings remain. Private local Forms bundle rebuilt; no npm publication.
- Real Playwright browser: compact preset, multi-event pointer drag + single undo, keyboard adjustment, visual→code appearance, code→canvas change, local save/reload and runtime preview PASS.
- Measured preview: row gap 9px, column gap 28px, section padding 12px as authored. Existing repeating-table cell sizing is preserved.
- Screenshots: 1440×900 VI/light, 1366×768 EN/dark, 390×844 EN/dark. Mobile toolbar now wraps to accommodate Spacing. No horizontal document overflow in the final browser run.
- Script/log: `output/playwright/form-layout-spacing-qa.cjs`, `form-layout-spacing-browser-log.txt`, `form-layout-spacing-tests.txt`. Runs use synthetic templates and restore test-browser storage/preferences; these are frontend checks, not backend E2E.
- Public `@flowdocker/ui` Popover exports reuse existing Radix primitives: outside click/Escape, focus restoration, collision handling and theme-scoped portal. No added dependency.

Usage: open a form → Field designer → **Spacing / Khoảng cách**, beside the currency selector. Choose Compact or drag a range, then save the draft. Settings are optional bounded form metadata; no migration or engine rewrite.
