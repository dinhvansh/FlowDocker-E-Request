# Dynamic Forms — Form.io Core Integration

**Status:** Proposed / POC required. Use form builder and renderer libraries, **not automatically the Form.io API Server**.

## Authoring workflow
Form Admin creates a draft request type → designs fields → configures defaults, rules and visibility → tests preview with sample data → binds published workflow version → publishes an immutable form version. Requests always snapshot `form_version_id`, validated payload, and calculated fields.

## Required components
- Text, textarea, integer, decimal/currency, date/date range, radio/select, checkbox, select multiple, person/department lookup.
- Repeating expense rows with currency, quantity, unit amount, tax, subtotal; attachment uploads; section/tab/layout.
- Conditional visibility and validation based on typed fields, not unrestricted code.
- Form-level validation and field-level read/write masking by role and request state.
- Mobile-friendly display and accessible labels/errors.

## Typed field catalog
| Data type | Backend handling | Rule example |
|---|---|---|
| `money` | ISO currency + decimal minor units, not floating point | `total.amountMinor > 2000000000` |
| `date` | ISO date, timezone-independent | `endDate >= startDate` |
| `user_ref` | internally verified user UUID | resolve line manager |
| `department_ref` | org-scoped department UUID | route to cost center |
| `repeat_group` | nested validated array | sum expense line amounts |
| `attachment_ref` | authenticated upload ID | only own attachments attachable |

For money use integer minor units or decimal types in backend; do not trust JavaScript floating point for accounting amounts.

## Fields vs workflow rule inputs
- Each field has **stable technical key**, label, type, form_version_id, `workflow_exposed` flag, optional sensitivity classification.
- Workflow Studio selects only eligible fields from published form schema; user-friendly condition builder uses typed operators.
- Evaluator reads server-validated snapshot, never hidden browser fields or client calculated totals.
- Sensitive fields (bank info) cannot be placed in Teams card payloads or logs.

## Form version and request revisions
- `form_definition` owns a list of immutable `form_version` records.
- Publish locks JSON + compiled validation rule definition and SHA.
- Request revision pins `form_version` and canonical response data.
- Returned request creates revision N+1; the admin's newer published form does not auto-apply to the existing request.
- After re-submit, workflow condition may change; default policy is to **restart approvals from step one**, preserve previous audit and cancel pending tasks.

## Upload security
Upload to authenticated API / short-lived controlled URL; enforce file type, size, malware-scan hook, content-disposition and ownership. Store metadata, avoid exposing internal object URLs. No direct public S3 writes without authorized scoped token.

## External data lookups
Use allowlisted backend providers (departments, users, cost centers, vendors). No arbitrary URL lookup or arbitrary JS submitted by admin. Cache non-sensitive options only.

## Example form: Payment
Requester (read-only identity), Department, Payment Type, Beneficiary, Amount, Currency, Payment Method, Expense Rows, Description, Invoice Files, Cost Center. Finance-only fields visible and editable only in Finance step; status tracked separately.

## Example form: Business Trip
Employee, Department, Destination/Country, Domestic/International, Travel Dates, Purpose, Estimated Expense Rows, Advance Needed, Attachments. Validations prevent end date before start date and require justification for international travel.

## Definition of done
Form builder and renderer both embedded; version rollback preserves old submissions; API rejects malformed/unauthorized fields; total cross-checks pass; keyboard/mobile QA; sample payment/trip forms pass E2E.
