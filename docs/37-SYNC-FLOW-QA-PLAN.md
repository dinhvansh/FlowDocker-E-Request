# Visual Sync Flow Studio — QA & Acceptance

**Test plan only; no test executions or results.**

| ID | Area | Scenario | Pass |
|---|---|---|---|
| FLOW-01 | UX | Drag a Source and two Transform nodes onto React Flow canvas | nodes/edges survive save/reload |
| FLOW-02 | UX | Select node shows typed Input/Output/Errors inspector | safe schema and preview |
| FLOW-03 | UX | Drag nested JSON source field to target field | binding saved with stable path |
| FLOW-04 | Mapper | Type mismatch string→number w/o converter | publish blocked |
| FLOW-05 | Mapper | Required company_id missing | publish blocked |
| FLOW-06 | Mapper | One-to-many join used where unique company required | error rather than duplicate vendor rows |
| FLOW-07 | Extract | JSON already parsed into object | optional Parse JSON bypass works |
| FLOW-08 | Extract | Parse invalid JSON string | error output/quarantine, no silent item loss |
| FLOW-09 | Array | Split Items preserves parent key and row lineage | deterministic item IDs |
| FLOW-10 | Graph | Invalid cyclic edge/missing port | graph publish blocked |
| FLOW-11 | Preview | Test Node with redacted source sample | no writes to canonical/checkpoint |
| FLOW-12 | Dry Run | preview predicts target changes and errors | no actual master changes |
| FLOW-13 | Publish | Save and publish immutable DAG version | in-flight run remains version-pinned |
| FLOW-14 | Execution | Real approved Epicor source 10k sample | batch bounded, counts/hash checked |
| FLOW-15 | Execution | Successful source staging then transform failure | retry from staged pages |
| FLOW-16 | Recovery | Crash after upsert before checkpoint | deduplicated reapply, no lost rows |
| FLOW-17 | Sync | Cursor incompatible with new map/PK | requires explicit rebootstrap plan |
| FLOW-18 | Scope | Vendor from wrong company in mapping/lookup | fails closed |
| FLOW-19 | Auth | Form Designer guesses connector/sync node IDs | forbidden |
| FLOW-20 | Security | Arbitrary SQL/JS/URL in node config | rejected |
| FLOW-21 | Lineage | Filter removes items | metrics show filtered vs rejected vs applied |
| FLOW-22 | Quarantine | Bad vendor key | quarantine recorded, checkpoint policy explicit |
| FLOW-23 | Resource | Source returns >max batch / huge JSON | bounded parse, timeout, no browser OOM |
| FLOW-24 | Security | Preview includes bank account/email sensitive field | masked/omitted, audited |
| FLOW-25 | Operations | Connection Active but unhealthy | sync blocks/fails according to policy; old master safe |
| FLOW-26 | Target | Unvalidated rows sent to Upsert | graph compile/runtime rejects |
| FLOW-27 | License | Embedded editor uses @xyflow/react and not n8n code | pinned dependency + license evidence |

## Evidence / gates
A 'DONE' report requires real disposable PostgreSQL and a permitted synthetic/QA upstream source, exact commands, commit SHA, worker logs, UI screenshots, graph version, node-level metric counts, GRANT/RLS inspection and recovery results. React Flow editor drag/drop functioning does not prove data execution. If V1 only does source/schema preview and not Upsert, it remains NOT DONE for Flow Studio end-to-end.

## POC vertical slice
1. Configure **one Epicor approved view** using read-only connection (no real company values committed).
2. Graph: Source → optional Parse JSON → Split Items → RAW Staging → Filter → Company Lookup → Drag Field Mapper → Validate → Master Upsert.
3. Input two valid synthetic vendors and one unmapped-company record; preview output and quarantine.
4. Run initial sync; inspect canonical records/checkpoint/graph version; repeat after simulated crash and confirm no duplicates.
5. Change mapping V2; demonstrate V1 in-flight remains pinned and V2 requires validation/rebootstrap review.
