---
name: flowdocker-ux-design-process
description: Apply FlowDocker's mandatory five-stage UX Research → UI/UX Design → Design Audit → Interactive Prototype → Design to Code process to new apps, dashboards, Master Data Builder, Permission Builder, Data Flow Studio, and component-system changes. Use before building or redesigning any frontend screen.
compatibility: Browser-based FlowDocker products; HTML prototypes and React/TypeScript reusable components.
---

# FlowDocker UX/UI Pro — Research to Code

## Upstream design skill
Read the original **UI/UX Pro Max** specification and relevant web/desktop quick reference from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill):
- `.claude/skills/ui-ux-pro-max/SKILL.md`
- `.claude/skills/ui-ux-pro-max/references/quick-reference.md`
- `.claude/skills/ui-ux-pro-max/references/pro-rules.md` (primarily native/mobile; distinguish from desktop web)

This is a **local project instruction skill inspired by the upstream process**; it does NOT install or vendor the upstream skill's dataset, does not claim to be their original skill and must not copy copyrighted assets. If the upstream skill's local search script is unavailable, do not invent returned design-system recommendations: use documented rules, state that a data-driven skill search was not executed, and link external references.

## Owner-mandated 5 stages
Follow the exact named lifecycle, preserving evidence gates:
1. **UX Research** — identify real persona/task constraints, current usage, user journeys, competitive patterns and assumptions. No fabricated interviews. Deliver Research Brief.
2. **UI/UX Design** — information architecture, wireframe/task flows, component inventory, design tokens, proposed screens. Deliver Design Brief.
3. **Design Audit** — inspect current/proposed UI, record P0/P1/P2 issues with evidence and accessibility checks. Deliver Audit + Fix Plan.
4. **Interactive Prototype** — make a browser-playable prototype with nav, actions, state changes, errors, empty/loading states and working mapping/role simulation; label all mocked data/actions clearly. QA with screenshots and task tests.
5. **Design to Code** — extract accepted UI into FlowDocker-owned reusable typed package primitives, domain adapters and actual API integration; ensure auth, RLS, audit and tests. Deliver build/CI/Storybook evidence.

After feedback, revisit stages as needed instead of pretending the process is a one-way checklist.

## Mandatory reads
- `docs/47-UX-RESEARCH-TO-DESIGN-TO-CODE.md` (process)
- `docs/48-V1-PROTOTYPE-AUDIT-AND-UX-RESEARCH.md` (current demo audit)
- `docs/49-FLOWDOCKER-UI-REDESIGN-BRIEF.md` (updated direction)
- `docs/39-FLOWDOCKER-COMPONENT-LIBRARY.md`
- `docs/40-COMPONENT-EXTRACTION-ACCEPTANCE.md`
- `.agents/skills/flowdocker-component-system/SKILL.md`

## Acceptance anti-patterns
- Reject giant marketing hero and repetitive KPI cards for operational admin tools.
- Use compact workbench/data-first layouts, meaningful tables and dedicated inspectors instead of decorative shells.
- Don't add shadows/gradients/glass effects by default.
- Avoid tiny low-contrast helper text and icon-only controls without accessible names.
- Every dragged mapping needs a click/keyboard fallback and typed validation feedback.
- Test actual user journeys, empty/error states and responsive widths rather than only static screenshots.
- A mock `Publish` or `Test Connection` action must not look like a real backend success.

## Engineering handoff
Each design component maps to stable public `@flowdocker/*` package exports, typed Props, tokens, unit tests and Storybook. Domain engines remain independent (Sync graph execution vs Approval workflow). Backend enforcement is not inferred from permission UI.

## Status discipline
Research completed only if there is actual user evidence; heuristic audit is not user research. Design complete only after artifact + review; prototype complete only after interaction QA; code complete only after real build/API/security tests. Record links/SHA and **DONE/NOT DONE**, no fake evidence.
