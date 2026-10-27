# Proposed API Contract — /api/v1

**Status:** Draft contract, not running endpoints. AuthN via OIDC session/bearer token; AuthZ tenant+permission+task checks on every endpoint.

## Catalog and authoring
| Method | Route | Access / behavior |
|---|---|---|
| GET | `/request-types` | published types visible to caller |
| POST | `/admin/forms` | Form Admin creates draft |
| PATCH | `/admin/forms/{formId}/draft` | save draft with version precondition |
| POST | `/admin/forms/{formId}/publish` | validate, immutable version, checksum |
| POST | `/admin/workflows` | Workflow Admin creates draft |
| PATCH | `/admin/workflows/{workflowId}/draft` | update graph |
| POST | `/admin/workflows/{workflowId}/publish` | compile and validate |
| PUT | `/admin/request-types/{typeId}/binding` | bind explicit published versions |

## Request lifecycle
| Method | Route | Access |
|---|---|---|
| POST | `/requests` | employee creates draft with published request_type |
| GET | `/requests` | scoped My Requests/team permission query |
| GET | `/requests/{requestId}` | ACL + field masking |
| PATCH | `/requests/{requestId}/draft` | creator; draft only; optimistic version |
| POST | `/requests/{requestId}/attachments` | authenticated upload contract |
| POST | `/requests/{requestId}/submit` | server validation, revision snapshot, outbox |
| POST | `/requests/{requestId}/resubmit` | only CHANGES_REQUESTED; new revision |
| POST | `/requests/{requestId}/cancel` | policy-allowed cancellation |
| GET | `/requests/{requestId}/timeline` | authorized audit summary |

## Approval and processing
| Method | Route | Access |
|---|---|---|
| GET | `/tasks` | assigned active tasks |
| GET | `/tasks/{taskId}` | assigned approver/admin |
| POST | `/approval-tasks/{taskId}/decisions` | assigned actor; terminal decision atomically |
| GET | `/requests/{id}/artifacts` | protected artifact metadata |
| GET | `/artifacts/{artifactId}/download` | authorized streamed download or short-lived URL |
| POST | `/payments/{requestId}/start-processing` | Finance operator, approved only |
| POST | `/payments/{requestId}/mark-paid` | Finance operator; audited reference |
| POST | `/payments/{requestId}/mark-failed` | Finance operator; reason mandatory |

## Example submit request
```http
POST /api/v1/requests/req_123/submit
Authorization: Bearer <redacted>
Idempotency-Key: client-generated-unique-key
Content-Type: application/json

{"expectedDraftVersion":3}
```
Server loads draft values, recomputes totals and validates against pinned published form and org permissions. Return `202 Accepted` with request/revision IDs if the workflow-start event is queued.

## Example approval decision
```http
POST /api/v1/approval-tasks/task_123/decisions
Authorization: Bearer <redacted>
Idempotency-Key: example-unique-action-key
Content-Type: application/json

{
  "decision": "APPROVE",
  "comment": "Reviewed",
  "expectedVersion": 4
}
```
Response `200` on accepted or exact retry; `409` on a different stale/conflicting decision, `403` if actor unauthorized, `404` if not scoped/accessible. Teams Bot uses service-to-service auth **plus separately verified end-user identity**, not an untrusted userId in body.

## Example response
```json
{
  "taskId": "task_123",
  "status": "APPROVED",
  "decisionId": "decision_456",
  "acceptedAt": "2026-10-27T08:00:00Z",
  "workflowSignal": "QUEUED"
}
```

## Error envelope and concurrency
```json
{"error":{"code":"TASK_ALREADY_PROCESSED","message":"This task has already been decided.","correlationId":"..."}}
```
Use stable error codes `FORM_VALIDATION_FAILED`, `FORM_VERSION_UNAVAILABLE`, `WORKFLOW_INVALID`, `TASK_NOT_ASSIGNED`, `TASK_ALREADY_PROCESSED`, `REQUEST_REVISION_STALE`, `INTEGRATION_NOT_AVAILABLE`. Prevent enumeration by uniform unauthorized response strategy.

## Integrations
- `POST /integrations/teams/activities`: Bot-hosted, signature/identity-verified transport ingress, never public unverified HTTP.
- `POST /integrations/events/{provider}`: reserved for approved external callbacks with signing, replay-window checks and strict allowlist.
- Outbound webhooks use retryable outbox and signed payloads; do not include PII by default.

## Nonfunctional API rules
Request limits, file quotas, pagination and rate limits. All mutation endpoints require audit, idempotency and authorization tests. Publish endpoints require explicit permissions and validation errors suitable for Studio UI.


## Detailed authorization contract
Every query is limited by tenant, resource ownership/explicit active grants, request state and classification. Backend validates active Entra-to-local identity and roles/scopes **from current database state**, not only stale JWT group claims. Apply the [permission matrix](21-PERMISSION-MATRIX.md) and [authorization architecture](20-AUTHORIZATION-ARCHITECTURE.md) consistently to `GET /requests`, counts, exports, attachments, request revisions, task decisions, payment commands and admin authoring. Never serialize full `request_revisions.data_jsonb` without a field projection. Request IDs from the browser are untrusted, task decisions require exact active assignee and revision/version, and a different prior terminal decision returns conflict. PostgreSQL policies [002 RLS](../db/design/002_rls_policies.sql) provide defense in depth, not an API bypass.
