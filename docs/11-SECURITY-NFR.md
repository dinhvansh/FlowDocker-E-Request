# Security, Privacy, Resilience & Nonfunctional Requirements

**Status:** Design requirements; no certification or test evidence claimed.

## Authentication and authorization
- OIDC via company Microsoft Entra (subject/tenant verified server-side). Use secure session/cookie or JWT validation with rotation and short validity.
- RBAC for Employee, Approver, Finance, Form Admin, Workflow Admin, System Admin, Auditor.
- Enforce record ACL + field-level read/write controls by active task and business status; UI hiding is not security.
- Tenant organization ID must come from authenticated session and be in every business query; test cross-tenant access.
- Sensitive finance fields and attachments never sent via Teams cards or broad webhook payloads.

## Dynamic content security
- Form builder cannot execute arbitrary JavaScript or arbitrary external URL fetches.
- Safe allowlisted expression AST with CPU/complexity limits and schema type checks; no `eval`.
- Freeze form/workflow definitions and request data revisions at submit.
- Sanitize content in HTML rendering and PDF; prevent template injection/SSRF.
- Upload quotas, extension+MIME+magic validation, malware scan integration, isolated object paths and attachment ACL.

## Teams/integrations
- Signed incoming bot activities; validate service credential + Entra end-user, task owner, origin and replay/idempotency.
- Use managed secrets, restricted outbound allowlists, signed outbound webhooks.
- Platform administrator validates DLP/licensing before authorizing tenant integration.
- Never log tokens/authorization headers/financial bank details.

## Durability
- PostgreSQL transaction records request/decision/audit/outbox atomically.
- Retry-safe Temporal workflow IDs and activity/task signals.
- Exponential backoff, retry budgets, dead-letter/operator reconciliation, monitoring lag.
- PDF generated from immutable approved revision; final artifact hash and provenance.
- Backup database **and object storage**; restore drill must prove linked attachment/PDF integrity.

## Operational gates
Define before UAT: expected employees, concurrent approvals, document size, PDF volume, retention, RPO/RTO and environment SLO. These are **unknown**, not achieved performance values.

## Threat model shortlist
IDOR/cross-tenant guessing; approval race; replayed Teams card; stale workflow graph; malicious form expressions; SSRF through lookup/webhook; storage link leak; duplicate payment; privilege escalation via field editing; PDF template injection; compromised bot credentials.

## Minimum evidence
Backend unit and PostgreSQL integration with two tenants, Playwright browser tests, Temporal worker crash/retry/replay, Teams sandbox E2E, file upload security checks, dependency/SBOM scan, backup+restore and a production-like UAT signoff. Release gate fails if any P0 authorization or double-decision test fails.


## Authorization/data-layer acceptance gate (new)
See [Authorization Architecture](20-AUTHORIZATION-ARCHITECTURE.md), [Permission Matrix](21-PERMISSION-MATRIX.md), [Physical Data Layer](22-DATA-LAYER-PHYSICAL-DESIGN.md), [RLS Operations](23-POSTGRESQL-RLS-OPERATIONS.md), [Authorization Negative Tests](24-AUTHORIZATION-TEST-PLAN.md). A passing UI E2E is **not** evidence of SQL row/field isolation. Production requires applied migration, least-privilege DB grants, tested non-owner/non-BYPASSRLS role, two-tenant and same-tenant cross-owner denial, masked sensitive JSONB data, Teams/Web race, request grant revocation and backup/recovery evidence.
