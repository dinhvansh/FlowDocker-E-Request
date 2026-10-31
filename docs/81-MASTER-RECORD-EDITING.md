# Master record editing — scoped UX and impact

Base 35fe7cf on feat/forms-field-ux-layout; clean tree before work.

## 1. UX Research
Owner reports missing edit/update/delete. Source inspection confirms Records is a read-only four-column preview with no mutation callback. Current task: maintain browser-local catalog data and immediately reuse it in form sources. No user interviews or external benchmark claims.

## 2. UI/UX Design
Records tab: compact full-schema table, Add record action, explicit Edit/Delete buttons per row. Edit opens shared accessible Modal with typed Field controls, required stars, inline validation, Save/Cancel. Delete requires confirmation showing record identity. Keep error and input on failed saves; disable repeat actions while pending. Display local-only status and success. Use existing FlowDocker shadcn/Radix primitives; no new dependencies.

## 3. Design Audit
Read-only external/composite entities; optional host mutation adapter means existing consumers remain read-only. Record changes must not downgrade published schemas. Preserve unknown legacy properties on edits. Validate required/type/date/finite number/reference and conventional id/code duplicates. Existing id is immutable. Reference blockers prevent removing or changing a value still referenced in another master. Index identifies a row only within a captured entity snapshot; host rejects changed schema/records, deleted entity, malformed storage, duplicate entity IDs. No automatic data migration. Historical form submissions are not implemented, so production archival/reference lifecycle remains pending.

## 4. Interactive Prototype
Existing MasterBuilder is the interactive harness. Verify add/edit/cancel/delete confirmation, validation, failure recovery, external read-only and persistence; test VI/EN light/dark 1440x900,1366x768,mobile with synthetic data only. Original browser storage restored after QA.

## 5. Design to Code / impact map
Shared foundation: typed optional MasterBuilder onSaveRecords(expectedEntity, records) adapter; internal record editor/validation reused from package. E-Request adapter performs strict storage read, expected snapshot check, local source rule and validation before write; preserves schema/status/version. No backend/API/DB/Temporal/Teams/security policy or storage format migration. No production authorization claim. Component system, UX, shadcn, master data and authorization skills applied. Second-host and owner visual approval remain pending; no platform-ready claim.

## Actual verification — 2026-10-30
- `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`: PASS.
- First full test run: 138 passed; one existing Forms catalog journey exceeded the default 5-second timeout under load (no assertion failure). Full rerun `npm test -- --maxWorkers=2 --testTimeout=15000`: 139 tests / 34 files PASS. Focused rerun after error messaging/optional-clearing changes: 9 tests / 2 files PASS.
- Browser CLI `output/playwright/master-records-qa.cjs`: PASS add/edit/cancel/delete confirmation, immediate required/duplicate errors, decimal typing, boolean/reference/DatePicker edits, optional clearing, reload persistence, published status/version retained, external read-only, referenced group deletion blocked, stale write blocked. Synthetic data only; original storage restored in finally.
- Screenshots: master-records-1440-vi.png, master-records-1366-en-dark.png, master-records-390-en-dark.png. Inspected desktop table/compact modal and mobile scrolling; no document horizontal overflow. Full table may scroll horizontally. Reduced-motion and focus handling inherit shared Radix components.
- Original implementation had excessive FieldGroup+legacy Field spacing; scoped gap/margin fix applied and screenshots recaptured. Read-only field inspector is hidden in Records, reclaiming table width.
- Expected-snapshot comparison in local storage is best-effort stale detection, not a distributed transaction or server authorization. No real synchronization/backend/production CRUD claim.
- `npm run build` and `npm run build:forms`: PASS. Existing application chunk-size (>500 kB) advisory remains.
