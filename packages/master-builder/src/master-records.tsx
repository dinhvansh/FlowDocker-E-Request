import { useId, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { MasterEntity } from "@flowdocker/app-contracts";
import { useI18n } from "@flowdocker/i18n";
import {
  Button,
  Combobox,
  DataTable,
  DatePicker,
  Field,
  FieldGroup,
  Input,
  Modal,
  Notice,
  Select,
} from "@flowdocker/ui";
import {
  assertRecordChange,
  recordFieldError,
  recordIdentity,
  recordsSchemaValid,
  type MasterRecord,
} from "./record-validation";
export type SaveMasterRecords = (
  expected: MasterEntity,
  records: MasterRecord[],
) => Promise<void>;
type Edit = {
  expected: MasterEntity;
  index?: number;
  mode: "edit" | "delete";
  draft: MasterRecord;
};
export function MasterRecords({
  entity,
  entities,
  onSave,
}: {
  entity: MasterEntity;
  entities: MasterEntity[];
  onSave?: SaveMasterRecords;
}) {
  const { t } = useI18n();
  const formId = useId();
  const [edit, setEdit] = useState<Edit>();
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [failed, setFailed] = useState<string>();
  const [success, setSuccess] = useState(false);
  const editable =
    !!onSave && entity.kind === "LOCAL_CATALOG" && recordsSchemaValid(entity);
  const open = (mode: Edit["mode"], index?: number) => {
    setEdit({
      expected: structuredClone(entity),
      mode,
      index,
      draft: index === undefined ? {} : { ...entity.records[index] },
    });
    setAttempted(false);
    setTouched(new Set());
    setFailed(undefined);
    setSuccess(false);
  };
  const close = () => {
    if (!pending.current) setEdit(undefined);
  };
  const typedDraft = edit ? { ...edit.draft } : {};
  if (edit)
    for (const f of edit.expected.fields) {
      const value = typedDraft[f.key];
      if (
        f.type === "number" &&
        typeof value === "string" &&
        value.trim() &&
        Number.isFinite(Number(value))
      )
        typedDraft[f.key] = Number(value);
    }
  const errors = edit
    ? Object.fromEntries(
        edit.expected.fields.map((f) => [
          f.key,
          recordFieldError(
            f,
            typedDraft[f.key],
            edit.expected,
            entities,
            edit.index,
          ),
        ]),
      )
    : {};
  const update = (key: string, value: string | number | boolean) => {
    setEdit((e) => (e ? { ...e, draft: { ...e.draft, [key]: value } } : e));
    setTouched((s) => new Set([...s, key]));
    setFailed(undefined);
  };
  const save = async () => {
    if (!edit || !onSave || pending.current || !editable) return;
    setAttempted(true);
    if (edit.mode === "edit" && Object.values(errors).some(Boolean)) return;
    const records =
      edit.mode === "delete"
        ? edit.expected.records.filter((_, i) => i !== edit.index)
        : edit.index === undefined
          ? [...edit.expected.records, typedDraft]
          : edit.expected.records.map((row, i) =>
              i === edit.index ? typedDraft : row,
            );
    pending.current = true;
    setBusy(true);
    setFailed(undefined);
    try {
      assertRecordChange(edit.expected, records, entities);
      await onSave(edit.expected, records);
      setEdit(undefined);
      setSuccess(true);
    } catch (error) {
      setFailed(
        error instanceof Error && error.message === "Record is referenced"
          ? "Bản ghi đang được tham chiếu. Gỡ tham chiếu trước khi xóa hoặc đổi mã."
          : error instanceof Error &&
              error.message === "Master data changed; reload before retrying"
            ? "Dữ liệu đã thay đổi ở tab khác. Tải lại trang trước khi cập nhật."
            : "Không lưu được thay đổi. Nội dung đang sửa được giữ lại; hãy kiểm tra lưu trữ và thử lại.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="fd-content">
      <div className="fd-section-heading">
        <div>
          <h3>{t("Bản ghi danh mục")}</h3>
          <p>{t("Dữ liệu minh họa, chỉ lưu trong trình duyệt.")}</p>
        </div>
        {editable && (
          <Button onClick={() => open("edit")}>
            <Plus data-icon="inline-start" />
            {t("Thêm bản ghi")}
          </Button>
        )}
      </div>
      {!editable && (
        <Notice>
          {t(
            entity.kind !== "LOCAL_CATALOG"
              ? "Dữ liệu do nguồn ngoài quản lý, chỉ được xem tại đây."
              : !onSave
                ? "Ứng dụng chưa bật chỉnh sửa bản ghi."
                : "Sửa mã trường không hợp lệ hoặc trùng trước khi nhập bản ghi.",
          )}
        </Notice>
      )}
      {success && (
        <div role="status">
          <Notice tone="success">
            {t("Đã cập nhật bản ghi trong trình duyệt.")}
          </Notice>
        </div>
      )}
      <DataTable<{ record: MasterRecord; index: number }>
        rows={entity.records.map((record, index) => ({ record, index }))}
        rowKey={(row) => String(row.index)}
        empty={t("Chưa có bản ghi. Thêm bản ghi đầu tiên để bắt đầu.")}
        columns={[
          ...entity.fields.map((f) => ({
            key: f.id,
            heading: f.label,
            render: ({ record }: { record: MasterRecord }) =>
              f.type === "boolean" && typeof record[f.key] === "boolean"
                ? t(record[f.key] ? "Có" : "Không")
                : String(record[f.key] ?? "—"),
          })),
          ...(editable
            ? [
                {
                  key: "actions",
                  heading: t("Thao tác"),
                  render: ({ index }: { index: number }) => (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        aria-label={t("Sửa bản ghi {{name}}", {
                          name: recordIdentity(entity.records[index]),
                        })}
                        onClick={() => open("edit", index)}
                      >
                        <Pencil data-icon="inline-start" />
                        {t("Sửa")}
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={t("Xóa bản ghi {{name}}", {
                          name: recordIdentity(entity.records[index]),
                        })}
                        onClick={() => open("delete", index)}
                      >
                        <Trash2 data-icon="inline-start" />
                        {t("Xóa")}
                      </Button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
      {edit && (
        <Modal
          title={t(
            edit.mode === "delete"
              ? "Xóa bản ghi"
              : edit.index === undefined
                ? "Thêm bản ghi"
                : "Sửa bản ghi",
          )}
          onClose={close}
          footer={
            <>
              <Button disabled={busy} onClick={close}>
                {t("Hủy")}
              </Button>
              <Button
                variant={edit.mode === "delete" ? "danger" : "primary"}
                disabled={busy}
                form={formId}
                type="submit"
              >
                {t(
                  busy
                    ? "Đang lưu..."
                    : edit.mode === "delete"
                      ? "Xác nhận xóa bản ghi"
                      : "Lưu bản ghi",
                )}
              </Button>
            </>
          }
        >
          <form
            id={formId}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <FieldGroup className="fd-record-fields">
              {edit.mode === "delete" ? (
                <p>
                  {t(
                    "Xóa bản ghi {{name}} khỏi danh mục {{catalog}}? Thao tác này không thể hoàn tác.",
                    {
                      name: recordIdentity(edit.draft),
                      catalog: edit.expected.name,
                    },
                  )}
                </p>
              ) : (
                edit.expected.fields.map((f) => {
                  const label = f.required
                    ? t("{{label}} (bắt buộc)", { label: f.label })
                    : f.label;
                  const error =
                    attempted || touched.has(f.key) ? errors[f.key] : undefined;
                  const value = edit.draft[f.key];
                  const locked =
                    busy ||
                    (edit.index !== undefined &&
                      f.key === "id" &&
                      edit.expected.records[edit.index].id !== undefined);
                  const target = entities.find(
                    (e) =>
                      e.id === f.referenceEntity || e.key === f.referenceEntity,
                  );
                  return (
                    <Field
                      key={f.id}
                      label={label}
                      error={error ? t(error) : undefined}
                      hint={
                        edit.index !== undefined && f.key === "id"
                          ? t(
                              "Mã định danh của bản ghi đã tạo không thể thay đổi.",
                            )
                          : undefined
                      }
                    >
                      {f.type === "boolean" ? (
                        <Select
                          label={label}
                          value={
                            value === true
                              ? "true"
                              : value === false
                                ? "false"
                                : ""
                          }
                          disabled={locked}
                          onValueChange={(v) =>
                            update(
                              f.key,
                              v === "__fd_clear__" ? "" : v === "true",
                            )
                          }
                          options={[
                            ...(!f.required
                              ? [
                                  {
                                    value: "__fd_clear__",
                                    label: t("Để trống"),
                                  },
                                ]
                              : []),
                            { value: "true", label: t("Có") },
                            { value: "false", label: t("Không") },
                          ]}
                        />
                      ) : f.type === "reference" ? (
                        <Combobox
                          label={label}
                          value={String(value ?? "")}
                          disabled={locked}
                          onValueChange={(v) =>
                            update(f.key, v === "__fd_clear__" ? "" : v)
                          }
                          options={[
                            ...(!f.required
                              ? [
                                  {
                                    value: "__fd_clear__",
                                    label: t("Để trống"),
                                  },
                                ]
                              : []),
                            ...(target?.records ?? [])
                              .map((row) => ({
                                value: String(
                                  row.id ??
                                    row.code ??
                                    row.value ??
                                    row.key ??
                                    "",
                                ),
                                label: String(
                                  row.name ??
                                    row.label ??
                                    row.code ??
                                    row.id ??
                                    "—",
                                ),
                              }))
                              .filter((option) => !!option.value),
                          ]}
                        />
                      ) : f.type === "date" ? (
                        <DatePicker
                          label={label}
                          disabled={locked}
                          value={String(value ?? "")}
                          onValueChange={(v) =>
                            update(f.key, v === "__fd_clear__" ? "" : v)
                          }
                        />
                      ) : (
                        <Input
                          disabled={locked}
                          inputMode={
                            f.type === "number" ? "decimal" : undefined
                          }
                          value={String(value ?? "")}
                          onChange={(e) => update(f.key, e.target.value)}
                        />
                      )}
                    </Field>
                  );
                })
              )}
              {failed && (
                <div role="alert">
                  <Notice tone="danger">{t(failed)}</Notice>
                </div>
              )}
            </FieldGroup>
          </form>
        </Modal>
      )}
    </div>
  );
}
