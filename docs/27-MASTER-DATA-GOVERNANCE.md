# Master Data Hub — Ownership, Privacy, Resolution, Freshness

**Status: Proposed policy register, pending HR/Finance/IT/ERP owner approval.**

## Who owns the data?
| Entity / field | Proposed Business Owner | IT Technical Owner | Allowed manual corrections |
|---|---|---|---|
| Login/Entra ID | IT Identity team | IT Integration | none; corrected in Entra |
| Employment and official manager/dept | HR | IT Integration | HR-approved exception/import only |
| ERP companies/vendors | Finance/Purchasing / ERP owner | IT Integration | correction at ERP (not E-Request) |
| Cost centers/GL master | Finance/Accounting | IT Integration | Finance-approved override with effective date; source mapping exception |
| Travel expense types/policies | HR/Finance | E-Request Admin | approved local version/publish |
| Role/permission grants | IT Security + process owner | E-Request Admin | policy-controlled, audited, limited scope |

## Field precedence
Record precedence for each attribute explicitly. Entra `department` could be stale; HR-owned department must win if designated. If two sources disagree, create `master_data_conflict` and show both normalized values to owner (masked as necessary). A raw sync run cannot silently replace an owner-approved exception.

## Matching and deduplication
- Entra user key = `(entra_tenant_id, entra_object_id)`.
- HR employee key = `(source_id, employee_code)` scoped to company/tenant.
- Epicor supplier key = `(source_id, company_code, vendor_external_key)`.
- No fuzzy self-binding based only on name, phone, UPN or email. Ambiguous match remains unlinked and blocked from auto-assignee assignment until manually confirmed.
- Keep source cross-reference as separate entity, with match confidence/status, approved_by and evidence reference.
- Company and cost-center aliases require approved explicit mapping, not silently normalized across different legal entities.

## Data quality gates (proposed)
| Check | Severity | Safe action |
|---|---|---|
| Missing stable external key | Block | quarantine |
| Duplicate source key with different payload | Block | conflict |
| Vendor company unmapped | Block | exclude vendor from lookup |
| Department/manager circular graph | Block | HR exception, no auto-approver |
| Active employee not mapped to Entra login | Warn/block assignment | no Teams task until mapped |
| Sudden deletion/inactivation > configured percentage | Block promotion | manual review |
| Snapshot completeness missing | Block deletions | keep last known good |
| Missing required finance code / currency | Block payment submit | explicit Finance error |
| Stale directory for an approver | Block decision | revalidate account and local active status |

Track `run_started/finished`, source pages, record count, inserted/updated/unchanged/inactivated/quarantined, max lag, last success, last full reconciliation, and error counts. Operator dashboard alerts on aging jobs, perpetual partials and stale critical catalog.

## Effective dating and reproducibility
- For people manager/department and chart-of-accounts, keep **effective from/to** records or versioned change log where business owner supplies effective dates; otherwise record `observed_at` and never pretend it is legal-effective date.
- Submitted requests snapshot IDs and selected code/name at submission; historic record remains readable after source deactivation under request ACL.
- Approval history retains original assignee and decision; management changes only affect future tasks or explicitly reassign pending tasks with audit.
- `DELETED` source event never physically deletes request snapshots or approval evidence.

## Privacy and security
- Sync credentials in secret manager, not repo/database plaintext.
- HR attributes are minimum-necessary; never bulk ingest payroll, personal IDs, family data, home addresses without approved requirement.
- Vendor bank accounts require separate encrypted store/ACL; not generic `masters` JSON read.
- Staging contains personal/financial data: encrypt in transit/at rest, TTL, restrict worker + data steward, redact logs.
- External source IDs are not credentials. Graph delta tokens should be encrypted and protected.
- System Admin may operate sync jobs but should not inherently see unrestricted HR/Finance data.

## Admin UI workflows
`Integration Hub → Data Sources → Mapping → Scheduled Sync → Run History → Data Quality/Conflicts`. Business owner gets restricted conflict resolution screen; operator sees counts/errors, not sensitive raw records. 'Sync Now' has role permission, rate-limit and per-source lock; operator cannot change mapped source identity or bank fields.

## Unanswered source discovery checklist
1. Where HR master actually lives (HRIS, Entra fields, SharePoint list, CSV)?
2. HR employee immutable code and manager/department effective dates?
3. Entra tenant IDs and permitted Graph scopes?
4. Epicor environment/company list and preferred REST/BAQ availability?
5. Authoritative vendor key and last-modified/deletion semantics?
6. Does Finance authorize vendor bank info in E-Request? Default NO.
7. What source refresh freshness can business tolerate before submit/approve blocks?
8. Who can approve bulk inactivation and manual cross-reference?
9. What are retention periods for staging, failed rows and audit metadata?
10. Who owns full source-to-target mapping changes and schema drift response?
