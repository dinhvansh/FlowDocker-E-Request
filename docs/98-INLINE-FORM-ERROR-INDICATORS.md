# Inline authoring configuration errors

## UX Research → UI/UX Design → Design Audit

Continue the owner-selected Form Studio work. Central diagnostics are implemented, but the canvas and outline do not show which fields have invalid configuration. Existing inspector errors sit below every property, making navigation unclear. Show a compact warning icon/count on each invalid field and outline row; use a shared component, count actual validator issues for that field only, and keep child errors on the child. Clicking opens/focuses inspector. Move the selected field's issue summary above property controls. Reuse warnings and do not add red borders or hover colors.

## Impact map / reusable component impact

Reusable FieldIssueBadge(field,count,onNavigate?) used by canvas and outline. Optional FormCanvas.onIssue(id) is authoring-only navigation. Shared FormSchemaIssues renders the inspector summary. No schema, validation-rule, calculation, runtime-input, storage/recovery, backend/API/Temporal/Teams/security/migration change. Original FormDefinition validator remains authoritative; no auto-repair. Package 0.5.6; current app and isolated designer tests are harnesses. Owner visual acceptance pending.

## Interactive Prototype → Design to Code

Synthetic nested invalid field: visible count on child canvas/outline, warning activation by keyboard/pointer opens selected inspector and visible diagnostics, valid sibling has no badge, repair clears badges immediately, undo restores them. Runtime preview has its existing issue summary but no authoring badges. VI/EN light/dark at 1440×900,1366×768,390×844, no overflow. Record actual checks below.

## Actual verification — 2026-11-03

- Typecheck PASS after correcting new test-only unsupported Testing Library `exact` options. Lint/i18n PASS; format check PASS.
- Targeted canvas/badge tests: **9 tests / 2 files PASS**, 236.48s. Includes nested valid/invalid siblings, shared badge callback/no mutation, outline/canvas counts, inspector summary placement, repair and undo.
- Real browser PASS: nested canvas warning, healthy sibling/parent unmarked, outline warning activation, keyboard activation, inspector focus and summary, repair/undo/redo, save and runtime without authoring badges. VI/light1440×900, EN/dark1366×768 and390×844 plus mobile inspector screenshots inspected. No page errors or document horizontal overflow. Synthetic storage restored after QA.
- Initial mobile QA counted only visible canvas buttons while canvas was hidden by inspector; corrected the test to include hidden authoring elements and reran all three viewports successfully. No product repair was needed for undo behavior.
- Owner visual acceptance pending; actual package/build evidence follows. No backend, production E2E or merge claim.
- Application build PASS (1m 15s); existing bundle-size advisory remains. Final lint/i18n and diff checks PASS. No new dependency.
- Forms library build PASS (1m 6s), 76 bundled license entries. Local `npm pack` PASS: `dist/flowdocker-forms-0.5.6.tgz`; not published. Branch push is separate from any pull request/merge.
