# People field and organization sample

## Scope and UX stages

1. **UX Research:** owner needs a requester/colleagues picker and an organization sample before connecting Microsoft 365. Prior desk research: Microsoft Creator Kit PeoplePicker uses stable keys and searchable suggestions; Graph manager is a separate relationship from department text. No user interviews or live directory access claimed.
2. **UI/UX Design:** add People to the existing toolbox, search inside the picker, show names plus email/department, allow one or many IDs. Master Data has Catalog / Organization chart tabs. Chart shows reporting lines and a department filter; department heads are separately labeled.
3. **Design Audit:** prevent accidental free-text identities, inactive suggestions, ambiguous manager/head labels, stale selections disappearing on local search, and oversized horizontal charts. Use a nested semantic list, compact rows, keyboard controls and existing semantic tokens.
4. **Interactive Prototype:** synthetic local directory, shared by chart and injected form provider. Browser acceptance and screenshot evidence recorded below after execution. Owner visual acceptance pending.
5. **Design to Code:** reusable PeoplePicker composes the shared Combobox/Radix Popover. Form schema adds `person` and optional `multiple`; existing 33 types and schema versions remain supported. Application owns organization data; generic packages contain no directory endpoints.

## Impact map

- Schema/UI: additive person field, single ID or unique ID array, inspector and validation.
- Storage: missing sample catalogs are merged by stable ID without overwriting existing saved entities; no automatic writes.
- Master data: synthetic employees/departments, separate manager and department-head links. Picker and chart consume the same current local master records.
- API/Temporal/Teams: no changes, connections or workflow assignment execution.
- Security: synthetic data only; frontend allowlist validation is not server authorization. Future lookup APIs require tenant scope and active memberships under docs/20–29.
- Migration: no database migration; older engine versions cannot read the new field type. Selection values remain IDs, not emails/names.
- Tests: schema roundtrip, required/single/multi membership, inactive filtering, relationship integrity and UI selection/search.

## Reusable component impact

Combobox gains optional descriptions and multiple selection without changing existing single-value callers. PeoplePicker exposes typed controlled values/options and composes it; no domain imports. Runtime and design canvas share the same control. Independent second-app/server integration remains NOT DONE.

## Sample limits

All records are invented and use `example.test`. This is browser-local master data, not authenticated identity, HR authority or an approval resolver. Default person can be configured by stable ID using existing default-value support; live current-user defaults and manager-based workflow assignment require the later identity/workflow adapter.

## Executed QA — 2026-10-29

Base: `9d2b967`, branch `feat/forms-field-ux-layout`; evidence applies to the source committed with this report. Existing PR #6 is updated, not merged. Frontend sample implementation verified; owner visual approval remains pending. Backend/identity/connector integration NOT DONE.

| Command | Actual result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, including bilingual checks |
| `npm run format:check` | PASS |
| `npm test -- --maxWorkers=1` | PASS, 74 tests / 18 files |
| `npm run build` | PASS; existing >500 kB chunk warning remains |
| `npm run build:forms` | PASS, package and bundled notices generated |
| `git diff --check` | PASS |

Browser automation: `npx --yes --package @playwright/cli playwright-cli run-code --filename output/playwright/people-org-qa.cjs` and `people-designer-qa.cjs`. Actual checks: required empty value blocks validation; email search; one/multiple choice; selections retained while filtering; inactive person excluded; 7 active chart people; IT department filter returns 3; Tab/Enter selects a person; Escape closes; toolbox addition uses the default directory and undo removes it. No page errors during the completed QA run. A narrow-screen Notice overflow discovered in QA was fixed; final mobile has no document horizontal overflow.

Screenshots under `output/playwright/`:

- `people-1366-vi-light.png`, `people-1440-en-dark.png`, `people-390-en-dark.png`
- `organization-1366-vi-light.png`, `organization-1440-en-dark.png`, `organization-390-en-dark.png`
- `people-designer-1440-vi-light.png`

Shared `Field` now displays the required red asterisk in both VI and EN. Unit evidence: `organization.test.ts` covers schema roundtrip, catalogs/relationships, allowlist validation and preservation of saved master edits; `people-picker.test.tsx` covers search, selection stability and ID toggling. Isolated reusable example is in `packages/ui/examples/main.tsx`.
