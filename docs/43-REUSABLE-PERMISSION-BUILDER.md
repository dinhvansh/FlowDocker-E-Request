# FlowDocker Permission Builder — Reusable Authorization Administration

**STATUS: DESIGN ONLY — no UI, policy engine, migrations or test execution.** 2026-10-28. This extends [E-Request Authorization](20-AUTHORIZATION-ARCHITECTURE.md) into an application-agnostic capability. **No-code policy authoring is not equivalent to secure enforcement.**

## Product goal
In any FlowDocker app, a permitted admin registers resources and permitted actions, creates roles and scoped grants, sets conditional row/field rules in a **Permission Builder UI**, then tests/simulates and publishes an immutable reviewed policy version. Platform API code uses a central policy decision point (PDP) + enforcement middleware (PEP); UI guards are presentation only. PostgreSQL RLS provides an additional tenant-row boundary where appropriate.

## Permission dimensions
| Dimension | Examples | Essential enforcement |
|---|---|---|
| Identity | ACTIVE Entra-verified user; tenant membership | AuthN + current state from DB, not stale group claim |
| App / Module | E-Request.Payment vs IT-Assets.Inventory | scoped registered `app_id/module_id` |
| Resource | `request`, `asset`, `master.vendor`, `sync.pipeline` | registered typed resource schema |
| Action | `read`, `create`, `submit`, `approve`, `transfer`, `dispose`, `export` | explicit capability not free-text from UI |
| Scope | Tenant, Company, Department, Own, Assigned Task, Explicit Grant | server-referenced relationships and active date |
| Attributes | status, sensitivity, classification, amount, stage | type-safe allowlisted predicate AST |
| Field | read, edit, mask, deny, export | backend projection and write whitelist |
| Time/Context | effective interval, actor active, delegation | validated server time/side constraints |

**Default DENY.** A broad `role:Manager` does not allow reading arbitrary departmental requests, and `Tenant Admin` does not automatically expose bank data. Policies are additive only after explicit safety constraints. Explicit DENY / guardrails must override positive role grants; system invariants like tenant isolation cannot be overridden in UI.

## Builder UX
```text
Administration → Security → Permission Builder
Roles | Resources & Actions | Policy Rules | Data Scopes | Field Security | Test Access | Versions | Audit

Role: Finance Reviewer                         [DRAFT v4]
Resource             Read  Create  Edit  Approve  Export   Scope
Payment Request       ✓      –      –      ✓       –      Assigned Task
Finance Codes         ✓      –      –      –       –      Company/Department
Vendor Bank Fields    MASK   –      –      –       –      Except authorized phase

Rule Builder:
 IF actor.active = true
 AND task.status = PENDING
 AND task.assignedUserId = actor.userId
 AND request.tenantId = actor.tenantId
 THEN ALLOW task:decide_assigned
 ELSE DENY

[Test Access] Actor: Sample Manager   Action: APPROVE   Resource: PAY-A-001
→ DENY. Reason: no active task assignment (synthetic simulation)
[Validate] [Review Changes] [Publish Policy]
```

## Role setup process
1. Application code registers a versioned `resource/action manifest`; **admins cannot invent an unimplemented backend action**.
2. Admin selects a predefined or custom role with no implicit blanket privileges and binds it to app/module/tenant/company/department/request-type scope.
3. Matrix editor grants capabilities (create/view/edit/publish/process/approve) and attaches stronger relationship requirements where applicable.
4. Rule builder (AND/OR typed comparisons, safe references) expresses ABAC; field rules decide read/write/mask for each classification/stage.
5. Admin **simulates** representative allow/deny cases with synthetic fixtures. Simulation can show effective permissions/explanation without logging in as another user or issuing any real entitlement.
6. Validate policy (schema, deny invariants, privilege escalation, separation-of-duties); review diff, require approval and publish immutable version.
7. Enforcement service picks active policy version. Revocation and critical role disable apply promptly based on current DB state; caches are bounded and invalidated.

## API authorization contract
```typescript
// Declarative example, not a working SDK yet.
type AuthorizationRequest = {
  actor: { id: string; tenantId: string; active: boolean };
  appId: string;
  resource: { type: string; id: string; tenantId: string };
  action: string;
  context: { departmentId?: string; companyId?: string; taskId?: string; stage?: string };
};
type Decision = {
  effect: "ALLOW" | "DENY";
  reasonCodes: string[];            // never leak sensitive policy details to untrusted client
  fieldProjection?: { allow: string[]; mask: string[] };
  constraints?: { resourceIds?: string[]; scope?: string };
  policyVersion: string;
};
// authorize(actor, resource, action, ctx) runs SERVER-SIDE.
```
- **For single object:** API checks permission + current relationship + tenant + state before access; then applies field projection/masking. Revalidate on write under business transaction to prevent TOCTOU.
- **For lists/search/count/export:** compile a reviewed safe authorization predicate into query constraints, or use explicit authorized join/view; never fetch everything then filter in JS or browser. Policies may require dedicated business query adapters, not every condition can be expressed as raw SQL safely.
- **For workflow tasks:** capability `task:decide_assigned` is insufficient without exactly assigned, active, matching revision/tenant/one-time decision state. Same guard for Web/Teams.
- **For downloads:** object gateway uses request ACL + attachment classification; storage URLs not discoverable via UI policy alone.
- **For SQL:** tenant RLS/GRANT guardrails remain enforced separately. Session GUCs are not cryptographically trusted actor identity; no direct shared DB credentials to browsers or arbitrary SQL.

## Permission Builder security governance
- Only owner-authorized Security Admin/role steward can draft. **Publish is separate action**; require reviewer for highly privileged policy changes.
- Break-glass requires separate audited mechanism and is out of V1 unless explicitly approved; cannot click `Admin Allow All`.
- Role delegation/assignment must not enable a user to grant a capability broader than their own administrative scope; critical grants require dual approval.
- Policy source registries are immutable signed/versioned assets; attach app, module, resource and field classification schema compatibility.
- Policy simulator runs with synthetic fixtures, never logs raw payroll/bank docs and cannot elevate a live session. An explain result is informational; actual API always re-checks.
- Policy rollbacks are explicit published revisions; preserve previous policies and references used for audit.
- Maintain `who changed what`, denied reasons (redacted), policy diff, publish reviewer and impact report.
- Sensitive field classification in Master Data Builder must be referenced by Permission Builder; **changing a classification to PUBLIC cannot bypass mandatory finance restrictions** without an approved policy/migration.

## Reuse examples
- **E-Request:** `payment:submit`, `task:decide_assigned`, `payment:mark_paid`; requester OWN, approver assigned, Finance company+role; bank data redacted.
- **IT Assets:** `asset:create`, `asset:assign`, `asset:transfer`, `asset:dispose`; assigned custodian may view owned asset, IT asset manager controls location transfer.
- Both apps use the **same policy engine/UI** but different resource/action registrations and domain attributes.

## POC and release acceptance
Demonstrate two independent app manifests with distinct capabilities; role scope and policy publish; simulator allows and denies; real API enforces same decisions and masks; cross-app tenant/resource leaks denied; field and list/export protections; revocation blocks stale Teams approval; unauthorized users cannot publish policies. See [Platform QA](45-PLATFORM-ACCEPTANCE-AND-ROADMAP.md) and [E-Request tests](24-AUTHORIZATION-TEST-PLAN.md).

## Related reference
[App Module Contract](44-APP-MODULE-CONTRACT.md) · [Master Builder](42-REUSABLE-MASTER-DATA-BUILDER.md) · [Physical model](22-DATA-LAYER-PHYSICAL-DESIGN.md) · [PostgreSQL RLS](23-POSTGRESQL-RLS-OPERATIONS.md)
