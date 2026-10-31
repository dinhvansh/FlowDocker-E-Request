# Permissions visual refresh — pilot

Base `6a232e4`. Scope: original reusable PermissionBuilder UI; no authorization engine change.

## 1. UX Research

Owner reports the application feels visually inconsistent despite shadcn. Current browser evidence at 1440x900: three permanent panels squeeze the matrix, inactive publishing and validation commands add noise, technical IDs compete with resource labels, scope radio chips run together, and the simulation form is always visible. User task: select a role, understand its scope, adjust a resource action, optionally simulate the decision.

Actual UI/UX Pro Max local searches executed: `enterprise permission roles access control compact admin --design-system` and `data table progressive disclosure selection detail --stack shadcn`. Selected minimal/Swiss spacing, existing Inter, semantic table, keyboard and contrast guidance. Rejected generic Hero/Features/CTA and proposed blue/orange palette as inappropriate for this operational screen and existing FlowDocker brand. No interviews or benchmark scores claimed.

## 2. UI/UX Design

Two-column workspace: compact searchable roles → wide role editor. Clear role title, draft status and local-save status. Scope in a labeled select above the capability matrix; secondary field protection/version views stay in tabs. Test Access moves to a named button opening an accessible shared dialog. Keep a concise prototype/local-only explanation. Remove disabled publish command and superficial UI validation command. No new publishing capability.

Reuse shared shadcn/Radix Button, Tabs, Select, Checkbox, Table, FieldGroup, Field and Modal. All labels bilingual. Preserve existing grants, scopes, field rules, version and synthetic access evaluator.

## 3. Design Audit

P1 cramped matrix / always-open simulator → progressive disclosure. P2 border density, competing headings and technical copy → one workspace surface with consistent 8/16/24 spacing; technical identifiers in title hints. P1 mobile dense matrix → locally scrollable semantic table with explicit helper; compact role picker on small screens. Visible keyboard focus and no color-only state. New CSS scoped to the reusable permission package; no global font/palette resets.

## 4. Interactive Prototype

Implement as a working React pilot in the existing UI. Before/after screenshots at 1440x900; verify 1366x768 and 390x844, VI/EN, light/dark, role selection/search, grant and scope changes, field rules, versions, create/cancel and allow/deny simulation. Use synthetic browser-local data only; preserve user's existing browser state by using a named isolated browser session.

## 5. Design to Code / impact

Reusable component impact: `@flowdocker/permission-builder` owns the role workspace and scoped presentation; shared `@flowdocker/ui` primitives are reused without forks. Public props remain stable. Domain adapter/storage and evaluator unchanged. No API/schema/migration/Temporal/Teams/backend permissions changes. Frontend role drafts and simulation do not enforce authorization. Visual owner acceptance remains pending. Actual verification to be recorded below.

## Executed verification

Evidence applies to base `6a232e4` plus this commit's changes. `npm run typecheck`, `npm run lint` (including i18n), `npm run format:check`, `npm run build` and `git diff --check`: PASS. Build retains the existing >500kB main chunk warning. Initial format check found a pre-existing wrapping issue in `form-builder/data-source.test.tsx`; this slice includes only its Prettier whitespace correction.

`npm test -- --maxWorkers=1`: 91 tests passed / 22 files after the layout implementation. The subsequent focus-return fix was checked with final typecheck/lint/build and actual browser interaction rather than rerunning unrelated unit tests.

`output/playwright/permissions-ux-qa.cjs` in named session `permissions-ux`: PASS on final code. Search/empty state, role selection, grant toggle, scope change, field MASK/DENY, version tab, create/cancel/empty-name rejection/no implicit grants, simulated owner DENY → owner ALLOW → different-tenant DENY. Keyboard Enter opens simulation; Escape closes it and restores focus to its trigger. Final QA recorded no page errors. Development HMR briefly reported missing source/style while edits were in progress; those were resolved before final reload and QA.

Screenshots: before/after 1440x900 VI/light, after 1366x768 VI/light and EN/dark, 390x844 EN/dark, simulation desktop/mobile. Desktop dark and mobile dialog were visually inspected. No document horizontal overflow at 1366 or 390; the mobile permission table uses its own horizontal scroll. The QA restores only its isolated session's original role storage, VI/light and desktop viewport; no changes to the owner's open browser data.

Frontend visual pilot: implemented and locally verified. Backend authorization/CI/owner visual acceptance: not established by this slice. No merge.
