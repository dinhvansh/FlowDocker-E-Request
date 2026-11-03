CREATE TABLE fd.approval_runs (
 tenant_id uuid NOT NULL,
 app_id text NOT NULL,
 id uuid NOT NULL,
 owner_id uuid NOT NULL,
 plan jsonb NOT NULL,
 input jsonb NOT NULL,
 exposed_fields jsonb NOT NULL,
 status text NOT NULL DEFAULT 'RUNNING' CHECK(status IN ('RUNNING','APPROVED','REJECTED','BLOCKED')),
 PRIMARY KEY(tenant_id,app_id,id),
 FOREIGN KEY(tenant_id,owner_id) REFERENCES fd.members(tenant_id,id)
);
CREATE TABLE fd.approval_work_items (
 tenant_id uuid NOT NULL,
 app_id text NOT NULL,
 id uuid NOT NULL,
 run_id uuid NOT NULL,
 step_id text NOT NULL,
 assignee_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
 version integer NOT NULL DEFAULT 1,
 PRIMARY KEY(tenant_id,app_id,id),
 UNIQUE(tenant_id,app_id,run_id,step_id,assignee_id),
 FOREIGN KEY(tenant_id,app_id,run_id) REFERENCES fd.approval_runs(tenant_id,app_id,id),
 FOREIGN KEY(tenant_id,assignee_id) REFERENCES fd.members(tenant_id,id)
);
ALTER TABLE fd.approval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.approval_runs FORCE ROW LEVEL SECURITY;
CREATE POLICY worker_run ON fd.approval_runs TO fd_worker USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND id=nullif(current_setting('app.run_id',true),'')::uuid
) WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND id=nullif(current_setting('app.run_id',true),'')::uuid
);
ALTER TABLE fd.approval_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.approval_work_items FORCE ROW LEVEL SECURITY;
CREATE POLICY worker_items_read ON fd.approval_work_items FOR SELECT TO fd_worker USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND run_id=nullif(current_setting('app.run_id',true),'')::uuid
);
CREATE POLICY worker_items_create ON fd.approval_work_items FOR INSERT TO fd_worker WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND run_id=nullif(current_setting('app.run_id',true),'')::uuid
 AND status='PENDING' AND version=1
);
CREATE POLICY worker_members ON fd.members FOR SELECT TO fd_worker USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid AND active
);
GRANT USAGE ON SCHEMA fd TO fd_worker;
GRANT SELECT ON fd.approval_runs,fd.approval_work_items,fd.members TO fd_worker;
GRANT UPDATE(status) ON fd.approval_runs TO fd_worker;
GRANT INSERT ON fd.approval_work_items TO fd_worker;
CREATE POLICY worker_items_cancel ON fd.approval_work_items FOR UPDATE TO fd_worker USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND run_id=nullif(current_setting('app.run_id',true),'')::uuid AND status='PENDING'
) WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND run_id=nullif(current_setting('app.run_id',true),'')::uuid AND status='CANCELLED'
);
GRANT UPDATE(status) ON fd.approval_work_items TO fd_worker;
