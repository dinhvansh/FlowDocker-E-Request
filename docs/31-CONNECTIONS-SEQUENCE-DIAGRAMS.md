# Connections — Six Sequence Diagrams

**DESIGN ONLY**. Connection Test != Sync. All actions use authorized backend and secrets vault. Never leak credentials to logs or source data to unapproved actors.

## CN-01 Create, real test and activate Connection
```mermaid
sequenceDiagram
  autonumber
  actor IT as Integration Admin
  participant UI as Connections UI
  participant API as Connection API
  participant Vault as Secret Manager
  participant Probe as Connector Test Worker
  participant Source as Epicor/Graph/HR
  participant DB as PostgreSQL
  IT->>UI: New Connection → choose provider
  IT->>UI: Enter endpoint and transient credentials
  UI->>API: Request bounded connection test
  API->>API: Validate tenant, role, endpoint allowlist
  API->>Probe: Test transient secret in restricted context
  Probe->>Source: DNS/TLS/Auth + minimal READ
  Source-->>Probe: Result / authorized capabilities
  Probe-->>API: Sanitized PASS/FAIL + fingerprint
  API->>DB: Store sanitized test run
  API-->>UI: Per-step result
  alt Test success
    IT->>UI: Save + Activate
    UI->>API: Save validated config
    API->>Vault: Store secret, receive opaque reference
    API->>DB: Commit connection version, enabled true, audit
    API-->>UI: ACTIVE (no sync started)
  else Test failure
    API-->>UI: Fix config / Save draft
  end
```
Implementation nuance: a transient test success is not sufficient to activate a **different** saved secret or config. Re-test persisted vault reference/current fingerprint before ACTIVE; never store secret plaintext in test history.

## CN-02 Create source and sync pipeline from existing connection
```mermaid
sequenceDiagram
  autonumber
  actor Owner as Master Data Operator
  participant UI as Create Sync Wizard
  participant API as Sync Config API
  participant Conn as Connection Registry
  participant Src as Source Connector
  participant DB as PostgreSQL
  Owner->>UI: Select ACTIVE Epicor connection
  UI->>API: List safe supported domains
  API->>Conn: Authorize scope and current health
  Owner->>UI: Select Vendor + Company
  UI->>API: Discover approved source view
  API->>Src: Fetch safe metadata/sample
  Src-->>API: Schema + approved fields
  API-->>UI: Typed schema
  Owner->>UI: Map fields and external keys
  UI->>API: Validate mapping and source ownership
  Owner->>UI: Choose Full/Incremental, schedule and DQ rules
  UI->>API: Dry Run (no canonical writes)
  API->>Src: Read bounded data
  API-->>UI: Expected counts/conflicts
  Owner->>UI: Publish paused sync pipeline
  API->>DB: Save pipeline version + review + audit
  API-->>UI: PAUSED, Run Initial Sync available
```

## CN-03 Scheduled incremental sync (no UI participant)
```mermaid
sequenceDiagram
  autonumber
  participant Scheduler
  participant DB as PostgreSQL
  participant Vault
  participant Worker as Sync Worker
  participant Source as Epicor/Graph
  participant Stage as Staging+DQ
  Scheduler->>DB: Lock pipeline / lease & create run
  DB-->>Worker: Run id + scoped configuration
  Worker->>Vault: Resolve secret at execution
  Worker->>DB: Read durable checkpoint
  loop All pages
    Worker->>Source: Read approved fields using safe cursor
    Source-->>Worker: Data + next cursor
    Worker->>Stage: Durable staged batch
  end
  Stage->>Stage: Normalize, FK and duplicate checks
  alt Valid enough per policy
    Worker->>DB: Idempotent promote records + audit
    Worker->>DB: Commit completed checkpoint and counters
    DB-->>Scheduler: SUCCESS/NEEDS_REVIEW
  else Conflict/source outage
    Worker->>DB: Exception and FAILED/NEEDS_REVIEW
    Note over Worker,DB: Do not jump cursor or mass delete
  end
```

## CN-04 Rotate credentials without downtime
```mermaid
sequenceDiagram
  autonumber
  actor IT
  participant API as Connection API
  participant Vault
  participant Probe as Connection Test Worker
  participant Source
  participant DB
  IT->>API: Rotate secret (authorized, protected channel)
  API->>Vault: Store candidate version
  API->>Probe: Test candidate with same approved configuration
  Probe->>Source: Authenticate + minimal READ
  alt Pass
    Probe-->>API: VALID
    API->>DB: Atomically change active secret ref/version + audit
    API-->>IT: Rotation complete
    API->>Vault: Retire old ref after safe overlap policy
  else Fail
    Probe-->>API: AUTH_FAILED
    API-->>IT: Old active ref unchanged, error sanitized
    API->>Vault: Discard candidate after protected cleanup
  end
```

## CN-05 Disable connection with running/dependent pipelines
```mermaid
sequenceDiagram
  autonumber
  actor IT
  participant UI as Connection Detail
  participant API as Connection API
  participant DB
  participant Worker as Sync Scheduler/Workers
  IT->>UI: Disable Connection
  UI->>API: Get dependency impact
  API->>DB: Find dependent pipelines + active runs
  API-->>UI: Show affected entities and future schedule stops
  IT->>UI: Confirm policy
  UI->>API: Disable with expectedVersion
  API->>DB: Mark connection disabled + audit/outbox
  API->>Worker: Block future runs / cancel or drain by policy
  API-->>UI: DISABLED, history retained
```

## CN-06 Connection test failed but previously synced form lookup works
```mermaid
sequenceDiagram
  autonumber
  participant Monitor as Health Checker
  participant Src as External Source
  participant API as Connection Status API
  participant DB as Canonical PostgreSQL
  actor Employee
  participant UI as Dynamic Form
  Monitor->>Src: Test minimal READ
  Src-->>Monitor: Timeout / unauthorized
  Monitor->>API: Record error / DEGRADED health
  Employee->>UI: Open Payment Request
  UI->>API: Request permitted active vendors
  API->>DB: Check last-good master + freshness threshold
  alt Noncritical and fresh enough
    API-->>UI: Last-known-good vendors + stale warning
  else Critical or too stale
    API-->>UI: Lookup unavailable / block Submit
  end
```
