import { useMemo, useState } from "react";
import { Database, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
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
import {
  validateEntity,
  type FieldType,
  type MasterEntity,
  type MasterField,
} from "@flowdocker/app-contracts";

export interface MasterBuilderProps {
  entities: MasterEntity[];
  onSave(entity: MasterEntity): Promise<void>;
  loading?: boolean;
  error?: string;
}
const uid = () => crypto.randomUUID();
const kinds = {
  LOCAL_CATALOG: "Danh mục nội bộ",
  EXTERNAL_MIRROR: "Dữ liệu nguồn ngoài",
  COMPOSITE_READ_MODEL: "Dữ liệu kết hợp",
};
export function MasterBuilder({
  entities,
  onSave,
  loading,
  error,
}: MasterBuilderProps) {
  const [selectedId, setSelectedId] = useState(entities[0]?.id ?? "");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [tab, setTab] = useState("schema");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newKind, setNewKind] = useState<MasterEntity["kind"]>("LOCAL_CATALOG");
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const entity = entities.find((e) => e.id === selectedId) ?? entities[0];
  const field =
    entity?.fields.find((f) => f.id === selectedFieldId) ?? entity?.fields[0];
  const filtered = useMemo(
    () =>
      entities.filter((e) =>
        `${e.name} ${e.key}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [entities, query],
  );
  const save = async (
    next: MasterEntity,
    text = "Đã lưu bản nháp trong trình duyệt",
  ) => {
    await onSave({ ...next, status: "DRAFT" });
    setMessage(text);
    setErrors([]);
  };
  const patch = (patchValue: Partial<MasterEntity>) =>
    entity && save({ ...entity, ...patchValue });
  const patchField = (patchValue: Partial<MasterField>) => {
    if (!entity || !field) return;
    save({
      ...entity,
      fields: entity.fields.map((f) =>
        f.id === field.id ? { ...f, ...patchValue } : f,
      ),
    });
  };
  const addField = () => {
    if (!entity) return;
    const id = uid();
    save({
      ...entity,
      fields: [
        ...entity.fields,
        {
          id,
          key: `field_${entity.fields.length + 1}`,
          label: "Trường mới",
          type: "text",
          required: false,
          classification: "INTERNAL",
        },
      ],
    });
    setSelectedFieldId(id);
    setTab("schema");
  };
  const create = async () => {
    const next: MasterEntity = {
      id: uid(),
      key: newKey.trim(),
      name: newName.trim(),
      kind: newKind,
      sourceOwner: newKind === "LOCAL_CATALOG" ? "Nội bộ" : "Chưa xác định",
      businessOwner: "Chưa xác định",
      scope: "TENANT",
      version: 1,
      status: "DRAFT",
      fields: [],
      records: [],
    };
    await onSave(next);
    setSelectedId(next.id);
    setSelectedFieldId("");
    setModal(false);
    setMessage("Đã tạo bản nháp entity trong trình duyệt");
    setTab("schema");
  };
  return (
    <section className="fd-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">DỮ LIỆU / MASTER DATA</div>
          <h1>Master Data Builder</h1>
          <p>Định nghĩa danh mục, nguồn sở hữu và cấu trúc trường</p>
        </div>
        <div className="fd-toolbar-actions">
          <Badge tone="warning">Chỉ lưu cục bộ</Badge>
          <Button variant="primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Tạo entity
          </Button>
        </div>
      </div>
      {error && <Notice tone="danger">{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="fd-workbench fd-master-layout">
        <aside className="fd-pane fd-entity-list">
          <div className="fd-pane-title">
            <strong>Entity Explorer</strong>
            <span>{entities.length}</span>
          </div>
          <div className="fd-pane-pad">
            <SearchInput
              label="Tìm entity..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="fd-entity-scroll">
            {loading ? (
              <div className="fd-pane-pad">Đang tải...</div>
            ) : filtered.length ? (
              filtered.map((e) => (
                <button
                  key={e.id}
                  className={`fd-entity-item ${entity?.id === e.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedId(e.id);
                    setSelectedFieldId("");
                    setErrors([]);
                    setMessage("");
                  }}
                >
                  <Database size={17} />
                  <span>
                    <strong>{e.name}</strong>
                    <small>{e.key}</small>
                  </span>
                  <Badge
                    tone={e.status === "PUBLISHED" ? "success" : "neutral"}
                  >
                    {e.status === "PUBLISHED" ? "v" + e.version : "Draft"}
                  </Badge>
                </button>
              ))
            ) : (
              <EmptyState title="Không tìm thấy entity" />
            )}
          </div>
        </aside>
        <section className="fd-pane fd-editor">
          {entity ? (
            <>
              <div className="fd-object-header">
                <div>
                  <div className="fd-object-title">
                    <h2>{entity.name}</h2>
                    <Badge
                      tone={
                        entity.status === "PUBLISHED" ? "success" : "warning"
                      }
                    >
                      {entity.status === "PUBLISHED"
                        ? "Đã phát hành"
                        : "Bản nháp"}
                    </Badge>
                  </div>
                  <div className="fd-object-meta">
                    <code>{entity.key}</code>
                    <span>·</span>
                    <span>{kinds[entity.kind]}</span>
                    <span>·</span>
                    <span>v{entity.version}</span>
                  </div>
                </div>
                <div className="fd-toolbar-actions">
                  <Button
                    onClick={() => {
                      setErrors(validateEntity(entity));
                      setMessage(
                        validateEntity(entity).length
                          ? ""
                          : "Hợp lệ trong bản mô phỏng; chưa kiểm tra API hoặc migration.",
                      );
                    }}
                  >
                    <ShieldCheck size={16} /> Kiểm tra
                  </Button>
                  <Button
                    disabled
                    title="Cần backend, reviewer và migration để phát hành"
                  >
                    Phát hành · cần backend
                  </Button>
                </div>
              </div>
              <Tabs
                tabs={[
                  { id: "schema", label: `Cấu trúc (${entity.fields.length})` },
                  {
                    id: "records",
                    label: `Bản ghi (${entity.records.length})`,
                  },
                  { id: "source", label: "Nguồn & sở hữu" },
                  { id: "versions", label: "Phiên bản" },
                ]}
                active={tab}
                onChange={setTab}
              />
              {errors.length > 0 && (
                <div className="fd-validation" role="alert">
                  <strong>Cần xử lý {errors.length} vấn đề</strong>
                  <ul>
                    {errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === "schema" && (
                <div className="fd-content">
                  <div className="fd-section-heading">
                    <div>
                      <h3>Thiết kế trường</h3>
                      <p>Chọn một dòng để chỉnh thuộc tính trong inspector.</p>
                    </div>
                    <Button onClick={addField}>
                      <Plus size={15} /> Thêm trường
                    </Button>
                  </div>
                  <DataTable
                    rows={entity.fields}
                    rowKey={(f) => f.id}
                    selectedKey={field?.id}
                    onRowClick={(f) => setSelectedFieldId(f.id)}
                    empty="Chưa có trường. Thêm trường đầu tiên để bắt đầu."
                    columns={[
                      {
                        key: "name",
                        heading: "TRƯỜNG",
                        render: (f) => (
                          <div className="fd-cell-main">
                            <strong>{f.label}</strong>
                            <code>{f.key}</code>
                          </div>
                        ),
                      },
                      {
                        key: "type",
                        heading: "KIỂU",
                        render: (f) => <Badge>{f.type}</Badge>,
                      },
                      {
                        key: "required",
                        heading: "BẮT BUỘC",
                        render: (f) => (f.required ? "Có" : "Không"),
                      },
                      {
                        key: "security",
                        heading: "PHÂN LOẠI",
                        render: (f) => (
                          <Badge
                            tone={
                              f.classification === "SENSITIVE"
                                ? "danger"
                                : "neutral"
                            }
                          >
                            {f.classification}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
              {tab === "records" && (
                <div className="fd-content">
                  <div className="fd-section-heading">
                    <div>
                      <h3>Xem trước bản ghi</h3>
                      <p>Dữ liệu minh họa, không kết nối nguồn thật.</p>
                    </div>
                  </div>
                  {entity.records.length ? (
                    <DataTable
                      rows={entity.records}
                      rowKey={(row) => JSON.stringify(row)}
                      columns={entity.fields.slice(0, 4).map((f) => ({
                        key: f.key,
                        heading: f.label.toUpperCase(),
                        render: (
                          row: Record<string, string | number | boolean>,
                        ) => String(row[f.key] ?? "—"),
                      }))}
                    />
                  ) : (
                    <EmptyState
                      title="Chưa có bản ghi mẫu"
                      detail="Việc tạo và đồng bộ bản ghi cần API ở giai đoạn sau."
                    />
                  )}
                </div>
              )}
              {tab === "source" && (
                <div className="fd-content fd-source-grid">
                  <div>
                    <h3>Quyền sở hữu nguồn</h3>
                    <p>
                      Entity lấy từ nguồn ngoài chỉ được xem trong bản
                      prototype.
                    </p>
                    <Field label="Loại entity">
                      <Select
                        label="Loại entity"
                        value={entity.kind}
                        onValueChange={(value) =>
                          patch({ kind: value as MasterEntity["kind"] })
                        }
                        options={Object.entries(kinds).map(
                          ([value, label]) => ({ value, label }),
                        )}
                      />
                    </Field>
                    <Field label="Nguồn dữ liệu">
                      <Input
                        value={entity.sourceOwner}
                        onChange={(e) => patch({ sourceOwner: e.target.value })}
                      />
                    </Field>
                    <Field label="Business owner">
                      <Input
                        value={entity.businessOwner}
                        onChange={(e) =>
                          patch({ businessOwner: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Phạm vi">
                      <Select
                        label="Phạm vi"
                        value={entity.scope}
                        onValueChange={(value) =>
                          patch({ scope: value as MasterEntity["scope"] })
                        }
                        options={[
                          { value: "TENANT", label: "Tenant" },
                          { value: "COMPANY", label: "Công ty" },
                        ]}
                      />
                    </Field>
                  </div>
                  <Notice tone="warning">
                    Mọi thay đổi ở đây chỉ tác động bản nháp trong trình duyệt.
                    Nguồn ngoài không được chỉnh bản ghi từ UI này.
                  </Notice>
                </div>
              )}
              {tab === "versions" && (
                <div className="fd-content">
                  <h3>Lịch sử phiên bản</h3>
                  <div className="fd-version-row">
                    <Badge tone="warning">Draft</Badge>
                    <span>Bản nháp hiện tại · chỉ trên trình duyệt</span>
                  </div>
                  <div className="fd-version-row">
                    <Badge>v{entity.version}</Badge>
                    <span>Phiên bản mẫu · không có revision backend</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState title="Chọn entity" />
          )}
        </section>
        <aside className="fd-pane fd-inspector">
          <div className="fd-pane-title">
            <strong>Inspector</strong>
            <span>THUỘC TÍNH</span>
          </div>
          {tab === "schema" && field && entity ? (
            <div className="fd-pane-pad fd-inspector-form">
              <div className="fd-inspector-heading">
                <span className="fd-field-icon">Aa</span>
                <div>
                  <strong>{field.label}</strong>
                  <small>{field.key}</small>
                </div>
              </div>
              <Field label="Tên hiển thị">
                <Input
                  value={field.label}
                  onChange={(e) => patchField({ label: e.target.value })}
                />
              </Field>
              <Field label="Mã trường">
                <Input
                  value={field.key}
                  onChange={(e) => patchField({ key: e.target.value })}
                />
              </Field>
              <Field label="Kiểu dữ liệu">
                <Select
                  label="Kiểu dữ liệu"
                  value={field.type}
                  onValueChange={(value) =>
                    patchField({ type: value as FieldType })
                  }
                  options={[
                    { value: "text", label: "Văn bản" },
                    { value: "number", label: "Số" },
                    { value: "date", label: "Ngày" },
                    { value: "boolean", label: "Boolean" },
                    { value: "reference", label: "Tham chiếu" },
                  ]}
                />
              </Field>
              {field.type === "reference" && (
                <Field label="Entity tham chiếu">
                  <Input
                    value={field.referenceEntity ?? ""}
                    onChange={(e) =>
                      patchField({ referenceEntity: e.target.value })
                    }
                  />
                </Field>
              )}
              <Field label="Phân loại">
                <Select
                  label="Phân loại"
                  value={field.classification}
                  onValueChange={(value) =>
                    patchField({
                      classification: value as MasterField["classification"],
                    })
                  }
                  options={[
                    { value: "PUBLIC", label: "Công khai" },
                    { value: "INTERNAL", label: "Nội bộ" },
                    { value: "SENSITIVE", label: "Nhạy cảm" },
                  ]}
                />
              </Field>
              <label className="fd-checkbox">
                <Checkbox
                  checked={field.required}
                  onCheckedChange={(checked) =>
                    patchField({ required: checked === true })
                  }
                />{" "}
                Bắt buộc
              </label>
              <div className="fd-inspector-bottom">
                <Button
                  variant="danger"
                  onClick={() => {
                    save({
                      ...entity,
                      fields: entity.fields.filter((f) => f.id !== field.id),
                    });
                    setSelectedFieldId("");
                  }}
                >
                  <Trash2 size={15} /> Xóa trường
                </Button>
              </div>
            </div>
          ) : (
            <div className="fd-pane-pad">
              <EmptyState
                title="Chọn trường để xem thuộc tính"
                detail="Inspector cập nhật theo trường đang chọn."
              />
            </div>
          )}
        </aside>
      </div>
      {modal && (
        <Modal
          title="Tạo entity mới"
          onClose={() => setModal(false)}
          footer={
            <>
              <Button onClick={() => setModal(false)}>Hủy</Button>
              <Button
                variant="primary"
                disabled={!newName.trim() || !/^[a-z][a-z0-9_]*$/.test(newKey)}
                onClick={create}
              >
                Tạo bản nháp
              </Button>
            </>
          }
        >
          <div className="fd-form-stack">
            <Field label="Tên entity">
              <Input
                autoFocus
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newKey)
                    setNewKey(
                      e.target.value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/đ/g, "d")
                        .replace(/[^a-z0-9]+/g, "_")
                        .replace(/^_|_$/g, ""),
                    );
                }}
              />
            </Field>
            <Field
              label="Mã kỹ thuật"
              hint="Chữ thường, số, dấu gạch dưới; bắt đầu bằng chữ"
            >
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </Field>
            <Field label="Loại entity">
              <Select
                label="Loại entity"
                value={newKind}
                onValueChange={(value) =>
                  setNewKind(value as MasterEntity["kind"])
                }
                options={Object.entries(kinds).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Field>
          </div>
        </Modal>
      )}
    </section>
  );
}
