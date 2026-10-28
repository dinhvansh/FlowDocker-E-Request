# FlowDocker UX/UI Pro — Mandatory 5-Stage Design-to-Code Workflow

**Owner-approved workflow, 2026-10-28. STATUS: process documented, not proof of research sessions, redesigned prototype, UI code, or user testing.**

The five stages are mandatory for each new FlowDocker app or major screen redesign. Original UI/UX Pro Max guidance: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), especially `.claude/skills/ui-ux-pro-max/SKILL.md`. Do not copy external skill source/assets into this public repo without appropriate review; use a project-specific instruction skill linking to the upstream.

## Process & gates
| Stage | Activities | Required deliverables | Exit gate |
|---|---|---|---|
| **1. UX Research** | Identify operators/personas, jobs-to-be-done, actual workflows, context/frequency, constraints; research comparable enterprise tools, user task validation when available | Research brief, jobs-to-be-done, user journeys, validated vs assumed needs, 3–5 critical task flows | At least primary users/tasks are defined and assumptions explicitly marked; no fabricated interviews |
| **2. UI/UX Design** | IA, task-first low-fi wireframes, layout hierarchy, states, component inventory, tokens/theme, responsive and accessibility plan; choose style by product need not trendy mockup | Screen inventory, task wireframes, interaction spec, design tokens, component map and approved UI direction | Every critical task has entry/action/feedback/exit; UI is navigable without excessive cards |
| **3. Design Audit** | Heuristic review of existing and proposed flows; readability, interaction, content hierarchy, accessibility, microcopy and data density; compare with research goals | Audit with screenshots/references, evidence, severity P0/P1/P2 and fix list | P0 fixed or explicitly blocked; P1 owned with acceptance checks |
| **4. Interactive Prototype** | Implement actual click flows using synthetic data, including dialogs, inline editing, field mapping, node selection, read-only/error/empty/loading, test accessibility | Browser-openable prototype, scenario fixtures, user/task test script, screenshots at desktop/tablet/mobile, observed QA results | Primary demo journeys work end-to-end in UI; distinguish mocked vs real; no dead-end primary CTA |
| **5. Design to Code** | Translate accepted screens to `@flowdocker/ui`, `flow-canvas`, `field-mapper`, Master/Permission Builder packages and domain adapter; wire real APIs with typed contracts; test | React source, public Props/events, Storybook, tests, API authorization integration, migration/CI documentation | Component is reused by second context; UI↔API behavior, RBAC, tenant scope, errors and accessibility tests pass |

**Loop:** User feedback and prototype findings may take work back to Research/Design/Audit. Never force a linear waterfall for changed requirements. If a downstream gate fails, return to the relevant earlier stage.

## Roles / personas for FlowDocker (hypotheses until user research)
- **Platform Admin:** sets app workspaces, roles, module manifests and shared catalogs.
- **Integration Operator:** creates connections, builds sync graph, maps data, checks runs and resolves errors.
- **Business Data Steward:** owns entity definitions, source precedence, mapping conflicts and publish approval.
- **App Developer:** registers business module, typed actions and domain handlers, reuses platform.
- **Approver/Employee:** end-user request submission/decisions; not the main audience for platform admin UI.

## Task-based acceptance
A user should be able to: create a new app with selected platform modules; publish a safe local master entity; configure a role and evaluate simulated access; set up a connection then visualize Source→RAW→Map→Validate→Upsert; inspect failure and retry; build a reusable component rather than copy screen-local code. Do not optimize solely for a beautiful overview dashboard.

## UI/UX Pro Max checks used for web
Accessibility 4.5:1 text contrast, meaningful keyboard navigation/focus, alternative to drag-only mapping, no emoji navigation icons, consistent SVG/icon system, status isn't color alone, loading/empty/error/read-only states, small-screen layout without unintended horizontal scroll, restrained motion and reduced-motion support. Treat user-facing enterprise data tables and panels differently from marketing landing pages.

## FlowDocker anti-patterns (rejected)
- Hero slogan/banner as the primary admin workspace.
- 6–10 identical rounded cards before a user can access the action they came for.
- Oversized whitespace leading to low data density.
- Generic "AI dashboard" gradient/glass effects unrelated to a task.
- Mock "Test Connection"/"Publish" buttons appearing real when no backend exists.
- Rebuilding every module with ad hoc CSS, duplicate node cards or inconsistent field mapping.
- "Looks polished" used as the only acceptance criterion.

## Evidence rules
Each stage records artifact links, reviewer, date, unresolved assumptions and status. Research is not complete without real operators or clearly identified desk-research hypotheses; UI Design is not 'approved' by a mockup alone; Prototype and Code are independently tested. Use **DONE** or **NOT DONE**, never "partially complete" as a status.

## References
- [Actual V1 Prototype Audit](48-V1-PROTOTYPE-AUDIT-AND-UX-RESEARCH.md)
- [Proposed FlowDocker Screen Design Brief](49-FLOWDOCKER-UI-REDESIGN-BRIEF.md)
- [Existing Component System](39-FLOWDOCKER-COMPONENT-LIBRARY.md)
- [App Platform](41-FLOWDOCKER-APPLICATION-PLATFORM.md)


## Framework choice happens AFTER UX definition
The owner explicitly states **"choose what fits; Ant Design is NOT mandatory."** UI/UX Design and Design Audit must evaluate appropriate primitives per screen before committing to a toolkit. Favor a consistent FlowDocker design system over enforcing an external component library's appearance. The Design to Code stage records the component choice rationale, public reusable `@flowdocker/*` API, accessibility, performance and license tests. See [ADR-016](50-UI-STACK-SELECTION-PRINCIPLES.md).
