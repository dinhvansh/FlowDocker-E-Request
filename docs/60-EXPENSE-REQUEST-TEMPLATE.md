# Expense request VND template

## Scope and UX evidence

1. **UX Research:** owner supplied a two-page landscape expense-request PDF and asked for a working form to try. The source contains document metadata, beneficiary details, an invoice-line table, advance settlement and approval history. No source records, account numbers, names, emails or PDF assets are copied into this repository.
2. **UI/UX Design:** landscape form with two-column general/beneficiary sections; eight invoice fields plus automatic row numbers; advance reference/amount and calculated totals. Long payment instructions are separate inputs. This first template supports VND only at fixed rate 1, matching the source scenario without implying dynamic currency/bank integration.
3. **Design Audit:** keep document reference explicitly synthetic, account identifiers as text, calculated fields non-editable, negative settlement allowed and approval history system-owned. Advance reference is conditionally required when an advance exceeds zero. No approval outcome is simulated. A nine-column table exposed hidden labels escaping their scroll container; positioning the shared scroll wrapper contains them without hiding accessible labels.
4. **Interactive Prototype:** the original engine powers the actual Form Studio preview; owner can edit the template, add/remove rows, choose dates/expense categories and validate entries. Saved only through the existing local-draft mechanism.
5. **Design to Code:** domain-specific `createExpenseRequestTemplate()` under the E-Request app, shared FormDesigner/FormPreview/RepeatField/CurrencyInput/DatePicker reused. Catalog entry opens the template. Importable definition: `output/templates/expense-request-vnd.json`.

## Reusable component impact and contracts

No new UI primitive, engine or dependencies. Shared repeating-table wrapper gains a positioning context to contain absolutely positioned hidden labels inside horizontal scrolling. No public props, schema version, API, database, Temporal, Teams, authorization or storage contract change; existing drafts are preserved. Template is an application-specific example, not a generic Finance service or access-control implementation. No automatic identity lookup, document numbering, real master-data connection, submission, banking, approval or print/PDF service is implemented.

Main keys:

- `lines`: repeat, min 1/max 50; manually add/remove entries.
- Invoice fields: `invoice_date`, `invoice_ref`, `description`, `expense_type`, `currency_code`, `amount`, `amount_vnd`, `exchange_rate`.
- Row `amount_vnd`: multiply `amount,exchange_rate`, precision 2.
- `total_payment`: sum `lines.amount_vnd`, precision 2.
- `difference`: subtract `advance_amount,total_payment`, precision 2. Negative means more to pay; positive means an advance surplus.
- `advance_ref`: required when `advance_amount > 0`.

The input does not ask users to supply approval signatures/history. An explanatory notice identifies those positions as pending workflow integration. Approval positions in a PDF do not establish routing rules.

## How to try

1. Open Forms, then **Danh sách biểu mẫu**.
2. Select **Mở mẫu chi phí theo PDF**.
3. Select **Lưu bản nháp** to retain the design on this browser; its name is **Đề nghị thanh toán · mẫu chi phí VND**.
4. Open **Xem thử biểu mẫu**, enter synthetic requester/beneficiary/invoice data and use **Thêm dòng** for further expenses.
5. Inspect calculations and use **Kiểm tra dữ liệu thử**. Preview values are not saved or submitted.

To import elsewhere, use the designer's **Nhập schema JSON** action with the supplied JSON. This creates no backend records.

## Verification

- Typecheck, lint/i18n and formatting: PASS.
- Full suite: 16 files / 68 tests PASS. Template tests cover schema/import/export, row multiplication, decimal aggregate, negative settlement, required invoice details, conditional advance reference and negative-amount validation.
- App build and portable Forms build: PASS; existing app chunk-size advisory remains.
- Browser journey: two rows 2,500,000 + 500,000 produce total 3,000,000; advance 1,000,000 gives difference -2,000,000. Missing advance reference is rejected; completing the form clears invalid controls. Removing row 2 recalculates total to 2,500,000. VI/EN preserves values; EN formats total as `2,500,000.00`.
- VI Dark runtime at 1440x900, 1366x768 and 390x844; EN Light runtime and VI Light designer at 1440x900. At 1366 and 390, no horizontal page overflow after the scroll-wrapper correction. This is a focused set, not a full locale/theme/device matrix.
- Script: `output/playwright/expense-template-qa.cjs`. Screenshots: `expense-template-totals-1440.png`, `expense-template-1366.png`, `expense-template-390.png`, `expense-template-en-light.png`, `expense-template-designer-1440.png`.

Owner visual acceptance and merge remain pending. The template does not generate a PDF identical to the source.
