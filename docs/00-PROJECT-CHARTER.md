# Project Charter — FlowDocker E-Request

**Document status:** Proposed / V1 planning · **Date:** 2026-10-27

## Problem and goal
Employees currently submit internal requests across disconnected forms/channels. Build a configurable portal in which administrators define form schemas and approval workflows, users submit requests, approvers process them via web or Teams, and the company tracks all decisions with audit evidence.

**North star:** A Form Admin and Workflow Admin can publish a new request type and IF/ELSE approval policy **without deploying code**, provided they use supported field and node types.

## V1 in scope
- Form Builder, Form Renderer, draft/publish, schema versioning, field validation, lookup, file attachments, repeating expense rows, role/field visibility.
- Workflow Studio, validation, publish/versioning, sequential and parallel approvals, AND/OR/IF/ELSE, task assignment by user/role/manager/department, return-for-changes.
- Submission and immutable snapshots; My Requests, My Tasks, request detail/timeline, notifications, audit.
- Web approval and custom Teams Bot approval through one authenticated decision service.
- Payment Request (approval status separate from settlement); Business Trip Request (domestic/international branch).
- Final PDF generation **after approval**, controlled storage and download.
- Admin management of request types, permissions, form/workflow bindings, integrations; tenant/organization scope.

## Out of scope for V1
- ONLYOFFICE or other collaborative Word editor; contract negotiation / Track Changes.
- Qualified digital/PAdES signature; E-Office signing-service reuse.
- Native Microsoft Teams **Approvals** two-way parity or Graph beta production dependency.
- ERP posting/payment execution; only manual Finance settlement state (ERP connector is future).
- Free-form loops, escalation/delegation, SLA automation, advanced OCR, AI document extraction.
- Selling hosted SaaS, multi-region HA, tenant self-service billing.

## Stakeholders and decisions
| Role | Ownership |
|---|---|
| Product owner | Priorities, workflows, UAT sign-off |
| Finance owner | Payment policy, settlement, audit |
| HR/Travel owner | Trip policy and approval routing |
| IT Admin | Entra/Teams permissions, networking, security and backups |
| Form Admin | Data model/form version and publishing |
| Workflow Admin | Workflow policy, assignees, conditional branches |
| Employee / Manager / Finance operator | Day-to-day create, review, approve, process |

## Success criteria
- New request type publishable from UI with no source code changes.
- Conditional route uses **trusted submitted snapshot**, including correct values from repeatable items.
- Authorized approver can act on either channel; exactly one accepted decision per task.
- Reject/return/revise never silently mutates historical approvals.
- Finance can mark payment as PAID only with proper role and evidence.
- PDF has snapshot metadata, storage hash and audit provenance.
- CI + browser E2E + database/Temporal integration + Teams sandbox UAT evidence are published before declaring any phase done.

## Non-sensitive examples
All sample names, thresholds, company roles and data in docs are fictitious. **Never commit employee identities, payment bank details, contract data, tokens or production topology.**
