import { useState } from "react";
import { Plus, Shield, ShieldCheck } from "lucide-react";
import {
  evaluateAccess,
  type AccessDecision,
  type AccessFixture,
  type Action,
  type ResourceAction,
  type Role,
  type Scope,
} from "@flowdocker/app-contracts";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Checkbox,
  Modal,
  Notice,
  SearchInput,
  Select,
  Tabs,
} from "@flowdocker/ui";

export interface PermissionBuilderProps {
  roles: Role[];
  resources: ResourceAction[];
  onSave(role: Role): Promise<void>;
  loading?: boolean;
  error?: string;
}
const actions: Action[] = [
  "READ",
  "CREATE",
  "UPDATE",
  "ARCHIVE",
  "APPROVE",
  "EXPORT",
];
const labels: Record<Action, string> = {
  READ: "Xem",
  CREATE: "Tạo",
  UPDATE: "Sửa",
  ARCHIVE: "Lưu trữ",
  APPROVE: "Duyệt",
  EXPORT: "Xuất",
};
const scopes: Record<Scope, string> = {
  TENANT: "Tenant",
  COMPANY: "Công ty",
  DEPARTMENT: "Phòng ban",
  OWN: "Bản ghi của mình",
  ASSIGNED_TASK: "Tác vụ được giao",
};
const initialFixture: AccessFixture = {
  actorActive: true,
  sameTenant: true,
  sameCompany: true,
  sameDepartment: true,
  isOwner: false,
  assignedActiveTask: false,
};
export function PermissionBuilder({
  roles,
  resources,
  onSave,
  loading,
  error,
}: PermissionBuilderProps) {
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("matrix");
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [fixture, setFixture] = useState(initialFixture);
  const [testResource, setTestResource] = useState(
    resources[0]?.resource ?? "",
  );
  const [testAction, setTestAction] = useState<Action>("READ");
  const [decision, setDecision] = useState<AccessDecision | null>(null);
  const [message, setMessage] = useState("");
  const role = roles.find((r) => r.id === selectedId) ?? roles[0];
  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()),
  );
  const save = async (next: Role) => {
    await onSave({ ...next, status: "DRAFT" });
    setMessage("Đã lưu bản nháp vai trò trong trình duyệt");
    setDecision(null);
  };
  const patch = (value: Partial<Role>) => role && save({ ...role, ...value });
  const toggle = (resource: string, action: Action) => {
    if (!role) return;
    const set = new Set(role.grants[resource] ?? []);
    if (set.has(action)) set.delete(action);
    else set.add(action);
    patch({ grants: { ...role.grants, [resource]: [...set] } });
  };
  const create = async () => {
    const next: Role = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: "Vai trò tùy chỉnh",
      scope: "ASSIGNED_TASK",
      grants: {},
      fieldRules: {},
      version: 1,
      status: "DRAFT",
    };
    await onSave(next);
    setSelectedId(next.id);
    setModal(false);
    setNewName("");
    setMessage("Đã tạo vai trò bản nháp trong trình duyệt");
  };
  return (
    <section className="fd-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">BẢO MẬT / PHÂN QUYỀN</div>
          <h1>Permission Builder</h1>
          <p>Thiết lập vai trò, phạm vi dữ liệu và kiểm thử truy cập giả lập</p>
        </div>
        <div className="fd-toolbar-actions">
          <Badge tone="warning">Không thực thi quyền thật</Badge>
          <Button variant="primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Tạo vai trò
          </Button>
        </div>
      </div>
      {error && <Notice tone="danger">{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="fd-workbench fd-permission-layout">
        <aside className="fd-pane fd-entity-list">
          <div className="fd-pane-title">
            <strong>Vai trò</strong>
            <span>{roles.length}</span>
          </div>
          <div className="fd-pane-pad">
            <SearchInput
              label="Tìm vai trò..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="fd-entity-scroll">
            {loading ? (
              "Đang tải..."
            ) : filtered.length ? (
              filtered.map((r) => (
                <button
                  key={r.id}
                  className={`fd-entity-item ${role?.id === r.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedId(r.id);
                    setDecision(null);
                    setMessage("");
                  }}
                >
                  <Shield size={17} />
                  <span>
                    <strong>{r.name}</strong>
                    <small>{scopes[r.scope]}</small>
                  </span>
                </button>
              ))
            ) : (
              <EmptyState title="Không tìm thấy vai trò" />
            )}
          </div>
          <div className="fd-pane-help">
            <strong>Mặc định từ chối</strong>
            <p>
              Ma trận chỉ là bản nháp giao diện. Quyền thật cần PDP/PEP và RLS
              phía máy chủ.
            </p>
          </div>
        </aside>
        <section className="fd-pane fd-editor">
          {role ? (
            <>
              <div className="fd-object-header">
                <div>
                  <div className="fd-object-title">
                    <h2>{role.name}</h2>
                    <Badge
                      tone={role.status === "PUBLISHED" ? "success" : "warning"}
                    >
                      {role.status === "PUBLISHED"
                        ? "Đã phát hành"
                        : "Bản nháp"}
                    </Badge>
                  </div>
                  <div className="fd-object-meta">
                    {role.description} <span>·</span> v{role.version}{" "}
                    <span>·</span> {scopes[role.scope]}
                  </div>
                </div>
                <div className="fd-toolbar-actions">
                  <Button
                    onClick={() =>
                      setMessage(
                        "Cấu hình hợp lệ ở UI; chưa kiểm tra policy engine hoặc server.",
                      )
                    }
                  >
                    <ShieldCheck size={16} /> Kiểm tra
                  </Button>
                  <Button
                    disabled
                    title="Cần reviewer và backend PDP/PEP để phát hành"
                  >
                    Phát hành · cần backend
                  </Button>
                </div>
              </div>
              <Tabs
                tabs={[
                  { id: "matrix", label: "Quyền thao tác" },
                  { id: "fields", label: "Bảo vệ trường" },
                  { id: "versions", label: "Phiên bản" },
                ]}
                active={tab}
                onChange={setTab}
              />
              {tab === "matrix" && (
                <div className="fd-content">
                  <div className="fd-section-heading">
                    <div>
                      <h3>Ma trận tài nguyên & hành động</h3>
                      <p>
                        Chỉ hiển thị hành động trong catalog mẫu; chưa xác minh
                        backend handler.
                      </p>
                    </div>
                  </div>
                  <div className="fd-matrix-scroll">
                    <table className="fd-table fd-matrix">
                      <thead>
                        <tr>
                          <th>TÀI NGUYÊN</th>
                          {actions.map((a) => (
                            <th key={a}>{labels[a]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map((res) => (
                          <tr key={res.resource}>
                            <td>
                              <strong>{res.label}</strong>
                              <small>{res.resource}</small>
                            </td>
                            {actions.map((a) => (
                              <td key={a}>
                                {res.actions.includes(a) ? (
                                  <Checkbox
                                    aria-label={`${res.label}: ${labels[a]}`}
                                    checked={(
                                      role.grants[res.resource] ?? []
                                    ).includes(a)}
                                    onCheckedChange={() =>
                                      toggle(res.resource, a)
                                    }
                                  />
                                ) : (
                                  <span className="fd-na">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="fd-scope-section">
                    <h3>Phạm vi dữ liệu</h3>
                    <p>
                      Phạm vi này được dùng trong mô phỏng. Server phải kiểm tra
                      quan hệ hiện hành khi thực thi.
                    </p>
                    <div className="fd-scope-options">
                      {(Object.keys(scopes) as Scope[]).map((s) => (
                        <label
                          key={s}
                          className={role.scope === s ? "active" : ""}
                        >
                          <input
                            type="radio"
                            name="scope"
                            checked={role.scope === s}
                            onChange={() => patch({ scope: s })}
                          />
                          {scopes[s]}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {tab === "fields" && (
                <div className="fd-content">
                  <h3>Chính sách theo trường</h3>
                  <p>
                    Trường nhạy cảm phải được chiếu/mask tại API. Cấu hình dưới
                    đây chỉ là ví dụ ở UI.
                  </p>
                  {[
                    "vendor.bank_account",
                    "request.amount",
                    "employee.personal_id",
                  ].map((f) => (
                    <div className="fd-field-rule" key={f}>
                      <div>
                        <strong>{f}</strong>
                        <small>Dữ liệu nhạy cảm mẫu</small>
                      </div>
                      <Select
                        label={`Quyền với ${f}`}
                        value={role.fieldRules[f] ?? "DENY"}
                        onValueChange={(value) =>
                          patch({
                            fieldRules: {
                              ...role.fieldRules,
                              [f]: value as "READ" | "MASK" | "DENY",
                            },
                          })
                        }
                        options={[
                          { value: "DENY", label: "Từ chối" },
                          { value: "MASK", label: "Che giá trị" },
                          { value: "READ", label: "Cho xem" },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              )}
              {tab === "versions" && (
                <div className="fd-content">
                  <h3>Phiên bản chính sách</h3>
                  <div className="fd-version-row">
                    <Badge tone="warning">Draft</Badge>
                    <span>Bản nháp hiện tại · trình duyệt này</span>
                  </div>
                  <div className="fd-version-row">
                    <Badge>v{role.version}</Badge>
                    <span>Phiên bản mẫu · không có policy backend</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState title="Chọn vai trò" />
          )}
        </section>
        <aside className="fd-pane fd-inspector fd-access-panel">
          <div className="fd-pane-title">
            <strong>Test Access</strong>
            <Badge tone="warning">MÔ PHỎNG</Badge>
          </div>
          <div className="fd-pane-pad">
            <p className="fd-muted">
              Dùng dữ liệu giả lập để giải thích quyết định. Kết quả không cấp
              quyền thật.
            </p>
            <Field label="Tài nguyên">
              <Select
                label="Tài nguyên"
                value={testResource}
                onValueChange={(value) => {
                  setTestResource(value);
                  setTestAction(
                    resources.find((resource) => resource.resource === value)
                      ?.actions[0] ?? "READ",
                  );
                  setDecision(null);
                }}
                options={resources.map((resource) => ({
                  value: resource.resource,
                  label: resource.label,
                }))}
              />
            </Field>
            <Field label="Hành động">
              <Select
                label="Hành động"
                value={testAction}
                onValueChange={(value) => {
                  setTestAction(value as Action);
                  setDecision(null);
                }}
                options={(
                  resources.find((r) => r.resource === testResource)?.actions ??
                  actions
                ).map((action) => ({ value: action, label: labels[action] }))}
              />
            </Field>
            <div className="fd-fixture-heading">NGỮ CẢNH GIẢ LẬP</div>
            {(
              [
                ["actorActive", "Người dùng đang hoạt động"],
                ["sameTenant", "Cùng tenant"],
                ["sameCompany", "Cùng công ty"],
                ["sameDepartment", "Cùng phòng ban"],
                ["isOwner", "Chủ sở hữu bản ghi"],
                ["assignedActiveTask", "Có tác vụ được giao"],
              ] as const
            ).map(([key, label]) => (
              <label className="fd-checkbox fd-fixture" key={key}>
                <Checkbox
                  checked={fixture[key]}
                  onCheckedChange={(checked) => {
                    setFixture({ ...fixture, [key]: checked === true });
                    setDecision(null);
                  }}
                />
                {label}
              </label>
            ))}
            <Button
              variant="primary"
              className="fd-full"
              disabled={!role}
              onClick={() =>
                role &&
                setDecision(
                  evaluateAccess(role, testResource, testAction, fixture),
                )
              }
            >
              Chạy mô phỏng
            </Button>
            {decision && (
              <div
                className={`fd-decision fd-decision-${decision.effect.toLowerCase()}`}
                role="status"
              >
                <div>
                  <strong>{decision.effect}</strong>
                  <Badge tone="warning">SIMULATED</Badge>
                </div>
                <ul>
                  {decision.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <small>Chưa kiểm tra quyền truy cập thực tế trên API.</small>
              </div>
            )}
          </div>
        </aside>
      </div>
      {modal && (
        <Modal
          title="Tạo vai trò"
          onClose={() => setModal(false)}
          footer={
            <>
              <Button onClick={() => setModal(false)}>Hủy</Button>
              <Button
                variant="primary"
                disabled={!newName.trim()}
                onClick={create}
              >
                Tạo bản nháp
              </Button>
            </>
          }
        >
          <Field label="Tên vai trò">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </Field>
          <Notice tone="warning">Vai trò mới không có quyền mặc định.</Notice>
        </Modal>
      )}
    </section>
  );
}
