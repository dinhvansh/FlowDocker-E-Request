# Visual Master Data Sync — Five Sequence Diagrams

**DESIGN ONLY / no code executed.** The operator edits a data-flow DAG; this is distinct from the Request Approval Workflow Studio.

## FL-01 — Build visual data pipeline
```mermaid
sequenceDiagram
  autonumber
  actor IT as Integration Admin
  participant UI as Flow Studio React Flow
  participant API as Flow Definition API
  participant Conn as Connection Manager
  participant Source as Approved Source View
  participant DB as PostgreSQL
  IT->>UI: New Master Data Flow / target Vendors
  UI->>API: List approved active Connections
  API->>Conn: Verify tenant, role, live config version
  IT->>UI: Drag Epicor Source node onto canvas
  UI->>API: Discover approved view metadata
  API->>Source: Bounded schema/read-only probe
  Source-->>API: Safe field definitions
  API-->>UI: Source schema and allowed fields
  IT->>UI: Connect Source → Parse JSON? → Split Items
  IT->>UI: Add RAW boundary, Filter, Lookup, Mapper, Validate, Upsert
  UI->>API: Save graph draft with node/port configs
  API->>DB: Store draft graph version, audit
```

## FL-02 — Drag/drop JSON mapping and test node
```mermaid
sequenceDiagram
  autonumber
  actor Steward as Data Steward
  participant UI as Mapper UI
  participant API as Preview API
  participant Worker as Sandbox Node Runner
  participant DB as Staging / Synthetic Fixtures
  Steward->>UI: Open Field Mapper
  UI->>API: Get safe input JSON tree + target schema
  API-->>UI: Paths, types, masked examples
  Steward->>UI: Drag $.Name to display_name
  Steward->>UI: Add Trim transform
  Steward->>UI: Drag $.Company to company_id
  Steward->>UI: Configure exact Company lookup
  UI->>API: Test selected mapping node
  API->>Worker: Execute typed mappings on bounded sample
  Worker->>DB: Lookup tenant/company canonical dimension safely
  Worker-->>API: Mapped output and item-level errors
  API-->>UI: Input/Output/Error preview
  Note over UI,DB: No canonical upsert or checkpoint mutation
```

## FL-03 — Validate graph, Dry Run, Publish PAUSED
```mermaid
sequenceDiagram
  autonumber
  actor Owner as Master Data Owner
  participant Studio as Flow Studio
  participant Compiler as Graph Compiler
  participant Sandbox as Preview Executor
  participant DB as PostgreSQL
  Owner->>Studio: Validate Flow
  Studio->>Compiler: Parse nodes, typed ports, mapping and cursor
  alt Graph invalid
    Compiler-->>Studio: Blockers: keys/type/joins/missing targets
  else Valid
    Compiler-->>Studio: Safe compiled DAG
    Owner->>Studio: Dry Run Flow
    Studio->>Sandbox: Fetch bounded safe sample and simulate target diff
    Sandbox-->>Studio: Predicted Insert/Update/Quarantine counts
    Owner->>Studio: Publish with reviewer approval
    Studio->>DB: Save immutable compiled graph version as PAUSED
    DB-->>Studio: Version published; NO sync running
  end
```

## FL-04 — Initial sync, stage barrier, transform and promote
```mermaid
sequenceDiagram
  autonumber
  actor Operator
  participant API as Flow Run API
  participant Orchestrator as Temporal / Run Orchestrator
  participant Source as Approved Epicor / Graph Source
  participant RAW as Durable Staging
  participant Worker as Typed Batch Executor
  participant Canonical as Canonical Master PostgreSQL
  Operator->>API: Run Initial Sync (published graph version)
  API->>Orchestrator: Start scoped run via outbox + lease
  loop Bounded source page
    Orchestrator->>Source: Read approved fields with cursor/page token
    Source-->>Orchestrator: Source rows, source keys and next page token
    Orchestrator->>RAW: Stage page + hash + lineage durably
  end
  Orchestrator->>Worker: Execute compiled transform nodes over staged batches
  Worker->>Worker: Parse optional, Filter, Lookup, Map, Validate
  alt All gating rules satisfied
    Worker->>Canonical: Idempotent upsert + audit/change events
    Canonical-->>Worker: Persisted records and metrics
    Worker->>RAW: Mark applied; checkpoint commit when obligations satisfied
    Orchestrator-->>API: Run COMPLETE with applied counts
  else Invalid/missing company/source drift
    Worker->>RAW: Quarantine rows / mark Needs Review
    Note over Worker,Canonical: No skipped critical checkpoint
    Orchestrator-->>API: Operator resolution required
  end
```

## FL-05 — Retry after crash and flow version upgrade
```mermaid
sequenceDiagram
  autonumber
  actor Admin
  participant Studio as Flow Studio
  participant Registry as Published Graph Registry
  participant Worker as Run Worker
  participant RAW as Staging
  participant DB as Canonical PostgreSQL
  Admin->>Studio: Edit mapping while V1 run in progress
  Studio->>Registry: Save draft version V2
  Worker->>Registry: Continue pinned V1
  Worker->>RAW: Load staged page and item lineage
  Worker->>DB: Upsert idempotent key (tenant/source/row/version)
  Note over Worker,DB: Crash after successful upsert, before checkpoint
  Worker->>RAW: Retry same page after restart
  Worker->>DB: Upsert duplicate command ignored/update deterministic
  Admin->>Studio: Dry Run V2 and approve migration/backfill
  Studio->>Registry: Publish V2 for NEW runs
  Note over Registry,Worker: V1 run history remains pinned to V1
```
