# FlowDocker E-Request

> **Status: frontend PR 1 prototype in progress.** Master Data Builder và Permission Builder chạy với dữ liệu tổng hợp trong trình duyệt; chưa có backend hay production deployment.
> Product: Enterprise Request Management Platform · Scope: V1 Payment Request, Business Trip, dynamic forms, conditional workflows, Web/Teams approvals and PDF archive.

FlowDocker E-Request is a proposed self-hosted enterprise request portal. Employees submit business requests from administrator-defined forms, and published, versioned workflows assign approvals with IF/ELSE branching. Approvers can act through the web portal or a custom Microsoft Teams bot; final records and PDFs are archived with access control and audit trails.

## Frontend PR 1 — chạy local

Yêu cầu Node.js 24 và npm 11 (phiên bản đã kiểm thử):

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. Kiểm tra bằng `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`. Ứng dụng hiện có điều hướng, theme sáng/tối, Master Data Builder và Permission Builder tương tác với mock service typed trong `localStorage`. Nhánh PR 2 bổ sung Connection Manager (lưu metadata bản nháp), Flow Studio dùng React Flow (sơ đồ và dry run tổng hợp), và User Profile demo mở bằng avatar góc trái dưới. Kiểm tra kết nối thật, kích hoạt, publish và đồng bộ vẫn cần backend; không nhập secret hoặc endpoint nội bộ. Application Builder là PR 3. Xem [UX và ranh giới PR 1](docs/51-PR1-FRONTEND-UX-AND-IMPLEMENTATION.md), [phạm vi PR 2](docs/52-PR2-CONNECTIONS-FLOW-PROFILE.md).

Sau khi cập nhật `vite.config.ts` hoặc Tailwind, hãy dừng rồi chạy lại dev server trên cổng 5173 và tải lại trang. Vite đang chạy từ cấu hình cũ có thể render component shadcn/ui mà không biên dịch utility CSS, khiến button và dropdown bị mất kiểu dáng.

Giao diện dùng trắng–đỏ và font Inter (Latin + tiếng Việt) đóng gói cùng ứng dụng. `@flowdocker/ui` dùng source shadcn/ui tạo bằng CLI trên Radix cho Button, Badge, Input, Checkbox, Select, Dialog, Tabs và Table; các Builder vẫn gọi qua API component chung của FlowDocker. Các ô chọn không mở menu mặc định của Chrome.

UI primitives có [isolated examples](packages/ui/examples/main.tsx) tại `npm run examples:ui` (cổng Vite in ra terminal); không cần backend.

Skill [shadcn/ui chính thức](.agents/skills/shadcn/SKILL.md) đã được cài trong dự án từ [shadcn-ui/ui](https://github.com/shadcn-ui/ui/tree/main/skills/shadcn). Các phần UI tiếp theo dùng skill này cùng quy tắc FlowDocker trong `AGENTS.md`, tái sử dụng `@flowdocker/ui`, token chung và nền song ngữ Việt–Anh.

Form Studio tại `#forms` dùng [engine FlowDocker tự phát triển](docs/56-FLOWDOCKER-FORMS-PRODUCT.md), 33 loại trường, điều kiện, phép tính và preview cục bộ. [UX V2](docs/58-FORMS-UX-V2-IMPLEMENTATION.md) bổ sung toolbox theo nhóm, canvas input thật dùng chung renderer, inspector theo ngữ cảnh, Designer/Preview/Logic/JSON, mẫu thanh toán và chế độ mobile. Package dùng chung [`@flowdocker/form-builder`](packages/form-builder/README.md) có ví dụ riêng qua `npm run examples:forms`. Theo quyết định owner trong Issue #3: giữ engine riêng, không tích hợp hay tiếp tục POC so sánh Form.io. Backend, phát hành và phê duyệt thật chưa được triển khai.

## Key architectural choices

| Layer | Proposed choice | Status |
|---|---|---|
| Frontend | Next.js / React / TypeScript / shadcn/ui | Proposed |
| Dynamic forms | Original FlowDocker Forms engine + UX V2 designer | Frontend implemented; owner visual acceptance pending; see docs/57–58 |
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

- Phần nghiệp vụ E-Request và backend vẫn là **thiết kế/chưa kiểm thử**; frontend PR 1 là prototype cục bộ, không phải phần mềm production.
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

## Connection Manager and guided Sync Setup — UX design

Connections is **separate** from Sync Pipelines. A reusable endpoint/credential profile is created with a 4-step wizard: Select Connector → Configure → Real Test → Save/Activate. An independent 5-step Sync Wizard selects approved data entities → discovers fields → maps canonical schema → chooses Full/Incremental and schedule → dry-run/publish/initial sync. No test/save action starts an automatic sync.

- [Thiết kế Connections tiếng Việt](docs/33-CONNECTIONS-USER-FLOWS-VI.md)
- [Detailed UX and operations](docs/30-CONNECTIONS-UX-FLOWS.md)
- [Six Connection sequence diagrams](docs/31-CONNECTIONS-SEQUENCE-DIAGRAMS.md)
- [API/data/security/acceptance contracts](docs/32-CONNECTIONS-API-DATA-CONTRACT.md)
- [SQL reference 005](db/design/005_connections_extension.sql)

**Status: design only**; no live connection, secret vault, UI, migrations or tests claimed.

## Node-based Master Data Flow Studio (NEW DESIGN 2026-10-28)
**Replaces a mapping-only wizard with an n8n-style drag-and-drop graph editor, without embedding n8n code.** UI built with candidate MIT `@xyflow/react`; custom typed batch runtime separates **Source → RAW/STAGING** from **Transform/Join/Field Mapping → Validate → Canonical Upsert**. Supports optional Parse JSON, Split Items, visual source JSON → target field drag/drop, node-level input/output previews, safe Dry Run, immutable graph versions and retries. Approval Workflow Studio stays a separate product module.

- [Tiếng Việt: Flow Studio node & kéo mapping](docs/38-SYNC-FLOW-STUDIO-VI.md)
- [Detailed Flow Studio UX/architecture](docs/34-MASTER-DATA-FLOW-STUDIO.md)
- [Visual Mapper and typed execution contracts](docs/35-MAPPING-EDITOR-EXECUTION.md)
- [5 Flow Sequence Diagrams](docs/36-SYNC-FLOW-SEQUENCES.md)
- [27 QA scenarios](docs/37-SYNC-FLOW-QA-PLAN.md)
- [Graph/version/lineage SQL reference 006](db/design/006_node_sync_graphs.sql)

**Status: design only, nothing running.** n8n Sustainable Use License does not grant blanket rights to embed n8n editor/runtime in a resold product.

## FlowDocker Component System — reusable components are a project requirement
The E-Request UI is the first consumer of a **FlowDocker-owned reusable component library**, not a collection of app-specific copies. Component extraction is part of each completed vertical slice, not just a post-project cleanup. Platform UI, graph canvas and visual field mapper are reusable across Master Data Flow Studio and Approval Workflow Studio; domain-specific node configurations and executors remain separate.

- [Component library architecture and catalogs](docs/39-FLOWDOCKER-COMPONENT-LIBRARY.md)
- [Extraction plan, quality gates and 12 acceptance scenarios](docs/40-COMPONENT-EXTRACTION-ACCEPTANCE.md)
- [Component-system Agent Skill for Codex](.agents/skills/flowdocker-component-system/SKILL.md)

Proposed workspace packages `@flowdocker/ui`, `@flowdocker/flow-canvas`, `@flowdocker/field-mapper`, `@flowdocker/flow-contracts` and domain adapters are **design targets only**, not published packages or built application code. The repository's own license remains undecided.

## FlowDocker Application Platform — "Build the shell once, write the business core"

**Owner requirement (2026-10-28):** Beyond reusable UI components, extract an **application platform** with shared App Shell, Identity/Organization, Permission Builder (roles, actions, scope, field masking, test access), Master Data Builder (entity schema, catalog CRUD/lookup, source ownership), Connection Manager, Data Flow Studio, Form/Approval Studios, audit and notification adapters. New apps register a versioned App/Module Manifest and implement **only business-specific typed handlers, tables and tests**. Generic catalog CRUD does **not** replace sensitive domain transaction code.

- [Tổng quan nền tảng bằng tiếng Việt](docs/46-FLOWDOCKER-PLATFORM-VI.md)
- [Platform Architecture](docs/41-FLOWDOCKER-APPLICATION-PLATFORM.md)
- [Reusable Master Data Builder](docs/42-REUSABLE-MASTER-DATA-BUILDER.md)
- [Reusable Permission Builder](docs/43-REUSABLE-PERMISSION-BUILDER.md)
- [App Manifest / Business Module extension contract](docs/44-APP-MODULE-CONTRACT.md)
- [Platform rollout / multi-app QA](docs/45-PLATFORM-ACCEPTANCE-AND-ROADMAP.md)
- [Reference PostgreSQL schema 007](db/design/007_platform_foundation.sql)
- [FlowDocker app-platform Agent Skill](.agents/skills/flowdocker-app-platform/SKILL.md)

**These are DESIGN artifacts.** There is currently no working platform/package/CLI/policy builder or standalone new app, no migrations/tests run. No new repository has been created. Source repo remains FlowDocker E-Request until compatibility and second-consumer evidence justify extraction.

## Mandatory UX Research → Design → Audit → Prototype → Design to Code
**Owner's five-stage process for all FlowDocker screens** is recorded in [UX/UI Process](docs/47-UX-RESEARCH-TO-DESIGN-TO-CODE.md), with a [heuristic audit of the old FlowDocker HTML prototype](docs/48-V1-PROTOTYPE-AUDIT-AND-UX-RESEARCH.md) and a [task-first enterprise console redesign brief](docs/49-FLOWDOCKER-UI-REDESIGN-BRIEF.md). All Codex UI work must first read [FlowDocker UX Design Process Agent Skill](.agents/skills/flowdocker-ux-design-process/SKILL.md) and upstream UI/UX Pro Max guidance. The audit is screenshot-based, **not** proof of usability interviews; the redesigned interactive prototype and Design-to-Code are **NOT DONE**.


## UI technology selection (owner decision)
**No mandatory Ant Design.** Each screen/library is chosen based on actual UX flows and task needs, design freedom, accessibility, maintainability, performance and reusable FlowDocker component boundaries. [ADR-016: UI Stack Selection Principles](docs/50-UI-STACK-SELECTION-PRINCIPLES.md) details candidate shadcn/ui, Radix/Base UI, TanStack Table, React Flow, dnd-kit, and the conditions for using Ant Design selectively. **This is a selection policy, not implemented code.**

## Frontend PR 3 — Application Builder
Application Builder hỗ trợ danh sách/tìm kiếm ứng dụng, chọn module, kiểm tra manifest nháp và lưu cục bộ. Có fixture E-Request và IT Assets tổng hợp; không có server registry, chuyển app thật, cấp quyền hoặc publish. Xem docs/53-PR3-APPLICATION-BUILDER.md.

## Vietnamese / English foundation
The topbar language picker switches between Vietnamese and English and remembers the selection. All current application screens and the isolated UI examples use the shared private `@flowdocker/i18n` package, including Connections, Flow Studio, Permissions and Profile. New UI must ship in both languages; `npm run i18n:check` is included in lint. User-entered data and technical IDs stay unchanged. See [i18n foundation and coverage](docs/54-BILINGUAL-I18N-FOUNDATION.md).
