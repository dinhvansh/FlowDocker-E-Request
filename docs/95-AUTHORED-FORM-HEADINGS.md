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

## Owner correction — legacy decoration (0.5.3)

Owner screenshot showed a centered editable title and divider still present. Root cause: the previous change only removed the undecorated fallback; a saved legacy header with `kind: title` still rendered. The previous compatibility choice did not satisfy the owner's request.

Research/design/audit revision: suppress all automatic name/title cells in the shared FormBandView, including saved decoration. Omit a band with no remaining visible text/image, removing its spacer/divider. Keep explicit text/image cells and all stored schema metadata. Authored content headings still work. Public legacy props remain accepted but no longer render an automatic name. Same scope/impact boundaries as above; no storage migration.

Interactive prototype: rerun the add-heading/configure/save/reload/preview journey using a synthetic saved legacy centered title with divider, rather than only an undecorated form. Add regression coverage for the legacy header with an edit-render callback. Owner visual acceptance pending.

### Corrective verification — 2026-11-03

- Typecheck, lint/i18n, format check PASS. Initial lint detected the CLI arrow-expression fixture missing its scoped ESLint annotation (including the prior slice fixture); annotated both and reran lint successfully.
- Targeted decoration regression: 6 tests / 1 file PASS (22.13s).
- Real browser journey with saved legacy title/divider: PASS; no automatic title or empty header; authored heading config, undo/redo, save/reload and preview PASS. VI/light 1440×900; EN/dark 1366×768 and 390×844 screenshots inspected; no horizontal overflow or page errors. Synthetic browser state restored.
- App build PASS (58.99s; bundle-size advisory). Forms build PASS (31.53s); 76 license entries. Package 0.5.3 packed locally successfully.
- Diff check PASS after normalizing log EOF. Branch pushed separately from any pull request/merge. Owner visual acceptance remains pending.
