# Master catalogs as form choice sources

Base `845dc06`, branch `feat/forms-field-ux-layout`, clean before work. Owner requests all existing Master Data catalogs be available instead of manually duplicating dropdown options, supporting future sync reuse.

## 1. UX Research
Current source picker exposes only three host adapters despite MasterEntity metadata/records already loaded by the app. Admin journey: choose source → catalog → stable stored key → display column → preview choices, save/reopen. Desk review: source editor/useChoices, docs/25–29 and master-data/authorization skills; no interviews or live connector evidence.

## 2. UI/UX Design
Register every host-provided catalog as a named Master Data source. Expose column mapping for these sources only; keep manual lists and existing adapters/drafts. Prefer id/code as initial stored-key suggestion and name as display suggestion; no row indexes or display-name guessing for identity. Metadata-derived column options exclude sensitive and unsupported columns. Catalogs without suitable columns remain visible but unavailable. Preserve unavailable saved mappings and explain repair instead of replacing silently.

## 3. Design Audit
Use stable entity ID, never display name, in provider identity. Resolve current records on each provider refresh; don't embed records in schema or copy options. Reject missing/duplicate/invalid stable keys, allow zero IDs, preserve existing saved values. Only registered/allowlisted columns, no raw record descriptions/sensitive payload. Existing person source compatibility remains. Generic catalog provider is not ERP connectivity or API authorization; backend ACL/filtering still required.

## Impact map before code
- Schema: additive optional dataSource.valueField/labelField; strict import validation updated. Older strict consumers need upgrade; schema versions unchanged, old definitions remain supported.
- API: additive optional mapping keys in injected DataProvider context; no network endpoint.
- UI: optional FormDataSource mapping metadata, shared Select/Field; host MasterData adapter and memoized sources/providers.
- Temporal/Teams: no changes.
- Storage: same draft key, only source ID and mapping names stored; no record snapshots or copied choices. No DB migration.
- Security: host-side synthetic metadata projection only, PUBLIC/INTERNAL scalar columns allowed, SENSITIVE excluded; backend authorization and real sync NOT DONE.
- Tests: adapter identity/duplicates/empty/inactive/projection, schema compatibility/mapping validation, editor preservation and runtime refetch, browser select/preview/save/reopen/language/theme/mobile.

## 4. Interactive Prototype
Working existing local app, synthetic data only. QA and owner acceptance to follow.

## 5. Design to Code / Reusable component impact
Portable engine retains provider injection; reusable source editor gains optional mapping metadata, useChoices passes mapping and invalidates stale choices. E-Request owns MasterEntity adaptation. No new package/dependency or vendor connection. Existing second-host providers work without mapping metadata. No production/platform-ready claim.


## Verification (2026-10-30, slice based on 845dc06)

- `npm run typecheck`: PASS.
- `npm run lint` (includes `i18n:check`): PASS.
- `npm run format:check`: PASS.
- `npm test -- --maxWorkers=2`: PASS, 109 tests / 26 files. Initial unrestricted parallel run timed out in three existing UI tests (106 passed); bounded-worker rerun passed without changing tests/timeouts.
- `npm run build`: PASS; existing >500kB bundle-size warning remains.
- `npm run build:forms`: PASS; declarations/package prepared.
- Browser: PASS. Script: `output/playwright/forms-master-catalogs-qa.cjs`. Synthetic isolated catalog, value/display defaults, sensitive-column exclusion, save/reopen mapping, runtime lookup, changed Master label read after reload, no options copied, manual fallback, VI/EN and light/dark. Earlier script iterations exposed fixture/locator errors and unload-dialog handling; no product success inferred from those attempts.
- Screenshots: `output/playwright/forms-master-catalogs-1440-vi-light.png`, `forms-master-catalogs-1366-vi-light.png`, `forms-master-catalogs-1366-en-dark.png`, `forms-master-catalogs-390-en-dark.png`. Desktop mapping controls inspected visually; mobile properties scroll vertically without page horizontal overflow.
- Unit tests cover all-entity registration, renamed stable identity, numeric zero, inactive rows, empty catalogs, bad/sensitive/missing mappings, duplicate/reserved IDs, no mutation, legacy schema support and mapping-change provider refresh.

Frontend local catalog lookup implemented. External connectors/scheduled sync, backend tenant/company/role authorization and production key governance NOT DONE. Generic scalar catalog sources are excluded from person fields; dedicated organization people source remains. Owner visual acceptance pending; no merge.
