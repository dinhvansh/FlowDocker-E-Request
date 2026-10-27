# Authorization — Negative-First Test Plan

**Status: Test scenarios only; none executed.** P0 release blockers require evidence.

## Principal/resource test fixtures
- Tenant A / Tenant B (synthetic UUIDs).
- Alice (employee in A), Bob (other employee in A), Manager M (A), Finance F (A), Tenant Admin A, Auditor A, Eve (user in B), inactive user X.
- Alice owns PAY-A-001. Bob owns PAY-A-002. Eve owns PAY-B-001. Manager M is assigned one PENDING task on PAY-A-001 only.
- Finance F has department REQUEST_TYPE scope limited to one Payment purpose. Attachments include non-sensitive PDF and FINANCE_SENSITIVE bank data field.
- Web and Teams simulate two independent valid authorized requests against the *same task*.

## Test matrix
| ID | Layer | Case | Expected |
|---|---|---|---|
| AUTH-001 | API/SQL | Alice reads her own request | allowed, field projection |
| AUTH-002 | API/SQL | Alice guesses Bob's request ID | deny/no data |
| AUTH-003 | API/SQL | Eve queries Alice request | deny cross-tenant |
| AUTH-004 | API | Manager with no active task reads Bob request | deny |
| AUTH-005 | API/SQL | Manager with assigned task reads approved snapshot | allowed while assignment/grant active |
| AUTH-006 | API/SQL | Revoke Manager assignment then try old Teams card | deny |
| AUTH-007 | API | Finance with one department scope reads another department | deny |
| AUTH-008 | API | Employee adds hidden `finance.accountCode` field to POST | reject/ignore with audit; cannot persist |
| AUTH-009 | API | Requester reads masked bank field in disallowed state | no raw value |
| AUTH-010 | API | Tenant admin attempts to read confidential attachment with no grant | deny |
| AUTH-011 | API | Auditor accesses purpose-bound metadata | allow metadata, no protected data |
| AUTH-012 | API | Inactive user token still has role claim | deny from DB revocation |
| AUTH-013 | API/Teams | Teams actor ID forged inside card data | deny |
| AUTH-014 | DB | Shared app DB role has BYPASSRLS or owns protected tables | fail security gate |
| AUTH-015 | DB | GUC absent / transaction committed | no rows |
| AUTH-016 | DB | A-tenant GUC querying B rows | no rows |
| AUTH-017 | DB | Same tenant but no owner/grant | no requests |
| AUTH-018 | DB/API | Request list/count/export total | identical authorization boundary |
| AUTH-019 | API | Attachment ID belongs to unauthorized request | deny |
| AUTH-020 | API | User submits already-closed task | 409 no new decision |
| AUTH-021 | Integration | Web approve races Teams reject | exactly 1 committed terminal decision |
| AUTH-022 | Integration | Temporal unavailable after decision transaction | accepted decision remains; outbox retries |
| AUTH-023 | Integration | Request returned and revision changed | old assignee/grants retired, new approvals |
| AUTH-024 | Integration | Worker retries job with another tenant's ID | deny and dead-letter |
| AUTH-025 | DB/API | Foreign key across tenants despite valid UUID | rejected by composite FK |
| AUTH-026 | API | Wrong task revision or expectedVersion | 409 no new decision |
| AUTH-027 | API | Generic role alone tries task DECIDE unassigned | deny |
| AUTH-028 | Integration | Form publishes new schema after active submission | existing revision and policy preserved |

## Evidence required
For each test: executed command/test path, branch/SHA, actual database role, synthetic fixture, expected and actual assertion, PASS/FAIL, CI link and sanitized logs. Do not claim success from design or from a superuser SQL session.

## Definition of done
- Correct migrations and policy ownership/GRANT setup.
- All P0 negative tests pass on real Postgres, API and Temporal disposable stack.
- Direct SQL verified with real non-owner role and RLS enabled.
- Web+Teams race, revocation, attachment authorization and field projection pass.
- Security review signs off on remaining risk of session GUC compromise.
