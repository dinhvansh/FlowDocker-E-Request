-- Connection Manager physical schema extension (reference only).
-- DESIGN ONLY: not run, not migration-ready, no GRANTs/policies.
-- Requires 001_core_schema.sql, 003_master_data_schema.sql.
-- Real production role/object ownership and RLS review are mandatory.

CREATE TABLE ereq.master_connections (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  environment text NOT NULL CHECK(environment IN ('DEV','QA','PROD')),
  connector_type text NOT NULL CHECK(connector_type IN
    ('ENTRA_GRAPH','EPICOR_REST','MSSQL_READONLY','HR_REST','SFTP_IMPORT')),
  owner_user_id uuid,
  admin_enabled boolean NOT NULL DEFAULT false,
  health_state text NOT NULL DEFAULT 'UNKNOWN' CHECK
    (health_state IN ('UNKNOWN','HEALTHY','DEGRADED','FAILED')),
  lifecycle text NOT NULL DEFAULT 'DRAFT' CHECK
    (lifecycle IN ('DRAFT','TESTED','ACTIVE','REVALIDATION_REQUIRED','DISABLED')),
  active_version_id uuid,
  lock_version integer NOT NULL DEFAULT 1 CHECK(lock_version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,name,environment),
  FOREIGN KEY(tenant_id,owner_user_id) REFERENCES ereq.users(tenant_id,id)
);

CREATE TABLE ereq.master_connection_versions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL,
  version_no integer NOT NULL CHECK(version_no>0),
  endpoint_config_json jsonb NOT NULL DEFAULT '{}'::jsonb
     CHECK(jsonb_typeof(endpoint_config_json)='object'),
  secret_vault_ref text NOT NULL, -- an opaque locator, NOT an inline password/token
  secret_fingerprint text NOT NULL, -- nonreversible identifier, no value
  config_hash_sha256 text NOT NULL,
  state text NOT NULL CHECK(state IN ('DRAFT','TESTED','ACTIVE','RETIRED')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,connection_id,id),
  UNIQUE (tenant_id,connection_id,version_no),
  FOREIGN KEY (tenant_id,connection_id) REFERENCES ereq.master_connections(tenant_id,id),
  FOREIGN KEY (tenant_id,created_by) REFERENCES ereq.users(tenant_id,id)
);
CREATE UNIQUE INDEX ux_master_connection_active_version
  ON ereq.master_connection_versions(tenant_id,connection_id) WHERE state='ACTIVE';

-- Critical composite FK ensures active version belongs to SAME connection and tenant.
ALTER TABLE ereq.master_connections
  ADD CONSTRAINT fk_connection_active_version
  FOREIGN KEY (tenant_id,id,active_version_id)
  REFERENCES ereq.master_connection_versions(tenant_id,connection_id,id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE ereq.master_connection_test_runs (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL,
  version_id uuid NOT NULL,
  secret_fingerprint text NOT NULL,
  result text NOT NULL CHECK(result IN ('PASS','FAIL','CANCELLED')),
  checks_json jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK(jsonb_typeof(checks_json)='array'),
  error_code text,
  duration_ms integer CHECK(duration_ms>=0),
  tested_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz,
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,connection_id,version_id)
    REFERENCES ereq.master_connection_versions(tenant_id,connection_id,id),
  FOREIGN KEY (tenant_id,tested_by) REFERENCES ereq.users(tenant_id,id)
);
CREATE INDEX ix_connection_test_history
 ON ereq.master_connection_test_runs(tenant_id,connection_id,started_at DESC);

-- Existing logical master_sources now bind to the single reusable credential
-- profile; backfill from old secret_reference with DBA-run migration before
-- deprecating master_sources.secret_reference. DO NOT store duplicate secrets.
ALTER TABLE ereq.master_sources ADD COLUMN connection_id uuid;
ALTER TABLE ereq.master_sources
  ADD CONSTRAINT fk_master_source_connection
  FOREIGN KEY (tenant_id,connection_id) REFERENCES ereq.master_connections(tenant_id,id);

-- Optional role-specific SQL policy below is intentionally not added.
-- This schema is not safe to expose to general app accounts until:
--  1. FORCE RLS + reviewed service/operator SELECT policies for every new table
--  2. Explicit least-privilege GRANT, strict vault access, no direct browser DB
--  3. Atomic Activate transaction matches PASS test config+secret+version
--  4. Tenant isolation, disable/rotate, test history and audit gates tested
--  5. Production migration plan addresses backfill of old master_sources
--     secret_reference and concurrent writes from dependent sync workers.
