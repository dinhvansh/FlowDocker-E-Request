# Editable canvas form title

## UX Research → UI/UX Design → Design Audit

Owner cannot edit the displayed form title. Code audit: renaming exists behind Form options, while the canvas title is plain text. Make the canvas title a labelled, keyboard-accessible edit trigger. Reuse InlineLabelEditor (Enter/blur commits, Escape cancels) and existing designer undo/redo. Editing changes the active language only. Runtime/preview titles remain plain headings.

## Impact map / reusable component impact

Add optional InlineLabelEditor.label, FormBandView.renderTitle and FormCanvas.onTitleChange contracts; shared EditableFormTitle composes existing controls. No schema, storage or engine change; existing title validation still blocks saving an empty title. Preserve old decoration title cells through the same rendering hook. No backend/API/security/Temporal/Teams change. Version Forms 0.5.1; additive APIs, no migration.

## Interactive Prototype → Design to Code

Use current FormDesigner as harness. Verify direct edit, Escape, undo/redo, read-only/plain preview, VI/EN and responsive sizing. Record actual checks below; owner visual acceptance pending.

## Actual verification (2026-11-02)

- `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`: PASS.
- Targeted Vitest canvas/decoration suite: 13 tests in 2 files PASS (63.79s); log `output/playwright/form-title-tests.txt`.
- Browser: title click, Enter/blur commit, Escape cancel, undo/redo, empty title blocks draft save, active-locale-only update, Code Studio synchronization, save/reload and plain preview PASS. No page errors.
- Screenshots inspected: VI/light 1440×900; EN/dark 1366×768 and 390×844. No document horizontal overflow at 1366/390. Isolated fixture and browser storage restored after QA. Owner visual acceptance pending.
- `npm run build`: PASS (42.84s), with bundle-size advisory.
- `npm run build:forms`: PASS (17.64s); 76 bundled license entries.
- `npm pack ./dist/forms-library --pack-destination ./dist --json`: PASS; `dist/flowdocker-forms-0.5.1.tgz`.
- `git diff --check`: PASS.
