CREATE TABLE fd.workflow_versions (
 tenant_id uuid NOT NULL, app_id text NOT NULL, id uuid NOT NULL,
 workflow_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 form_version_id uuid NOT NULL, plan jsonb NOT NULL, exposed_fields jsonb NOT NULL,
 checksum text NOT NULL CHECK(length(checksum)=64),
 published_by uuid NOT NULL, published_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,app_id,id),
 UNIQUE(tenant_id,app_id,workflow_id,version),
 UNIQUE(tenant_id,app_id,workflow_id,checksum),
 FOREIGN KEY(tenant_id,app_id,form_version_id) REFERENCES fd.form_versions(tenant_id,app_id,id),
 FOREIGN KEY(tenant_id,published_by) REFERENCES fd.members(tenant_id,id)
);
ALTER TABLE fd.workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.workflow_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_version_read ON fd.workflow_versions FOR SELECT TO fd_runtime USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND EXISTS(SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true)||':workflows:publish')=ANY(capabilities))
);
CREATE POLICY workflow_version_insert ON fd.workflow_versions FOR INSERT TO fd_runtime WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND published_by=nullif(current_setting('app.actor_id',true),'')::uuid
 AND EXISTS(SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true)||':workflows:publish')=ANY(capabilities))
);
GRANT SELECT,INSERT ON fd.workflow_versions TO fd_runtime;

-- Fixed boolean membership check; do not broaden members RLS to authoring peers.
CREATE FUNCTION fd.valid_workflow_assignees(ids uuid[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,fd AS $$
 SELECT cardinality(ids) BETWEEN 1 AND 1600
 AND EXISTS(SELECT 1 FROM fd.members m
  WHERE m.tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
  AND m.id=nullif(current_setting('app.actor_id',true),'')::uuid AND m.active
  AND (current_setting('app.app_id',true)||':workflows:publish')=ANY(m.capabilities))
 AND (SELECT count(*) FROM fd.members m
  WHERE m.tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
  AND m.active AND m.id=ANY(ids))=cardinality(ids)
$$;
REVOKE ALL ON FUNCTION fd.valid_workflow_assignees(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fd.valid_workflow_assignees(uuid[]) TO fd_runtime;
