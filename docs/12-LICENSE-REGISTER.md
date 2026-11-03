# Third-Party License Register and Procurement Gates

**Status:** Preliminary research register as of 2026-10-27. This is **not** a legal opinion, package-level SBOM, proof of procurement, or permission to white-label every component. Revalidate at exact pinned version, edition, deployment and distribution model before implementation/release.

## Proposed V1 dependencies
| Component | Candidate / license family | Internal self-hosted | Commercial/white-label caution | Gate |
|---|---|---|---|---|
| Form designer/renderer | Form.io **JS Core** — MIT (verify package) | Generally permitted subject to notices | Do not conflate with Form.io API Server (OSL 3.0) or paid enterprise plugins | Lock versions; check every bundled module |
| Workflow Studio | Synergy Codes Workflow Builder **Community Edition**, Apache-2.0 (verify) | Generally permitted | Enterprise extensions may be separate; identify included packages | Verify repository license, feature availability and bundled code |
| Temporal open-source | Temporal Server / SDK, license per release (commonly MIT) | Generally permitted | SaaS/cloud product contract separate | Verify pinned server + SDK |
| React Flow/xyflow | MIT (verify edition) | Generally permitted | Pro/examples may have different terms | Avoid copy of separately licensed paid assets |
| Next.js / React / shadcn/ui | MIT-family upstream (verify packages) | Generally permitted | Preserve attribution/NOTICE where required | Generate SBOM |
| PostgreSQL | PostgreSQL License | Generally permitted | Maintain notices | Confirm distribution packaging |
| Valkey | BSD-3-Clause | Generally permitted | Do not assume complete compatibility without test | Redis-protocol integration POC |
| SeaweedFS | Apache-2.0 per upstream (verify version) | Generally permitted | S3-compatible is not identical to AWS S3 | Security, performance and license POC |
| PDF.js | Apache-2.0 (verify) | Generally permitted | Preserve notices | Verify dependencies |
| pdf-lib | MIT (verify) | Generally permitted | No native PAdES compliance guarantee | Validate PDF output |
| LibreOffice (if deployed for conversion) | MPL-2.0 / LGPL-family components | Generally permitted with compliance | Distribution/modified component obligations | Verify packaged modules and conversion quality |
| Microsoft Teams Bot / Entra / Graph | Microsoft cloud product terms, **not** MIT license | Requires eligible tenant/config | Bot hosting, App approvals, API and premium connectors may cost | IT tenant/admin + procurement signoff |

## Explicitly deferred V2
| Component | Risk / review |
|---|---|
| ONLYOFFICE Docs Community | AGPL-3.0 with project-specific additional terms/branding integration considerations; legal review for proprietary embedded integration and concurrent editing plan |
| ONLYOFFICE Docs Developer | Commercial alternative for proprietary embedding; contract and pricing required |
| Existing FlowDocker E-Office signing source | Separate **source-available** community license, not OSI open source; internal-use and commercial redistribution rights differ; owner authorization and third-party notices required |
| DSS / certificate integration | LGPL and certificate/trust policy, no automatic regulatory compliance |

## Licensing mechanics (practical)
- MIT/BSD/Apache usually permit internal and commercial use with copyright/license/NOTICE obligations.
- AGPL is **not** automatically a monetary license fee; obligations depend on copying/modifying/integrating/deploying software and network access. Merely hosting separate services does not by itself prove either compliance or noncompliance.
- Upstream package license is not equivalent to license of the entire deployment tree.
- Native Teams Approvals is different from a custom bot; connector licensing and company DLP must be checked.
- Project's own license **has not yet been chosen**. Do not paste another repository's LICENSE or declare the new product Apache/MIT without owner approval.

## Required release review procedure
1. Freeze exact package versions, Docker images and upstream commit tags.
2. Create SBOM including npm transitive dependencies and container packages; scan unknown/copyleft/commercial items.
3. Verify license files directly and third-party notices; examine bundled web assets/fonts/fonts usage (do not publish proprietary fonts).
4. Record how component is used: linked library, separate process, service, modified version, redistribution/hosting.
5. If proprietary product later: legal owner signs off GPL/AGPL/commercial integration posture; obtain ONLYOFFICE commercial agreement **if needed**.
6. Store license approvals, attribution/NOTICE and deployment decisions in release evidence.

## Sources for current validation
- [Form.io JS](https://github.com/formio/formio.js) and [Form.io licenses](https://form.io/open-source/)
- [Form.io React](https://github.com/formio/react)
- [Workflow Builder](https://github.com/synergycodes/workflowbuilder)
- [Temporal](https://github.com/temporalio/temporal)
- [React Flow](https://github.com/xyflow/xyflow)
- [ONLYOFFICE DocumentServer](https://github.com/ONLYOFFICE/DocumentServer)
- [ONLYOFFICE licensing FAQ](https://www.onlyoffice.com/license-faq)
- [SeaweedFS](https://github.com/seaweedfs/seaweedfs)
- [Valkey](https://github.com/valkey-io/valkey)
- [Microsoft Teams platform docs](https://learn.microsoft.com/en-us/microsoftteams/platform/)

## Decision
For V1, **exclude ONLYOFFICE and signing**. Select Form.io JS Core + Synergy Codes CE + Temporal only **after an executable, pinned-version POC** proves licensing and required APIs. Preserve a record of evidence.

## Optional Ant Design permissions preview (2026-10-30)

`@flowdocker/permission-builder/antd-preview` links `antd` 6.6.8 and `@ant-design/icons` 6.3.4, both MIT per installed package metadata and LICENSE files. Preserved upstream license texts are in `packages/permission-builder/legal/`. Versions and transitive dependencies are in package-lock.json. This opt-in UI comparison does not replace the main shadcn/Radix toolkit. Runtime package installation reported zero audit vulnerabilities; this is not a complete release/legal approval or SBOM assessment.

## Optional Form Code Studio — 2026-10-31
Direct dependencies pinned: codemirror 6.0.2; @codemirror/lang-json 6.0.2; @codemirror/lint 6.9.7; @codemirror/autocomplete 6.20.4; @codemirror/view 6.43.15; @codemirror/state 6.7.6; @codemirror/language 6.13.1; @lezer/highlight 1.2.3; jsonc-parser 3.3.1. Installed package manifests identify MIT; preserve their LICENSE files and transitive notices in distributions. These remain upstream software, not FlowDocker-owned code. Standard standalone forms export remains independent of this optional editor subpath at this stage.

## Backend foundation — 2026-11-03
Installed direct runtime packages Fastify 5.12.8 and node-postgres (pg) 8.23.1 declare MIT in their installed manifests; dev runner tsx 4.23.15 declares MIT. Exact dependency graph is locked. Local PostgreSQL uses 16.6-alpine, subject to patch/image/SBOM review before release. npm audit --omit=dev reports zero runtime advisories on this run; full developer dependency audit still has 11 moderate advisories. This is not release or legal signoff.

Local identity uses @fastify/rate-limit 10.3.0 (MIT per installed manifest), exact direct dependency pinned in package-lock. This does not replace production IAM/security review.

## Approval engine POC — 2026-11-04

Direct @temporalio/client, common, worker and workflow are pinned to 1.25.0;
installed manifests/LICENSE files identify MIT. The development image is
temporalio/temporal 1.4.1 pinned by digest in compose.backend.yml (server 1.28.0,
UI 2.39.0). Preserve upstream notices; full transitive/container SBOM and release
review remain pending. Form.io is not installed: the original Forms engine is
retained per the later owner decision.
