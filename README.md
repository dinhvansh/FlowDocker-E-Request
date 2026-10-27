# FlowDocker E-Request

> **Status: DESIGN / PLANNING — no application code or production deployment yet.**  
> Product: Enterprise Request Management Platform · Scope: V1 Payment Request, Business Trip, dynamic forms, conditional workflows, Web/Teams approvals and PDF archive.

FlowDocker E-Request is a proposed self-hosted enterprise request portal. Employees submit business requests from administrator-defined forms, and published, versioned workflows assign approvals with IF/ELSE branching. Approvers can act through the web portal or a custom Microsoft Teams bot; final records and PDFs are archived with access control and audit trails.

## Key architectural choices

| Layer | Proposed choice | Status |
|---|---|---|
| Frontend | Next.js / React / TypeScript / shadcn/ui | Proposed |
| Dynamic forms | Form.io JS Core (builder + renderer) | Proposed; POC required |
| Workflow design | Synergy Codes Workflow Builder Community | Proposed; POC required |
| Workflow execution | Temporal | Proposed; POC required |
| API and durable data | Node.js / TypeScript / PostgreSQL | Proposed |
| Cache | Valkey (optional) | Proposed |
| Attachments / PDFs | Pluggable storage; evaluate SeaweedFS S3 API | Proposed |
| Teams channel | Custom Teams Bot + Adaptive Cards | Proposed; tenant permissions required |
| PDF generation | PDF service after final approval | Proposed |
| Word collaboration / ONLYOFFICE / signing | **V2, explicitly out of V1** | Deferred |

**Important boundaries:** This is a separate application design and does **not** use the existing E-Office Workflow Runtime V2. Graph editing does not by itself imply that every diagram is executable; publish-time compilation/validation and a tested Temporal executor are required. A custom Teams card is **not** an item in Microsoft's native Teams Approvals app.

**Tiếng Việt:** [Tổng quan thiết kế E-Request](docs/VI-TONG-QUAN.md) · **For Codex:** [First vertical slice handoff](docs/19-POC-HANDOFF.md).

## Documentation map

| Topic | Document |
|---|---|
| Scope, actors, non-goals | [Project Charter](docs/00-PROJECT-CHARTER.md) |
| Functional/non-functional requirements | [Requirements](docs/01-REQUIREMENTS.md) |
| System components and execution boundaries | [Architecture](docs/02-ARCHITECTURE.md) |
| Form schema, permissions, validation | [Dynamic Forms](docs/03-DYNAMIC-FORMS.md) |
| IF/ELSE, workflow DSL, human tasks | [Workflow Designer](docs/04-WORKFLOW-DESIGNER.md) |
| Web/Teams decision consistency | [Approvals & Teams](docs/05-APPROVAL-TEAMS.md) |
| Persistence model | [Data Model](docs/06-DATA-MODEL.md) |
| Proposed HTTP API | [API Contract](docs/07-API-CONTRACT.md) |
| Eight end-to-end Mermaid diagrams | [Sequence Diagrams](docs/08-SEQUENCE-DIAGRAMS.md) |
| Payment Request workflow | [Payment](docs/09-PAYMENT-REQUEST.md) |
| Business Trip workflow | [Business Trip](docs/10-BUSINESS-TRIP.md) |
| Security and quality requirements | [Security & NFR](docs/11-SECURITY-NFR.md) |
| License decision register | [Licensing](docs/12-LICENSE-REGISTER.md) |
| Phases and exit gates | [Roadmap](docs/13-IMPLEMENTATION-ROADMAP.md) |
| Test cases and UAT evidence | [Acceptance Tests](docs/14-ACCEPTANCE-TESTS.md) |
| Architecture decisions/open questions | [ADRs & Open Questions](docs/15-DECISIONS-AND-QUESTIONS.md) |
| Screens and role journeys | [UX / IA](docs/16-UX-INFORMATION-ARCHITECTURE.md) |
| Environments and deployment | [Deployment Plan](docs/17-DEPLOYMENT-PLAN.md) |
| Word review, signatures | [V2 Backlog](docs/18-V2-DOCUMENT-REVIEW.md) |
| AI contributor instructions | [AGENTS.md](AGENTS.md) |

## Default request lifecycle

`DRAFT → SUBMITTED → IN_APPROVAL → APPROVED/REJECTED` with `CHANGES_REQUESTED` and `CANCELLED` paths. Payment settlement and PDF artifact delivery have **separate statuses**. Request submissions snapshot an immutable form version, workflow version and their validated business data. Revisions after return are retained with audit history.

## Scope and assumptions

- This repository currently documents an **implementation plan**, not finished or tested software.
- Example employees, names, monetary thresholds and policies are placeholders; business owners must confirm real rules.
- Microsoft Teams approvals in V1 refer to a **custom Teams Bot + Adaptive Cards**, not the native Approvals application.
- V1 does not require ONLYOFFICE. The optional V2 document review module must undergo separate licensing/compliance review.
- Before production: confirm integration/package licenses **at pinned versions**, security controls, identity/Teams tenant permissions, DLP and real UAT.

See [Implementation Roadmap](docs/13-IMPLEMENTATION-ROADMAP.md) for the phase-by-phase acceptance gates.

Copyright / project license: **not yet selected**. Do not assume that upstream OSS licenses automatically license this repository's original code or docs.


## Detailed data-layer and authorization design (new)

Before implementation, read the [Authorization architecture](docs/20-AUTHORIZATION-ARCHITECTURE.md), [Permission matrix](docs/21-PERMISSION-MATRIX.md), [Physical data layer](docs/22-DATA-LAYER-PHYSICAL-DESIGN.md), [PostgreSQL RLS operations](docs/23-POSTGRESQL-RLS-OPERATIONS.md) and [Negative-first authorization tests](docs/24-AUTHORIZATION-TEST-PLAN.md).

Codex project skill: [`.agents/skills/authorization-design/SKILL.md`](.agents/skills/authorization-design/SKILL.md), following the [Agent Skills format](https://github.com/agentskills/agentskills). Reference PostgreSQL DDL: [001_core_schema.sql](db/design/001_core_schema.sql) and [002_rls_policies.sql](db/design/002_rls_policies.sql). **These SQL files are reference designs, not applied migrations or security-verified policies.**

## Master Data Hub: sources and synchronization (DESIGN, not yet running)
[Source ownership and architecture](docs/25-MASTER-DATA-ARCHITECTURE.md) · [Connector/delta/full sync](docs/26-MASTER-DATA-SYNC-CONTRACTS.md) · [Governance/freshness](docs/27-MASTER-DATA-GOVERNANCE.md) · [5 sequence diagrams](docs/28-MASTER-DATA-SEQUENCES.md) · [35 test scenarios](docs/29-MASTER-DATA-TEST-PLAN.md). Reference SQL: [003 schema](db/design/003_master_data_schema.sql) and [004 RLS](db/design/004_master_data_rls.sql). [Codex Skill](.agents/skills/master-data-integration/SKILL.md).

Entra identity, HR-owned organization data (actual source unknown), Epicor read-only business master, and internal policy catalogs are proposed sources; there are no live credentials or implemented connectors. Form.io and workflow rules query tenant-scoped E-Request canonical masters, never the upstream servers directly.
