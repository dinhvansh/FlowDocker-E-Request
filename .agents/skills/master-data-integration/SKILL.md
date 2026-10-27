---
name: master-data-integration
description: Design, implement and audit E-Request master data integration and sync from Microsoft Entra Graph, HR-approved sources, Epicor read-only ERP and Finance catalogs. Use for data lookup, employee/manager/department mapping, vendor/cost center synchronization, incremental cursors, source reconciliation, conflict handling, freshness and task reassignments.
compatibility: FlowDocker E-Request repo, Node.js/TypeScript connector workers and PostgreSQL 16+ test stack.
---

# Master Data Integration Skill — FlowDocker E-Request

## Inputs
Read `docs/25-MASTER-DATA-ARCHITECTURE.md`, `docs/26-MASTER-DATA-SYNC-CONTRACTS.md`, `docs/27-MASTER-DATA-GOVERNANCE.md`, `docs/28-MASTER-DATA-SEQUENCES.md`, `docs/29-MASTER-DATA-TEST-PLAN.md`, `docs/20-AUTHORIZATION-ARCHITECTURE.md` and `db/design/003_master_data_schema.sql`, `004_master_data_rls.sql`.

## Mandatory process
1. Inventory real source availability and obtain approval for Entra scopes, HR feed, Epicor API/BAQ/SQL read-only views. No presumed live credentials.
2. Build field-level source-of-truth matrix; record external stable composite keys, company scope, timezone, type and deletion semantics.
3. Separate authenticated identity from authoritative HR job/department/manager relationships. No joining by name/email.
4. Write connector discovery + deterministic paged read with bounded memory, rate-limit handling, retry and idempotent staging.
5. Build mapping and conflict queue, including duplicate keys, missing parents, stale attributes, schema drift and lifecycle changes.
6. Promote staged source changes into canonical UUID-keyed tables in transactions, advance checkpoint **only** after successful durable apply.
7. Add safe full reconciliation (including deletions), mass-inactivation guard, freshness monitoring and operator review.
8. Form.io lookup API uses tenant+company+role filtering and field projection. Workflow task assignee uses current verified active manager according to configured source ownership and fails closed when unknown.
9. Handle revocation and pending tasks explicitly. No rewriting historical approvals.
10. Add least-privilege PostgreSQL worker role and RLS policies; ensure SQL Server Epicor credentials are SELECT-only; never mutate external sources.
11. Run negative-first tests from docs/29 with real disposable database and approved sandbox APIs; record exact SHA, fixtures, run IDs, sanitized checkpoints and logs.
12. Mark implementation DONE only when actual connector, permissions, migrations, tests and recovery gates pass. Otherwise mark NOT DONE.

## Guardrails
No real employee records, bank details, Entra delta tokens, client secrets, Epicor credentials, private network addresses or production database dumps in this **public** repository. Reference SQL is not a deployed migration. No invented upstream fields like `SysRevID` or `SysRowID` until schema discovery verifies suitability. Critical employee activation/termination and approval assignment cannot rely on a weak periodic job alone.

## References
- [Agent Skills format](https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx)
- [Microsoft Graph delta](https://learn.microsoft.com/en-us/graph/delta-query-overview)
- [Epicor REST](https://www.epicor.com/en-us/products/enterprise-resource-planning-erp/kinetic/tools-and-technology/open-rest-api/)

## Connection Manager procedure (when task involves connectors/UX)
Read docs/30–33 and db/design/005_connections_extension.sql. Distinguish Connection, Source and Sync Pipeline. Never implement a one-click 'connect and sync everything' feature. Connector config and credentials must be versioned; real test verifies bounded READ with an approved account; credential rotation has staged test/promotion and rollback; disable requires impact analysis. Sync pipeline mapping, dry run and activation are separate governance steps. Unimplemented design does not equal connected source.
