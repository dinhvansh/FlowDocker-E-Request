# Inline form header/footer editing

## UX Research → UI/UX Design → Design Audit

Code audit: header/footer content renders on the design canvas, but editing is available only from a shared toolbar button. Admins should be able to find the edit action beside the authored content. This is an inferred usability improvement, not an observed user study.

Design: compact, keyboard-accessible Edit header/Edit footer actions inside the design canvas; the footer action remains available when the footer is disabled. Each opens the existing editor on its corresponding tab. Reuse the existing editor, tokens, validation and undo/redo; no new visual primitives. Runtime/preview documents contain no authoring controls. Existing 4000-character text limits are retained.

## Impact map and reusable component impact

- Domain UI: additive optional FormCanvas.onDecorationChange callback and FormDecorationEditor.entry prop. Both remain independent of E-Request. Existing FormDesigner wires changes through its commit/undo path; standalone Forms consumers inherit this behavior.
- Schema/API/storage/migrations: no format changes. All edits target the existing optional decoration metadata.
- Backend/security/Temporal/Teams: no change, no new service or signing/PDF claim.
- Audit: verify correct initial tab, disabled/read-only behavior, undo/redo, hidden footer discovery, VI/EN, light/dark and responsive layout. No hover-only controls, no new border or animation.
- Browser audit additionally found the toolbar's generic 32px button width squeezing text-labelled actions into overlapping text. Give text buttons their natural width, retain a 32px minimum for desktop icon actions and allow wrapping; mobile actions have 44px minimum targets. This is a shared Forms toolbar styling correction.

## Interactive Prototype → Design to Code

Use the existing application and standalone Forms example as harnesses. Actual verification is recorded after implementation; owner visual acceptance remains pending.

## Verification — 2026-11-02

- App restarted at `http://127.0.0.1:5174/`; HTTP 200 verified.
- `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`: PASS.
- `npx vitest run packages/form-builder/src/decoration.test.tsx packages/form-builder/src/canvas.test.tsx --maxWorkers=1 --testTimeout=60000`: PASS, 13 tests / 2 files. This is a targeted regression run; the full suite was not rerun for this slice.
- `forms-inline-decoration-qa.cjs`: PASS. Canvas header/footer entries, hidden-footer discovery, correct initial tabs, undo/redo, existing text length limit and absence of editing controls in runtime preview verified. No page errors or horizontal overflow at 1440×900 VI/light, 1366×768 EN/dark and 390×844 EN/dark. Screenshots reviewed at desktop and mobile.
- The first browser script expected a catalog entry after reload; actual tab recovery reopened the editor. The script now handles either observed state. No product change to recovery behavior.
- Browser evidence: `output/playwright/forms-inline-decoration-browser-log.txt` and matching screenshots. Synthetic fixture in an isolated browser session; no user in-app-browser data modified.
- Additive public API version: Forms 0.4.1; no dependency or schema-format change. Owner visual acceptance remains pending.
- Final `npm run build`: PASS (44.35s); existing Vite large-chunk warnings remain.
- Final `npm run build:forms`: PASS (33.59s), prepared private Forms 0.4.1 with 76 bundled license entries.
- `npm pack ./dist/forms-library --pack-destination ./dist --json`: PASS; local `dist/flowdocker-forms-0.4.1.tgz`. Inventory/checksum in `forms-inline-decoration-package-log.json`; not published to a registry.
