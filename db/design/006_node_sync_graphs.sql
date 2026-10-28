-- 006 Node Sync Graphs, visual mapping and run provenance (PostgreSQL reference)
-- DESIGN ONLY. Not executed, not production migration or approved GRANT/RLS.
-- Requires 001_core_schema.sql, 003_master_data_schema.sql, 005_connections_extension.sql.
CREATE TABLE ereq.master_flow_definitions (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL,
  flow_name text NOT NULL,
  current_published_version_id uuid,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,pipeline_id),
  FOREIGN KEY (tenant_id,pipeline_id)
    REFERENCES ereq.master_sync_pipelines(tenant_id,id)
);

CREATE TABLE ereq.master_flow_versions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL,
  version_no integer NOT NULL CHECK(version_no>0),
  state text NOT NULL DEFAULT 'DRAFT'
    CHECK(state IN ('DRAFT','VALIDATED','PUBLISHED','RETIRED')),
  graph_json jsonb NOT NULL CHECK(jsonb_typeof(graph_json)='object'),
  mapping_json jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK(jsonb_typeof(mapping_json)='object'),
  compiled_plan_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_sha256 text NOT NULL,
  source_schema_sha256 text NOT NULL,
  target_schema_version text NOT NULL,
  runtime_compat_version text NOT NULL,
  checkpoint_compat_key text NOT NULL, -- key/mapping/cursor compatibility marker
  created_by uuid,
  reviewed_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,flow_id,version_no),
  UNIQUE (tenant_id,flow_id,id),
  FOREIGN KEY (tenant_id,flow_id) REFERENCES ereq.master_flow_definitions(tenant_id,id),
  FOREIGN KEY (tenant_id,created_by) REFERENCES ereq.users(tenant_id,id),
  FOREIGN KEY (tenant_id,reviewed_by) REFERENCES ereq.users(tenant_id,id)
);

ALTER TABLE ereq.master_flow_definitions
 ADD CONSTRAINT fk_master_flow_published_version
 FOREIGN KEY (tenant_id,id,current_published_version_id)
 REFERENCES ereq.master_flow_versions(tenant_id,flow_id,id)
 DEFERRABLE INITIALLY DEFERRED;

-- Each running sync is pinned to one immutable graph version.
-- Source batches are staged first; raw rows must not be pulled into browser
-- beyond bounded, sanitized preview.
CREATE TABLE ereq.master_flow_run_bindings (
  tenant_id uuid NOT NULL,
  sync_run_id uuid NOT NULL,
  flow_version_id uuid NOT NULL,
  published_graph_sha256 text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,sync_run_id),
  FOREIGN KEY (tenant_id,sync_run_id) REFERENCES ereq.master_sync_runs(tenant_id,id),
  FOREIGN KEY (tenant_id,flow_version_id) REFERENCES ereq.master_flow_versions(tenant_id,id)
);

CREATE TABLE ereq.master_flow_node_executions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL,
  node_id text NOT NULL,
  stage_batch_key text NOT NULL,
  status text NOT NULL CHECK(status IN ('PENDING','RUNNING','SUCCESS','FAILED','SKIPPED')),
  input_rows bigint NOT NULL DEFAULT 0 CHECK(input_rows>=0),
  output_rows bigint NOT NULL DEFAULT 0 CHECK(output_rows>=0),
  filtered_rows bigint NOT NULL DEFAULT 0 CHECK(filtered_rows>=0),
  rejected_rows bigint NOT NULL DEFAULT 0 CHECK(rejected_rows>=0),
  error_code text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0),
  started_at timestamptz,
  finished_at timestamptz,
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,sync_run_id,node_id,stage_batch_key),
  FOREIGN KEY(tenant_id,sync_run_id) REFERENCES ereq.master_sync_runs(tenant_id,id)
);
CREATE INDEX ix_flow_node_failures ON ereq.master_flow_node_executions(tenant_id,sync_run_id,status)
 WHERE status IN ('PENDING','FAILED');

CREATE TABLE ereq.master_flow_batch_apply_ledger (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL,
  stage_batch_key text NOT NULL,
  target_domain text NOT NULL,
  apply_status text NOT NULL CHECK(apply_status IN ('STAGED','VALIDATED','APPLYING','APPLIED','QUARANTINED','FAILED')),
  input_sha256 text NOT NULL,
  applied_graph_version_id uuid NOT NULL,
  applied_rows bigint NOT NULL DEFAULT 0 CHECK(applied_rows>=0),
  rejected_rows bigint NOT NULL DEFAULT 0 CHECK(rejected_rows>=0),
  completed_at timestamptz,
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,sync_run_id,stage_batch_key,target_domain),
  FOREIGN KEY(tenant_id,sync_run_id) REFERENCES ereq.master_sync_runs(tenant_id,id),
  FOREIGN KEY(tenant_id,applied_graph_version_id) REFERENCES ereq.master_flow_versions(tenant_id,id)
);

-- For large batches, row-level replay idempotency also requires canonical
-- upsert keys and transactional commit rules; this ledger alone does not
-- guarantee exactly-once cross-service effects.
-- Data projection and connector/provider fields must never store secrets.
-- Graph definitions must prohibit arbitrary JS, arbitrary SQL and arbitrary
-- network URLs; only allowlisted typed nodes compile.
-- THIS DDL DOES NOT ENABLE RLS OR GRANT PRIVILEGES ON THESE NEW TABLES.
-- Before any deployment, add FORCE RLS + least privilege + immutable version
-- guards, preview protections, tests and cursor compatibility enforcement.
