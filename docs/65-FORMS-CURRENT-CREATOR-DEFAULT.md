# Current creator as person-field default

Base `34ee1eb`, same Forms branch. Owner authorized adding current creator and allowing/disallowing changes.

## UX Research → Design → Audit

Owner evidence: a people source alone cannot default a request to its creator. Add a person-only Default value mode: Enter value / Current form creator. With the current creator selected, offer Allow changing person, mapped to existing `readOnly`. Source selection remains independent. Do not overwrite saved or explicitly cleared values. Missing identity must stay empty with an explanation, never guess by name/email.

Security audit: runtime identity is injected by the host, never persisted in the schema. UI read-only is not server authorization. Future real submissions must bind the creator to verified active membership on the server. This slice supplies only the synthetic sidebar profile for local testing, explicitly identified as demo. Existing organization records are preserved; the Forms demo adapter includes the current demo account alongside directory options.

## Impact / reusable component impact

- Schema: additive optional person-only `defaultValueSource: "currentUser"`; no engine replacement or schema version change. Older strict consumers must update before importing the new property.
- Engine: optional runtime context resolves current-user ID for defaults, nested fields and repeating rows, including multi-person arrays. Explicit input values take precedence. Context must also be supplied by headless validation/submission hosts.
- UI: shared Select/Checkbox/Field, bilingual context-aware inspector and runtime feedback. Designer and renderer share context.
- Host: current demo identity is a synthetic option, not a live Microsoft 365 or HR integration. No edits to saved masters, new connector, auth API, storage key, migration, Teams or Temporal change.

## Interactive Prototype → Code

Use local app to configure a person field, preview prefill, toggle editability, edit another field, reset and verify original data persistence. Test VI/EN, light/dark and mobile. Add engine, schema and runtime regressions. No real request is submitted. Owner acceptance remains pending; executed evidence follows after verification.

## Executed verification — 2026-10-29

Local source: base `34ee1eb` plus the changes in the commit containing this report.

- `npm run typecheck`: PASS.
- `npm run lint` including `i18n:check`: PASS.
- `npm run format:check`: PASS.
- `npm test -- --maxWorkers=1`: PASS, 85 tests / 21 files. Five new tests cover absent/saved/cleared values, denied access, nested/repeated/multiple-person defaults, validation/submission context, schema roundtrip/rejection, locked runtime submission and missing-identity required validation.
- `npm run build`: PASS; existing main chunk size warning (>500 kB) remains.
- `npm run build:forms`: PASS, 57 bundled license entries.
- `git diff --check`: PASS.
- Browser: `npx --yes --package @playwright/cli playwright-cli -s=forms-current-creator run-code --filename output/playwright/forms-current-creator-qa.cjs`: PASS with the synthetic organization form open and inspector on Data. Verified current sidebar demo account prefill, locked/editable modes, valid local required-field validation, overriding the requester and changing another field without losing that override, reset to the current account, VI/light 1440×900, EN/dark 1366×768 and mobile 390×844 without document overflow. QA changes were discarded, not saved.
- Screenshots in `output/playwright/`: `forms-creator-inspector-1440-vi-light.png`, `forms-creator-preview-1366-en-dark.png`, `forms-creator-inspector-390-en-dark.png`.

The first browser reset assertion ran before async directory loading finished; it now waits for the resolved person label. Picker options are scoped to their listbox. The final browser journey passed after these script corrections. Unit fixtures were corrected for schema version normalization, valid field keys and asynchronous option registration before the successful run.

The standalone example now injects its own synthetic current identity and provider to demonstrate the reusable API; typecheck covers it, but its browser journey was not separately executed. No live login, backend request creation, backend authorization or CI result is claimed. Owner visual acceptance remains pending; no merge is authorized.
