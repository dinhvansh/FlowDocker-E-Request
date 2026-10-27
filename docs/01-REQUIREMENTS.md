# V1 Requirements and Acceptance Criteria

**Status:** Target requirements, not implementation evidence.

## Actors
Employee, Approver/Manager, HOD, Finance Reviewer, Finance Operator, Form Admin, Workflow Admin, System Admin, Auditor.

## Functional requirements
| ID | Priority | Requirement | Acceptance observable |
|---|---|---|---|
| FR-001 | P0 | Create editable form draft via drag/drop | JSON schema persists and renders in preview |
| FR-002 | P0 | Data types + server validation | invalid currency/date/required rejected by API |
| FR-003 | P0 | Repeating rows and computed totals | backend recomputes trusted amount |
| FR-004 | P0 | Lookup current user, department and authorized master data | no arbitrary foreign-department/user impersonation |
| FR-005 | P0 | Publish immutable form versions | old requests still render old schema |
| FR-006 | P0 | Create/publish workflow graph with IF/ELSE | invalid branches cannot publish |
| FR-007 | P0 | Workflow assignment from user, manager, HOD, role | active resolved approvers snapshot |
| FR-008 | P0 | Start workflow once on submit | retry does not duplicate instance |
| FR-009 | P0 | My Requests + My Tasks + audit | permissions enforced server-side |
| FR-010 | P0 | Approve, reject, return with comment | one action per task; timestamp+actor+source recorded |
| FR-011 | P0 | Concurrent decisions are safe | web and Teams race has a single winner |
| FR-012 | P0 | Revision after return | new revision, changed rules re-evaluated from start |
| FR-013 | P0 | Teams interactive approval | verified Entra mapping, stale card handled |
| FR-014 | P0 | PDF generation after final approval | retries, hash, download authorization |
| FR-015 | P0 | Payment approved ≠ paid | Finance-only processing and settlement |
| FR-016 | P0 | Business Trip overseas conditional | optional CEO step follows published rule |
| FR-017 | P0 | Audit immutable business events | complete creator, assignee, action and revision history |
| FR-018 | P1 | Bulk request filtering & export | only authorized rows/fields included |
| FR-019 | P1 | Web/Teams notification sync | failed sends remain retryable |
| FR-020 | P1 | Form field ACL | finance-only fields protected on API writes and reads |

## Core request states
- `DRAFT`, `SUBMITTED`, `IN_APPROVAL`, `CHANGES_REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`, `ARCHIVED`.
- Task: `PENDING`, `APPROVED`, `REJECTED`, `RETURNED`, `SKIPPED`, `CANCELLED`.
- Artifact: `PENDING`, `GENERATING`, `READY`, `FAILED`.
- Payment: `NOT_READY`, `PENDING_PAYMENT`, `PROCESSING`, `PAID`, `FAILED`, optional `REVERSED` by controlled process.

No single status column should stand in for all business lifecycles.

## Requirements not yet agreed with business owners
Thresholds, local vs overseas routing, budget limits, payment currencies, exchange rates, per-department approval authority, required attachment count, delegate rules, fiscal coding and retention schedule. Placeholder examples MUST NOT become production policy.

## NFR (initial goals for UAT; owners to ratify)
- Authorization denies are fail-closed, all tenant-scoped.
- Durable retries, audit and recovery across service restarts.
- Response-time SLO to be set after baseline benchmark; no invented performance SLA.
- Backups must have a tested restore drill; encrypted transport, secrets isolation.
- Responsive UI for mobile browsers; no claim of mobile offline support.

## Traceability
See [Acceptance Tests](14-ACCEPTANCE-TESTS.md) for test matrix, [Data Model](06-DATA-MODEL.md) for entities and [Sequence Diagrams](08-SEQUENCE-DIAGRAMS.md) for runtime flows.
