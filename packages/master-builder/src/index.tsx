import { MasterRecords, type SaveMasterRecords } from "./master-records";
export { assertRecordChange } from "./record-validation";
export type { MasterRecord } from "./record-validation";
export type { SaveMasterRecords } from "./master-records";
import { FieldKeyEditor } from "./field-key-editor";
import { useI18n } from "@flowdocker/i18n";
import { useMemo, useState } from "react";
import { Database, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Field,
  FieldGroup,
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
  onSaveRecords?: SaveMasterRecords;
  onDelete?(id: string): Promise<void>;
  getDeleteBlockers?(entity: MasterEntity): string[];
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
  onDelete,
  onSaveRecords,
  getDeleteBlockers,
  loading,
  error,
}: MasterBuilderProps) {
  const { t, validation } = useI18n();

  const [selectedId, setSelectedId] = useState(entities[0]?.id ?? "");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [tab, setTab] = useState("schema");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const deleteTarget = entities.find((entity) => entity.id === deleteId);
  const deleteIssues = deleteTarget
    ? (getDeleteBlockers?.(deleteTarget) ?? [])
    : [];
  const remove = async () => {
    if (!deleteTarget || !onDelete || deleting || deleteIssues.length) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      await onDelete(deleteTarget.id);
      setDeleteId(undefined);
      setSelectedId("");
      setSelectedFieldId("");
      setMessage("Đã xóa entity khỏi dữ liệu cục bộ.");
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };
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
    return save({
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
          <div className="fd-overline">{t("DỮ LIỆU / MASTER DATA")}</div>
          <h1>{t("Master Data Builder")}</h1>
          <p>{t("Định nghĩa danh mục, nguồn sở hữu và cấu trúc trường")}</p>
        </div>
        <div className="fd-toolbar-actions">
          <Badge tone="warning">{t("Chỉ lưu cục bộ")}</Badge>
          <Button variant="primary" onClick={() => setModal(true)}>
            <Plus size={16} />
            {t("Tạo entity")}
          </Button>
        </div>
      </div>
      {error && <Notice tone="danger">{t(error)}</Notice>}
      {message && <Notice>{t(message)}</Notice>}
      <div
        className={
          tab === "records"
            ? "fd-workbench fd-master-layout fd-master-records-layout"
            : "fd-workbench fd-master-layout"
        }
      >
        <aside className="fd-pane fd-entity-list">
          <div className="fd-pane-title">
            <strong>{t("Entity Explorer")}</strong>
            <span>{entities.length}</span>
          </div>
          <div className="fd-pane-pad">
            <SearchInput
              label={t("Tìm entity...")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="fd-entity-scroll">
            {loading ? (
              <div className="fd-pane-pad">{t("Đang tải...")}</div>
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
              <EmptyState title={t("Không tìm thấy entity")} />
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
                        ? t("Đã phát hành")
                        : t("Bản nháp")}
                    </Badge>
                  </div>
                  <div className="fd-object-meta">
                    <code>{entity.key}</code>
                    <span>·</span>
                    <span>{t(kinds[entity.kind])}</span>
                    <span>·</span>
                    <span>
                      {t("v")}
                      {entity.version}
                    </span>
                  </div>
                </div>
                <div className="fd-toolbar-actions">
                  {onDelete && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDeleteId(entity.id);
                        setDeleteError(false);
                      }}
                    >
                      <Trash2 size={16} />
                      {t("Xóa entity")}
                    </Button>
                  )}
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
                    <ShieldCheck size={16} />
                    {t("Kiểm tra")}
                  </Button>
                  <Button
                    disabled
                    title={t("Cần backend, reviewer và migration để phát hành")}
                  >
                    {t("Phát hành · cần backend")}
                  </Button>
                </div>
              </div>
              <Tabs
                tabs={[
                  {
                    id: "schema",
                    label: t("Cấu trúc ({{count}})", {
                      count: entity.fields.length,
                    }),
                  },
                  {
                    id: "records",
                    label: t("Bản ghi ({{count}})", {
                      count: entity.records.length,
                    }),
                  },
                  { id: "source", label: t("Nguồn & sở hữu") },
                  { id: "versions", label: t("Phiên bản") },
                ]}
                active={tab}
                onChange={setTab}
              />
              {errors.length > 0 && (
                <div className="fd-validation" role="alert">
                  <strong>
                    {t("Cần xử lý {{count}} vấn đề", { count: errors.length })}
                  </strong>
                  <ul>
                    {errors.map((e, i) => (
                      <li key={i}>{validation(e)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === "schema" && (
                <div className="fd-content">
                  <div className="fd-section-heading">
                    <div>
                      <h3>{t("Thiết kế trường")}</h3>
                      <p>
                        {t(
                          "Chọn một dòng để chỉnh thuộc tính trong inspector.",
                        )}
                      </p>
                    </div>
                    <Button onClick={addField}>
                      <Plus size={15} />
                      {t("Thêm trường")}
                    </Button>
                  </div>
                  <DataTable
                    rows={entity.fields}
                    rowKey={(f) => f.id}
                    selectedKey={field?.id}
                    onRowClick={(f) => setSelectedFieldId(f.id)}
                    empty={t(
                      "Chưa có trường. Thêm trường đầu tiên để bắt đầu.",
                    )}
                    columns={[
                      {
                        key: "name",
                        heading: t("TRƯỜNG"),
                        render: (f) => (
                          <div className="fd-cell-main">
                            <strong>{f.label}</strong>
                            <code>{f.key}</code>
                          </div>
                        ),
                      },
                      {
                        key: "type",
                        heading: t("KIỂU"),
                        render: (f) => <Badge>{t(f.type)}</Badge>,
                      },
                      {
                        key: "required",
                        heading: t("BẮT BUỘC"),
                        render: (f) => (f.required ? t("Có") : t("Không")),
                      },
                      {
                        key: "security",
                        heading: t("PHÂN LOẠI"),
                        render: (f) => (
                          <Badge
                            tone={
                              f.classification === "SENSITIVE"
                                ? "danger"
                                : "neutral"
                            }
                          >
                            {t(f.classification)}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
              {tab === "records" && entity && (
                <MasterRecords
                  key={entity.id}
                  entity={entity}
                  entities={entities}
                  onSave={onSaveRecords}
                />
              )}
              {tab === "source" && (
                <div className="fd-content fd-source-grid">
                  <div>
                    <h3>{t("Quyền sở hữu nguồn")}</h3>
                    <p>
                      {t(
                        "Entity lấy từ nguồn ngoài chỉ được xem trong bản prototype.",
                      )}
                    </p>
                    <FieldGroup>
                      <Field label={t("Loại entity")}>
                        <Select
                          label={t("Loại entity")}
                          value={entity.kind}
                          onValueChange={(value) =>
                            patch({ kind: value as MasterEntity["kind"] })
                          }
                          options={Object.entries(kinds).map(
                            ([value, label]) => ({ value, label: t(label) }),
                          )}
                        />
                      </Field>
                      <Field label={t("Nguồn dữ liệu")}>
                        <Input
                          value={entity.sourceOwner}
                          onChange={(e) =>
                            patch({ sourceOwner: e.target.value })
                          }
                        />
                      </Field>
                      <Field label={t("Business owner")}>
                        <Input
                          value={entity.businessOwner}
                          onChange={(e) =>
                            patch({ businessOwner: e.target.value })
                          }
                        />
                      </Field>
                      <Field label={t("Phạm vi")}>
                        <Select
                          label={t("Phạm vi")}
                          value={entity.scope}
                          onValueChange={(value) =>
                            patch({ scope: value as MasterEntity["scope"] })
                          }
                          options={[
                            { value: "TENANT", label: t("Tenant") },
                            { value: "COMPANY", label: t("Công ty") },
                          ]}
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                  <Notice tone="warning">
                    {t(
                      "Mọi thay đổi ở đây chỉ tác động bản nháp trong trình duyệt. Nguồn ngoài không được chỉnh bản ghi từ UI này.",
                    )}
                  </Notice>
                </div>
              )}
              {tab === "versions" && (
                <div className="fd-content">
                  <h3>{t("Lịch sử phiên bản")}</h3>
                  <div className="fd-version-row">
                    <Badge tone="warning">{t("Draft")}</Badge>
                    <span>{t("Bản nháp hiện tại · chỉ trên trình duyệt")}</span>
                  </div>
                  <div className="fd-version-row">
                    <Badge>
                      {t("v")}
                      {entity.version}
                    </Badge>
                    <span>
                      {t("Phiên bản mẫu · không có revision backend")}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState title={t("Chọn entity")} />
          )}
        </section>
        {tab !== "records" && (
          <aside className="fd-pane fd-inspector">
            <div className="fd-pane-title">
              <strong>{t("Inspector")}</strong>
              <span>{t("THUỘC TÍNH")}</span>
            </div>
            {tab === "schema" && field && entity ? (
              <FieldGroup className="fd-pane-pad fd-inspector-form">
                <div className="fd-inspector-heading">
                  <span className="fd-field-icon">{t("Aa")}</span>
                  <div>
                    <strong>{field.label}</strong>
                    <small>{field.key}</small>
                  </div>
                </div>
                <Field label={t("Tên hiển thị")}>
                  <Input
                    value={field.label}
                    onChange={(e) => patchField({ label: e.target.value })}
                  />
                </Field>
                <FieldKeyEditor
                  key={`${entity.id}:${field.id}`}
                  field={field}
                  fields={entity.fields}
                  onCommit={(key) => patchField({ key })}
                />
                <Field label={t("Kiểu dữ liệu")}>
                  <Select
                    label={t("Kiểu dữ liệu")}
                    value={field.type}
                    onValueChange={(value) =>
                      patchField({ type: value as FieldType })
                    }
                    options={[
                      { value: "text", label: t("Văn bản") },
                      { value: "number", label: t("Số") },
                      { value: "date", label: t("Ngày") },
                      { value: "boolean", label: t("Boolean") },
                      { value: "reference", label: t("Tham chiếu") },
                    ]}
                  />
                </Field>
                {field.type === "reference" && (
                  <Field label={t("Entity tham chiếu")}>
                    <Input
                      value={field.referenceEntity ?? ""}
                      onChange={(e) =>
                        patchField({ referenceEntity: e.target.value })
                      }
                    />
                  </Field>
                )}
                <Field label={t("Phân loại")}>
                  <Select
                    label={t("Phân loại")}
                    value={field.classification}
                    onValueChange={(value) =>
                      patchField({
                        classification: value as MasterField["classification"],
                      })
                    }
                    options={[
                      { value: "PUBLIC", label: t("Công khai") },
                      { value: "INTERNAL", label: t("Nội bộ") },
                      { value: "SENSITIVE", label: t("Nhạy cảm") },
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
                  {t("Bắt buộc")}
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
                    <Trash2 size={15} />
                    {t("Xóa trường")}
                  </Button>
                </div>
              </FieldGroup>
            ) : (
              <div className="fd-pane-pad">
                <EmptyState
                  title={t("Chọn trường để xem thuộc tính")}
                  detail={t("Inspector cập nhật theo trường đang chọn.")}
                />
              </div>
            )}
          </aside>
        )}
      </div>
      {deleteTarget && (
        <Modal
          title={t("Xóa entity")}
          onClose={() => {
            if (!deleting) setDeleteId(undefined);
          }}
          footer={
            <>
              <Button
                disabled={deleting}
                onClick={() => setDeleteId(undefined)}
              >
                {t("Hủy")}
              </Button>
              <Button
                variant="danger"
                disabled={deleting || deleteIssues.length > 0}
                onClick={remove}
              >
                {t(deleting ? "Đang xóa..." : "Xác nhận xóa entity")}
              </Button>
            </>
          }
        >
          <p>
            {t(
              "Xóa danh mục {{name}} ({{key}}) và {{count}} bản ghi khỏi trình duyệt? Thao tác này không thể hoàn tác.",
              {
                name: deleteTarget.name,
                key: deleteTarget.key,
                count: deleteTarget.records.length,
              },
            )}
          </p>
          {deleteIssues.map((issue) => (
            <Notice key={issue} tone="warning">
              {issue}
            </Notice>
          ))}
          {deleteError && (
            <Notice tone="danger">
              {t(
                "Không xóa được entity. Dữ liệu có thể đang được sử dụng hoặc trình duyệt không cho phép lưu. Hãy kiểm tra và thử lại.",
              )}
            </Notice>
          )}
        </Modal>
      )}
      {modal && (
        <Modal
          title={t("Tạo entity mới")}
          onClose={() => setModal(false)}
          footer={
            <>
              <Button onClick={() => setModal(false)}>{t("Hủy")}</Button>
              <Button
                variant="primary"
                disabled={!newName.trim() || !/^[a-z][a-z0-9_]*$/.test(newKey)}
                onClick={create}
              >
                {t("Tạo bản nháp")}
              </Button>
            </>
          }
        >
          <FieldGroup>
            <Field label={t("Tên entity")}>
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
              label={t("Mã kỹ thuật")}
              hint={t("Chữ thường, số, dấu gạch dưới; bắt đầu bằng chữ")}
            >
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </Field>
            <Field label={t("Loại entity")}>
              <Select
                label={t("Loại entity")}
                value={newKind}
                onValueChange={(value) =>
                  setNewKind(value as MasterEntity["kind"])
                }
                options={Object.entries(kinds).map(([value, label]) => ({
                  value,
                  label: t(label),
                }))}
              />
            </Field>
          </FieldGroup>
        </Modal>
      )}
    </section>
  );
}
