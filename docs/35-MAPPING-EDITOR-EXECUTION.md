# Visual Field Mapper & Node Execution Contract

**STATUS: DESIGN ONLY — not implemented.** Complement to [Flow Studio](34-MASTER-DATA-FLOW-STUDIO.md).

## Sample input
An Epicor-compatible, **fictional** vendor projection returns:
```json
{"Company": "ABC", "VendorNum": 1205, "Name": "Supplier A", "Inactive": false}
```
Do **not** assume actual Epicor BAQ/SQL fields have these names; user must discover/approve source schema.

## Visual mapper experience
```text
┌─ INPUT: VendorRow ────────────┬─ TRANSFORM ────────────┬─ OUTPUT: master_vendors ───────┐
│ Company        "ABC"    ──────┼─ Lookup Company.code ──┼──▶ company_id : uuid [required]│
│ VendorNum      1205     ──────┼─ ToString              ┼──▶ vendor_external_key : text   │
│ Name           "Supplier A"───┼─ Trim                  ┼──▶ display_name : text          │
│ Inactive       false    ──────┼─ Invert + EnumMap      ┼──▶ lifecycle_state : enum       │
└───────────────────────────────┴────────────────────────┴───────────────────────────────┘
 Source preview (sanitized) | Mapped preview | Mapping errors | Test field | Schema version
```

Dragging field paths into target slots creates bindings. User can view, edit and test individual binding without code. Field tree supports nested JSON e.g. `$.data.items[*].vendorName`, arrays and repeated row paths; array expansion belongs in Extract Items node rather than implicit unstable mapper expansion.

## Internal declarative mapping model (example, not n8n syntax)
```json
{
  "version": 1,
  "target": "master_vendors",
  "bindings": [
    {"targetField":"company_id","sourcePath":"$.Company",
     "transforms":[{"op":"lookup","dataset":"master_companies","matchField":"code","onMissing":"QUARANTINE"}]},
    {"targetField":"vendor_external_key","sourcePath":"$.VendorNum",
     "transforms":[{"op":"to_string"}]},
    {"targetField":"display_name","sourcePath":"$.Name",
     "transforms":[{"op":"trim"}]},
    {"targetField":"lifecycle_state","sourcePath":"$.Inactive",
     "transforms":[{"op":"boolean_invert"},{"op":"enum_map","true":"ACTIVE","false":"INACTIVE"}]}
  ]
}
```

**Inverted boolean mapping semantics:** Example `Inactive=false` → boolean invert `true` → enum `ACTIVE`. The compiler must type-check transforms (including enum values) and expose the intermediate value to user.

## Node contracts
```typescript
type NodeKind =
  | "TRIGGER" | "EPICOR_SQL_SOURCE" | "EPICOR_REST_SOURCE" | "GRAPH_DELTA_SOURCE"
  | "PARSE_JSON" | "SPLIT_ITEMS" | "FILTER" | "SET_FIELDS"
  | "MAP_FIELDS" | "LOOKUP_JOIN" | "VALIDATE" | "QUARANTINE"
  | "MASTER_UPSERT" | "METRICS";

type Item = {
  sourceKey: string; companyKey?: string; payload: Record<string, unknown>;
  lineage: { sourceId: string; pageId: string; ordinal: number };
};
type Batch = {
  tenantId: string; runId: string; schemaVersion: string;
  items: Item[]; errors: Array<{itemKeyHash: string; code: string}>;
};
type Definition = {
  id: string; version: number; nodes: Array<{id:string; kind:NodeKind; config:unknown}>;
  edges: Array<{source:string; sourcePort:string; target:string; targetPort:string}>;
  sourceVersionId: string; targetDomain: string;
};
```

- Execution engine runs validated, compiled definitions, not arbitrary admin-supplied JS.
- All nodes consume/produce typed bounded batches. Preserve provenance when filtering, joining or splitting; errors have sourceKeyHash and nodeId but no raw PII.
- `PARSE_JSON` takes a **string field**; SQL adapters commonly already output object/rows, so parser is optional.
- `LOOKUP_JOIN` must declare input key, dimension key, cardinality ONE/OPTIONAL_ONE, behavior on 0/multiple matches, company scope and bounded query. For 1-to-many, provide explicit `EXPAND` node later; don't silently duplicate vendors.
- `MASTER_UPSERT` requires validated canonical `tenantId`, company FK and stable `(sourceId,externalKey)` with idempotency, transaction/audit, source record hash and effective status.
- Entra Graph delta `@removed` becomes a tombstone/soft-inactivation event; remove message is not automatically a SQL DELETE.

## Execution vs preview
| Action | Data read | Data written | Can move production checkpoint? |
|---|---|---|---|
| Test Connection | Bounded auth/read probe | Test run metadata only | NO |
| Test Source Node | Bounded read, mocked/redacted fixture | Preview metadata | NO |
| Test Transform Node | Sanitized staged sample | Preview only | NO |
| Dry Run Flow | Bounded staged sample, planned target diff | Ephemeral staging/quarantine preview | NO |
| Publish Flow | Graph/compiled definition only | Immutable graph version | NO |
| Run Initial Sync | Paginated real approved source | Staging then canonical + audit | YES after durable promotion |
| Scheduled Run | Incremental/full as configured | Staging then canonical + audit | YES after durable promotion |

**Important:** Dry Run should not write real quarantine exceptions as confirmed production failures; preview errors can be temporary/sandbox-only. Each execution requires a data-handling purpose and scope.

## Engine choice
Use original batch executor (Node/TypeScript worker or specialized service) with PostgreSQL staging and a Temporal orchestration wrapper if proven in POC; **do not assume Temporal activities automatically execute graph nodes**. Temporal tracks run workflow, fetch/transform batch activities and retries, while the data plane processes rows in bounded batches. Graph node types are registered allowlisted handlers with versioned schemas.

## Graph compilation checks
- Graph schema/port types, unique IDs, DAG only; validate reachable target.
- Require one approved source and at least one validated target; raw boundary before transform.
- Required target fields mapped and type-safe; no secret-bearing or restricted field mapped into safe output.
- Stable key, company, join ambiguity, duplicate handling, null/error policy.
- Cursor mode supported by source and source schema version; checkpoint compatibility.
- Data volume, max batch, timeout and retry budgets; forbidden dynamic queries or arbitrary network callbacks.
- Versioned publish approval and data steward signoff for source/field ownership.

## Recovery plan
Record per-node metrics and stage/apply status. If source fetch succeeds and transform fails, retry from immutable staging without re-reading source when possible. If upsert succeeds and worker crashes before checkpoint, idempotent reapply yields no duplicate. When active graph version changes, pending runs continue pinned old version; new version starts with approved migration/backfill policy.

## Preview safety
Max 20–100 synthetic/masked records (configurable), hide bank details, minimize employee data. No source text, credential, raw SQL or Graph delta token in browser. Every preview and mapping change audited.

## Data integrity invariant
A pipeline can mark SUCCESS only when required sinks are durable and every rejected source row is either quarantined under explicit business-approved rules or blocks the checkpoint. Never silently swallow invalid item or count ignored rows as successfully applied.
