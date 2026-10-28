-- FlowDocker Application Platform: reusable registry / policy / simple catalog model
-- DESIGN ONLY: not migration-ready, not executed; requires db/design/001_core_schema.sql.
-- Not a replacement for typed domain payment/asset/HR tables.
-- Security critical: RLS, least-privilege GRANT, immutability triggers, worker
-- authorization and policy compiler are NOT supplied in this reference design.

CREATE TABLE ereq.platform_apps (
  tenant_id uuid NOT NULL REFERENCES ereq.tenants(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  app_key text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,app_key)
);

CREATE TABLE ereq.platform_modules (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL,
  module_key text NOT NULL,
  manifest_version text NOT NULL,
  manifest_json jsonb NOT NULL CHECK(jsonb_typeof(manifest_json)='object'),
  manifest_sha256 text NOT NULL,
  state text NOT NULL DEFAULT 'DRAFT'
    CHECK(state IN ('DRAFT','VALIDATED','ACTIVE','RETIRED')),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,app_id,module_key),
  FOREIGN KEY(tenant_id,app_id) REFERENCES ereq.platform_apps(tenant_id,id)
);

CREATE TABLE ereq.platform_resources (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  resource_key text NOT NULL,
  classification text NOT NULL DEFAULT 'INTERNAL'
    CHECK(classification IN ('PUBLIC_REQUEST','INTERNAL','FINANCE_SENSITIVE','SECRET')),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,module_id,resource_key),
  FOREIGN KEY(tenant_id,module_id) REFERENCES ereq.platform_modules(tenant_id,id)
);

CREATE TABLE ereq.platform_resource_actions (
  tenant_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  action_key text NOT NULL,
  handler_key text NOT NULL, -- validated against startup backend implementation
  PRIMARY KEY(tenant_id,resource_id,action_key),
  FOREIGN KEY(tenant_id,resource_id) REFERENCES ereq.platform_resources(tenant_id,id)
);
-- A resource/action row is not sufficient to authorize a call. An actual
-- registered backend handler + PEP/PDP check are required.

CREATE TABLE ereq.platform_policy_sets (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL,
  code text NOT NULL,
  description text,
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,app_id,code),
  FOREIGN KEY(tenant_id,app_id) REFERENCES ereq.platform_apps(tenant_id,id)
);

CREATE TABLE ereq.platform_policy_versions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_set_id uuid NOT NULL,
  version_no integer NOT NULL CHECK(version_no>0),
  policy_ast_json jsonb NOT NULL CHECK(jsonb_typeof(policy_ast_json)='object'),
  compiled_policy_hash text,
  state text NOT NULL DEFAULT 'DRAFT'
    CHECK(state IN ('DRAFT','VALIDATED','PUBLISHED','RETIRED')),
  created_by uuid,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,policy_set_id,version_no),
  FOREIGN KEY(tenant_id,policy_set_id)
    REFERENCES ereq.platform_policy_sets(tenant_id,id),
  FOREIGN KEY(tenant_id,created_by) REFERENCES ereq.users(tenant_id,id),
  FOREIGN KEY(tenant_id,reviewed_by) REFERENCES ereq.users(tenant_id,id)
);
-- Publish must atomically select a validated version and audit reviewer;
-- immutable versions and revocation semantics belong in implementation.

CREATE TABLE ereq.platform_master_entities (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL,
  entity_key text NOT NULL,
  entity_kind text NOT NULL
    CHECK(entity_kind IN ('LOCAL_CATALOG','EXTERNAL_MIRROR','COMPOSITE_READ_MODEL','DOMAIN_ENTITY')),
  owner_label text NOT NULL,
  state text NOT NULL DEFAULT 'DRAFT'
    CHECK(state IN ('DRAFT','ACTIVE','DISABLED')),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,app_id,entity_key),
  FOREIGN KEY(tenant_id,app_id) REFERENCES ereq.platform_apps(tenant_id,id)
);

CREATE TABLE ereq.platform_master_entity_versions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  version_no integer NOT NULL CHECK(version_no>0),
  schema_json jsonb NOT NULL CHECK(jsonb_typeof(schema_json)='object'),
  source_ownership_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  field_policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema_sha256 text NOT NULL,
  state text NOT NULL DEFAULT 'DRAFT'
    CHECK(state IN ('DRAFT','VALIDATED','PUBLISHED','RETIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,entity_id,version_no),
  FOREIGN KEY(tenant_id,entity_id) REFERENCES ereq.platform_master_entities(tenant_id,id)
);

-- Only for bounded, low-risk, LOCAL_CATALOG entities; external mirrors and
-- business transactions must use reviewed typed canonical/domain tables.
CREATE TABLE ereq.platform_local_catalog_records (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  business_key text NOT NULL,
  record_version integer NOT NULL DEFAULT 1 CHECK(record_version>0),
  data_jsonb jsonb NOT NULL CHECK(jsonb_typeof(data_jsonb)='object'),
  lifecycle text NOT NULL DEFAULT 'ACTIVE'
    CHECK(lifecycle IN ('ACTIVE','INACTIVE','ARCHIVED')),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,entity_id,business_key),
  FOREIGN KEY(tenant_id,entity_id) REFERENCES ereq.platform_master_entities(tenant_id,id),
  FOREIGN KEY(tenant_id,created_by) REFERENCES ereq.users(tenant_id,id),
  FOREIGN KEY(tenant_id,updated_by) REFERENCES ereq.users(tenant_id,id)
);
CREATE INDEX ix_local_catalog_lookup
  ON ereq.platform_local_catalog_records(tenant_id,entity_id,lifecycle,business_key);

-- SECURITY TODO before any real deployment:
-- - Add verified owner and schema GRANT/RLS policies for each platform table,
--   including tenant/app scopes; app_id can be reached through parent FK.
-- - Catalog record writes must check entity_kind='LOCAL_CATALOG' in a trusted
--   transactional service, verify schema and field permissions and audit.
-- - Generic JSONB cannot serve as database FK target for finance transactions.
-- - Permission Builder edits require scoped security-admin and separate publish
--   reviewer. No arbitrary JS/SQL in policy_ast_json.
-- - Resource actions must match live backend implementations and module version.
-- - Existing ereq.roles/user_role_assignments remain tenant-scoped. Evolve role
--   assignment schema to support app/module scope and capability registration
--   without silently broadening existing grants. Do not assume implicit joins.
-- - Keep cross-application data sharing disabled unless explicit owner grant.
-- - Published schema versions must be immutable; run migrations for type changes.
