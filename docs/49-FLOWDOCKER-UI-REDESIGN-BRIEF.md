# FlowDocker UI Redesign Brief — Operational Enterprise Console

**Status: Proposed Design / owner review required.** Date: 2026-10-28. **This document does not prove that a redesigned prototype or production UI is built.**

## Design thesis
Replace generic "AI SaaS dashboard" aesthetics with a serious **operations-first builder console**. Visually restrained, structured and information-dense, with explicit ownership, versions, editable objects, permission scope and job status. A familiar data-tool feel is useful; **do not simply clone n8n, Retool, Linear or Ant Design**.

## Information architecture
```text
Workspace / [App] / [DEV | QA | PROD]
├── Workspace Overview (Recent apps, tasks, sync issues, activity)
├── Application Builder
│   ├── Installed Modules / App Manifest
│   ├── Navigation & Routes
│   └── Build & Version
├── Data
│   ├── Master Catalog (Entities / Records / Versions)
│   ├── Sources & Connections
│   ├── Flow Studio
│   └── Runs / Exceptions
├── Security
│   ├── People & Groups
│   ├── Roles & Permissions
│   ├── Data Scopes / Field Security
│   └── Test Access / Audit
└── Platform
    ├── Component Library / Tokens
    ├── Notifications / Audit
    └── Settings
```
Navigation must adapt to active user authorization; route visibility is **not** API enforcement.

## Desktop layout (first high fidelity)
- **Sidebar**: 216–236 px, clear navigation grouping, role/task favorites, compact environment/app switcher.
- **Topbar**: 52–56 px with current workspace/app/environment, global search, action history and user menu.
- **Page toolbar**: 56–76 px containing title, specific object/version/status and one primary CTA; eliminate oversized page introduction blocks.
- **Working area**: layout occupies remaining viewport; flat border-separated panes, optional resize/collapse.
- **Data tables**: 36–44 px row density where appropriate, sticky header, filters, column selection, actual statuses, empty/loading/error state.
- **Detail panels**: 300–360 px, resize/collapse on Flow Studio; inputs and statuses use readable typography and inline errors.
- **Responsive**: mobile focuses reading/approval/management basics; dense canvas editor on narrow phones may be read-only with clear desktop suggestion.

Exact dimensions are **proposed** and must be verified in prototype at 1366×768, 1440×900, 1920×1080, 768 tablet and 375 phone.

## Per-screen task-first structure
### Workspace Overview
Above the fold: Quick Switch Apps; 1 primary Create Application; Recent Apps table; attention-required sync errors; recently edited definitions. No decorative hero, giant slogan or made-up KPI cards.

### Master Data Builder
Three columns: searchable Entity Catalog (left) → schema table + tabbed content (center) → current selected field details (right). Top line includes Entity Type LOCAL/EXTERNAL, Source Owner, Draft/Published version, Validate/Publish. Clicking field row highlights precise schema/field policies. Separate Schema/Records/Source/Versions tabs.

### Permission Builder
Left: roles/resources tree. Center: compact capability matrix and explicit scope selector (Tenant/Company/Department/Own/Assigned). Right: Test Access with input Actor/Resource/Action/Context and trace explanation. Field Security remains accessible via selected resource, not distant decorative chips. Save Draft, Validate, Review Diff, Publish.

### Data Flow Studio
Dedicated full-viewport workbench (not contained inside a centered card): Node Palette narrow/collapsible; infinite/zoomable canvas; resizable Inspector with **Input | Output | Schema | Errors | Logs**; graph toolbar includes Save, Validate, Test Node, Dry Run, Publish and Run. Link graph version to source and checkpoint status. RAW/Staging boundary is meaningful, never just decorative dashed line.

### Field Mapper
Full-screen workspace with source JSON tree / transformation chain / target schema, searchable paths, type badges, mapping preview and invalid field explanation. Drag-to-map plus click-to-map and keyboard alternative, no arbitrary JS execution.

## Suggested design primitives
Neutral off-white/white work surfaces and dark graphite variant, one controlled brand accent, semantic warning/error/success, thin borders rather than card shadows, 4/8 px spacing system, compact radius 4–8 px, SVG icon set with consistent stroke, typography readable at 100–150% zoom. **Do not assert exact FlowDocker palette is finalized.** Brand direction and component-library tokens need owner review.

## Design audit quality checks before prototype
Audit each screen for task discovery, command affordance, information hierarchy, focus order/visible labels, status readability, error recovery, keyboard alternatives for drag, no sensitive preview leakage, avoid horizontal scroll at required widths, light/dark contrast and no dead-end CTA. Keep mock status conspicuous until connected to real services.

## Component mapping for Design to Code
| Design primitive | Target reusable package |
|---|---|
| App shell, nav tree, tab/toolbar/status/table/dialog | `@flowdocker/ui` + `@flowdocker/app-shell` |
| Node card, port, edge, minimap, canvas toolbar | `@flowdocker/flow-canvas` |
| JSON tree, field slot, transform chain, I/O inspector | `@flowdocker/field-mapper` |
| Master Entity Catalog + Field Editor | `@flowdocker/master-builder` |
| Role matrix, scope selector, access simulation | `@flowdocker/permission-builder` |
| Epicor Source, Raw, Lookup, Upsert visual nodes | Sync-domain adapter, not generic component |

## Prototype handoff requirements
Provide actual browser-playable HTML or React artifact with URLs/hash navigation, click flows, resizable/collapsible panels when meaningful, accessible keyboard flows and visible mock labels. Test actions should update demo UI state; if "Publish" is simulated, label it `SIMULATED`, not `SUCCESS` as if backend accepted it. Run screenshot/browser QA and record the results separately. Do not present proposed layout as completed implementation.


## Library neutrality — explicit owner clarification
The redesign is **not an Ant Design Pro conversion** and no external library is prescribed across all screens. Select UI foundations by task and proven interaction fit. Candidate toolkit to evaluate includes shadcn/ui + a single primitive layer (Radix or Base UI), TanStack Table, React Flow, dnd-kit, theme tokens and Storybook; Ant Design remains a selective option only when justified. Ensure a single cohesive FlowDocker visual language through components and tokens. See [UI Selection ADR](50-UI-STACK-SELECTION-PRINCIPLES.md).
