# Form Studio UX Reference V2 — SurveyJS Creator Structure + Fillout Polish

> **Owner decision 2026-10-28 — KEEP ORIGINAL FLOWDOCKER FORMS ENGINE.** This is a visual/interaction redesign brief, **not a new engine plan**. **Status: SPECIFICATION ONLY; redesigned UI NOT DONE.**

## 1. Benchmarks (inspiration only — do not copy source, design assets or pixel-level layouts)

**Primary interaction reference: SurveyJS Creator V2**
- Official UX: https://surveyjs.io/survey-creator/documentation/creator-v2-whats-new
- Interface and toolbox/property grid: https://surveyjs.io/survey-creator/documentation/end-user-guide/user-interface
- Reference screenshot (official): https://surveyjs.io/survey-creator/documentation/images/creator-v2-toolbox-and-property-grid.png
- Learn: compact category toolbox; inline field controls; live editable surface; context-sensitive properties; Designer / Preview / Logic separation.
- **Licensing:** SurveyJS Creator is commercially licensed for embedding. Do not import its source or package. Learn UX patterns only.

**Secondary UI quality reference: Fillout**
- Official editor overview: https://www.fillout.com/help/getting-started
- Official field visual screenshot: https://www.fillout.com/help/images/Screenshot2025-09-16at3.19.28PM.png
- Official form screenshot: https://www.fillout.com/help/images/Screenshot2025-10-02at3.39.58PM.png
- Learn: polished *real form* preview, field selection and surrounding context, non-intimidating visual density, cohesive input states and direct editing.
- **Licensing:** Fillout is a proprietary hosted product. Do NOT copy its source, CSS, icons, branded assets or exact compositions.

Keep **FlowDocker branded identity**, independent interactions, original component code, reusable packages and explicit license notes.

## 2. Confirmed scope / actual current code
Source branch: `feat/forms-ui-product`; starting ref at time of this specification `cf97c1e`. No Forms code is merged into `main`.

Current original engine:
- `packages/form-builder/src/schema.ts`: form definitions and 33 field types, nested layout fields, typed rules.
- `packages/form-builder/src/engine.ts`: validation, conditions, calculations, data preparation.
- `packages/form-builder/src/runtime.tsx`: interactive field renderers and dynamic data adapters.
- `packages/form-builder/src/designer.tsx`: current builder and drag logic — **major UX redesign target**.
- `packages/form-builder/src/editors.tsx`: properties/options/rules — regroup as contextual inspector rather than discard logic.
- `apps/e-request-web/src/forms.tsx`: page shell, local draft storage and navigation — redesign app integration.
- `packages/form-builder/src/product.test.tsx` and `schema.test.ts`: existing regression tests, augment instead of deleting.
- Package `@flowdocker/form-builder` already exists. **No Form.io runtime dependency and no Form.io source in this product.**

Do not rebuild engine to make UI pretty. If designer and renderer need shared field-view adapters, extract UI primitives and preserve data/schema semantics. Changes to schema or calculation logic must have explicit compatibility notes and regression tests.

## 3. Target layout — no table-only designer
```text
FLOWDOCKER / Apps / E-Request / Forms / Payment Request          Draft · v3
[← Forms]        [Undo] [Redo]   Validate     [Preview]   [Save Draft]
───────────────────────────────────────────────────────────────────────────
┌──────────────────┬─────────────────────────────────┬──────────────────────┐
│ FIELD TOOLBOX    │ LIVE DESIGN CANVAS              │ FIELD INSPECTOR      │
│ Search…          │                                 │ Selected: Amount     │
│ ★ Frequently     │  Payment Request                │ General · Logic      │
│ ▸ Basic Fields   │  Name        [________________] │ Validation · Data    │
│ ▸ Choices        │                                 │ Appearance · Advanced│
│ ▸ Date & Amount  │  Amount      [          0.00]   │ Label (vi/en)        │
│ ▸ Layout         │  └─ selected field outline      │ Key/Type (guarded)   │
│ ▸ Advanced       │  [＋ Insert field below]        │ Required   [✓]       │
│                  │                                 │ Dynamic lookup       │
│ [Field tree ↔]   │  [Expense lines: repeat/table]  │ Conditional logic    │
│                  │                                 │ Test field           │
└──────────────────┴─────────────────────────────────┴──────────────────────┘
[Designer] [Preview] [Logic] [JSON]      [0 errors]   [DEMO · local only]
```

- Desktop 1366px: no horizontal page overflow. Left 220–270px, right 320–380px, center flex ≥500px when possible. Collapsible/resizable panels, keyboard-focus preservation.
- Avoid duplicate deeply nested internal scrollbars; sticky action bar and contextual inspector.
- Tablet: collapse toolbox and inspector to drawers/tabs; canvas remains usable.
- Phone: prefer field-by-field editing via tabs, 100% width preview; no forced 3-column miniature layout.
- Use original FlowDocker semantic tokens; no giant gradients/hero, card soup, low-contrast 11px helper labels or emoji controls.

## 4. Non-negotiable behavior / UX flow
1. **Open an existing form** with its draft status, version, unsaved state, title and VI/EN labels.
2. **Add a field** from searchable category palette through drag, click or keyboard (choice of insertion location). Do not display 33 fields as one unstructured column.
3. **WYSIWYG design surface**: show actual label, input, help, disabled and validation states using same underlying rendering components as runtime. Click selects field; inline toolbar for reorder, clone, delete.
4. **Contextual property inspector:** General (labels/placeholder/technical key), Validation (required/format/range), Logic (show/hide/disable/required), Data (static choice vs approved Master lookup provider), Appearance/Layout, Advanced.
5. **Complex structures**: columns, tabs, nested repeating expense rows editable in-place, plus outline switch for precise hierarchy.
6. **Preview**: user can fill sample form, trigger real *local* validation and see error messages, test conditional logic and calculations. Does not fake a successful server submit or approval.
7. **Logic**: typed AND/OR rules and calculations with clear dependency error feedback; do not add arbitrary JS expression editor.
8. **JSON**: safe bounded import/export and schema validity; show version/compatibility, do not execute scripts.
9. **Persistence**: save local draft through current app adapter, recover unsaved changes, undo/redo; keep `@flowdocker/form-builder` portable.
10. **Data provider**: render injected `provider(query, dependency, signal)` without making browser query ERP directly; mark source unavailable when adapter missing.
11. **Access control**: frontend field masking is a presentation preview; backend field ACL and workflow publication are not implemented and must not be claimed.
12. **No fake CTA:** Publish/Submit/Connect actions either genuinely work within declared frontend local demo scope or are disabled with explanatory status.

## 5. Working reference scenario: Payment Request form
Use a single **synthetic** Payment Request scenario for comparison and QA:
- Requester (read-only; mock), Company (lookup), Department (lookup), Vendor, Invoice Date, Due Date.
- Currency, Amount (decimal), Payment Type, Expense Rows (repeat/table), Attachment (mock callback explicitly unavailable or simulated).
- Conditional: Payment Type = Advance → show Advance Reason required; Expense Rows total → Amount reconciliation *local preview only*.
- Section/columns, tabs/wizard, two languages, light/dark, field-level disabled/read-only and typed validations.

Golden UX demo (must be recorded in browser):
1. Open Payment Request → Insert Amount field under Vendor, rename label VI/EN, make required.
2. Add conditional Advance Reason → Preview hides/shows; invalid submission focuses and explains failure.
3. Add two expense rows → calculate decimal total and show it in preview, then Save draft/reopen unchanged.
4. Preview 1366×768 and 390px; keyboard-only field insertion/move works; no global overflow or hidden fields.
5. Compare field visuals in Builder with runtime — same core field components, not a table surrogate.

## 6. Engineering strategy
- Keep `schema.ts`, `engine.ts`, `runtime.tsx` and package API stable unless bug/UX critical change is proven.
- Refactor `designer.tsx` / `editors.tsx` / `forms.tsx` in small, reviewable commits. Reuse `@flowdocker/ui`; extract `FormCanvas`, `FieldToolbox`, `FieldInspector`, `FieldOverlay`, `FormOutline`, `FormPreview` as original FlowDocker components when API stable.
- Prefer controlled component props and typed schema; keep field IDs and parent/child references, not transient DOM ordering as source of truth.
- Observe actual regression tests and input focus, typing/reordering, selection stability, 100+ field performance, nested repeat and mobile.
- Only introduce new dependencies where interaction/accessibility warrants, and document choice. No SurveyJS Creator runtime, Fillout assets or Form.io dependency.
- Use UX stages: research assumptions, target screen design, old-UI audit, interactive prototype, design-to-code and reusable package QA.

## 7. QA and release gate
Mandatory commands **rerun, no fabricated status**:
`npm run typecheck`, `npm run lint`, `npm test`, `npm run format:check`, `npm run build`, `npm run build:forms`, standalone package build/test if touched.

Browser test:
- 1366×768, 1440×900, 390px; VI/EN, light/dark.
- Input/Output model consistency; field selection, input click/keyboard, accessible alternative to drag, no dead-end action.
- Form save/reload, invalid condition, malformed schema import, failed storage, no sensitive data leak.
- Screenshot before/after with exact commands and commit SHA.
- **Owner visual approval before merge; no automatic merge.**

## 8. Definition of done
UX redesigned and built **only when** actual interactive React design canvas is working, the existing original FlowDocker engine functionality is preserved, tests and browser scenarios pass with evidence, and Owner accepts visuals. Today only a reference/brief is committed, **UI REDESIGN NOT DONE**.

Related: [FlowDocker Forms](56-FLOWDOCKER-FORMS-PRODUCT.md) · [UX audit](48-V1-PROTOTYPE-AUDIT-AND-UX-RESEARCH.md) · [Design process](47-UX-RESEARCH-TO-DESIGN-TO-CODE.md) · [Issue #3](https://github.com/dinhvansh/FlowDocker-E-Request/issues/3).
