# FlowDocker Master Data Builder — Reusable Schema/Catalog Platform

**Status: DESIGN ONLY, not implemented.** Not every dynamic entity is safe to express as a generic catalog.

## Goal
In any FlowDocker app, an authorized admin can configure common catalogs such as `Department`, `Location`, `Asset Category`, `Expense Type`, `Vendor` through a reusable **Master Data Builder**, while preserving source ownership (Entra/HR/Epicor/local), typed keys, tenant/organization scopes and audit history.

## Experience: Administration → Master Data → Entity Builder
```text
MASTER DATA BUILDER                    [+ Create Entity]
Entities | Definitions | Records | Sources | Mapping | Sync | Quality
─────────────────────────────────────────────────────────────────
Entity: Asset Category  [DRAFT v3]    [Preview] [Validate] [Publish]
Details: key = asset_category, owner=IT, source=Local, scope=Tenant
 ┌─ FIELD DESIGNER ─────┐ ┌─ SCHEMA CANVAS ─────────────────────────┐
 │ Text, Number, Date   │ │ code            Text      Required/Key │
 │ Boolean, Enum        │ │ name            Text      Required     │
 │ Entity Reference     │ │ active          Bool      Default True │
 │ System / Audit Field │ │ depreciation    Enum      Restricted   │
 └──────────────────────┘ └─────────────────────────────────────────┘
Relations: Location?   Validation: unique code    Field Policy: role
[Sample CRUD Preview] [Test API Rules] [Publish Version]
```
After publish, the platform can generate a tenant-scoped **simple admin CRUD list/form, lookup endpoint, typed schema and audit** for that catalog without writing the app's business page. Domain APIs use the catalog by typed ID and must validate against active/current master state on submission.

## Entity types and ownership
| Entity kind | CRUD ownership | Example | Implementation mode |
|---|---|---|---|
| `LOCAL_CATALOG` | Business admin | Travel reason, Asset Category | Metadata-defined CRUD permitted |
| `EXTERNAL_MIRROR` | Entra/HR/Epicor source owner | Vendor, employee, company, cost center | Read-only canonical mirror; corrections originate upstream |
| `COMPOSITE_READ_MODEL` | Governed field-level precedence | Employee directory + HR profile/manager | Only orchestrated/import workers write; admin resolves mappings |
| `DOMAIN_ENTITY` | App business module | Payment, IT asset custody, legal contract | **Dedicated typed tables/services**, not generic catalog mutations |

## Configuration steps
1. **Create Entity:** unique technical key, tenant/app scope, business owner, purpose, `LOCAL_CATALOG/EXTERNAL_MIRROR/COMPOSITE`, retention classification.
2. **Field Designer:** stable keys, types, required/default/range, unique indexes, search/display labels, field classifications, reference relationships.
3. **Source & Ownership:** local, connection/sync pipeline or combination; assign field owner/priority, external stable keys, company scope, soft-delete strategy.
4. **Access:** bind to Permission Builder registered `master:<entity>:read/create/update/archive/import`, per field and scope, include sensitive masking.
5. **Preview & Validate:** build typed schema, example CRUD/lookup, safe query and indexes, migration impact; no production writes.
6. **Publish:** immutable version + reviewer; generate safe CRUD/lookup views and registration for domain modules. Data migration for changed types/references is separately reviewed.
7. **Operate:** import/sync, records, conflict queue, duplicate handling, effective dating and audit.

## Template for metadata definition (example, not executable migration)
```json
{
  "entityKey": "asset_category",
  "version": 1,
  "scope": "TENANT",
  "kind": "LOCAL_CATALOG",
  "owner": "IT",
  "fields": [
    {"key":"code","type":"string","required":true,"unique":true},
    {"key":"name","type":"string","required":true},
    {"key":"active","type":"boolean","default":true}
  ],
  "displayField": "name",
  "primaryBusinessKey": ["code"],
  "capabilities": ["READ","CREATE","UPDATE","ARCHIVE"],
  "lookupPolicy": {"onlyActive":true}
}
```
Use Zod/JSON Schema or equivalent for runtime validation and typed generated client. **Do not expose executable SQL, JS or arbitrary HTTP in admin config.**

## Generic data persistence strategy
- Use a **metadata registry** with immutable definitions/versions and stable `entity_key`; keep a runtime catalog for approved simple local data.
- For simple low-risk catalogs, generic `master_catalog_records` with `tenant_id, app_id, entity_definition_id, business_key, data_jsonb, status, version, source_identity, audit` may be acceptable **only** with safe runtime schema validation, strict per-entity index/query controls, row authorization and field masking. Document expected volume/performance.
- For externally sourced high-volume catalogs, employee/HR and financial vendors: **prefer typed canonical tables**, such as the previously designed `master_vendors`, `master_companies` and `master_cost_centers`. Do **not** indiscriminately migrate all ERP data into one EAV/JSON table.
- Do not silently change published record shape when schema version changes; migrate/backfill/maintain old read-compatible snapshots.
- Foreign keys from financial business tables should point to typed canonical masters where integrity requires database FKs, not arbitrary JSON text.
- Source ID, external key, company key and effective status are separate from friendly display labels.

## Builder vs data sync
- Builder defines entity/field ownership and safe CRUD shape.
- Connection Manager stores approved source endpoint/credential references.
- Flow Studio handles Source → RAW/Staging → Parse/Map/Join/Validate → Upsert canonical.
- Runtime Lookup API returns permission-scoped, field-masked records. It does not permit Form.io widgets to directly query ERP.
- An external-owned master is **read-only in catalog UI** by default; the data steward resolves source mapping/conflicts rather than silently overwriting source.

## Standard APIs (conceptual, NOT implemented)
`POST /platform/master/entities`, `PATCH /platform/master/entities/{id}/draft`, `POST /platform/master/entities/{id}/validate`, `POST /platform/master/entities/{id}/publish`, `GET /platform/master/entities/{key}/lookup`, `GET/POST/PATCH /platform/master/catalogs/{key}/records` for allowed LOCAL_CATALOG only, `POST .../archive`; source-managed entity mutations cannot use generic POST/PATCH.

## Edge rules
An entity can be referenced by multiple apps only when explicitly marked shared with approved tenant/app scopes and consistent source-of-truth. A local app cannot create a fake employee row and automatically grant Entra login. Dangerous changes (new required key, changed type, new unique constraint) need migration plan and validation before publishing. Bulk import/archival needs review and mass-inactivation guard.

## Example reuse
**E-Request:** expense_types, travel_purpose, vendor lookup (externally mirrored), cost center. **IT Assets:** asset_categories, sites, asset_statuses. Both share Builder shell, publishing and permissions, not their app-specific transaction logic.

## Implementation acceptance
Two independent synthetic catalogs defined/published, complete CRUD/lookup with isolation, field masking, stale revision behavior; external Vendor mirror cannot be edited via generic local endpoint; source mapping data quality and access tests pass. See [Platform QA](45-PLATFORM-ACCEPTANCE-AND-ROADMAP.md).
