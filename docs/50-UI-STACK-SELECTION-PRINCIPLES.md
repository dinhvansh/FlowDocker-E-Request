# FlowDocker — UI Technology Selection Principles (ADR-016)

**Decision date:** 2026-10-28  
**Status:** DESIGN DECISION CONFIRMED — NO UI STACK INSTALLED OR IMPLEMENTATION VERIFIED.

## Owner decision: fit-for-purpose, no framework mandate
**Do not default to Ant Design or demand a single external component library.** The design process starts with user tasks, interaction requirements, information density, accessibility, performance and long-term FlowDocker component ownership. Evaluate libraries **after** UX Research / UI/UX Design, and document rationale before Design to Code.

### Library selection principles
1. **User job first.** Enterprise CRUD, interactive graph editors, JSON mapping, approval on mobile and app onboarding have different usability needs.
2. **Prefer headless and composable building blocks** when creating FlowDocker-owned reusable UI. Keep them behind `@flowdocker/*` public exports.
3. **Choose ONE primitive foundation per host app** (e.g. Radix OR Base UI primitives for overlapping components), rather than blindly mixing dialog/focus systems. Multiple specialist engines are acceptable if they have explicit ownership boundaries.
4. **Do not enforce a library's default appearance** on FlowDocker screens. Visual design tokens, spacing, typography, colors, states and layout belong to FlowDocker.
5. **Ant Design is allowed, never mandatory.** It can be chosen for a justified use case/isolated module after comparison. If selected, wrap it behind FlowDocker adapters and review CSS/theme/dependency coupling.
6. Prefer maintainable licenses and dependency updates. Confirm exact pinned versions, NOTICE, distribution rights, bundle cost, long-term maintenance, SSR compatibility and accessibility in POC.
7. Use a **design-to-code review gate**, not an arbitrary stack restriction: fidelity, interaction, WCAG keyboard/focus, responsive density, API wiring and reusable component extraction.
8. Do not interpret "headless" as "accessible by default": Drag/Drop needs keyboard and click alternatives and actual testing.

## Candidate toolkit (recommended for POC, NOT mandated)
| Problem | Candidate | Why it may fit | What to evaluate |
|---|---|---|---|
| App Shell, dialogs, form controls, menus | shadcn/ui source + one accessibility primitive layer (Radix UI **or** Base UI) | customizable primitives with original FlowDocker styling | component APIs, focus management, SSR, maintenance |
| Master Data / Permission data tables | TanStack Table | UI-independent sorting, filtering, pagination and selection state | virtual scrolling, pinned columns, keyboard navigation, large datasets |
| Sync / Approval **visual graph** | `@xyflow/react` (React Flow, MIT) | extensible nodes, edges, canvas, zoom and panels | nested controls, keyboard access, hundreds of nodes |
| JSON path to target field mapping | dnd-kit + custom FlowDocker mapper | drag-to-map interactions with custom typed target slots | keyboard/click alternative, source/target validation |
| Styling | Tailwind CSS + CSS variables/tokens (or equivalent design-token system) | brand theme without a rigid vendor visual skin | scalable tokens, dark/light contrast, package boundaries |
| UI catalog & isolated QA | Storybook or equivalent | visible versions/states and consumer examples | build/CI, visual snapshots, accessibility |
| Specialized admin tables/forms | Ant Design or another system if task demands it | may reduce implementation cost for complex ready-made controls | theme integration, bundle, interaction consistency, migration risk |

## Screen-specific design decisions
- **Workspace/App Builder:** compact neutral admin shell, fast navigation/search, clear app/env/version context. No oversized hero sections.
- **Master Data Builder:** searchable entity tree + editable typed schema + property inspector; display versions, ownership, source permissions. Use dense table primitives.
- **Permission Builder:** role/resource/action matrix with filters + scope/field policy inspector + access simulator. Backend PDP/PEP is the authority.
- **Master Data Flow Studio:** full-viewport canvas + resizable node inspector + JSON Input/Output and mapping workbench. React Flow is canvas toolkit, not a sync engine.
- **Employee request / approval:** responsive task-first forms; mobile simplicity may require different layout conventions from admin.
- Preserve one cohesive FlowDocker design system: consistent icons, focus states, tokens, semantic status colors, read-only/loading/errors, and keyboard navigation across screens.

## Selection process per module
1. UX Research defines actor, frequency, scale, core tasks, device constraints.
2. UI/UX Design defines wireframes and interaction; identify complex widgets.
3. Design Audit compares 2–3 candidate UI approaches against task completion, data density and accessibility.
4. Interactive Prototype tests with actual flows (fake data clearly labeled), including dark/light and 1366×768 laptop.
5. Design to Code chooses smallest maintainable library set; wraps adapters in `@flowdocker/*`, provides tests, Stories, documentation and license evidence.

Record in design PR: `user problem`, `options considered`, `chosen primitives`, `why not Ant Design / why Ant Design if chosen`, `accessibility issues`, `performance/size`, `component extraction boundary`, `license status`.

## Sources
- shadcn/ui: https://ui.shadcn.com/docs
- TanStack Table: https://tanstack.com/table/latest/docs/overview
- React Flow: https://reactflow.dev/
- dnd-kit: https://dndkit.com/
- Existing [Five Stage UX Workflow](47-UX-RESEARCH-TO-DESIGN-TO-CODE.md)
- Existing [Redesign Brief](49-FLOWDOCKER-UI-REDESIGN-BRIEF.md)

**Implementation status:** This is a design decision and shortlist only. No package was installed, no frontend prototype was rebuilt, and no production UI QA was run by writing this document.
