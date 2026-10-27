-- FlowDocker E-Request / reference DDL (PostgreSQL 16+)
-- DESIGN ONLY: NOT EXECUTED, NOT APPROVED AS PRODUCTION MIGRATION.
-- Synthetic schema. Apply with migrations only after DBA review.
-- No production secrets or data belong in this file.
CREATE SCHEMA IF NOT EXISTS ereq;

CREATE TABLE ereq.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ereq.departments (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  parent_id uuid,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,code),
  FOREIGN KEY (tenant_id,parent_id) REFERENCES ereq.departments(tenant_id,id)
);

CREATE TABLE ereq.users (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entra_tenant_id uuid NOT NULL,
  entra_object_id uuid NOT NULL,
  display_name text NOT NULL,
  department_id uuid,
  manager_user_id uuid,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,entra_tenant_id,entra_object_id),
  FOREIGN KEY (tenant_id,department_id) REFERENCES ereq.departments(tenant_id,id),
  FOREIGN KEY (tenant_id,manager_user_id) REFERENCES ereq.users(tenant_id,id)
);
CREATE INDEX ix_users_manager ON ereq.users(tenant_id,manager_user_id);

CREATE TABLE ereq.permissions (
  code text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE ereq.roles (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  label text NOT NULL,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,code)
);

CREATE TABLE ereq.role_permissions (
  tenant_id uuid NOT NULL,
  role_id uuid NOT NULL,
  permission_code text NOT NULL REFERENCES ereq.permissions(code),
  PRIMARY KEY (tenant_id,role_id,permission_code),
  FOREIGN KEY (tenant_id,role_id) REFERENCES ereq.roles(tenant_id,id) ON DELETE CASCADE
);

CREATE TABLE ereq.user_role_assignments (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  scope_kind text NOT NULL CHECK (scope_kind IN ('TENANT','DEPARTMENT','REQUEST_TYPE','REQUEST')),
  scope_id uuid,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  revoked_at timestamptz,
  granted_by uuid,
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,user_id) REFERENCES ereq.users(tenant_id,id),
  FOREIGN KEY (tenant_id,role_id) REFERENCES ereq.roles(tenant_id,id),
  FOREIGN KEY (tenant_id,granted_by) REFERENCES ereq.users(tenant_id,id),
  CONSTRAINT ck_scope_id CHECK ((scope_kind='TENANT' AND scope_id IS NULL)
                             OR (scope_kind<>'TENANT' AND scope_id IS NOT NULL)),
  CONSTRAINT ck_validity CHECK (valid_until IS NULL OR valid_until > valid_from)
);
-- Polymorphic scope_id needs a scope-type + tenant reference check in the application
-- (or dedicated typed binding tables); never accept an arbitrary scope_id at face value.
CREATE INDEX ix_role_assignment_user ON ereq.user_role_assignments(tenant_id,user_id,revoked_at,valid_until);

CREATE TABLE ereq.form_definitions (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text NOT NULL,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,code)
);

CREATE TABLE ereq.form_versions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  version_no integer NOT NULL CHECK (version_no>0),
  schema_json jsonb NOT NULL CHECK (jsonb_typeof(schema_json)='object'),
  checksum_sha256 text NOT NULL,
  state text NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','PUBLISHED','RETIRED')),
  published_at timestamptz,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,form_id,version_no),
  FOREIGN KEY (tenant_id,form_id) REFERENCES ereq.form_definitions(tenant_id,id)
);

CREATE TABLE ereq.form_field_policies (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_version_id uuid NOT NULL,
  field_key text NOT NULL,
  classification text NOT NULL DEFAULT 'INTERNAL'
    CHECK (classification IN ('PUBLIC_REQUEST','INTERNAL','FINANCE_SENSITIVE','SECRET')),
  read_policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  write_policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,form_version_id,field_key),
  FOREIGN KEY (tenant_id,form_version_id) REFERENCES ereq.form_versions(tenant_id,id)
);

CREATE TABLE ereq.workflow_definitions (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text NOT NULL,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,code)
);

CREATE TABLE ereq.workflow_versions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  version_no integer NOT NULL CHECK (version_no>0),
  graph_json jsonb NOT NULL CHECK (jsonb_typeof(graph_json)='object'),
  compiled_plan_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  engine_compat_version text NOT NULL,
  checksum_sha256 text NOT NULL,
  state text NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','PUBLISHED','RETIRED')),
  published_at timestamptz,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,workflow_id,version_no),
  FOREIGN KEY (tenant_id,workflow_id) REFERENCES ereq.workflow_definitions(tenant_id,id)
);

CREATE TABLE ereq.request_types (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text NOT NULL,
  form_version_id uuid NOT NULL,
  workflow_version_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,code),
  FOREIGN KEY (tenant_id,form_version_id) REFERENCES ereq.form_versions(tenant_id,id),
  FOREIGN KEY (tenant_id,workflow_version_id) REFERENCES ereq.workflow_versions(tenant_id,id)
);

CREATE TABLE ereq.requests (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_no text NOT NULL,
  request_type_id uuid NOT NULL,
  requester_user_id uuid NOT NULL,
  department_id uuid NOT NULL,
  approval_status text NOT NULL DEFAULT 'DRAFT' CHECK
    (approval_status IN ('DRAFT','SUBMITTED','IN_APPROVAL','CHANGES_REQUESTED',
                         'APPROVED','REJECTED','CANCELLED','ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lock_version integer NOT NULL DEFAULT 1 CHECK (lock_version>0),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,request_no),
  FOREIGN KEY (tenant_id,request_type_id) REFERENCES ereq.request_types(tenant_id,id),
  FOREIGN KEY (tenant_id,requester_user_id) REFERENCES ereq.users(tenant_id,id),
  FOREIGN KEY (tenant_id,department_id) REFERENCES ereq.departments(tenant_id,id)
);
CREATE INDEX ix_requests_owner ON ereq.requests(tenant_id,requester_user_id,created_at DESC);
CREATE INDEX ix_requests_state ON ereq.requests(tenant_id,approval_status,created_at DESC);

CREATE TABLE ereq.request_revisions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  revision_no integer NOT NULL CHECK (revision_no>0),
  form_version_id uuid NOT NULL,
  workflow_version_id uuid NOT NULL,
  data_jsonb jsonb NOT NULL CHECK (jsonb_typeof(data_jsonb)='object'),
  data_hash_sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,request_id,id),
  UNIQUE (tenant_id,request_id,revision_no),
  FOREIGN KEY (tenant_id,request_id) REFERENCES ereq.requests(tenant_id,id),
  FOREIGN KEY (tenant_id,form_version_id) REFERENCES ereq.form_versions(tenant_id,id),
  FOREIGN KEY (tenant_id,workflow_version_id) REFERENCES ereq.workflow_versions(tenant_id,id)
);
CREATE INDEX ix_revision_by_request ON ereq.request_revisions(tenant_id,request_id,revision_no DESC);

CREATE TABLE ereq.approval_tasks (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  request_revision_id uuid NOT NULL,
  workflow_node_key text NOT NULL,
  temporal_workflow_id text NOT NULL,
  task_status text NOT NULL DEFAULT 'PENDING'
    CHECK (task_status IN ('PENDING','APPROVED','REJECTED','RETURNED','SKIPPED','CANCELLED')),
  lock_version integer NOT NULL DEFAULT 1 CHECK (lock_version>0),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,request_id,request_revision_id,workflow_node_key,id),
  FOREIGN KEY (tenant_id,request_id) REFERENCES ereq.requests(tenant_id,id),
  FOREIGN KEY (tenant_id,request_id,request_revision_id)
    REFERENCES ereq.request_revisions(tenant_id,request_id,id)
);
CREATE INDEX ix_tasks_request ON ereq.approval_tasks(tenant_id,request_id,task_status);

CREATE TABLE ereq.approval_task_assignees (
  tenant_id uuid NOT NULL,
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY (tenant_id,task_id,user_id),
  FOREIGN KEY (tenant_id,task_id) REFERENCES ereq.approval_tasks(tenant_id,id),
  FOREIGN KEY (tenant_id,user_id) REFERENCES ereq.users(tenant_id,id)
);
CREATE INDEX ix_active_assignee ON ereq.approval_task_assignees(tenant_id,user_id,task_id) WHERE revoked_at IS NULL;

CREATE TABLE ereq.request_access_grants (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  grantee_user_id uuid NOT NULL,
  permission_code text NOT NULL CHECK
    (permission_code IN ('REQUEST_READ','ATTACHMENT_READ','AUDIT_SUMMARY_READ')),
  source_task_id uuid,
  valid_until timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,request_id) REFERENCES ereq.requests(tenant_id,id),
  FOREIGN KEY (tenant_id,grantee_user_id) REFERENCES ereq.users(tenant_id,id),
  FOREIGN KEY (tenant_id,source_task_id) REFERENCES ereq.approval_tasks(tenant_id,id)
);
CREATE INDEX ix_active_grants ON ereq.request_access_grants
  (tenant_id,grantee_user_id,request_id,permission_code)
  WHERE revoked_at IS NULL;

CREATE TABLE ereq.approval_decisions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('APPROVE','REJECT','RETURN')),
  comment text,
  source_channel text NOT NULL CHECK (source_channel IN ('WEB','TEAMS')),
  idempotency_key text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,task_id),
  UNIQUE (tenant_id,actor_user_id,idempotency_key),
  FOREIGN KEY (tenant_id,task_id) REFERENCES ereq.approval_tasks(tenant_id,id),
  FOREIGN KEY (tenant_id,actor_user_id) REFERENCES ereq.users(tenant_id,id)
);
-- The UNIQUE task constraint complements, not replaces, atomic PENDING->terminal
-- in the approval command transaction. No direct client INSERT should be permitted.

CREATE TABLE ereq.attachments (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  storage_key text NOT NULL,
  sha256 text NOT NULL,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  classification text NOT NULL DEFAULT 'INTERNAL'
    CHECK (classification IN ('PUBLIC_REQUEST','INTERNAL','FINANCE_SENSITIVE','SECRET')),
  scan_status text NOT NULL DEFAULT 'PENDING' CHECK
    (scan_status IN ('PENDING','CLEAN','BLOCKED','FAILED')),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,storage_key),
  FOREIGN KEY (tenant_id,request_id,revision_id)
    REFERENCES ereq.request_revisions(tenant_id,request_id,id)
);

CREATE TABLE ereq.artifacts (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'APPROVED_PDF',
  state text NOT NULL DEFAULT 'PENDING' CHECK
    (state IN ('PENDING','GENERATING','READY','FAILED')),
  storage_key text,
  sha256 text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,request_id,revision_id)
    REFERENCES ereq.request_revisions(tenant_id,request_id,id)
);

CREATE TABLE ereq.payment_operations (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'NOT_READY' CHECK
    (state IN ('NOT_READY','PENDING_PAYMENT','PROCESSING','PAID','FAILED')),
  transaction_ref text,
  updated_by uuid,
  paid_at timestamptz,
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,request_id),
  FOREIGN KEY (tenant_id,request_id) REFERENCES ereq.requests(tenant_id,id),
  FOREIGN KEY (tenant_id,updated_by) REFERENCES ereq.users(tenant_id,id)
);

CREATE TABLE ereq.audit_events (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  actor_user_id uuid,
  service_actor text,
  action text NOT NULL,
  correlation_id text,
  event_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,actor_user_id) REFERENCES ereq.users(tenant_id,id)
);
CREATE INDEX ix_audit_resource ON ereq.audit_events(tenant_id,resource_type,resource_id,occurred_at DESC);

CREATE TABLE ereq.outbox_events (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','PROCESSING','SENT','FAILED')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,dedupe_key)
);
CREATE INDEX ix_outbox_pending ON ereq.outbox_events(next_attempt_at)
  WHERE status IN ('PENDING','FAILED');

-- FOLLOW-UP BEFORE PRODUCTION:
-- 1. Add migration-controlled function/transaction for decision + audit + outbox.
-- 2. Protect published versions/submitted revisions as immutable.
-- 3. Separate sensitive bank values from broad data_jsonb projections.
-- 4. Implement & review per-table GRANT and RLS for read/write/list/export.
-- 5. Add actor-scope validation for polymorphic role assignments.
-- 6. Test as non-owner and non-BYPASSRLS role with two tenants.
