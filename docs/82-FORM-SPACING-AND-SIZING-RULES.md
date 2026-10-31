# Shared form spacing and control sizing

Base 82370ee, clean tree before work. Shared platform UI change; no domain schema/API/storage/Temporal/Teams/auth/migration change.

## UX Research → UI/UX Design
Owner repeatedly reports excessive space between controls. Code audit: FieldGroup gap 28px plus legacy Field margin-bottom 15px produced 43px between fields, before label/control height. Other parents already have their own grid gap. Task is compact, predictable app-wide editing using existing components and typography.

## Design Audit
Remove per-field outer margins; parent group owns spacing once. Standard fields 16px apart, compact inspector 12px, related groups/sections 24px. Label/control/helper/error gap 6px. Standard single-line control height 36px desktop, compact inspector 32px; mobile 44px. Textareas minimum 80px and grow; checkbox/radio keep their native size, do not stretch. Repeating-table cells, document-like underline controls and canvas layout keep intentional specialized sizing. No fixed field row height; wrapped labels/errors grow without clipping.

## Interactive Prototype → Design to Code
Use current app and isolated UI example as harnesses. Reuse Field/FieldGroup/Input/Select/DatePicker/PeoplePicker. Introduce CSS spacing/size tokens, update shared defaults, migrate legacy ungrouped master controls to FieldGroup, remove local record-spacing patch. Browser measure actual gaps/heights plus screenshots 1440/1366/mobile VI/EN light/dark; typecheck/lint/format/tests/build. Owner visual review remains pending.

## Required design rule (all future UI)
| Relationship | Token | Size |
|---|---|---|
| Label → input → help/error | --fd-field-content-gap | 6px |
| Field → field, default | --fd-field-gap | 16px |
| Field → field, inspector | --fd-field-gap (scoped) | 12px |
| Related sections | --fd-section-gap | 24px |
| Single-line control, default | --fd-control-height | 36px |
| Single-line control, inspector | --fd-control-height (scoped) | 32px |
| Single-line control, mobile | --fd-control-height | 44px |
| Textarea minimum | --fd-textarea-min-height | 80px |

- Compose forms with FieldGroup + Field. Group owns gap, Field has zero outer margin. Do not add margin-bottom to Field or combine child margins with parent gap.
- No justify-between/space-between/min-height on vertical form stacks to distribute fields across empty height. Height comes from content; never pad fields to fill a panel.
- Use shared tokens, no new 9/13/15/28/40px spacing overrides per screen. Compact context sets tokens once; nested groups inherit density.
- Preserve existing owner-approved font and colors. Align adjacent Input/Select/date/person controls to the same height.
- Fields with long labels, errors and helper text must wrap and grow. Errors appear directly beneath their own control. Checkbox/radio use a horizontal label row.
- Mobile uses larger touch controls. Repeat-grid/document controls are deliberate exceptions; document their local sizing rather than overriding the entire app.
- Verify computed spacing in browser, including one field with help/error, VI/EN and mobile. Screenshots alone cannot prove exact spacing.

## Actual verification — 2026-10-30
- `npm run typecheck`: PASS. `npm test -- --maxWorkers=2 --testTimeout=15000`: 139 tests / 34 files PASS.
- Playwright CLI `output/playwright/form-spacing-qa.cjs`: PASS. Exact measured results retained in `form-spacing-results.json`: standard control 36px / field gap 16px; master and Forms inspectors control 32px / gap 12px; mobile control 44px / gap 16px. Labels, helper and error gaps measured at 6px, field margin 0px. Valid and invalid states tested. QA waits for dialog entry animation to finish before reading geometry.
- Screenshots visually reviewed: spacing-1440-vi-light.png, spacing-1366-en-dark.png, spacing-390-en-dark.png, spacing-forms-1440-en-dark.png. No mobile document horizontal overflow. Synthetic fixtures; original browser storage restored. Console: development informational logs only.
- Shared defaults apply to other consumers; this is not a claim that every screen/field variant was visually audited. Existing specialized table/document layout rules remain. No interaction/auth/storage changes. Owner visual acceptance remains pending.
- Final `npm run lint` (including i18n), `npm run format:check`, `npm run build`, `npm run build:forms`: PASS. Existing >500kB application chunk advisory remains.
