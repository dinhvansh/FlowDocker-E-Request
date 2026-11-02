# Remove the per-field ISO input

## UX Research → UI/UX Design → Design Audit

Owner feedback: admins already define a currency choice and exchange rate in their form; the separate technical ISO input in field validation is confusing. Code audit: calculations operate on numeric values; the field currency metadata is used for a display badge, not exchange-rate conversion. Remove the ISO textbox from the property inspector using the existing layout and typography.

## Impact map

UI-only removal in the reusable FieldSettings inspector. Schema/import/export and old authored currency metadata stay compatible; numeric formatting, validation and calculations remain unchanged. This slice does not add automatic linkage between a currency-choice field and an amount field. No API, storage, migration, security, Temporal, Teams or backend change; no new component/dependency.

## Interactive Prototype → Design to Code

The existing inspector is the prototype and implementation. Verify existing formatting/runtime regressions and browser absence of the removed setting, then report actual typecheck/lint/build results. Owner acceptance remains pending.

## Verification — 2026-11-02

- `npm run typecheck`, `npm run lint` (including i18n), `npm run build`: PASS. Existing application chunk-size advisory remains.
- Existing decimal row calculation/aggregation regression: `npx vitest run packages/form-builder/src/product.test.tsx -t "calculates decimal row values" --maxWorkers=1 --testTimeout=60000`: 1 PASS, 19 not selected. No new removal-only unit test.
- Real browser: select currency field → Validation inspector; numeric validation remains, ISO input absent, old USD metadata preserved. Screenshot 1366×768 and reproducible script/log: output/playwright/remove-iso-property-*.
- `npx eslint output/playwright/remove-iso-property-qa.cjs` and diff whitespace check: PASS.
