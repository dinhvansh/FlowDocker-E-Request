CREATE POLICY workflow_version_use ON fd.workflow_versions FOR SELECT TO fd_runtime USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid AND app_id=current_setting('app.app_id',true)
 AND EXISTS(SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true)||':requests:submit')=ANY(capabilities))
);
CREATE TABLE fd.request_revisions (
 tenant_id uuid NOT NULL, app_id text NOT NULL, id uuid NOT NULL,
 owner_id uuid NOT NULL, revision integer NOT NULL DEFAULT 1 CHECK(revision=1),
 workflow_version_id uuid NOT NULL, form_version_id uuid NOT NULL,
 values_json jsonb NOT NULL, input_checksum text NOT NULL CHECK(length(input_checksum)=64),
 idempotency_key uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,app_id,id), UNIQUE(tenant_id,app_id,owner_id,idempotency_key),
 FOREIGN KEY(tenant_id,owner_id) REFERENCES fd.members(tenant_id,id),
 FOREIGN KEY(tenant_id,app_id,workflow_version_id) REFERENCES fd.workflow_versions(tenant_id,app_id,id),
 FOREIGN KEY(tenant_id,app_id,form_version_id) REFERENCES fd.form_versions(tenant_id,app_id,id)
);
ALTER TABLE fd.request_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.request_revisions FORCE ROW LEVEL SECURITY;
CREATE POLICY request_owner ON fd.request_revisions TO fd_runtime USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid AND app_id=current_setting('app.app_id',true)
 AND owner_id=nullif(current_setting('app.actor_id',true),'')::uuid
 AND EXISTS(SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true)||':requests:submit')=ANY(capabilities))
) WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid AND app_id=current_setting('app.app_id',true)
 AND owner_id=nullif(current_setting('app.actor_id',true),'')::uuid
 AND EXISTS(SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true)||':requests:submit')=ANY(capabilities))
);
GRANT SELECT,INSERT ON fd.request_revisions TO fd_runtime;
ALTER TABLE fd.approval_runs ADD COLUMN request_revision_id uuid;
ALTER TABLE fd.approval_runs ADD CONSTRAINT run_request_revision_fk FOREIGN KEY(tenant_id,app_id,request_revision_id) REFERENCES fd.request_revisions(tenant_id,app_id,id);
CREATE POLICY run_submit ON fd.approval_runs FOR INSERT TO fd_runtime WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid AND app_id=current_setting('app.app_id',true)
 AND owner_id=nullif(current_setting('app.actor_id',true),'')::uuid AND status='RUNNING'
 AND id=request_revision_id AND EXISTS(SELECT 1 FROM fd.request_revisions r WHERE r.id=request_revision_id)
);
GRANT INSERT ON fd.approval_runs TO fd_runtime;
CREATE TABLE fd.approval_start_outbox (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, app_id text NOT NULL, run_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz,
 lease_id uuid, lease_until timestamptz, attempts integer NOT NULL DEFAULT 0,
 UNIQUE(tenant_id,app_id,run_id),
 FOREIGN KEY(tenant_id,app_id,run_id) REFERENCES fd.approval_runs(tenant_id,app_id,id)
);
ALTER TABLE fd.approval_start_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.approval_start_outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY start_outbox_insert ON fd.approval_start_outbox FOR INSERT TO fd_runtime WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid AND app_id=current_setting('app.app_id',true)
 AND delivered_at IS NULL AND lease_id IS NULL AND lease_until IS NULL AND attempts=0
 AND EXISTS(SELECT 1 FROM fd.request_revisions r WHERE r.id=run_id)
);
GRANT INSERT ON fd.approval_start_outbox TO fd_runtime;
CREATE POLICY start_outbox_dispatch ON fd.approval_start_outbox TO fd_worker USING(true) WITH CHECK(true);
GRANT SELECT ON fd.approval_start_outbox TO fd_worker;
GRANT UPDATE(lease_id,lease_until,attempts,delivered_at) ON fd.approval_start_outbox TO fd_worker;
CREATE INDEX approval_start_outbox_pending ON fd.approval_start_outbox(created_at,id) WHERE delivered_at IS NULL;
