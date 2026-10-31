# Form toolbox: direct drag into a template

Base `0400061`, same Forms branch. Owner clarified this request concerns Form Studio, not the organization-card template.

## UX Research → Design → Audit → Prototype → Code

1. Research: owner cannot discover/use dragging from the field library. Existing implementation activates only from an 18px grip; the prominent field-name button only adds on click.
2. Design: make both the grip and whole field tile draggable; retain click/keyboard insertion. Show a drag preview and before/after/inside/end placement hints.
3. Audit: closest-center targeting can still select a field when releasing outside the canvas. Pointer drops must intersect a real target. Nested containers must take precedence over the outer page. Keep undo/redo and read-only behavior.
4. Prototype: real browser pointer drags from the tile into an empty form, around existing fields and into nested columns/repeat; cancel/outside drop must leave schema unchanged. Screenshot and actual interaction evidence below.
5. Code: reuse existing dnd-kit sensors, shared Button, FormCanvas and original engine. No new dependency or schema/storage/API/security/Temporal/Teams contract change. Design canvas remains reusable; no app endpoints or master IDs added.

## Reusable component impact

FormDesigner toolbox tile supports direct dragging. FormCanvas gains an optional visual `dropAfter` hint; field rendering and validation remain shared with runtime. Pointer collision uses the smallest intersected target, keyboard keeps closest-center navigation. Existing outline reorder behavior is preserved. Owner visual acceptance remains pending.

Mouse activation stays at 8px. Touch uses a delayed TouchSensor (180ms / 8px tolerance) with vertical page scrolling allowed on field tiles. Enter retains native button insertion; Space activates keyboard dragging, matching existing screen-reader instructions. No real touch-drag test is claimed.

## Executed browser evidence — 2026-10-29

`npx --yes --package @playwright/cli playwright-cli run-code --filename output/playwright/forms-direct-tile-drag-qa.cjs`: PASS. Actual pointer drags from the field-name button into an empty form, before/after a scalar, into columns and into repeating-table schema; outside release and Escape cancel; no duplicate insertion; undo/redo verified. Nested repeat JSON was checked via the application's schema view. Synthetic QA draft was not saved.

`forms-direct-tile-responsive-qa.cjs`: PASS. English/Dark direct drag at 1366×768, keyboard Enter insertion, click insertion at 390×844, no mobile document overflow. VI/Light pointer tests at 1440×900; repeating layout also captured at 1366×768. Browser QA exposed Enter being consumed by the keyboard sensor; it now starts dragging only on Space.

Screenshots under `output/playwright/`: `forms-direct-drag-during-1440.png`, `forms-direct-drag-columns-1440.png`, `forms-direct-drag-repeat-1366.png`, `forms-direct-drag-1366-en-dark.png`, `forms-direct-drag-390-en-dark.png`.

## Final verification

Verified on base `0400061` plus the changes in the commit containing this report:

- `npm run typecheck`: PASS.
- `npm run lint` (including i18n check): PASS.
- `npm run format:check`: PASS.
- `npm test -- --maxWorkers=1`: PASS, 77 tests / 19 files.
- `npm run build`: PASS; existing main-chunk size warning (>500 kB) remains.
- `npm run build:forms`: PASS, reusable package prepared with 57 bundled license entries.
- `git diff --check`: PASS.

These are local frontend and browser results, not backend or CI evidence. Real touch dragging and owner visual acceptance remain pending.
