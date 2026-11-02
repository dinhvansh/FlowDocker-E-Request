# Form content blocks and explicit drop targets

## UX Research → UI/UX Design → Design Audit

Owner correction: replace the separate header/footer editing workflow with ordinary toolbox blocks. Support labels/text, images and layout anywhere in the form. Owner reports that dragging a layout above existing content cannot insert it there.

Code audit confirms container targets always append into their children. Design adds explicit before/after targets around every field, including containers, and start/end targets for the root. Inside-container targets retain their existing meaning. Keep click-to-add, move buttons and parent selectors as alternatives to dragging.

Toolbox: reuse `content` as Label / text, add `image` and `divider` presentation fields, grouped with existing layouts. Inspector edits text, alignment, size/bold and bounded raster uploads. Shared runtime renders the same content in designer and preview. Remove specialized header/footer entry points from FormDesigner; preserve existing optional decoration rendering and public editor exports for compatibility.

## Impact map / reusable component impact

- Domain components in the reusable Forms package: static block renderer/editor and insertion drop zones. Public optional presentation metadata on FormField; two additive field kinds. Original field kinds and engine remain.
- Schema/code: strict guards, JSON authoring schema and completion cover presentation metadata; existing schemas require no migration. Old clients must upgrade to read new field kinds.
- Data: presentation blocks do not collect input, participate in required validation or appear in submission output. Existing raster limits and local resize apply; no URLs/HTML/SVG/network upload.
- Storage: normal schema save/export/recovery and undo apply. Previously saved decoration metadata is retained; no automatic rewrite or data deletion.
- Backend/security/Temporal/Teams: no new service, authorization, PDF or signing claim.

## Interactive Prototype → Design to Code

Existing application and isolated Forms host provide the interactive harness. Verify actual drag to root start/middle/end and before/inside/after containers, content inside columns, read-only controls, code round-trip, save/reload, undo/redo, VI/EN, light/dark, desktop/mobile. Record actual checks below; owner acceptance pending.

## Verification — 2026-11-02

- Full regression: `npm test -- --maxWorkers=1 --testTimeout=60000` PASS, 43 files / 202 tests (522.74s), recorded in `forms-blocks-full-tests.txt`.
- After the final drop-target/overlay refinements: `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check` PASS. Targeted `npx vitest run packages/form-builder/src/content-blocks.test.tsx packages/form-builder/src/canvas.test.tsx --maxWorkers=1 --testTimeout=60000` PASS, 12 tests / 2 files; `forms-blocks-tests.txt`.
- Browser main journey: PASS. Real pointer drags: new columns to root start, image before a container, text into existing columns, divider to root end, existing field moved to root start, text into an empty layout. Undo/redo, raster upload/resize, image/text alignment, authored text size, draft save/reload, hidden layout title persistence and shared preview verified.
- Browser supplementary journey: PASS. Real divider drop after a container; image inspector on 390×844 mobile without overflow. See `forms-blocks-editor-log.txt`.
- Screenshots: 1440×900 VI/light, 1366×768 EN/dark, 390×844 EN/dark; additional desktop/mobile editor screenshots reviewed. No page errors or unintended horizontal overflow. Synthetic fixtures in an isolated browser session; user browser storage was not touched.
- Audit fixes during QA: prioritize explicit boundaries over overlapping container interiors; overlay in-container drag hints rather than expanding document rows. The initial automation used a textbox locator for a searchbox and did not account for scrolling during a drag; corrected to actual DOM roles and current target bounds. An empty layout correctly blocked saving until a child was added. Initial unit fixtures were corrected to use schemaVersion 2 and the existing validatePreview API; invalid calculations on nonnumeric fields remain rejected.
- `npm run build`: PASS (29.24s), existing Vite large-chunk warnings remain. `npm run build:forms`: PASS (19.09s), private Forms 0.5.0, 76 bundled license entries.
- `npm pack ./dist/forms-library --pack-destination ./dist --json`: PASS; local `dist/flowdocker-forms-0.5.0.tgz`, inventory/checksum in `forms-blocks-package-log.json`. No registry publication.
- Owner visual acceptance remains pending. No merge, backend or production authorization claim.
