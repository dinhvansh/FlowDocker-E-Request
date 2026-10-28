# V1 HTML Prototype — UX Research Brief & Evidence-Based Design Audit

**Status: Audit of the current HTML prototype, NOT a user-interview research study.** Reviewed 2026-10-28 against local UI screenshots of Overview, Master Data Builder, Permission Builder and Data Flow Studio generated for demo; these screenshots are conversation artifacts and are **not assumed committed** in this GitHub repo.

## Research context
**Product:** FlowDocker Application Platform. **Audience:** platform admin, integration operator, data steward, app builder. **Jobs:** reuse an app shell, configure entity master, assign scoped rights, construct/operate source sync graph. **Research method completed:** internal screenshot/DOM heuristic inspection of current demo, review of owner feedback ("looks like old AI template") and previous requirements. **NOT completed:** user interviews, time-on-task observation, production analytics or usability participant tests.

### Hypotheses to validate with operators
- Admin operators want compact, consistent tables and visible next actions instead of a marketing-style overview.
- Data stewards need clear distinction: entity schema draft vs actual records, sync source, permissions and publish state.
- Security admins need capability matrix + actual role scope and easy policy simulation tied to the selected resource.
- Integration operators need a full-width canvas with source schema, node preview, version/run status and issues, without scrolling past a large header.
- New developers need a fast "Create app from platform modules" path with concise manifest and package contract visibility.

### Five critical research tasks (user test prompts)
1. `Create App → choose modules → save draft manifest` without reading a hero page.
2. `Create Asset Category → add typed field → validate → publish` with clear preview and rollback/version.
3. `Create Manager role → scope to active assigned task → Test Access ALLOW and DENY` without confusing mock with enforcement.
4. `Configure Epicor connection → real Test (or explicitly simulated) → create Flow → mapping → Dry Run`.
5. `Open failed Sync Run → find failing node and source record error → choose retry/quarantine policy`.

## Audit findings of the previous prototype
| ID | Priority | Observed issue | User impact | Corrective design |
|---|---|---|---|---|
| A-01 | **P1** | Overview starts with very large green gradient hero, artificial decorative artwork and many near-identical module cards | Feels like generic AI SaaS landing/dashboard, low operational value | Replace with compact workspace landing showing Recent Apps, My Tasks, Latest Runs, Errors and primary Create App |
| A-02 | **P1** | Repeated shadows, pill labels, uppercase eyebrow headings and uniformly rounded cards across every screen | Weak hierarchy; content density and task focus suffer | Tight enterprise grid, mainly flat surfaces and dividers; reserve cards for meaningful modules/details |
| A-03 | **P1** | Large page title/subtitle/padding consume workspace before actual data, particularly Flow Studio | Fewer nodes/rows visible; excessive scroll on laptop | Compact task toolbar, smaller persistent breadcrumbs, data-area takes remaining viewport |
| A-04 | **P1** | Flow Studio canvas uses a fixed demo stage with tiny node boxes, no visible sample lineage table at first glance and overly narrow inspector | Cannot meaningfully understand data transformations and errors while mapping | Full-screen split-panels with resize, zoom/fit, node inspector Input/Output/Error tabs and collapsible palette |
| A-05 | **P0 (for real deployment)** | Publish/Test buttons and policy simulator are mocked (current demo does disclose this) | Risk of interpreting mock action as operational enforcement | Maintain conspicuous DEMO status and disabled production-risk actions until real API; show exact simulated result vs actual |
| A-06 | **P1** | Permission Builder shows checkbox matrix but data scope/conditions are distant static chips; unclear effective permission | Can confuse role permission with task/row authorization | Make active role, scope selector, resource/action matrix, field policy and Test Access linked with clear evaluation trace |
| A-07 | **P1** | Master Builder uses catalog list/field table/properties; good structural start, but publish/save state and data/schema ownership are visually secondary | Confusing schema vs records, source-owned vs local catalog | Make Entity Type, Source Authority, Draft/Published version and Review Issues prominent in compact header |
| A-08 | **P2** | Typography uses ~10–13 px for multiple helper labels and statuses | Hard to read for some operators and dense displays | Use defined typographic scale with readable body/controls and adequate contrast; test 100/125/150% zoom |
| A-09 | **P1** | Drag-and-drop mapping lacks a fully documented alternative interaction and stronger field-type visualization | Accessibility and error-prevention issues | Click-to-map searchable field dropdown, keyboard controls, typed converter visibility and inline invalid mapping |
| A-10 | **P2** | Navigation repeats the same broad platform-module grouping; route context/role task emphasis can be improved | Operators may hunt through irrelevant modules | Role-oriented navigation, active app/environment breadcrumb, pinned Recent modules, compact search |

Priorities are heuristic design severity, **not a recorded usability-test score**. Security issues marked P0 apply to real product/implementation; local demo's explicit mock data label is good and should remain.

## Positive patterns to preserve
- Clear separation between Master Data Builder and Permission Builder.
- Sidebar contextual navigation and consistent position of the primary actions.
- Three-pane Master Builder is a promising operational pattern.
- Flow canvas already supports selecting/dragging nodes and mock Input/Output inspector.
- UI labels mock data rather than claiming live data and backend authorization.
- Light/dark variants already exist in the demo.

## Design direction
**Operational console rather than marketing homepage.** Use compact topbar, precise typography hierarchy, more data table area, fewer decorative cards, white/neutral surfaces with restrained accent, one primary action per view, consistent statuses and direct links to current tasks. Avoid blindly adopting Ant Design, because E-Request's selected UI library/brand direction is not yet finalized; evaluate enterprise behaviors and design tokens independently.

## Next tasks
- UX Research remains **NOT DONE** until operator feedback is collected; desk research/audit alone is not a substitute.
- Create redesigned wireframes with flows for App Builder, Master Data Builder, Permission Builder and Data Flow Studio.
- Review drafts against A-01..A-10 and accessibility checklist before making a new interactive prototype.
- Prototype must include table, inspector, inline-validation, role scope simulator, mapping keyboard alternative, empty/loading/error states.
- Design-to-Code only after approved prototype; preserve FlowDocker component extraction.

## Evidence boundary
Screenshot filenames available to the current conversation when audited: `flowdocker-overview.png`, `flowdocker-master-builder.png`, `flowdocker-permission-builder.png`, `flowdocker-data-flow-studio.png`. They are **not GitHub design assets** until separately uploaded; do not invent repository screenshot links.
