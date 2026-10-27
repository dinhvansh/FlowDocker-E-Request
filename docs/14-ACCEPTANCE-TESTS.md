# V1 Acceptance Tests and UAT Plan

**Status:** Test plan only; **no tests executed** for E-Request.

## General fixture requirements
Two isolated test organizations; employees in Sales and Finance; active/inactive managers; separate Manager and Finance roles; mixed-currency/payment requests; domestic and overseas trip; sample documents with no real personal/financial information. For Teams, use a sanctioned test tenant and test bot.

## Test matrix
| ID | Type | Scenario | Pass criteria |
|---|---|---|---|
| FORM-01 | E2E | Build form and publish V1 | new request type visible with correct validation |
| FORM-02 | E2E | Publish V2 after request V1 created | old request still renders V1 |
| FORM-03 | Negative | Forge finance-only field in payload | API rejects or masks |
| FORM-04 | Integration | Expense table sum forged by browser | backend authoritative total used |
| FORM-05 | Negative | Broken references/unsupported expression | cannot publish |
| WF-01 | Integration | IF amount below threshold | HOD not assigned |
| WF-02 | Integration | IF above threshold | HOD assigned |
| WF-03 | Integration | Parallel ALL with one pending | step not complete early |
| WF-04 | Integration | Broken ELSE/invalid graph | publish fails |
| WF-05 | Recovery | Restart worker mid-human task | no lost/duplicate task |
| WF-06 | Regression | New workflow version published mid-run | old instance pinned |
| APPROVAL-01 | Concurrency | 2 Web approvals simultaneously | one terminal decision |
| APPROVAL-02 | Concurrency | Teams APPROVE vs Web REJECT | one winner, conflict on loser |
| APPROVAL-03 | Security | Unassigned user submits decision | forbidden |
| APPROVAL-04 | Reliability | Temporal unavailable after DB commit | decision persists, event eventually delivered |
| APPROVAL-05 | Idempotency | Retry same client command key | same result, one decision |
| APPROVAL-06 | Revision | Request returned and amount changed | new revision; workflow restarts; old audit persists |
| TEAMS-01 | E2E | Custom Teams card triggers approval | actor verified, real API task completed |
| TEAMS-02 | Security | Tamper with task or actor in card payload | server denies |
| TEAMS-03 | Recovery | Teams update fails | task remains correct; retry heals card |
| PAY-01 | E2E | Finance workflow all steps | APPROVED and payment PENDING separately |
| PAY-02 | Security | Employee marks payment PAID | forbidden |
| PAY-03 | E2E | Finance marks paid | external reference + audit required |
| TRIP-01 | E2E | Domestic trip | CEO step skipped |
| TRIP-02 | E2E | Overseas trip | CEO task required |
| PDF-01 | Integration | Approved request generates artifact | immutable key, SHA and authorized download |
| PDF-02 | Failure | Object store unavailable | APPROVED remains, artifact pending/failed, retry |
| SEC-01 | Security | Cross-org request/task/file ID | no other-tenant data |
| SEC-02 | Security | Malicious lookup/webhook/expressions | SSRF/code execution blocked |
| OPS-01 | DR | Restore DB+objects from backup | sample PDF and attachment checksum match |

## Mandatory QA record
For each test capture: test ID, environment, commit SHA, workflow/form version, sanitized input fixture, actual result, expected result, pass/fail, log/screenshot link and owner. Never mark passed without reproducible evidence.

## Release gates
- All P0 security/race/tenant tests pass.
- Pinned license register and SBOM reviewed.
- Backup restore demonstrated, alerts configured.
- Finance and HR approve the final policies and UAT traces.
- Teams tenant and DLP checked; actual app deployment permitted by IT.
- PDF is an approval record, **not** an automatically qualified digital signature.

## Known uncertainties
Company approvals policy, finance reconciliation rules, attachment retention, real user count/volume, Microsoft licenses, upstream Workflow Builder execution APIs: **pending discovery**. Test plan must be updated after POC.
