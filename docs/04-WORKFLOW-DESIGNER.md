# Workflow Studio — IF/ELSE + Human Tasks

**Status:** Architectural target; SDK/Temporal integration must be proven in a POC. Workflow Builder is not used as evidence that arbitrary runtime paths work automatically.

## Node catalog V1
| Node | Purpose |
|---|---|
| START / END | deterministic boundaries |
| APPROVAL | single approver or policy-assigned group |
| PARALLEL | branch/fork and join with ALL / ANY / MINIMUM_N policy |
| CONDITION | typed IF/ELSE with explicit true/false ports |
| SWITCH | typed multiple outcomes + required default |
| FINANCE_REVIEW | form evidence review, no payment execution |
| PAYMENT_OPERATION | Finance processing after approval |
| PDF_GENERATE | asynchronous artifact job |
| NOTIFY | Teams/email event, no state mutation |
| WEBHOOK | controlled outbound integration with retry/deduplication |
| WAIT_FOR_INPUT | request-for-changes/resubmit by immutable revision |

## Condition DSL (illustrative internal contract, not vendor SDK format)
```json
{
  "nodeType": "CONDITION",
  "field": "payment.amountMinor",
  "operator": "GT",
  "value": 2000000000,
  "valueType": "money_minor",
  "currency": "VND",
  "trueTarget": "hod-approval",
  "falseTarget": "finance-review"
}
```
VND amount is an **example only**; approval policy must be approved by Finance and configurable. Compile conditions into allowlisted AST; support `AND`, `OR`, `NOT`, comparisons, `IN`, `IS_EMPTY`. For mixed currency, require a published conversion/budget policy rather than compare raw numbers.

## Assignment resolution
Roles: named internal user, submitter line manager, department head, named job position, configured approval group. Resolve against active directory at task activation (or at submission per published assignment policy), persist assignment snapshot with user IDs. No silent skip when manager missing; route to operator exception queue.

## Runtime semantics
- START activates next node via Temporal.
- CONDITIONAL evaluates pinned request revision and published workflow version.
- APPROVAL creates DB human task, pauses Temporal until matching, authenticated and deduplicated signal arrives.
- Reject terminates/branches according to explicit workflow policy.
- Return-for-changes suspends execution; new request revision runs from defined restart point (V1 default: workflow restart).
- PARALLEL task policies must settle exactly once and close unused tasks.
- PDF generation runs **after final approval**, not implicitly at request submission.
- No free-form cyclic graph support assumed in V1. Revisions are a controlled session/restart, not a graph back-edge.

## Publish-time validation
1. START count exactly one; at least one reachable END.
2. No dangling ports, invalid node type, unreachable required step or cycles.
3. IF has both TRUE and FALSE paths; SWITCH has default.
4. Only type-safe conditions referencing exposed stable form keys.
5. Valid approver strategy and reject/return handling.
6. No orphan parallel join/unsafe concurrent updates.
7. Immutable version, compatibility marker, checksum and approval to publish.

## Runtime task contract
Task fields: `id, request_id, request_revision_id, workflow_instance_id, node_id, assigned_user_id, status, version, activated_at, decision_at, decision_by, decision_source`. Only one accepted terminal decision and a stable `completion_key`. Teams and Web share this task identity.

## POC gate
Implement one conditional (amount threshold) and one parallel ALL step, then prove real Temporal history, API task actions, replay/restart safety and existing-request version retention before marking Workflow Studio 'done'.
