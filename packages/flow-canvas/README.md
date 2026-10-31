# FlowDocker visual canvas

`FlowCanvas` remains the existing sync diagram primitive. `OrganizationCanvas` is a separate read-only reporting visualization; it never executes workflows or edits manager relationships.

## OrganizationCanvas

| Prop | Contract |
| --- | --- |
| `people` | Readonly `OrganizationPerson[]`: stable `id`, display `name`, `title`, `department`, `managerId`, optional `isHead` metadata |
| `selectedId` | Optional controlled selected person ID |
| `onSelect(id)` | Opens host-owned person details; does not mutate data |

Collapse state and viewport are local UI state. Diagram lays generations in rows, centers parents over their branches, renders disconnected roots, and breaks invalid/cyclic visual parent links to avoid recursion loops. It does not validate or repair authoritative HR data. Initials are generated from display names; no external photos or API calls. Resize refits the viewport; +/− and Fit controls support users who cannot pinch/drag. Native card and collapse buttons support keyboard activation; hosts should retain an accessible list view.

`organizationLayout(people, collapsed?)` is a pure exported helper with positions, depth, visual parent and direct child count. Tests cover nesting, sibling spacing, collapse and invalid parent structures.

Isolated harness: `npx vite packages/flow-canvas/examples`. E-Request Master Data is the application consumer. An independent production consumer remains pending. Styles use the shared `@flowdocker/ui/styles.css` semantic tokens. Existing React Flow MIT attribution remains visible; no changes to execution-engine ownership.
