# Discoverable logo demo and calendar typography

## Research → Design → Audit

Owner asks to open a real sample in the app and reports oversized month/year
captions in the calendar screenshot. The earlier independent example was not
discoverable in the Forms catalog. Calendar caption spans keep upstream text-sm
styling because the common control typography selector does not cover spans.

## Impact map / reusable component impact

App-specific `createDirectContentTemplate` supplies a synthetic DEMO raster logo,
heading, instructions and editable request/date fields. Register through the
existing built-in catalog merge: saved forms take precedence, with no storage
write, reset or replacement of authored drafts. This is a local example, not an
approved payment form. Existing visual/Code Studio behavior is unchanged.

Shared UI CSS applies the existing Inter 12/18px/400 tokens to calendar captions,
selects, options, weekday/day text and buttons within the date popover. Control
geometry and touch sizing remain unchanged. Authored document headings retain
their own sizes. No dependency, API, schema, backend, authorization, workflow,
connector or storage-format change.

## Interactive prototype and verification

Independent browser session opens the real app catalog, selects
“DEMO · Logo và tiêu đề”, opens Preview and its “Ngày đề nghị” calendar. Evidence:
`output/playwright/demo-calendar-vi-light.png` and
`output/playwright/demo-logo-heading-vi.png`.

Automated checks cover new-demo schema validity, catalog discovery and preservation
of saved edits, plus existing shared date-selection/locale/clock behavior. See
the final commit and recorded command output for results. This is frontend/local
verification; owner visual acceptance remains pending.

Actual results (2026-11-03):

- `npm run typecheck`, `npm run lint` (including i18n), and formatting checks pass.
- `npx vitest run apps/e-request-web/src/form-drafts.test.ts packages/ui/src/date-picker.test.tsx --maxWorkers=1 --testTimeout=20000`: 6 tests / 2 files pass. The initial 5-second default timed out in two existing calendar tests under local load; rerun with one worker and 20-second limit passed without assertion failures.
- `npm run build`: pass, existing chunk-size advisory. `npm run build:forms`: recorded separately in `output/playwright/demo-calendar-forms-build.log`.
- VI/light desktop: visible month/year captions compute Inter, 12px, 18px line-height, weight 400. Hidden native selects also compute Inter/12px/400; their native line-height is normal.
- EN/dark at 390×844: visible “November” and “2026” compute Inter/12px. Screenshot: `output/playwright/demo-calendar-mobile-en-dark.png`.
- Shared date picker still selects local dates, keeps clock time and changes locale; authored payment heading remains 18px. The actual app preview exposes direct logo/heading controls on the new sample. No user draft or browser storage was replaced during isolated browser QA.
