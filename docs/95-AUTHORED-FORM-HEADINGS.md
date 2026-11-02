# Authored form headings instead of automatic titles

## UX Research → UI/UX Design → Design Audit

Owner wants to remove the automatic form name from the document and author headings using the existing field library. Audit: FormBandView injects a heading without any authored decoration, duplicating user content. Remove this fallback in the shared renderer for both designer and runtime/preview. Keep catalog naming separate. Existing Nhãn / Văn bản supports title/subtitle/body, alignment and bold; no extra control needed. Preserve explicitly authored legacy decoration cells.

## Impact map / Reusable component impact

Shared Forms presentation primitive only; reuse ContentBlock and ContentBlockEditor. No new public props, schema, storage or validation changes. No API, backend, authorization, Temporal, Teams or migration change. Package 0.5.2. Canvas and runtime consume the same FormBandView. Existing title-edit APIs remain compatible for explicit decoration consumers. No stored title/content deletion.

## Interactive Prototype → Design to Code

Current app is the prototype harness; synthetic fixture checks automatic title absent, authored title added and configured, undo/redo, save/reload, plain preview, VI/EN, light/dark and responsive viewports. Owner visual acceptance pending. Actual evidence below after execution.

## Actual verification — 2026-11-02

- `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`: PASS.
- `npx vitest run packages/form-builder/src/canvas.test.tsx packages/form-builder/src/decoration.test.tsx --maxWorkers=1 --testTimeout=60000`: 13 tests / 2 files PASS (133.08s).
- Browser: no automatic title; add Nhãn / Văn bản, edit VI/EN, choose large title and center alignment, undo/redo, save/reload and authored heading in preview PASS. No page errors. Isolated synthetic data restored after QA.
- Screenshots inspected at 1440×900 VI/light, 1366×768 EN/dark, 390×844 EN/dark. No document horizontal overflow at 1366/390. Owner visual approval pending.
- `npm run build`: PASS (57.90s), bundle-size advisory remains.
- `npm run build:forms`: PASS (35.20s), 76 license entries. `npm pack ./dist/forms-library --pack-destination ./dist --json`: PASS, `dist/flowdocker-forms-0.5.2.tgz`.
- `git diff --check`: PASS after normalizing test-log EOF.
