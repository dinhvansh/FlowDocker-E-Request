# Codex Implementation Handoff — First Vertical Slice

**Status:** Engineering work request; not implemented.

## First task (scope)
On a feature branch, scaffold Next.js frontend + Node API + PostgreSQL migrations + Temporal dev workers, and prove:
1. Admin publishes a Form.io JS Core Payment Request form with `amount`, `currency`, description and attachment metadata.
2. Admin publishes a simple Workflow Builder graph with `START → MANAGER_APPROVAL → CONDITION(amount > sample threshold) → optional HOD_APPROVAL → END`.
3. Employee saves a draft and submits validated revision.
4. Request API emits durable start event and Temporal runs the versioned graph.
5. Manager approves through **Web**, with idempotent command and audit.
6. Verify below/above-threshold routing on **real** PostgreSQL/Temporal. No Teams or PDF required in this first slice, but architecture must allow them later.

## Before implementation
- Check pinned package names/licensing and actual Workflow Builder CE APIs/Temporal integration; build an executable spike. **Do not assume** a hypothetical `@workflowbuilder/sdk` package name is available.
- Identify PostgreSQL/Temporal Docker resource requirements; no test result until it runs.
- Record selected major versions and platform requirements in a fresh `docs/implementation/POC-RESULTS.md` only when actually tested.
- Plan API/schema/worker/UI scope and security tests before code.

## Deliverables for PR
- README local setup with non-destructive commands and fake credentials.
- Typechecked backend/frontend, migration(s), idempotent outbox/command path.
- Form designer and renderer operational.
- Editor graph mapping and compile validation, safe condition evaluator.
- Tests for tenant authorization, PENDING-only decision, concurrent retry, both condition branches.
- CI logs and exact commit SHA; Playwright screenshot/evidence of real flow.

## Explicit non-deliverables
Custom Teams Bot, native Approvals sync, PDF, ONLYOFFICE, digital signing, ERP writeback, SaaS billing. Do not implement unseen endpoints or invent E2E success.

## Acceptance checkpoint
`DONE` only if admin can publish graph and form, employee can submit two test amount variants, manager can approve via actual API/Web, and Temporal history proves the right branch from immutable request data. Any missing SDK feature must be listed as blocker and scoped custom implementation.


## Required data-layer work before POC signoff
Read [Agent Skill](../.agents/skills/authorization-design/SKILL.md). Build/validate schema from `db/design/001_core_schema.sql` and RLS baseline from `db/design/002_rls_policies.sql` only after reviewing production gaps. Provide real additive migrations, non-owner runtime database roles, scoped authorization command service, field-masked request serializers, tenant-safe FK and two-tenant/same-tenant negative tests from [Test Plan](24-AUTHORIZATION-TEST-PLAN.md). Neither SQL design file is an executed migration.
