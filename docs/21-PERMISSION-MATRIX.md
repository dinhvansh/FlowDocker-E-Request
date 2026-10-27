# Permission Matrix V1 — Proposed Default

**NOT approved company policy.** Codes: **O** own request; **A** active assigned task; **S** explicit scoped role+current object state; **G** explicit request-level grant; **P** purpose-limited auditor read; **–** DENY.

| Action | Employee | Approver | Finance Reviewer | Finance Operator | Form Designer | Workflow Designer | Tenant Admin | Auditor |
|---|---|---|---|---|---|---|---|---|
| Request type list | S | S | S | S | S | S | S | S |
| Request create | S | S | S | S | – | – | – | – |
| Request read/list | O | A/G | A/G | S/G | – | – | – | P |
| Request draft edit | O | – | – | – | – | – | – | – |
| Request submit/resubmit | O | – | – | – | – | – | – | – |
| Request cancel | O¹ | – | – | – | – | – | – | – |
| Task read | – | A | A | – | – | – | – | P² |
| Task approve/reject/return | – | A | A³ | – | – | – | – | – |
| Request attachments read | O⁴ | A⁴ | A⁴ | S⁴ | – | – | – | P⁴ |
| Finance-only form fields read | – | – | A⁵ | S⁵ | – | – | – | – |
| Bank details read | O⁵ | – | A⁵ | S⁵ | – | – | – | – |
| Bank details write | O⁶ | – | – | S⁶ | – | – | – | – |
| Payment PROCESSING/PAID | – | – | – | S⁷ | – | – | – | – |
| Form draft edit | – | – | – | – | S | – | – | – |
| Form publish | – | – | – | – | S⁸ | – | – | – |
| Workflow draft edit | – | – | – | – | – | S | – | – |
| Workflow publish | – | – | – | – | – | S⁸ | – | – |
| Users/role admin | – | – | – | – | – | – | S | – |
| Audit metadata read | O summary | A summary | A summary | S | – | – | S⁹ | P |

1. Owner cancellation allowed only in configured states. 2. No raw protected field access from task audit. 3. Finance Reviewer must be assigned to the active finance node, not any approval step. 4. Classification+need-to-know+malware status remain mandatory. 5. Mask/minimize by stage; NEVER on Teams cards. 6. Employees only their DRAFT/returned revision and validated keys; Finance only specific processing phase. 7. Requires explicit finance role scope, approved payment and transaction evidence. 8. Separate publish permission; editor access does not imply publish. 9. Tenant admin cannot automatically read banking secrets.

## Permission codes (proposed)
```text
request:create, request:read, request:edit_draft, request:submit, request:cancel,
request:list_scope, request:export, request:read_audit,
task:read_assigned, task:decide_assigned, task:reassign,
attachment:upload, attachment:download,
payment:review_assigned, payment:process, payment:mark_paid,
form:edit, form:publish, workflow:edit, workflow:publish,
organization:manage, role:grant, audit:read_scoped
```

## Approval-scoped policy
For `task:decide_assigned` BOTH permission and active assignment match are mandatory. No scoped manager/department role by itself permits deciding another employee's task. Confirm `task.request_revision_id` equals active current revision before accepting decision.

## Data filtering
`GET /requests` must use an access-constrained query (owner + explicit active grants), not read everything then filter on the frontend. Use the same filter in counts, CSV exports, attachments and batch operations. For custom reports, design a dedicated authorized projection: raw JSONB is not a general reporting endpoint.

## Tests
Use [Authorization Test Plan](24-AUTHORIZATION-TEST-PLAN.md). Each positive cell needs at least one allow case and each scope/state boundary at least one deny case.
