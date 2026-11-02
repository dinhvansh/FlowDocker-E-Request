# Preview schema diagnostics

## UX Research → UI/UX Design → Design Audit

Owner screenshot: recovered unsaved draft, disabled save, preview shows only a generic structure warning. The image does not reveal the underlying validation issue; do not guess or discard recovery. Existing schema validation can report a field ID and translated message but the renderer hides these diagnostics. Show each actual issue, with an action to open its field in the designer. Non-field title errors open name settings. Preserve the invalid draft and existing validation gate.

## Reusable component impact / impact map

Forms presentation primitive: additive optional FormRenderer/FormPreview.onEditSchemaIssue(FormIssue) callback. Generic renderer lists all existing validation diagnostics; app adapter navigates/selects field or opens form-name settings. No schema, storage/recovery, calculation, validation-rule, API, backend, Temporal, Teams, security or migration change. Existing recovered work remains untouched. Package 0.5.4. Current app and isolated test are consumer harnesses; no platform-ready claim.

## Interactive Prototype → Design to Code

Synthetic recovered draft with invalid field key → preview diagnostic → select diagnostic → designer field → correct key → preview resumes. Verify save remains blocked until fixed, saved recovery remains intact, VI/EN, light/dark and mobile. Owner's actual draft is inaccessible through current browser tooling; exact data error pending owner observation of new diagnostics. Actual checks recorded after execution.

## Actual verification — 2026-11-03

- Typecheck and lint/i18n PASS. Initial typecheck caught unsupported shared Button variant; corrected to existing ghost variant before final checks.
- Targeted test-preview suite: 3 tests / 1 file PASS (15.05s), including actual schema diagnostic/callback and repaired preview.
- Browser recovered-draft scenario PASS: specific field-key error, disabled save, clicking diagnostic selects field, repair restores preview, recovery contains repaired definition. VI/light 1440×900; EN/dark 1366×768 and 390×844 screenshots inspected; no page errors or horizontal overflow. Isolated synthetic data restored. Initial QA reload overwrote injected fixture through pagehide persistence; fixture injection moved to page initialization and full scenario rerun successfully.
- `npm run format:check` PASS. `npm run build` PASS (37.98s, bundle-size advisory). `npm run build:forms` PASS (26.71s, 76 license entries); local package 0.5.4 packed successfully.
- No claim that the owner's unknown invalid draft was repaired. New UI exposes the actual validation messages; owner visual acceptance remains pending.
