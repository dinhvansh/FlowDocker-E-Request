# Remove the redundant currency badge

## UX Research → UI/UX Design → Design Audit

Owner screenshot shows VND below amount inputs, including a calculated repeating-table column. Removing the ISO inspector input in docs/89 left the runtime badge. Remove this extra badge from the shared field renderer so the designer canvas, repeat cells and preview share the same clean amount control. The column/field title and separately authored currency-choice field provide context.

## Impact map / Interactive Prototype → Design to Code

Reusable RuntimeFieldSlot UI removal only. Keep numeric entry formatting, decimal calculations, validation, schema and stored currency metadata compatible. Other Badge usages remain. No API, storage, migration, security, Temporal, Teams, backend or new dependencies. Verify canvas and preview in the browser plus the existing decimal calculation regression and application gates. Owner acceptance remains pending.

## Verification — 2026-11-02

- Typecheck and lint/i18n: PASS.
- Existing regression: `npx vitest run packages/form-builder/src/product.test.tsx -t "calculates decimal row values" --maxWorkers=1 --testTimeout=60000`: 1 PASS, 19 not selected. Decimal row calculation and aggregation remain correct.
- Browser: numeric validation remains; ISO setting absent; currency badge absent in both canvas and preview. Synthetic legacy USD metadata is retained in the saved schema. Script/log and inspected 1366×768 screenshots: output/playwright/remove-currency-badge-*.
- QA script ESLint and diff whitespace checks: PASS. This is a frontend check, not a backend or full-suite claim.
- Application build: PASS; existing chunk-size advisory remains.
