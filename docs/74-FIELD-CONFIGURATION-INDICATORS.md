# Field configuration indicators

Base `86c5ca1`. Owner requests visible indicators for fields with data, calculations or advanced settings, using a screenshot of the logic inspector.

## 1. UX Research
Observed current code: canvas only marks visibleWhen; requiredWhen, disabledWhen, calculations, data/defaults and custom renderers have no comparable cue. User must inspect every field/group. No user interviews or measured scores claimed. Existing UX/component/shadcn guidance and docs/57 apply.

## 2. UI/UX Design
Compact icon+text indicators for Data, Conditions, Calculation, Validation, Advanced on the designer canvas and selected-field inspector. Configured indicators link directly to the relevant inspector group. No red/error border and no color-only signal. Empty configuration produces no badge. Simple required remains represented by the existing star rather than an extra validation badge. Runtime/fill-in forms do not show designer metadata.

## 3. Design Audit
Recognize all three conditional rules and cross-field compare, not only visibility. Treat zero/false defaults and bounds as configured, ignore empty defaults/empty rule conditions/whitespace provider and custom renderer. Indicators describe presence, not correctness. Nested fields use the same overlay/component, and parent status reflects its own settings only. Clicking cues works with keyboard and does not alter schema. VI/EN, light/dark, compact wrapping and reduced-motion unchanged.

## Impact map before code
- Schema/API: no stored schema changes; add optional typed FormCanvas onInspect callback only.
- UI: shared internal classifier and indicator component reused in canvas + inspector; designer routes navigation.
- Temporal/Teams: no impact.
- Storage/migration: unchanged; indicators derived from current draft, update on undo/remove/reopen.
- Security: no new execution, permissions, backend/network or real data; indicators never imply validated configuration.
- Tests: pure classification edge cases, existing designer integration + badge navigation, browser edits/removal/undo and bilingual/theme/responsive review.

## 4. Interactive Prototype
Implement in existing designer route with synthetic samples; browser evidence follows. Owner acceptance pending.

## 5. Design to Code / Reusable component impact
Reuse shared Badge/Button and existing semantic tokens/Lucide. One typed internal indicator component for both hosts; no duplicated classification in UI. Additive onInspect API supports standalone FormCanvas without requiring navigation. Forms engine and validators unchanged. No new dependency or platform-ready claim.

## Executed verification

Base `86c5ca1` plus this feature. `npm test -- --maxWorkers=1`: PASS, 24 files / 103 tests. New tests cover empty configs, false/zero defaults, source/current creator/options, all three rules/comparison, calculation presence, zero bounds/custom renderer, clearing and child independence; canvas integration verifies direct navigation without schema mutation. Initial new integration assertion assumed a text comparison control, then a unique dropdown; the sample has two comparison dropdowns (visible + required). Corrected the test to match the actual controls and reran the full suite successfully.

Browser: named isolated Chromium session `forms-config`, `output/playwright/forms-configuration-qa.cjs` PASS on final source. Synthetic fixture only; plain-required and parent fields get no false positives; child false default is marked. Data/calc/advanced/condition cues open the correct inspector section; removing calc/custom-renderer/condition clears the cue, undo restores it; keyboard Enter works. Runtime preview has no indicators. VI/light at 1440×900 and 1366×768; EN/dark at 1440×900 and 390×844; no page errors or document horizontal overflow. Mobile canvas cue switches to Properties. Original browser-local drafts/locale/theme are restored after QA.

Browser iteration caught pointer focus selecting a field before pointer-up, moving its badge before click. Configuration links now select through their click callback (same rationale as existing popover handling), and mobile navigation explicitly selects the Properties pane. QA then passed. This is local browser/unit evidence, not CI/UAT/owner acceptance.

Screenshots visually reviewed:
- [1440 VI/light](../output/playwright/forms-configuration-1440-vi-light.png)
- [1366 VI/light](../output/playwright/forms-configuration-1366-vi-light.png)
- [1440 EN/dark](../output/playwright/forms-configuration-1440-en-dark.png)
- [390 EN/dark](../output/playwright/forms-configuration-390-en-dark.png)

Typecheck/lint/format/build and standalone package build results recorded after execution below. Owner design acceptance remains pending.

Final gates: npm run typecheck, npm run lint (including i18n), npm run format:check, npm run build, npm run build:forms and git diff --check all PASS. Main app retains existing chunk-size warning; standalone forms declarations/package build completed. No dependency changes or package publication.
