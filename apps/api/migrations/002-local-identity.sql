CREATE TABLE fd.local_accounts (
  login_name text PRIMARY KEY CHECK (login_name ~ '^[a-z0-9][a-z0-9._-]{2,79}$'),
  tenant_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  salt text NOT NULL,
  verifier text NOT NULL,
  FOREIGN KEY (tenant_id,actor_id) REFERENCES fd.members(tenant_id,id)
);
ALTER TABLE fd.local_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.local_accounts FORCE ROW LEVEL SECURITY;
CREATE POLICY login_lookup ON fd.local_accounts FOR SELECT USING (
 login_name = current_setting('app.login_name',true)
);
CREATE POLICY issue_session ON fd.sessions FOR INSERT WITH CHECK (
 tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid
 AND actor_id = nullif(current_setting('app.actor_id',true),'')::uuid
 AND expires_at > now() AND expires_at <= now()+interval '1 hour 1 minute'
 AND EXISTS (SELECT 1 FROM fd.members WHERE active)
);
CREATE POLICY revoke_session ON fd.sessions FOR DELETE USING (
 token_hash = current_setting('app.session_hash',true)
);
GRANT SELECT ON fd.local_accounts TO fd_runtime;
GRANT INSERT,DELETE ON fd.sessions TO fd_runtime;
