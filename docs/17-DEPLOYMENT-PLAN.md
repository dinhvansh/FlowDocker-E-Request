# Dev / QA / Production Deployment Plan

**Status:** Proposed only. No ready-to-deploy Compose stack or secrets exist in this repository.

## Candidate runtime topology
```text
HTTPS Reverse Proxy
  ├── Next.js Web
  ├── Node.js API (+ auth, form & approval modules)
  └── Teams Bot public HTTPS ingress (narrow, verified)
Internal Docker/cluster network
  ├── PostgreSQL
  ├── Temporal Server + required persistence/services
  ├── Temporal Worker(s)
  ├── Outbox/Notification Worker(s)
  ├── Optional Valkey
  ├── Storage Adapter / candidate S3-compatible store
  └── PDF Renderer
```

## Environments
| Environment | Data | Goal |
|---|---|---|
| Local dev | Fake/demo identities, fake financial docs | UI and isolated integration |
| CI disposable | Seeded PostgreSQL/Temporal and mocked or sandbox Teams | deterministic contract/negative tests |
| Shared QA | Test organization, approved test tenant, no production PII | real API/worker/browser/Teams E2E |
| Production | Actual tenant, controlled retention/access | only after compliance, backups and UAT |

## Security defaults
- Bind DB/Temporal/storage ports internally; terminate TLS, encrypt transit to Teams.
- Secrets via environment secret manager; never commit `.env`, service principal certificates, tokens, bank data or actual company private URLs.
- Configure verified bot callback origin and OIDC identity; protect service-to-service calls.
- Use fixed image versions and pinned dependency lockfiles. Security patches reviewed prior to rollout.
- Database migrations additive; backup/restore before release; never run demo destructive seeding on production.
- PDF and attachment object storage backups have separate verification.

## Observability / incident runbook
Monitor: task backlog age, outbox retry count, Temporal activity failures, Teams delivery/refresh errors, PDF job age, storage free capacity, backup status, auth-denied spikes. Each business operation has trace/correlation ID that does not leak private data. Document recovery for stuck decisions, Temporal down, S3 outage, Teams bot downtime and operator intervention.

## What remains to be built
Docker/dev Compose, dependency lockfiles, Prisma migrations, Helm/production deploy strategy, staging TLS, alerting, backup scripts and CI. Until then, installation instructions should **not** claim a running application.

## Data classification
Public repo can store sanitized architecture and synthetic examples only. Production configuration, company-specific workflows, real people, banking info and private URLs belong in restricted secret/configuration stores, not Git.
