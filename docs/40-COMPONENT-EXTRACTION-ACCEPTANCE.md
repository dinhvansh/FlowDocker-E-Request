# FlowDocker Component Extraction — Implementation Plan and Acceptance

**Status: PLANNED, no component packages created or tested.**

## Definition of reusable, not merely duplicated JSX
A component is **reusable** only when (1) UI behavior is independent of E-Request API/domain-specific imports, (2) its public input/output contract is typed and documented, (3) theme and CSS do not leak to host, (4) keyboard/accessibility behavior works, (5) it renders in a development harness without production credentials or network, (6) its dependency/license footprint is reviewed.

## Extraction stages
| Stage | Deliverable | Gate |
|---|---|---|
| C0 | Agree names, tokens, path aliases, workspace/build strategy | architecture ADR + owner review |
| C1 | Base `ui` tokens/primitives used on Connections and Flow Studio | Storybook stories, light/dark, a11y tests |
| C2 | Canvas shell, graph/node/port components on Sync Flow Studio | editing/saving, mini-map, keyboard navigation, read-only mode |
| C3 | Visual Field Mapper, JSON tree, input/output inspector | drag field mapping, typed validation, synthetic preview |
| C4 | Package boundaries `flow-contracts`, `flow-canvas`, `field-mapper`; no hidden app dependencies | build/typecheck/lint, import/public exports test |
| C5 | Approval Studio **visual-only consumer** example (mock, no Temporal claim) | same `FlowCanvas` works with approval-specific node renderers |
| C6 | Versioned docs, examples, CI compatibility & release check | change log + compatibility matrix, SBOM, license review |

## Practical order and owner workflow
1. Build a **real vertical slice** of Sync Flow Studio, but extract reusable primitives as early as the first stable UI behavior; do **not** postpone all component work until the project ends.
2. First consumer E-Request/Sync Studio. Second consumer e.g. E-Request/Approval Studio visuals or isolated Storybook scenario.
3. Leave node execution, checkpoint, graph compiler and API authorization in app/business packages. A fake approval UI story proves visual reuse only.
4. When a reusable component evolves, add variant/slot under a typed contract rather than copy-and-paste new almost-identical JSX.
5. If design cannot be generic without excessive branches, keep it in domain package; only share generic parts.

## Mandatory component checklist
- Public export, controlled props, callbacks, error/empty/loading/read-only states.
- CSS variables / theme tokens; semantic success/warning/error, keyboard focus/ARIA.
- Storybook demonstrating default, selected/disabled/error, loading, light/dark and long text.
- Unit tests for contract, events and type-safe mapping; visual-regression snapshots where practical.
- Integration test with host adapters and synthetic data; no hardcoded endpoint/tenant/secret.
- Dependency list with OSS licenses; preserve attribution/NOTICE.
- Versioning strategy, changelog/migration notes for breaking API changes.
- Demonstrated integration into at least two independent host contexts if called platform-ready.

## Example component testing scenarios
| Test | Expected |
|---|---|
| UI-01 BaseNodeCard with two domain node renderers | no import from sync/approval engine |
| UI-02 FlowCanvas accepts synthetic sync and approval graphs | shared visuals, independent node config |
| UI-03 FieldMapper nested JSON source → target type | event emits stable, typed mapping |
| UI-04 FieldMapper wrong target type | error indicator; host validator invoked |
| UI-05 Dialog and node properties keyboard navigation | focus order and escape behavior |
| UI-06 Invalid node, stale preview and loading states | accessible status text, no color-only warnings |
| UI-07 Theme switch light↔dark | token-consistent surfaces and contrast |
| UI-08 Component package build without app source | succeeds, explicit public exports |
| UI-09 Storybook in isolation, network blocked | renders synthetic fixtures |
| UI-10 Component dependency audit | license/notice/SBOM documented |
| UI-11 Long source field path, i18n Vietnamese/English | no overflow, labels localizable |
| UI-12 Approval visual consumer reuses FlowCanvas | no Temporal dependency transitively in graph toolkit |

## Work completion classification
- **DONE** means extracted/implemented and tested with evidence, SHA, and consumer examples.
- **NOT DONE** means design accepted but package has no actual code.
- A mock Storybook story is **not** proof of a functioning Epicor connector, approval engine, or production integration.

## Non-goals
Do not clone n8n editor or represent third-party `@xyflow/react` as our proprietary code. Do not split into extra repositories/npm publications before APIs stabilize. Do not turn component extraction into refactoring business logic and changing approval rules in the same PR.
