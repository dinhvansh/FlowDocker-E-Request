-- FlowDocker E-Request — reference Master Data Hub DDL, PostgreSQL 16+
-- DESIGN ONLY: not a migration, not executed, no secrets. Requires 001_core_schema.sql.
-- All canonical keys are tenant-scoped; source credentials held in external secrets manager.
-- See docs/25–29 and 004_master_data_rls.sql before adapting to real migrations.

CREATE TABLE ereq.master_sources (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('ENTRA_GRAPH','HR_API','HR_FILE','EPICOR_REST','EPICOR_SQL_READONLY','MANUAL')),
  business_owner text NOT NULL,
  secret_reference text, -- secret store locator, NEVER credential/token
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb, -- allowlisted nonsecret options
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,code)
);

CREATE TABLE ereq.master_sync_pipelines (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  entity_kind text NOT NULL CHECK(entity_kind IN ('USER_IDENTITY','EMPLOYEE','ORG_RELATION',
    'COMPANY','VENDOR','COST_CENTER','FINANCE_CODE','TRAVEL_POLICY')),
  sync_mode text NOT NULL CHECK(sync_mode IN ('DELTA_TOKEN','KEYSET','FULL_SNAPSHOT','MANUAL')),
  enabled boolean NOT NULL DEFAULT false,
  schedule_expression text, -- validated in backend, never arbitrary shell code
  config_version integer NOT NULL DEFAULT 1 CHECK(config_version>0),
  last_success_at timestamptz,
  freshness_limit_minutes integer CHECK(freshness_limit_minutes>0),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,source_id,entity_kind),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id)
);

CREATE TABLE ereq.master_sync_checkpoints (
  tenant_id uuid NOT NULL,
  pipeline_id uuid NOT NULL,
  cursor_ciphertext bytea, -- encrypted opaque Graph deltaLink/keyset cursor
  cursor_kind text NOT NULL CHECK(cursor_kind IN ('DELTA_TOKEN','KEYSET','FULL_SNAPSHOT','MANUAL')),
  checkpoint_version bigint NOT NULL DEFAULT 0,
  committed_at timestamptz,
  PRIMARY KEY(tenant_id,pipeline_id),
  FOREIGN KEY(tenant_id,pipeline_id) REFERENCES ereq.master_sync_pipelines(tenant_id,id)
);

CREATE TABLE ereq.master_sync_runs (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','RUNNING','SUCCESS','NEEDS_REVIEW','FAILED','CANCELLED')),
  trigger_kind text NOT NULL CHECK(trigger_kind IN ('SCHEDULE','MANUAL','RECOVERY')),
  lease_epoch bigint NOT NULL DEFAULT 0,
  lease_owner text,
  lease_expires_at timestamptz,
  checkpoint_version_before bigint NOT NULL DEFAULT 0,
  checkpoint_version_after bigint,
  records_fetched bigint NOT NULL DEFAULT 0,
  records_applied bigint NOT NULL DEFAULT 0,
  records_quarantined bigint NOT NULL DEFAULT 0,
  records_inactivated bigint NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  PRIMARY KEY(tenant_id,id),
  FOREIGN KEY(tenant_id,pipeline_id) REFERENCES ereq.master_sync_pipelines(tenant_id,id)
);
-- Worker must acquire/update lease atomically with fencing token;
-- only one RUNNING run per pipeline at once.
CREATE UNIQUE INDEX ux_one_running_master_sync
  ON ereq.master_sync_runs(tenant_id,pipeline_id) WHERE status='RUNNING';
CREATE INDEX ix_master_sync_run_status ON ereq.master_sync_runs(tenant_id,status,started_at DESC);

CREATE TABLE ereq.master_staging_records (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL,
  source_id uuid NOT NULL,
  entity_kind text NOT NULL,
  external_key text NOT NULL,
  company_external_key text NOT NULL DEFAULT '', -- part of source identity namespace
  operation text NOT NULL CHECK(operation IN ('UPSERT','DELETE')),
  payload_ciphertext bytea, -- optional bounded encrypted staging; redact source PIIs
  payload_hash_sha256 text,
  source_revision text,
  validation_state text NOT NULL DEFAULT 'STAGED'
    CHECK (validation_state IN ('STAGED','VALID','QUARANTINED','APPLIED')),
  error_code text,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,sync_run_id,entity_kind,company_external_key,external_key),
  FOREIGN KEY(tenant_id,sync_run_id) REFERENCES ereq.master_sync_runs(tenant_id,id),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id)
);
CREATE INDEX ix_staging_run_state ON ereq.master_staging_records(tenant_id,sync_run_id,validation_state);

CREATE TABLE ereq.master_external_identities (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  entity_kind text NOT NULL,
  company_external_key text NOT NULL DEFAULT '',
  external_key text NOT NULL,
  canonical_entity_id uuid, -- polymorphic reference: resolve type+tenant in trusted service
  mapping_state text NOT NULL DEFAULT 'UNMAPPED'
    CHECK(mapping_state IN ('UNMAPPED','MATCHED','CONFLICT','INACTIVE')),
  match_method text CHECK(match_method IN ('SOURCE_KEY','APPROVED_MANUAL')),
  approved_by uuid,
  approved_at timestamptz,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,source_id,entity_kind,company_external_key,external_key),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id),
  FOREIGN KEY(tenant_id,approved_by) REFERENCES ereq.users(tenant_id,id)
);
-- No blind fuzzy join by email/name. canonical_entity_id is polymorphic;
-- a production design may prefer typed reference tables/trigger validation.

CREATE TABLE ereq.master_companies (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  company_external_key text NOT NULL,
  code text NOT NULL,
  display_name text NOT NULL,
  lifecycle_state text NOT NULL DEFAULT 'ACTIVE' CHECK(lifecycle_state IN ('ACTIVE','INACTIVE','PENDING_REVIEW')),
  last_seen_at timestamptz,
  source_hash text,
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,source_id,company_external_key),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id)
);

CREATE TABLE ereq.master_vendors (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  source_id uuid NOT NULL,
  vendor_external_key text NOT NULL,
  vendor_code text NOT NULL,
  display_name text NOT NULL,
  lifecycle_state text NOT NULL DEFAULT 'ACTIVE' CHECK(lifecycle_state IN ('ACTIVE','INACTIVE','PENDING_REVIEW')),
  source_hash text,
  last_seen_at timestamptz,
  changed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,company_id,source_id,vendor_external_key),
  FOREIGN KEY(tenant_id,company_id) REFERENCES ereq.master_companies(tenant_id,id),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id)
);
CREATE INDEX ix_active_vendors ON ereq.master_vendors(tenant_id,company_id,vendor_code)
  WHERE lifecycle_state='ACTIVE';

CREATE TABLE ereq.master_cost_centers (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  source_id uuid NOT NULL,
  external_key text NOT NULL,
  center_code text NOT NULL,
  display_name text NOT NULL,
  lifecycle_state text NOT NULL DEFAULT 'ACTIVE' CHECK(lifecycle_state IN ('ACTIVE','INACTIVE','PENDING_REVIEW')),
  source_hash text,
  last_seen_at timestamptz,
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,company_id,source_id,external_key),
  FOREIGN KEY(tenant_id,company_id) REFERENCES ereq.master_companies(tenant_id,id),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id)
);
CREATE INDEX ix_active_cost_centers ON ereq.master_cost_centers(tenant_id,company_id,center_code)
  WHERE lifecycle_state='ACTIVE';

CREATE TABLE ereq.master_employee_profiles (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  employee_external_key text NOT NULL,
  user_id uuid,
  employee_code text NOT NULL,
  employment_state text NOT NULL DEFAULT 'PENDING'
    CHECK(employment_state IN ('PENDING','ACTIVE','ON_LEAVE','TERMINATED')),
  display_name text NOT NULL,
  effective_from date,
  effective_to date,
  source_hash text,
  last_seen_at timestamptz,
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,source_id,employee_external_key),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id),
  FOREIGN KEY(tenant_id,user_id) REFERENCES ereq.users(tenant_id,id)
);
-- Some HR employees have no active Entra account; nullable user_id is intentional.
CREATE INDEX ix_employee_user ON ereq.master_employee_profiles(tenant_id,user_id) WHERE user_id IS NOT NULL;

CREATE TABLE ereq.master_org_assignments (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_profile_id uuid NOT NULL,
  department_id uuid,
  manager_user_id uuid,
  position_code text,
  effective_from date,
  effective_to date,
  observed_at timestamptz NOT NULL DEFAULT now(),
  source_id uuid NOT NULL,
  mapping_state text NOT NULL DEFAULT 'PENDING'
    CHECK(mapping_state IN ('PENDING','CONFIRMED','CONFLICT','SUPERSEDED')),
  PRIMARY KEY(tenant_id,id),
  FOREIGN KEY(tenant_id,employee_profile_id) REFERENCES ereq.master_employee_profiles(tenant_id,id),
  FOREIGN KEY(tenant_id,department_id) REFERENCES ereq.departments(tenant_id,id),
  FOREIGN KEY(tenant_id,manager_user_id) REFERENCES ereq.users(tenant_id,id),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id),
  CHECK(effective_to IS NULL OR effective_from IS NULL OR effective_to>=effective_from)
);
CREATE INDEX ix_org_current ON ereq.master_org_assignments(tenant_id,employee_profile_id,mapping_state,effective_from DESC);

CREATE TABLE ereq.master_data_exceptions (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_run_id uuid,
  source_id uuid NOT NULL,
  entity_kind text NOT NULL,
  external_key_hash text NOT NULL, -- hash instead of logging sensitive raw keys
  error_code text NOT NULL,
  severity text NOT NULL CHECK(severity IN ('WARN','BLOCK')),
  status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','UNDER_REVIEW','RESOLVED','IGNORED')),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,id),
  FOREIGN KEY(tenant_id,sync_run_id) REFERENCES ereq.master_sync_runs(tenant_id,id),
  FOREIGN KEY(tenant_id,source_id) REFERENCES ereq.master_sources(tenant_id,id),
  FOREIGN KEY(tenant_id,resolved_by) REFERENCES ereq.users(tenant_id,id)
);
CREATE INDEX ix_open_master_exceptions ON ereq.master_data_exceptions(tenant_id,source_id,status,created_at)
  WHERE status IN ('OPEN','UNDER_REVIEW');

-- Required but NOT defined as working migrations here:
-- * strict allowlisted INSERT/UPDATE transactions for sync service with RLS/GRANT
-- * source-specific 1-to-1 authoritative field mapping and override precedence
-- * safe encryption/decryption of payloads and delta tokens external to SQL
-- * referential proof for polymorphic master_external_identities.canonical_entity_id
-- * transactionally advance checkpoint only after promotion, plus job lease fencing
-- * rows for company/request/vendor reference snapshots where needed
-- * no web/API generic SELECT on staging/conflicts/checkpoints and bank data
