# Master entity deletion

Base 9be3dca; clean feat/forms-field-ux-layout. Owner cannot remove an accidentally created empty currency_name catalog.

## UX Research → UI/UX Design
Master Builder exposes create/field delete but no entity delete. Add Delete entity to object header; confirmation shows entity/key and record count. Keep cancel/failure state, prevent double submission, close only on success and select remaining entity. Optional onDelete lets existing hosts remain unchanged.

## Design Audit
Only local DRAFT catalogs can be removed; published/external/system organization catalogs protected. Check references from other master fields, role resource grants, saved and currently edited forms before removal. Recheck latest local storage at confirmation. Malformed/blocked storage must fail without replacing data. No reset or automatic deletion; owner clicks explicit confirmation. Seed organization remains protected to avoid reseeding surprises. Local demo is not backend authorization.

## Impact map
Shared MasterBuilder optional onDelete(id) callback + getDeleteBlockers(entity) strings, translated by host. Existing API intact. E-Request supplies dependency checks and strict entity-local removal; same storage key, no DB/schema/Temporal/Teams/worker changes. FormsPage optional handle read includes active draft for dependency check. No connector writes, production deletion or auth enforcement. Tests: cancel/confirm/failure/busy, references, persistence/no reseed and malformed storage. Browser synthetic new entity delete/reload, linked entity blocked, VI/EN/light/dark/mobile.

## Interactive Prototype → Design to Code
Local app is prototype harness. Reusable builder has no application or storage dependency; host owns policy and persistence. Native shared Modal/Button/Notice retained. Actual QA follows; owner review pending, no merge.


## Actual QA — 2026-10-30
- Typecheck, lint/i18n and format:check PASS.
- `npm test -- --maxWorkers=2`: PASS, 126 tests / 31 files. New domain/component tests verify selected-ID removal, preserved other catalogs, malformed/duplicate storage, missing ID, failed writes/new dependency, protected status/system catalogs, role/master/form references, optional adapter, cancel/confirm/busy and error dialog retention.
- `npm run build`, `npm run build:forms`: PASS (existing app >500kB chunk-size warning remains).
- Browser `output/playwright/master-delete-qa.cjs`: PASS. Cancels without removal, deletes a synthetic empty local draft, reload proves persistence, referenced catalog shows reason and disabled confirmation. VI/EN, light/dark, 1440×900, 1366×768 and 390×844 checked; no mobile horizontal page overflow. Test installs/restores synthetic data in a separate QA browser session; owner's currency/currency_name records were not deleted by the agent.
- Screenshots `master-delete-1440-vi.png`, `master-delete-1366-en-dark.png`, `master-delete-390-en-dark.png` under output/playwright; desktop confirmation/mobile blocker visually inspected.

## Public API / limits
MasterBuilder optional `onDelete(id): Promise<void>` enables header action; absent callback preserves existing hosts. Optional `getDeleteBlockers(entity): string[]` supplies already-localized reasons. Confirmation is modal, shows name/key/record count, blocks while pending, preserves failed selection and retries. Host must recheck dependencies at execution; generic UI is not authorization.

E-Request protects sample organization catalogs and non-draft/non-local entities. Host checks direct referenceEntity, role resource and saved/live form provider dependencies, rechecking stored entities/forms/roles before writing. Malformed dependencies fail closed. FormsPageHandle.getDefinitions() includes its current unsaved draft. Existing storage format unchanged; deletion does not reset/reseed general catalogs. Scope is browser-local prototype data; no complete production dependency index, backend transaction, audit/tombstone, archive or cross-tab concurrency guarantees. Future published catalogs require an archive/inactivation policy. Existing second hosts remain compatible; second-host deletion integration/platform-ready status NOT DONE. Owner review pending; no merge.
