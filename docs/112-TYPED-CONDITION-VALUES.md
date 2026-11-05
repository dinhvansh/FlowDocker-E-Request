# Typed condition values

IMPLEMENTED AND VERIFIED for this UI slice. Base 04b6c36. Original Forms engine
and browser drafts preserved. Owner acceptance and full project release pending.

## UX Research

Owner screenshot shows a person condition with an untyped text box. Task: choose
an existing option rather than remembering its storage ID. Existing static choice
and boolean support is partial; provider-backed person/master choices are absent.
This is owner feedback and code inspection, not invented usability research.

## UI/UX Design

Reuse the searchable Combobox, Select, Input, FieldGroup and Notice. Options come
from the condition source field via the existing injected provider. Store stable
option values, show localized labels/descriptions. Keep search inside the dropdown.
Use native date/time inputs; number fields store numbers, money retains runtime's
decimal string format. Changing the source clears the old operand. Multivalue
sources default to contains. No OnSelect/OnChange action engine in this slice.

## Design Audit

Do not silently choose false or the first person. Loading, missing provider,
failure/retry and missing saved option must be explicit. Keep unavailable saved
values until admin edits them. Use 12/18 typography and shared control sizing;
keyboard choices and labels required. No new toolkit or decorative styling.

## Interactive Prototype / Design to Code

Use the existing app and synthetic isolated test host for interaction QA.
Condition value editor is a Forms adapter, not a platform primitive. Reuses shared
controls and choice hook; both field inspector and Logic Studio consume it.

Impact: additive optional editor provider/default context props; no schema/API,
Temporal/Teams/auth/storage/migration changes. Providers remain host-authorized;
this UI confers no data access. Submission limitations in docs/110 still apply.
Tests must cover stable IDs, source switching, provider dependency/errors,
date/number/boolean, existing rules and local runtime result. Browser evidence,
build and verification recorded below. No production/project-completion claim.

## Verification — 2026-11-05

- Full frontend regression: `npm test -- --maxWorkers=2 --testTimeout=60000`
  passes 245 tests / 54 files. Nine new tests cover stable choice IDs and actual
  evaluateRule result, source reset, multi-value contains default, boolean false,
  provider mapping/dependency through AdvancedProperties, missing provider without
  stale static fallback, sanitized error/retry, removed saved value, numeric,
  money and date/time storage types. Targeted nine rerun after final refactor pass.
- Typecheck, lint/i18n, formatting, app build and Forms library build pass.
  Forms 0.5.13; existing application chunk-size advisory remains.
- Real Playwright UI on the built-in synthetic creator/Master Data sample:
  searchable person choice with keyboard Enter, source reset, master choice ID
  verified in Schema JSON, native date input. VI/light desktop and EN/dark desktop
  plus 390px mobile; Inter 12px/18px, control 36px desktop and 44px mobile, mobile
  operand x8/width374. Popover animation awaited before screenshot inspection.
  Evidence: `output/playwright/condition-values*`. Fresh isolated browser session;
  no user browser storage reset or real directory connection.
- Reuses existing bounded choice provider (up to 500 loaded options); dropdown
  searches that loaded list. Remote pagination/search and action events are not
  introduced. Existing expression/operator semantics and schema remain unchanged.
- Both inspector and Logic Studio share AdvancedProperties → RuleEditor → typed
  value adapter. Independent platform-ready consumer claim remains pending.
