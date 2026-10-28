---
name: flowdocker-component-system
description: Standardize and extract original reusable FlowDocker UI components, graph canvas nodes, field mapper and theme tokens from E-Request. Use whenever building or editing Connections, Master Data Flow Studio, Approval Workflow Studio, or reusable UI; enforce package boundaries, typed public APIs, storybook/examples, accessibility and versioning.
compatibility: FlowDocker E-Request repository, React/TypeScript UI, candidate @xyflow/react and shadcn/Radix components.
---

# FlowDocker Component System Skill

## First read
- `docs/39-FLOWDOCKER-COMPONENT-LIBRARY.md`
- `docs/40-COMPONENT-EXTRACTION-ACCEPTANCE.md`
- `docs/34-MASTER-DATA-FLOW-STUDIO.md`
- `AGENTS.md`

## Mandatory procedure
1. Before implementing UI, label each component as **platform primitive**, **graph/mapper toolkit**, **domain adapter**, or **app-specific page**. Explain why.
2. Choose FlowDocker tokens and public typed Props; prevent app-specific endpoints, DB calls, Temporal or Epicor imports in generic component packages.
3. Build reusable, composable and accessible components with story fixtures and visible error/loading/read-only states.
4. Derive Sync Node and Approval Node visuals from reusable BaseNodeCard/FlowCanvas, without mixing their execution logic.
5. For drag mapping, separate JSON Tree/Field Slots/Transform Editor visual package from mapper DSL evaluation and master sync worker.
6. Add unit/typecheck/interaction tests and Storybook or equivalent isolated harness; include a second host example when claiming platform-ready.
7. When refactoring extracted code, preserve functional behavior; use focused commits/PRs and check import boundaries.
8. Review dependency package licenses (MIT/other) and preserve NOTICE; never copy n8n source without appropriate rights review.
9. Record version and public API changes; keep both design docs and `README.md` aligned.
10. Claim **DONE** only when package code, tests, build and reproducible evidence are present.

## Do not
- Treat React Flow or shadcn as originally authored by FlowDocker.
- Add arbitrary JS/SQL/URL execution into node visual components.
- Copy UI JSX into each Studio rather than creating a stable public base component.
- Create a published npm package prematurely or claim release without evidence.
- Expose employee/finance data in stories, docs or public Git.

## Acceptance
Use [12 reusable UI acceptance tests](../../../docs/40-COMPONENT-EXTRACTION-ACCEPTANCE.md); report exact SHA, build commands, story/test evidence, consumers and remaining blockers.

## Precondition — five-stage UX/UI Pro process
Before implementing or extracting any UI component for FlowDocker, read `.agents/skills/flowdocker-ux-design-process/SKILL.md`, docs/47–49, and follow **UX Research → UI/UX Design → Design Audit → Interactive Prototype → Design to Code**. Component extraction is the **Design to Code** stage, not a substitute for research/audit/interactive usability checks. Avoid standardizing an unreviewed generic AI template.
