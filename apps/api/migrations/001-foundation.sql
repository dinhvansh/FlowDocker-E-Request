CREATE SCHEMA fd;
CREATE TABLE fd.members (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  capabilities text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (tenant_id,id)
);
CREATE TABLE fd.sessions (
  token_hash text PRIMARY KEY,
  tenant_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id,actor_id) REFERENCES fd.members(tenant_id,id)
);
CREATE TABLE fd.form_drafts (
  tenant_id uuid NOT NULL,
  app_id text NOT NULL,
  id uuid NOT NULL,
  definition jsonb NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,app_id,id)
);
CREATE TABLE fd.audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  app_id text NOT NULL,
  resource_id uuid NOT NULL,
  action text NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id,actor_id) REFERENCES fd.members(tenant_id,id)
);
ALTER TABLE fd.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.members FORCE ROW LEVEL SECURITY;
CREATE POLICY self ON fd.members USING (
 tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid
 AND id = nullif(current_setting('app.actor_id',true),'')::uuid
);
ALTER TABLE fd.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY session_token ON fd.sessions FOR SELECT USING (
 token_hash = current_setting('app.session_hash',true) AND expires_at > now()
);
ALTER TABLE fd.form_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.form_drafts FORCE ROW LEVEL SECURITY;
CREATE POLICY authoring ON fd.form_drafts USING (
 tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id = current_setting('app.app_id',true)
 AND EXISTS (SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true) || ':forms:edit') = ANY(capabilities))
) WITH CHECK (
 tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id = current_setting('app.app_id',true)
 AND EXISTS (SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true) || ':forms:edit') = ANY(capabilities))
);
ALTER TABLE fd.audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.audit FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_insert ON fd.audit FOR INSERT WITH CHECK (
 tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid
 AND actor_id = nullif(current_setting('app.actor_id',true),'')::uuid
 AND app_id = current_setting('app.app_id',true)
);
GRANT USAGE ON SCHEMA fd TO fd_runtime;
GRANT SELECT ON fd.members,fd.sessions TO fd_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON fd.form_drafts TO fd_runtime;
GRANT INSERT ON fd.audit TO fd_runtime;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA fd TO fd_runtime;

