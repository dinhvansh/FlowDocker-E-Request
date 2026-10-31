# Connected payment sample

Base ead1463; feat/forms-field-ux-layout; clean tree. Continue the active Form Studio work by exercising creator defaults and Master catalog sources in one real domain template. No backend expansion. The unsaved built-in People/organization sample also gains current creator and four profile defaults; its help explicitly distinguishes creator attributes from a manually selected requester. Saved versions still win.

## UX Research
Previous payment template still asks for requester/department manually, despite new creator profile defaults. Owner wants system work continued. Need a discoverable working sample that connects these existing capabilities without rewriting saved designs.

## UI/UX Design
Add a separate catalog entry: Payment request · creator & Master Data. Derive the existing landscape expense template, preserving decimal rows/validation. Requester is a locked person ID; department/email/employee code/title auto-fill from creator context. Optional Vendor lookup selects a stable code from Master Data, separate from manual beneficiary/payment account data. Explicitly describe local synthetic scope, no auto-numbering or actual approval.

## Design Audit
Keep old template IDs and saved drafts intact. No automatic migration of owner forms. Don't derive identity from names/email or manager placeholder. Vendor lookup stores only code; never copies sensitive bank columns or silently fills financial instructions. Required person membership/amount/invoice validation persists. No random IDs, workflow results or connector claims.

## Impact map
Domain adapter only: new template factory and catalog registration; no schema/API/engine/Temporal/Teams/auth/storage-key/DB migration. Public package APIs consumed, no new shared primitive needed. UI labels are bilingual schema data. Existing saved definitions keep priority in formCatalog. Tests cover generated schema, stable ID/provider mapping, default resolution, original template isolation and catalog persistence; browser selection/preview/local validation/light-dark/VI-EN/responsive.

## Interactive Prototype
Local Form Studio is the interactive harness; actual QA evidence follows. No owner acceptance inferred.

## Design to Code
Original FlowDocker Forms public schema/runtime reused. Template belongs to E-Request domain, not the reusable engine. Master/people providers injected by existing host. Synthetic only; authenticated identity, numbering, external sync, server storage/approval remain NOT DONE.


## Actual verification (2026-10-30)
- `npm run build`, `npm run build:forms`: PASS (existing app chunk-size warning remains).
- `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`: PASS.
- `npm test -- --maxWorkers=2`: PASS, 116 tests / 28 files. Domain tests resolve requester/profile, query synthetic Master Vendor, preserve invoice calculations and required validation, preserve original template and saved owner designs, distinguish selected requester from creator attributes.
- Browser `output/playwright/connected-payment-sample-qa.cjs`: PASS, catalog discovery, person/profile defaults, vendor selection, no automatic beneficiary replacement, invalid local preview summary, organization profile, VI/EN/light/dark, 1440×900, 1366×768, 390×844, no global horizontal overflow. Synthetic storage temporarily installed/restored in isolated QA session. Earlier QA attempt used wrong summary text locator; corrected to actual summary element before PASS.
- Screenshots: `output/playwright/connected-payment-1440-vi-light.png`, `connected-payment-1366-vi-light.png`, `connected-payment-1366-en-dark.png`, `connected-payment-390-en-dark.png`; desktop/mobile visually inspected.
- Existing saved People/organization designs remain as saved; updated built-in defaults apply only when that sample has no saved override. New connected payment ID is discoverable independently of the old PDF-inspired template.
- Master Vendor provider ID uses stable entity `vendor`; hosts without that catalog show unavailable source rather than manual fallback. No directory/ERP or financial credential integration. Owner visual acceptance pending; no merge.
