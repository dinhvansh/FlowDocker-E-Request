CREATE TABLE fd.form_versions (
  tenant_id uuid NOT NULL,
  app_id text NOT NULL,
  id uuid NOT NULL,
  form_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  draft_version integer NOT NULL CHECK (draft_version > 0),
  definition jsonb NOT NULL,
  checksum text NOT NULL CHECK (length(checksum)=64),
  published_by uuid NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,app_id,id),
  UNIQUE (tenant_id,app_id,form_id,version),
  UNIQUE (tenant_id,app_id,form_id,draft_version),
  FOREIGN KEY (tenant_id,published_by) REFERENCES fd.members(tenant_id,id)
);
ALTER TABLE fd.form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.form_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY version_read ON fd.form_versions FOR SELECT USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND EXISTS (SELECT 1 FROM fd.members WHERE active AND (
  (app_id || ':forms:edit')=ANY(capabilities) OR (app_id || ':forms:use')=ANY(capabilities)
 ))
);
CREATE POLICY version_publish ON fd.form_versions FOR INSERT WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND published_by=nullif(current_setting('app.actor_id',true),'')::uuid
 AND EXISTS (SELECT 1 FROM fd.members WHERE active AND
   (app_id || ':forms:edit')=ANY(capabilities) AND (app_id || ':forms:publish')=ANY(capabilities)
 )
);
GRANT SELECT,INSERT ON fd.form_versions TO fd_runtime;
