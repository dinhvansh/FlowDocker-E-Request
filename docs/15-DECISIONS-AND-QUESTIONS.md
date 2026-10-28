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

## ADR-012: Visual Master Data Flow Studio (2026-10-28)
Requested node-based sync and visual mapping analogous to n8n UX, with Parse JSON, Split Items, Filter, Lookup/Join, drag field mapping, Validate and Upsert. **Decision:** use candidate MIT React Flow to implement an **original** Master Data graph UI, a typed, bounded source→RAW/STAGING→canonical executor and graph-version pinning. Distinguish Connection, Sync Flow and Request Approval Workflow Studio. Don't embed/copy n8n editor/runtime under an assumption of free OEM rights. Compiler/runtime capabilities and chosen OSS package versions require executable POC and license evidence. [Spec](34-MASTER-DATA-FLOW-STUDIO.md) · [Mapping](35-MAPPING-EDITOR-EXECUTION.md).

## ADR-013: FlowDocker-owned reusable Component System (2026-10-28 — owner requirement)
The product UI must be standardized as **reusable FlowDocker components** across screens, other FlowDocker apps and especially both graph-based studios. Preferred boundaries are base UI/tokens, canvas primitives, visual mapper, typed shared UI contracts, with Sync-specific and Approval-specific node adapters. Reuse **visual/editor infrastructure**, not execution engines. Extract working, stable primitives during implementation and test them in isolated Storybook/second visual host; follow docs/39–40 and `.agents/skills/flowdocker-component-system/SKILL.md`. Third-party React Flow/shadcn remain third-party licensed components. Package publishing/separate repository and E-Request brand palette still require explicit later decisions. **No component code has been implemented or validated yet.**

## ADR-014: FlowDocker Application Platform ("vỏ có sẵn, chỉ làm ruột"), owner requirement 2026-10-28
Beyond UI component reuse, create a versioned reusable application foundation: App Shell, Identity/Org, Master Data Builder/catalog registry, Permission Builder + backend PDP/PEP, Connections/Sync, Form and Approval studios, Audit/Notification. New apps publish a validated `AppManifest` and implement only domain-specific business handlers/tables/rules. **Master Data Builder and Permission Builder are platform modules, not E-Request-specific screens.** No-code local catalogs can use generic safe CRUD; payment, HR and asset transactions require dedicated typed services. Pilot inside E-Request, then verify a second synthetic app; decide separate platform repo only after real package stability. Architecture refs docs/41–46, SQL 007. All outcomes remain DESIGN, not implemented.

## ADR-015: Mandatory UI/UX Pro Max five-stage process (2026-10-28)
Owner defines design delivery lifecycle **UX Research → UI/UX Design → Design Audit → Interactive Prototype → Design to Code** for every new FlowDocker app or significant interface redesign. Use upstream UI/UX Pro Max guidance with project skill, deliverables and explicit quality gates. The existing HTML mock was criticized as "old AI template"; objective design direction now emphasizes task-first enterprise tooling and a resizable/data-rich Sync Flow workbench, not hero/KPI card decorations. See docs/47–49 and `.agents/skills/flowdocker-ux-design-process/SKILL.md`. Audit is heuristic; no actual user research/interviews occurred. No new prototype or React component code is claimed.
