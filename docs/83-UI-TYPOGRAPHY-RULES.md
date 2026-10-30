# Shared UI typography rules

Base 40813d3; clean working tree before work.

## UX Research → UI/UX Design
Owner reports oversized text in the recently added UI and requests explicit font/size rules. Existing owner-approved choice is Inter 12px, regular 400, line-height 18px. Audit found portal dialogs inherit the browser body size (16px) for prose, and shared FieldError/AlertDescription/empty-state defaults use text-sm (14px), bypassing the incomplete control-only override.

## Design Audit
Use one shared Inter stack in app and portal-owned FlowDocker surfaces. Body, input, button, label, hint, validation, notice, table and empty-description text use 12/18px, weight 400. Compact section headings 13/20px, modal headings 14/20px, page-toolbar headings 18/24px, all weight 600. No blanket resizing of authored form document headings, rich content or graph labels. Technical code/schema retains intentional monospace. Do not enlarge text to compensate for layout spacing.

## Interactive Prototype → Design to Code
Update existing typography tokens and shared FlowDocker surface selectors; preserve public props, locale, spacing and sizing. Browser verify computed family/size/weight/line-height inside and outside portalled dialogs, including errors, hints, notice and empty state; VI/EN light/dark 1440/1366/mobile. Screenshot review and normal gates. No new font dependency, schema/API/storage/backend/security/migration changes. Owner visual approval pending.

## Mandatory rules
| Role | Font | Size / line-height | Weight |
|---|---|---|---|
| Body, controls, labels, help, error, notice, tables | Inter | 12 / 18px | 400 |
| Section / empty title | Inter | 13 / 20px | 600 |
| Dialog title | Inter | 14 / 20px | 600 |
| Page toolbar title | Inter | 18 / 24px | 600 |

Use shared --fd-font-* tokens, including in portals. No local text-sm/base/lg or hardcoded font-size on routine text. Inherit shared typography in new components. Do not use bold for every label/value; semibold is reserved for hierarchy. Mobile keeps the same UI text size; larger touch targets come from control sizing, not automatic text enlargement. Long VI/EN text wraps and errors remain fully readable. Intentional authored document content, charts/graphs and technical monospace are separate contexts and require explicit local rules.

## Actual verification — 2026-10-30
- `npm run typecheck`: PASS. `npm test -- --maxWorkers=2 --testTimeout=15000`: 139 tests / 34 files PASS.
- Browser `output/playwright/form-typography-qa.cjs`: PASS. Computed Inter / 12px / 18px / 400 for labels, controls, hints, errors, notices and portalled confirmation prose. Section and empty titles 13/20/600; dialog titles 14/20/600; page toolbar titles 18/24/600. VI/EN, light/dark, 1440x900,1366x768,390x844. Existing spacing assertions still PASS. Measured results stored in form-typography-results.json.
- Audit also found a host-specific Forms catalog title override at 24px; replaced with shared heading tokens. Browser measurements cover this previously bypassed override, including mounted inactive pages.
- Screenshots typography-1440-vi-light.png, typography-1366-en-dark.png, typography-390-en-dark.png, typography-forms-1440-en-dark.png visually inspected; no mobile document overflow. Synthetic fixtures only; original storage restored. No every-screen visual-audit claim.
- `npm run build`, `npm run build:forms`: PASS. Existing application >500kB chunk advisory remains. No schema/behavior changes.
- Final `npm run lint` (including i18n) and `npm run format:check`: PASS.
