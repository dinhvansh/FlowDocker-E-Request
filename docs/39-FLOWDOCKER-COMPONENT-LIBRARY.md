# FlowDocker Component System — Reusable UI and Graph Components

**STATUS: DESIGN / ARCHITECTURE DECISION, NOT YET IMPLEMENTED.** Last updated 2026-10-28.

## Product goal and hard rule
Every reusable UI building block introduced during E-Request V1 (especially Master Data Flow Studio, Connections and Approval Workflow Studio) must become part of a **FlowDocker-owned, documented component system**. E-Request is the first consumer, not the only owner. Avoid a one-off pile of local `components/` tightly coupled to E-Request REST endpoints. Do not prematurely extract every page into a package: extract when behavior is stable and reused or explicitly identified as a platform primitive.

**Meaning of "ours":** original source code and stable public component contracts; external libraries such as React Flow, Radix/shadcn, icons etc remain third-party dependencies with preserved license notices. The project must not claim ownership of their code.

## Boundaries (critical)
1. **Design tokens / base UI primitives**: visual language and accessible components shared with every FlowDocker app.
2. **Graph canvas / visual mapper components**: visual editing experience shared with both Master Data Sync Flow and Approval Workflow Studio.
3. **Domain adapters**: Sync node palette, source schemas, JSON previews, connector statuses; Approval node palette, assignees and task policy forms. These are **not** shared as domain logic merely because both use nodes.
4. **Execution engines** remain separated. Master sync runs bounded data batches into staging/canonical; approval runtime runs Temporal human workflows and decision APIs. **A shared visual component must never depend directly on Temporal, Epicor, PostgreSQL or Teams.**

## Proposed package plan (names provisional, not published)
```text
FlowDocker-E-Request/
  apps/
    e-request-web/                 # pages/routing/backend API bindings (future code)
  packages/
    ui/                            # @flowdocker/ui — base primitives/theme
    flow-canvas/                   # @flowdocker/flow-canvas — graph editor visuals
    field-mapper/                  # @flowdocker/field-mapper — JSON tree and drag mapping
    flow-contracts/                # @flowdocker/flow-contracts — TS schemas/types
    domain-sync-ui/                # @flowdocker/sync-ui — sync-specific nodes/panels
    domain-approval-ui/            # @flowdocker/approval-ui — approvals-specific nodes/panels
  docs/
    39-FLOWDOCKER-COMPONENT-LIBRARY.md
    40-COMPONENT-EXTRACTION-ACCEPTANCE.md
```
The directory is **target architecture only**, not an assertion packages exist. Initial development can use workspace packages/private exports in one monorepo. Publish separately to a private registry only after versioning, compatibility and security gates pass. Separate reusable library into its own GitHub repo **only after** stable API and actual second consumer, not automatically.

## Reusable component catalog

### Foundation `@flowdocker/ui`
`FdButton`, `FdIconButton`, `FdInput`, `FdSelect`, `FdDialog`, `FdDrawer`, `FdTabs`, `FdDataTable`, `FdStatusBadge`, `FdAlert`, `FdTooltip`, `FdConfirmDialog`, `FdEmptyState`, `FdErrorState`, `FdLoadingSkeleton`, `FdFormField`, `FdMaskedSecretInput`, `FdAuditTimeline`, `FdPermissionGuard` (UX convenience only; never backend security).

### Graph toolkit `@flowdocker/flow-canvas`
`FlowCanvas`, `NodePalette`, `BaseNodeCard`, `BaseNodeHeader`, `PortHandle`, `EdgeWithLabel`, `NodePropertiesPanel`, `CanvasToolbar`, `CanvasMinimap`, `NodeValidationBadge`, `ExecutionStatusOverlay`, `NodeContextMenu`, `GraphEmptyState`, `GraphErrorSummary`.

### Mapper toolkit `@flowdocker/field-mapper`
`JsonTreeExplorer`, `FieldPathDragHandle`, `SchemaFieldList`, `TargetFieldSlot`, `MappingRow`, `TransformChainEditor`, `TypeCompatibilityBadge`, `MappingPreview`, `InputOutputInspector`, `ValidationErrorList`, `MaskedValuePreview`.

### Domain adapters (not generic)
- Sync: `EpicorSourceNode`, `GraphDeltaSourceNode`, `ParseJsonNode`, `SplitItemsNode`, `FilterNode`, `LookupJoinNode`, `MasterUpsertNode`, `SyncRunInspector`, `ConnectionHealthCard`.
- Approval: `ApproverAssignmentNode`, `IfElseDecisionNode`, `ParallelApprovalNode`, `RequestChangesNode`, `HumanTaskNode`, `PdfOutputNode`.
- Shared visual shell, **independent** execution schema and runtime rules. Generic components receive props/adapters instead of importing domain modules.

## Component contract & dependency inversion
```typescript
// Illustrative API contract only; not compilable production code.
type FlowCanvasProps<TNode, TEdge> = {
  nodes: readonly TNode[];
  edges: readonly TEdge[];
  nodeRenderers: Record<string, React.ComponentType<any>>; // narrow union in implementation
  readOnly?: boolean;
  onGraphChange(next: { nodes: TNode[]; edges: TEdge[] }): void;
  onNodeSelect?(nodeId: string | null): void;
  onConnectRequest?(from: string, to: string): void;
};

type MappingEditorProps = {
  inputSchema: unknown;               // validated schema object in real implementation
  targetSchema: unknown;
  mapping: unknown;                   // published typed mapping DSL
  sample?: unknown;                   // masked and bounded
  onChange(nextMapping: unknown): void;
  onTestMapping?: () => Promise<unknown>; // injected by host, never embedded API URL
};
```
**Do not ship the `any/unknown` placeholder types** shown above: implementation must use Zod/JSON schema or equivalent runtime-validated typed contracts. No hardcoded `fetch('/api/..')` inside reusable packages, no app-specific state store, no tenant ID, Epicor URL, DB query, or Temporal client.

Node renderer contract separates:
- **visual state** (`selected`, `invalid`, `running`, `error`, `readOnly`, port labels, output schema summary);
- **node config** (typed declarative config owned by host domain);
- **host actions** (callbacks for select, edit, validate, test step).

## Theme and design tokens
Use CSS custom properties for spacing, typography, radii, surfaces, borders, focus rings and semantic statuses; support light/dark themes and accessibility. Scope to **FlowDocker brand tokens**, not raw shadcn colors scattered in feature screens. Keep semantic statuses Success/Warning/Error independent from brand accent. Exact palette is **not yet confirmed for E-Request**; do not force DataFlow-specific green/volt palette without owner decision.

Tokens include:
`--fd-color-brand`, `--fd-surface-default`, `--fd-surface-raised`, `--fd-text-primary`, `--fd-text-muted`, `--fd-border`, `--fd-focus-ring`, `--fd-node-source`, `--fd-node-transform`, `--fd-node-target`, `--fd-status-success`, `--fd-status-warning`, `--fd-status-error`, `--fd-radius-sm`, `--fd-spacing-unit`.

Ensure keyboard navigation, ARIA labels, drag/drop alternate interactions and focus restoration for dialogs. Avoid declaring accessible solely because Radix was used; test real custom graph and mapper interactions.

## Packaging and ownership
- Favor a workspace library using TypeScript project references and explicit `exports`; no undocumented deep imports from `src/internal`.
- Every reusable component has public Props, controlled/uncontrolled semantics where appropriate, events/callbacks, variations, Storybook story, unit tests and consumer example.
- Use semantic versioning when package is distributed and a changelog for breaking changes; during workspace prototyping document migration as changes occur.
- Use composable slots/variants; avoid enormous `mode: 'sync' | 'approval'` conditionals in base components.
- Preserve OSS license/NOTICE, SBOM and exact dependencies for commercial/white-label potential.
- Keep host-level routing, API calls, secret handling and permission enforcement outside shared packages. A visual PermissionGuard never authorizes backend actions.

## Extraction gates
After each working vertical slice, identify generic components, move them to a package **without changing user-visible behavior**, then prove use in a standalone Storybook harness and a second host example (e.g. approval graph mock fixture). A reusable visual package can demonstrate two hosts without both execution engines being implemented. All production API/worker claims require separate evidence.

See [Extraction and Acceptance](40-COMPONENT-EXTRACTION-ACCEPTANCE.md) and [.agents skill](../.agents/skills/flowdocker-component-system/SKILL.md).

## Platform boundary expanded on 2026-10-28
The earlier UI-only Component Library is a **subset** of the new [FlowDocker Application Platform](41-FLOWDOCKER-APPLICATION-PLATFORM.md). Reuse now includes **Master Data Builder, Permission Builder, Identity, module manifest, API/authorization contracts and audit**, not only components. Keep the visual component packages app-independent; domain business handlers belong outside. See [Master Builder](42-REUSABLE-MASTER-DATA-BUILDER.md), [Permission Builder](43-REUSABLE-PERMISSION-BUILDER.md), [App Module Contract](44-APP-MODULE-CONTRACT.md) and [Vietnamese overview](46-FLOWDOCKER-PLATFORM-VI.md). Still design-only.
