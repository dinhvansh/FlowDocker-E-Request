-- FlowDocker E-Request: reference RLS/SELECT policies on PostgreSQL 16+
-- DESIGN ONLY. Not applied, not a production-ready comprehensive GRANT or
-- mutation-policy migration. The default for unlisted commands is DENY.
--
-- WARNING: set_config('app.*',...,true) values are not cryptographically
-- trustworthy; do not expose shared DB credentials/direct SQL to end users.
-- Verified backend should set these per transaction on one pooled connection.

CREATE OR REPLACE FUNCTION ereq.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id',true),'')::uuid
$$;
CREATE OR REPLACE FUNCTION ereq.current_actor_user_id() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.actor_user_id',true),'')::uuid
$$;

-- Ensure no table accidentally accepts unrestricted operations when a role
-- gets new SQL GRANT privileges. Owner + BYPASSRLS caveats documented.
ALTER TABLE ereq.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.departments FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.users FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.roles FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.role_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.user_role_assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.form_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.form_definitions FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.form_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.form_field_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.form_field_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.workflow_definitions FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.workflow_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.request_types FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.requests FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.request_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.request_revisions FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.approval_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.approval_tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.approval_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.approval_task_assignees FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.request_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.request_access_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.approval_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.approval_decisions FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.artifacts FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.payment_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.payment_operations FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.outbox_events FORCE ROW LEVEL SECURITY;

-- Any existing policies in a real database must be reviewed as a group.
-- Adding PERMISSIVE policies can unexpectedly broaden access with OR.

CREATE POLICY p_tenant_self_select ON ereq.tenants
  FOR SELECT USING (id=ereq.current_tenant_id());

CREATE POLICY p_department_directory_select ON ereq.departments
  FOR SELECT USING (tenant_id=ereq.current_tenant_id());

CREATE POLICY p_user_self_select ON ereq.users
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND id=ereq.current_actor_user_id()
    AND status='ACTIVE'
  );
-- Person/manager lookup must use a separate guarded directory-projection
-- rather than relaxing p_user_self_select to all employee records.

CREATE POLICY p_my_active_role_assignments ON ereq.user_role_assignments
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND user_id=ereq.current_actor_user_id()
    AND revoked_at IS NULL
    AND valid_from <= now()
    AND (valid_until IS NULL OR valid_until > now())
  );

CREATE POLICY p_request_type_active ON ereq.request_types
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND status='ACTIVE'
  );

CREATE POLICY p_published_form_versions ON ereq.form_versions
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND state='PUBLISHED'
  );

CREATE POLICY p_published_form_definitions ON ereq.form_definitions
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND EXISTS(
      SELECT 1 FROM ereq.form_versions fv
      WHERE fv.tenant_id=form_definitions.tenant_id
        AND fv.form_id=form_definitions.id
        AND fv.state='PUBLISHED'
    )
  );

CREATE POLICY p_published_workflow_versions ON ereq.workflow_versions
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND state='PUBLISHED'
  );

CREATE POLICY p_published_workflow_definitions ON ereq.workflow_definitions
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND EXISTS(
      SELECT 1 FROM ereq.workflow_versions wv
      WHERE wv.tenant_id=workflow_definitions.tenant_id
        AND wv.workflow_id=workflow_definitions.id
        AND wv.state='PUBLISHED'
    )
  );

-- A user sees only their active explicit row-grants, not other users' grants.
CREATE POLICY p_my_request_grants ON ereq.request_access_grants
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND grantee_user_id=ereq.current_actor_user_id()
    AND revoked_at IS NULL
    AND (valid_until IS NULL OR valid_until > now())
  );

-- Request visibility is not granted simply by MANAGER or FINANCE role.
CREATE POLICY p_request_owner_or_read_grant ON ereq.requests
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND (
      requester_user_id=ereq.current_actor_user_id()
      OR EXISTS(
        SELECT 1 FROM ereq.request_access_grants g
        WHERE g.tenant_id=requests.tenant_id
          AND g.request_id=requests.id
          AND g.grantee_user_id=ereq.current_actor_user_id()
          AND g.permission_code='REQUEST_READ'
          AND g.revoked_at IS NULL
          AND (g.valid_until IS NULL OR g.valid_until > now())
      )
    )
  );

-- Related submitted data rows inherit request visibility at ROW level.
-- NOT permission to receive every dynamic JSONB field via the API.
CREATE POLICY p_revision_visible_request ON ereq.request_revisions
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM ereq.requests r
      WHERE r.tenant_id=request_revisions.tenant_id
        AND r.id=request_revisions.request_id
    )
  );

-- An assignee may see only their own association. Keep workflow operator's
-- broader policy behind a separate business service path, not a blanket grant.
CREATE POLICY p_own_task_assignee ON ereq.approval_task_assignees
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND user_id=ereq.current_actor_user_id()
    AND revoked_at IS NULL
  );

CREATE POLICY p_task_my_assignment ON ereq.approval_tasks
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND EXISTS(
      SELECT 1 FROM ereq.approval_task_assignees a
      WHERE a.tenant_id=approval_tasks.tenant_id
        AND a.task_id=approval_tasks.id
        AND a.user_id=ereq.current_actor_user_id()
        AND a.revoked_at IS NULL
    )
  );

CREATE POLICY p_decisions_on_visible_tasks ON ereq.approval_decisions
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM ereq.approval_tasks t
      WHERE t.tenant_id=approval_decisions.tenant_id
        AND t.id=approval_decisions.task_id
    )
  );

-- Row visibility alone is NOT enough for attachments: classification and
-- malware scan state must additionally be enforced by authorized API gateway.
CREATE POLICY p_attachment_visible_request ON ereq.attachments
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND classification IN ('PUBLIC_REQUEST','INTERNAL')
    AND scan_status='CLEAN'
    AND EXISTS (
      SELECT 1 FROM ereq.requests r
      WHERE r.tenant_id=attachments.tenant_id
        AND r.id=attachments.request_id
    )
  );

CREATE POLICY p_artifact_visible_request ON ereq.artifacts
  FOR SELECT USING (
    tenant_id=ereq.current_tenant_id()
    AND state='READY'
    AND EXISTS (
      SELECT 1 FROM ereq.requests r
      WHERE r.tenant_id=artifacts.tenant_id
        AND r.id=artifacts.request_id
    )
  );

-- No generic SELECT policies for payment_operations, audit_events,
-- outbox_events, permission catalog, role catalog, form_field_policies:
-- deliberate default deny until workload-specific safe projections exist.
-- There are NO INSERT/UPDATE/DELETE policies here; write actions require a
-- separately reviewed transaction API+role policy/migration, not blind
-- blanket tenant-only CRUD grants.
--
-- THIS REFERENCE SQL ALSO REQUIRES explicit GRANTs; none are made here.
-- For a proof-of-concept, test SELECT with a non-owner, non-BYPASSRLS role
-- after DBA-approved minimal GRANTs to the exact tables/views needed.
