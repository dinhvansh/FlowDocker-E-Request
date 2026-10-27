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
