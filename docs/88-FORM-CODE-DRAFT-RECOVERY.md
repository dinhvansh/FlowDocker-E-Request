# Form editing recovery

## UX Research → UI/UX Design → Design Audit

Evidence: docs/84 explicitly records invalid source as an in-session draft only. Reloading can lose the admin's unfinished AI-assisted code. This is a code audit finding, not a user study. Keep visual editing and code editing synchronized through the existing engine.

Design: a single tab-local recovery snapshot holds the active last valid form, exact source and code-edit state. Reopen the recovered editing session on reload, with a visible notice and a confirmed discard action. Invalid code remains visible, while the existing save/visual mutation guard remains enforced. No automatic save to the form catalog. Show storage failures without claiming recovery succeeded. Use existing Notice, Button and Modal with shared typography/spacing and VI/EN. No new primitive/dependency or design-system search required.

Audit acceptance: exact invalid source survives reload; last valid canvas survives; correcting code restores sync; saving clears recovery; discard confirms and returns to the saved form or catalog; runtime test inputs never enter recovery; denied/full storage reports failure; malformed recovery is not rendered.

## Impact map

- App-specific host: FormsPage and its session recovery helper, synthetic tests.
- Reusable foundation/domain engine: unchanged; no new public package contract.
- Schema/API: unchanged FormDefinition and safe code analysis.
- Storage: additive sessionStorage key `flowdocker.form-recovery.v1`, one bounded snapshot, no migration of saved localStorage forms. Browser-tab session only; not a backup across browser closure or storage clearing.
- Security: no identity/provider results, test values or credentials added. Authored defaults/configuration remain authored data, as in existing local form drafts. This is frontend recovery, not authentication or backend authorization.
- Temporal/Teams/backend: unchanged, no server connection.

## Interactive Prototype → Design to Code

Implement in the existing host with shared components. Test synthetic browser journeys, VI/EN, light/dark and desktop/mobile; report actual results after verification. Owner acceptance remains pending.

## Verification — 2026-11-02

- `npm run typecheck`: PASS.
- `npm run lint` / i18n and `npm run format:check`: PASS.
- `npx vitest run apps/e-request-web/src/form-recovery.test.ts --maxWorkers=1 --reporter=verbose --testTimeout=15000`: 4 tests PASS.
- `npx vitest run apps/e-request-web/src/forms.test.tsx --maxWorkers=1 --reporter=verbose --testTimeout=60000`: 8 tests PASS; log output/playwright/form-recovery-host-tests.txt. This is the affected suite, not a new full-suite run.
- Initial host runs timed out on this memory-constrained workstation. The pre-existing multi-language journey's explicit timeout and the Code Studio cold-import query now allow 60 seconds; assertions are preserved. Final host run passes. jsdom logs CodeMirror Range geometry warnings; actual browser run reports no page errors.
- Browser script output/playwright/form-recovery-qa.cjs: PASS. Exact unfinished source survives reload, valid canvas survives, invalid source blocks save, runtime input sentinel is excluded, cancel preserves recovery, correcting source saves, and successful save clears recovery. The isolated CLI browser suppresses its native leave dialog on deliberate test reloads; app guard code is retained. Test storage/preferences are restored afterward.
- Screenshots inspected: form-recovery-1440-vi-light.png (1440×900), form-recovery-1366-en-dark.png (1366×768), form-recovery-390-en-dark.png (390×844). No document horizontal overflow: 1366→1366 and 390→390.
- Browser audit found the existing invalid-code Notice's full width plus outer margins overflowed the split layout. Scoped Code Studio notice sizing now uses auto width and parent-aligned margins. This is a reusable visual stylesheet correction, no schema/engine/API contract change.
- Application build: PASS; existing large-chunk advisory remains. No backend, AI transport, CI, publication or production authorization claim.

Owner acceptance remains separate. Recovery is limited to the browser-tab session and available browser storage; continue saving valid drafts explicitly.
