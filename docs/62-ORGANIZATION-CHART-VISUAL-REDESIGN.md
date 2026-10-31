# Organization chart visual redesign

## Scope and UX process

Base `922767d`, branch `feat/forms-field-ux-layout`. Owner provided a reference of pill-shaped person cards, round portraits and top-down reporting connectors. Use the layout concept only; no reference photographs or source assets copied.

1. **UX Research:** direct owner feedback identifies the previous indented list as insufficiently visual. Tasks: understand reporting levels, find a department, inspect a person and fold a branch. No interviews claimed.
2. **UI/UX Design:** top-down forest, round initial avatars for synthetic employees, navy/teal/slate hierarchy, orthogonal links, collapse button and visible pan/zoom controls. Preserve a List view and existing department filter. Click a person for email/manager/head details.
3. **Design Audit:** graph must not overflow the page; mobile may pan inside the viewport, with a readable List alternative. No drag-to-reassign behavior. Initials avoid pretending sample people have real photos. Separate manager/head in detail. Use keyboard-accessible person/collapse buttons, translated controls, light/dark tokens and immediate transitions that respect reduced motion.
4. **Interactive Prototype:** test real browser card selection, collapse/expand, filtering, list, fit/zoom and mobile with synthetic local data. Evidence below after execution.
5. **Design to Code:** original `OrganizationCanvas` and pure forest layout in `@flowdocker/flow-canvas`, composed over existing MIT React Flow. Application adapts canonical local employee/department records. No new dependency or image license; preserve React Flow attribution. Owner visual acceptance remains pending.

## Impact and reusable component impact

- UI only: reusable `OrganizationPerson`, `OrganizationCanvasProps`, `organizationLayout`, read-only tree canvas; optional controlled selection and callbacks. Existing shared FlowCanvas contract unchanged.
- Storage/schema/API/security/Temporal/Teams/migrations: no changes. Graph is a view, not an authorization or workflow assignment engine. Cycle/missing-parent handling only prevents rendering failure and does not resolve organizational governance errors.
- Master and Forms continue reading the same local records. Department filtering may expose a person as a visual root without changing their actual manager.
- Dynamic import keeps chart code out of initial Master Data catalog loading. No npm publication or platform-ready claim; independent second consumer is pending.
- Tests: layout generations, spacing, collapse, missing parents, cycles; real browser interaction and screenshots.

## Executed QA — 2026-10-29

Verified source in the commit containing this report (base `922767d`). Frontend implementation tested; visual acceptance by owner pending. No backend/identity integration claim.

- `npm run typecheck`: PASS.
- `npm run lint`: PASS including bilingual checks.
- `npm run format:check`: PASS.
- `npm test -- --maxWorkers=1`: PASS, 77 tests / 19 files.
- `npm run build`: PASS; existing main chunk warning above 500 kB remains. Organization canvas loads in a separate async chunk.
- `npm run build:forms`: PASS.
- `git diff --check`: PASS.
- Browser: `npx --yes --package @playwright/cli playwright-cli run-code --filename output/playwright/orgchart-v2-qa.cjs`: PASS. Tested 7 visible people, branch collapse to 5 and restoration to 7, person details separating manager/head, keyboard Enter selection, actual background drag, zoom/fit controls, department filter (3 IT people), List alternative, VI/EN, Light/Dark and 1440×900 / 1366×768 / 390×844. No page errors in the completed run. A React Flow hot-reload nodeTypes warning was observed during development; nodeTypes is defined at module scope.
- Before: `output/playwright/organization-1366-vi-light.png` from prior sample slice. After: `orgchart-v2-1440-vi-light.png`, `orgchart-v2-1366-vi-light.png`, `orgchart-v2-1366-en-dark.png`, `orgchart-v2-390-en-dark.png` under the same folder.

Browser QA exposed pointer-event interception on non-selectable React Flow wrappers and a blank viewport after resizing. Original card controls now explicitly receive pointer events; ResizeObserver refits after size changes. Dark avatars use a stable white background for readable initials. The existing People/Organization QA script switches to List before its legacy list assertions.
