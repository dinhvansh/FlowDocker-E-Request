# Direct logo and text authoring

## Research → Design → Audit

Owner screenshot 2026-11-03 shows logo/title editing is difficult; owner explicitly chose selecting content on the form, dragging position/size and aligning directly. Preserve original image/content/columns blocks, schema/code synchronization and existing stored designs. Use direct manipulation inside each layout cell: horizontal position as a responsive percentage and bounded space above, keeping normal document flow. Existing field drag/drop changes field order/groups. No overlapping free-position page engine or HTML/JS editor.

Compact contextual controls below the selected object: move, left/center/right, edit text/change image, size and reset position; direct object dragging, corner sizing, keyboard alternatives, snap anchors, one undo per gesture and cancellation. Reuse ContentBlock, InlineLabelEditor, ContentBlockEditor and shared FlowDocker controls. Designer always exposes this interaction for selected content/image; Preview has an explicit edit-content toggle and its own bounded undo. Runtime without authoring callbacks shows only content. Preview selection does not change submitted values.

## Impact map / reusable component impact

Reusable Forms presentation metadata + DirectContentEditor typed authoring callbacks; E-Request owns preview toggle/history. Additive bounded position/spacing/font-size metadata, validation, Code Studio completion/reconciliation, portable package version 0.5.9. No API, backend, workflow/Temporal/Teams, master data, identity, authorization, publication, request-data or credential change. Synthetic browser tests only. Existing image preparation and upload safety stay in ContentBlockEditor. No new dependency or external service. Owner visual acceptance remains pending.

## Interactive prototype / audit corrections

Independent `/direct-content.html` example consumes both designer and preview callbacks, using an embedded DEMO image generated locally. No company assets, uploaded employee data or real records. Fixed the example runner to explicitly load the shared Vite/Tailwind configuration and use the standalone form root rather than the application-shell navigation grid.

Audit corrections: controls flow below selected content rather than overlap preceding rows; resize corner no longer covers trailing title text; image resize starts from the actual rendered width when constrained by a narrow cell. Unselected objects can be selected and moved in one gesture. Keyboard and numeric alternatives, localized labels and 44px mobile targets are retained. Stored legacy decoration bands are preserved; direct editing applies to toolbox content/image fields, not legacy band cells. The current user's open form contained no content/image header or legacy band in its DOM; no user draft was rewritten for testing.

## Actual local verification — 2026-11-03

Implementation based on `c52022d`, branch `feat/forms-direct-content-editing`; see the commit containing this document for final source SHA.

- `npm run typecheck`, `npm run lint` (including `i18n:check`), `npm run format:check`: PASS.
- `npx vitest run packages/form-builder/src/direct-content.test.tsx packages/form-builder/src/content-blocks.test.tsx packages/form-builder/src/decoration.test.tsx packages/form-builder/src/code-model.test.ts`: 21 tests / 4 files PASS. Includes bounded schema/code roundtrip and suggestions, exclusion from submitted values, locale editing, keyboard sizing/movement, disabled/access guards, one pointer checkpoint and Escape restoration.
- `npm run build` and `npm run build:forms`: PASS; Forms package prepared as 0.5.9 with 76 bundled license entries. Existing application chunk-size advisory remains.
- Actual browser interactions in the isolated example: select heading, center alignment, inline Vietnamese rename and Enter commit, keyboard font size 18→19, preview toggle, first-drag logo position 0→41% with 20px space above, one undo restores 0%, image corner drag 180→220px. Designer and preview render the same updated definition.
- Responsive browser checks: VI/light 1440×900, EN/dark 1366×768 and 390×844. Mobile document client/scroll width both 375px (390 minus scrollbar), toolbar has no internal overflow and button rectangles are 44px tall. Wide document client/scroll width both 1425px. Normal preview has no direct controls after disabling the edit toggle; designer retains its own authoring controls. Synthetic fixture initially lacked required field defaults; corrected with `createField`, then reloaded and continued with no new browser error logs.
- Screenshots: `output/playwright/direct-content-desktop-vi-light.jpg`, `direct-content-desktop-en-dark.jpg`, `direct-content-mobile-en-dark.jpg`, `direct-content-final-vi.jpg`. Final VI screenshot includes the corrected resize handle position. Temporary viewport override reset after checks.

This is frontend/browser-local authoring evidence, not production E2E, backend authorization or owner acceptance. Existing drag/drop, schema and Code Studio remain the form-design foundation. No merge or publication is implied by a pushed feature branch.
