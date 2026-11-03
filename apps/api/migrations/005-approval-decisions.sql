CREATE POLICY human_items_read ON fd.approval_work_items FOR SELECT TO fd_runtime USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND assignee_id=nullif(current_setting('app.actor_id',true),'')::uuid
 AND EXISTS(SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true)||':tasks:decide')=ANY(capabilities))
);
CREATE POLICY human_items_decide ON fd.approval_work_items FOR UPDATE TO fd_runtime USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND assignee_id=nullif(current_setting('app.actor_id',true),'')::uuid AND status='PENDING'
 AND EXISTS(SELECT 1 FROM fd.members WHERE active AND (current_setting('app.app_id',true)||':tasks:decide')=ANY(capabilities))
) WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND assignee_id=nullif(current_setting('app.actor_id',true),'')::uuid AND status IN ('APPROVED','REJECTED')
);
CREATE POLICY human_run_read ON fd.approval_runs FOR SELECT TO fd_runtime USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND EXISTS(SELECT 1 FROM fd.approval_work_items t WHERE t.run_id=approval_runs.id AND t.tenant_id=approval_runs.tenant_id AND t.app_id=approval_runs.app_id)
);
-- Column grants prevent leaking pinned request input/plan through task access.
GRANT SELECT(id,tenant_id,app_id,status) ON fd.approval_runs TO fd_runtime;
GRANT SELECT ON fd.approval_work_items TO fd_runtime;
GRANT UPDATE(status,version) ON fd.approval_work_items TO fd_runtime;

CREATE TABLE fd.task_decisions (
 tenant_id uuid NOT NULL, app_id text NOT NULL, actor_id uuid NOT NULL,
 idempotency_key uuid NOT NULL, task_id uuid NOT NULL,
 decision text NOT NULL CHECK(decision IN ('APPROVED','REJECTED')),
 expected_version integer NOT NULL CHECK(expected_version>0),
 version integer NOT NULL CHECK(version=expected_version+1),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,app_id,actor_id,idempotency_key),
 UNIQUE(tenant_id,app_id,task_id),
 FOREIGN KEY(tenant_id,app_id,task_id) REFERENCES fd.approval_work_items(tenant_id,app_id,id),
 FOREIGN KEY(tenant_id,actor_id) REFERENCES fd.members(tenant_id,id)
);
ALTER TABLE fd.task_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.task_decisions FORCE ROW LEVEL SECURITY;
CREATE POLICY decision_self ON fd.task_decisions TO fd_runtime USING (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND actor_id=nullif(current_setting('app.actor_id',true),'')::uuid
) WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND actor_id=nullif(current_setting('app.actor_id',true),'')::uuid
 AND EXISTS(SELECT 1 FROM fd.approval_work_items t WHERE t.id=task_id AND t.status=decision AND t.version=task_decisions.version)
);
GRANT SELECT,INSERT ON fd.task_decisions TO fd_runtime;
CREATE TABLE fd.approval_outbox (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL, app_id text NOT NULL, run_id uuid NOT NULL,
 task_id uuid NOT NULL, actor_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 delivered_at timestamptz,
 lease_id uuid, lease_until timestamptz,
 attempts integer NOT NULL DEFAULT 0,
 FOREIGN KEY(tenant_id,app_id,run_id) REFERENCES fd.approval_runs(tenant_id,app_id,id),
 FOREIGN KEY(tenant_id,app_id,task_id) REFERENCES fd.approval_work_items(tenant_id,app_id,id),
 FOREIGN KEY(tenant_id,actor_id) REFERENCES fd.members(tenant_id,id),
 UNIQUE(tenant_id,app_id,task_id)
);
CREATE INDEX approval_outbox_pending ON fd.approval_outbox(created_at,id) WHERE delivered_at IS NULL;
ALTER TABLE fd.approval_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd.approval_outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY outbox_insert ON fd.approval_outbox FOR INSERT TO fd_runtime WITH CHECK (
 tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid
 AND app_id=current_setting('app.app_id',true)
 AND actor_id=nullif(current_setting('app.actor_id',true),'')::uuid
 AND delivered_at IS NULL AND lease_id IS NULL AND lease_until IS NULL AND attempts=0
 AND EXISTS(SELECT 1 FROM fd.approval_work_items t WHERE t.id=task_id AND t.run_id=approval_outbox.run_id AND t.status IN ('APPROVED','REJECTED'))
);
GRANT INSERT ON fd.approval_outbox TO fd_runtime;
-- Trusted dispatcher can inspect only metadata events across tenants. No document payload.
CREATE POLICY outbox_dispatch ON fd.approval_outbox TO fd_worker USING(true) WITH CHECK(true);
GRANT SELECT ON fd.approval_outbox TO fd_worker;
GRANT UPDATE(lease_id,lease_until,attempts,delivered_at) ON fd.approval_outbox TO fd_worker;
