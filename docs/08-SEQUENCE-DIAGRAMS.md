# E-Request V1 — Eight Sequence Diagrams

**Status:** Target behavior only; no code is claimed complete. Sequence actors are conceptual; the implementation must preserve transaction/outbox/authorization boundaries.

## SD-01 — Design, bind and publish a form and workflow
```mermaid
sequenceDiagram
  autonumber
  actor Admin
  participant FS as Form Studio / Form.io
  participant WS as Workflow Studio
  participant API as Authoring API
  participant DB as PostgreSQL
  Admin->>FS: Create form and configure fields/conditions
  FS->>API: Save form draft JSON
  API->>DB: Upsert draft with optimistic version
  Admin->>WS: Build approval graph incl. IF/ELSE
  WS->>API: Save graph draft
  API->>DB: Save workflow draft
  Admin->>API: Bind form version + workflow version and publish
  API->>API: Validate form, graph, fields, actors, compatibility
  alt Valid
    API->>DB: Publish immutable versions + request type binding
    API-->>Admin: Published
  else Invalid
    API-->>Admin: Detailed validation failures
  end
```

## SD-02 — Draft and submit a new request
```mermaid
sequenceDiagram
  autonumber
  actor Employee
  participant Web as Request Portal
  participant Form as Form.io Renderer
  participant API as Request API
  participant DB as PostgreSQL
  participant Outbox as Dispatcher
  participant Temporal as Temporal Worker
  Employee->>Web: Choose published request type
  Web->>API: Fetch versioned form
  API-->>Form: Form schema & allowed options
  Employee->>Form: Enter data / upload attachments
  opt Save draft
    Form->>API: Save draft
    API->>DB: Persist editable draft
  end
  Employee->>Form: Submit
  Form->>API: Submit request command with idempotency key
  API->>API: Revalidate fields, file refs, totals and permissions
  alt Invalid
    API-->>Employee: Validation errors
  else Valid
    API->>DB: Transaction: immutable revision + SUBMITTED + outbox start
    API-->>Employee: Accepted + request number
    Outbox->>DB: Claim workflow-start event
    Outbox->>Temporal: Start deterministic workflow ID
    Temporal->>API: Activate first human task / evaluate condition
    API->>DB: Persist task + notification outbox
  end
```

## SD-03 — Approve / reject on Web
```mermaid
sequenceDiagram
  autonumber
  actor Approver
  participant Web as My Tasks
  participant API as Approval API
  participant DB as PostgreSQL
  participant O as Outbox
  participant T as Temporal
  participant Bot as Teams Bot
  Approver->>Web: Open assigned task and request snapshot
  Web->>API: GET scoped task
  API-->>Web: Allowed fields + current version
  Approver->>Web: Approve/Reject + comment
  Web->>API: POST decision (version + idempotency key)
  API->>API: Authenticate/authorize actor, scope and task state
  API->>DB: Atomic PENDING→terminal + audit + outbox
  alt Lost race or stale task
    API-->>Web: 409 / current decision
  else Accepted
    API-->>Web: 200 recorded
    O->>T: Signal decision once logically (retry-safe)
    T->>API: Activate next node or terminal state
    O->>Bot: Refresh prior Teams card
    Web-->>Approver: Updated status
  end
```

## SD-04 — Approve / reject from custom Teams Bot
```mermaid
sequenceDiagram
  autonumber
  participant T as Temporal
  participant O as Notification Outbox
  participant Bot as Teams Bot
  participant Teams as Microsoft Teams
  actor Manager
  participant API as Approval API
  participant DB as PostgreSQL
  T->>API: Activate assigned approval task
  API->>DB: Persist task + notification event
  O->>Bot: Deliver adaptive card
  Bot->>Teams: Send card and store activity reference
  Teams-->>Manager: Show request summary and actions
  Manager->>Teams: Approve/Reject with comment
  Teams->>Bot: Signed bot activity/callback
  Bot->>Bot: Validate activity and map Entra identity
  Bot->>API: Decision with verified actor context
  API->>DB: Compare-and-set task + write audit/outbox
  alt Task already decided or actor invalid
    API-->>Bot: Conflict / forbidden
    Bot->>Teams: Explain stale/unauthorized
  else Valid
    API-->>Bot: Decision accepted
    O->>T: Deliver durable decision signal
    O->>Bot: Replace stale card with terminal status
    T->>API: Activate next task
  end
```

## SD-05 — Payment Request, threshold branch and settlement
```mermaid
sequenceDiagram
  autonumber
  actor Employee
  participant API as Request/Approval API
  participant T as Temporal
  actor LM as Line Manager
  actor HOD
  actor FIN as Finance Reviewer
  actor FM as Finance Manager
  participant PDF as PDF Worker
  participant DB as PostgreSQL
  Employee->>API: Submit Payment Request
  API->>DB: Snapshot form + request revision
  API-->>T: Outbox starts workflow
  T->>LM: Activate LM task via API
  LM->>API: Approve
  API-->>T: Outbox decision signal
  T->>T: IF amount > configured threshold
  alt Exceeds threshold
    T->>HOD: Assign approval task
    HOD->>API: Approve
    API-->>T: Outbox decision signal
  else Not exceeding
    T->>T: Skip HOD
  end
  T->>FIN: Activate finance review
  FIN->>API: Complete review
  API-->>T: Decision signal
  T->>FM: Activate final approval
  FM->>API: Approve
  API-->>T: Decision signal
  T->>DB: Record approval complete via application service
  T->>PDF: Queue final PDF artifact job
  PDF->>DB: Persist PDF metadata and hash
  T->>FIN: Create payment processing task
  FIN->>API: Mark paid with evidence
  API->>DB: Set payment_state=PAID (separate from approval)
  API-->>Employee: Notify final payment result
```

## SD-06 — Business Trip, overseas conditional
```mermaid
sequenceDiagram
  autonumber
  actor Employee
  participant API as Request/Approval API
  participant T as Temporal
  actor LM as Line Manager
  actor CEO
  participant HR as HR Notification
  participant PDF as PDF Worker
  participant DB as PostgreSQL
  Employee->>API: Submit Business Trip
  API->>DB: Snapshot validated dates/country/costs
  API-->>T: Start via outbox
  T->>LM: Activate LM task
  LM->>API: Approve
  API-->>T: Decision signal
  T->>T: IF country != configured home country
  alt Overseas
    T->>CEO: Activate CEO task
    CEO->>API: Approve
    API-->>T: Decision signal
  else Domestic
    T->>T: Skip CEO
  end
  T->>DB: Mark approval APPROVED via API
  T->>PDF: Queue approved trip PDF
  PDF->>DB: Save artifact location/hash
  T->>HR: Notify HR/travel coordinator
  HR-->>Employee: Trip approved notification
```

## SD-07 — Reject vs Return for Changes + resubmit
```mermaid
sequenceDiagram
  autonumber
  actor Approver
  actor Employee
  participant API as Request/Approval API
  participant DB as PostgreSQL
  participant O as Outbox
  participant T as Temporal
  Approver->>API: Decide REJECT or RETURN with reason
  API->>DB: Atomic decision + audit + outbox
  O->>T: Deliver decision event
  alt REJECT
    T->>API: Set request REJECTED and close pending tasks
    API-->>Employee: Rejection notification
  else RETURN
    T->>API: Mark CHANGES_REQUESTED and suspend progression
    API-->>Employee: Return comment
    Employee->>API: Save revised draft and resubmit
    API->>API: Validate full revised form, totals, attachments
    API->>DB: Persist immutable revision N+1 and outbox
    O->>T: Start revised workflow using new revision ID
    T->>API: Cancel/supersede old active tasks; restart required approvals
  end
```

## SD-08 — Final PDF, archive and retriable failures
```mermaid
sequenceDiagram
  autonumber
  participant T as Temporal
  participant API as Request Service
  participant DB as PostgreSQL
  participant O as Outbox Worker
  participant PDF as PDF Renderer
  participant S as Object Storage
  actor Employee
  T->>API: All required approvals completed
  API->>DB: Transaction APPROVED + artifact PENDING + outbox
  O->>DB: Claim artifact event
  O->>PDF: Render approved immutable revision
  PDF->>API: Load scoped request snapshot + decisions
  API-->>PDF: Canonical data and audit summary
  PDF->>PDF: Render static PDF
  PDF->>S: Write object with immutable key
  S-->>PDF: Stored
  PDF->>S: Verify readback/hash as configured
  alt Generation/storage success
    PDF->>DB: Save artifact hash/key; set READY
    Employee->>API: Download artifact
    API->>API: Authorize and audit download
    API->>S: Read object
    S-->>Employee: Authorized PDF download
  else Failure
    PDF->>DB: Record retryable failure
    O->>O: Backoff/retry or dead-letter alert
    Note over DB: Approval remains APPROVED; PDF not READY
  end
```

## Interpretation rules
- Where a user/actor arrow visually targets Temporal, actual user commands **must** traverse authenticated E-Request APIs.
- Outbox → Temporal and callback → DB are conceptual; API/worker implementations must be idempotent and transactional where stated.
- All graphs use **example** role and amount policies; business owners approve production routing.
- Workflow Studio should not be assumed to support arbitrary loops; return-for-changes uses revision/restart semantics.
