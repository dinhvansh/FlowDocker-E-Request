-- Master Data Hub RLS reference for PostgreSQL 16+.
-- DESIGN ONLY; append only after reviewed 003_master_data_schema.sql.
-- NO GRANTs or WRITE policies are implied. New tables default DENY.

ALTER TABLE ereq.master_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_sync_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_sync_pipelines FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_sync_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_sync_checkpoints FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_sync_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_staging_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_staging_records FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_external_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_external_identities FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_companies FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_vendors FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_cost_centers FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_employee_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_org_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_org_assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_data_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereq.master_data_exceptions FORCE ROW LEVEL SECURITY;

-- App may use canonical public-ish LOOKUPS only, after verifying live
-- identity, requested company, request type and business purpose on API.
-- app.company_id custom GUC is an application-set hint, NOT an unforgeable
-- security boundary; no direct shared DB credentials or arbitrary SQL access.
CREATE OR REPLACE FUNCTION ereq.current_company_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.company_id', true),'')::uuid
$$;

CREATE POLICY p_master_active_company ON ereq.master_companies
FOR SELECT USING (
  tenant_id=ereq.current_tenant_id()
  AND lifecycle_state='ACTIVE'
);

CREATE POLICY p_master_active_vendor_by_company ON ereq.master_vendors
FOR SELECT USING (
  tenant_id=ereq.current_tenant_id()
  AND company_id=ereq.current_company_id()
  AND lifecycle_state='ACTIVE'
);

CREATE POLICY p_master_active_cost_center_by_company ON ereq.master_cost_centers
FOR SELECT USING (
  tenant_id=ereq.current_tenant_id()
  AND company_id=ereq.current_company_id()
  AND lifecycle_state='ACTIVE'
);

-- NO generic policies for HR personal profiles/relationships, source secrets
-- references, staging, tokens, runs, mappings, exceptions. Those require
-- purpose-specific worker or admin service contracts and separate security
-- design + least-privilege DB GRANTs.
-- No INSERT/UPDATE/DELETE policies. No production sync until these exist.
