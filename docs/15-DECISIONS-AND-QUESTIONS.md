# Decision Register (ADRs) and Open Questions

**Last reviewed:** 2026-10-27 · **Status:** design baseline, not deployed.

## Accepted product-direction decisions (from planning discussion)
| ADR | Decision | Consequence |
|---|---|---|
| ADR-001 | New app is **FlowDocker E-Request** | Repo `dinhvansh/FlowDocker-E-Request` |
| ADR-002 | Do **not** use E-Office Workflow Runtime V2 for new app | Workflow execution integration must be built/tested independently |
| ADR-003 | Dynamic Form Builder should use existing embeddable library | Form.io JS Core is preferred, subject to POC |
| ADR-004 | Workflow Designer based on Synergy Codes Workflow Builder CE | Custom typed IF/ELSE + Temporal integration needed |
| ADR-005 | Web and Teams use a **single** decision API | DB/task/audit is source of truth |
| ADR-006 | Teams V1 via custom Bot/Adaptive Card | Native Microsoft Approvals two-way sync is not promised |
| ADR-007 | PDF generated after approval, separate artifact status | PDF failures must not erase approved decision |
| ADR-008 | Payment approval separated from payment settlement | `APPROVED` is not `PAID` |
| ADR-009 | ONLYOFFICE Word review and signing **deferred to V2** | No AGPL/Editor dependency in V1 |
| ADR-010 | Public docs repo stores plans only and no company secrets | Scrub fixtures and configs; no production claims |

## Provisional technology preferences (not irrevocable ADRs)
PostgreSQL, Next.js/React, TypeScript, shadcn/ui; Valkey and SeaweedFS are candidate infrastructure components subject to performance/licensing/compatibility tests. Do not silently treat these as installed dependencies.

## Open decisions requiring owners
| ID | Owner | Question | Impact |
|---|---|---|---|
| Q-001 | Finance | Exact approval thresholds, currencies, limits and required attachments? | conditional rules |
| Q-002 | Finance | Is settlement manual, partial, reversible, or ERP-integrated? | payment state design |
| Q-003 | HR | Domestic/international definition and CEO approval rule? | Trip route |
| Q-004 | HR/Finance | Travel advance/expense claim in V1 or V2? | scope expansion |
| Q-005 | IT | Existing SSO/Entra tenant, Teams App permissions and bot hosting allowed? | Teams feasibility |
| Q-006 | IT/Compliance | Retention, encrypted storage and data residency? | storage/backup policy |
| Q-007 | Product | Multiple forms share one workflow? release governance and owner signoff? | authoring rules |
| Q-008 | Product | Request Changes restarts whole flow or selected steps? | currently whole restart |
| Q-009 | Tech lead | Verify Workflow Builder CE packages, SDK, engine semantics and pinned licenses? | POC gate |
| Q-010 | Product | Choose project license for original E-Request code/docs? | legal/release |
| Q-011 | IT | Power Automate DLP restrictions and whether native Approvals is a hard requirement? | bot-vs-native direction |

## Decision policy
Write an ADR before changing a core boundary. Every ADR has context, options, decision, consequences, date, reviewer, and compatibility/migration plan. Architecture diagrams and API contracts must be updated in the same PR.

## ADR-011: Master Data Hub (proposed; field ownership requires source-owner signoff)
Canonical E-Request master entities are fed read-only via Entra Graph, HR-approved source (actual system to discover), Epicor REST/BAQ or read-only SQL and approved local catalogs. Durable staging, idempotent promotion, mappings, soft delete, reconciliation and freshness/assignment checks are required. Form Studio references only safe internal lookup domains. [Architecture](25-MASTER-DATA-ARCHITECTURE.md) · [Sync Contracts](26-MASTER-DATA-SYNC-CONTRACTS.md).

**Still open:** HR system and authoritative manager/department, ERP company/vendor/finance field keys, safe incremental cursor, Graph permissions, stale-data thresholds, mapping owner, country/cost center policy. No source integration is marked implemented.
