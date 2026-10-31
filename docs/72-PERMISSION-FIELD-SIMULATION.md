# Field protection and synthetic projection simulation

Base: `38d5bce`. Frontend-only continuation of Permission Builder (original task section C); Ant comparison is paused by owner.

## 1. UX Research
Desk review of docs/43 and existing code: three hardcoded technical field names are editable but Test Access only explains action/scope. Admin cannot see the effect of a field rule. No interviews or measured usability score. Assumed journey: select role → field protection → resource → rule → simulate reading a synthetic record.

## 2. UI/UX Design
Use the host resource catalog for labeled fields, retain stable existing policy keys, show one resource at a time. Missing policy means DENY. Simulation shows each registered field as readable, masked, or omitted; no record view for mutation actions. Keep simulation in the existing dialog and reuse shared Select/Table/EmptyState. No extra permanent panel.

## 3. Design Audit
P1: disconnected field policy examples → host-owned typed field catalog. P1: opaque output → explicit synthetic result table. P0: raw values must never appear for denied/masked fixtures in returned simulation output. Resource/action denial overrides field READ; EXPORT additionally requires READ. UI is not security enforcement. Keep existing local drafts and unknown legacy keys untouched. Check long labels/mobile and VI/EN/light/dark.

## Impact map (before feature UI implementation)
- Schema: additive optional `ResourceAction.fields`, typed synthetic field descriptors; Role storage shape/keys unchanged.
- API / Temporal / Teams: no changes, no real calls or authorization.
- UI: shared PermissionBuilder field tab and access dialog, host fixture catalog.
- Storage: existing role adapter/local key unchanged; sample records are not persisted.
- Security: pure synthetic explanation only; backend PDP/PEP/RLS remains NOT DONE.
- Migration: none; omitted catalog remains compatible with existing consumers.
- Tests: projection denial/masking/defaults/export, interaction and browser responsive/bilingual/theme QA.

## 4. Interactive Prototype
Working React interface in existing shadcn route, with isolated browser QA. Owner acceptance pending.

## 5. Design to Code / Reusable component impact
Reuse public UI controls; extend public resource metadata and add pure `simulateFieldProjection` to app-contracts. Field keys and synthetic samples remain host-owned. No E-Request endpoint/domain engine in shared packages. No dependencies or versioned persisted-schema changes. Exact tests/evidence to be appended after execution; production/second-host acceptance NOT DONE.

## Executed verification

Base `38d5bce` plus this slice. `npm run typecheck`: PASS. `npm run lint` (ESLint + i18n): PASS after adding the missing Field label translation. `npm run format:check`: PASS after formatting the dictionary additions. `npm test -- --maxWorkers=1`: PASS, 23 files / 98 tests. `npm run build`: PASS, with existing >500 kB main/optional Ant chunk warnings. `git diff --check`: PASS. This is local verification, not CI or owner acceptance.

Browser: named Playwright Chromium session `permissions-fields`, standard shadcn route. `output/playwright/permissions-fields-qa.cjs`: PASS; resource selection, READ/MASK/DENY output, cross-tenant deny, missing EXPORT deny, stale projection clearing, save/reload, VI/EN and light/dark. No page errors. Initial browser script used an incorrect translated resource label; corrected the locator to the existing catalog label and reran successfully. QA restores the original role storage, language and theme in its isolated session.

Screenshots at 1440×900 and 1366×768 VI/light; 1366×768 and 390×844 EN/dark; simulation at desktop/mobile. Desktop and mobile simulation screenshots visually inspected; no document horizontal overflow at tested widths. Broader 1920/tablet/zoom audit and owner acceptance pending.

- [1440 field policies](../output/playwright/permissions-fields-1440-vi-light.png)
- [1366 dark](../output/playwright/permissions-fields-1366-en-dark.png)
- [Mobile simulation](../output/playwright/permissions-fields-simulation-390-en-dark.png)

DONE: frontend catalog-driven field rules and synthetic result simulation. NOT DONE: live enforcement, publishing, policy history, real identity/data, CI/UAT.
