import { useI18n } from "@flowdocker/i18n";
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import {
  Button,
  Checkbox,
  Combobox,
  Field,
  FieldGroup,
  Input,
  Notice,
  Select,
} from "@flowdocker/ui";
import { AdvancedProperties, OptionsEditor } from "../editors";
import { FieldConfigurationBadges } from "./field-configuration-badges";
import type { FormDataSource } from "./data-source-editor";
import type { FormRendererProps } from "../runtime";
import type { PreviewValues } from "../schema";
import {
  choiceTypes,
  containerTypes,
  fieldTypeLabels,
  flattenFields,
  formFieldTypes,
  type FormField,
  type FormFieldType,
  type FormIssue,
} from "../schema";

export type InspectorSection =
  "basic" | "validation" | "logic" | "data" | "appearance" | "advanced";
export interface FieldInspectorProps {
  providers?: FormRendererProps["providers"];
  sourceDefaults?: PreviewValues;
  dataSources?: readonly FormDataSource[];
  field: FormField;
  section: InspectorSection;
  onSectionChange(section: InspectorSection): void;
  patch(changes: Partial<FormField>): void;
  references: FormField[];
  containers: FormField[];
  parent: string;
  onParentChange(id: string): void;
  onMove(offset: number): void;
  onClone(): void;
  onDelete(): void;
  onError(message: string): void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canClone: boolean;
  readOnly?: boolean;
  issues: FormIssue[];
  historyRevision: number;
  width: number;
  onWidthChange(width: number): void;
  onSelectField?(id: string): void;
  onAddColumn?(type: FormFieldType): void;
}
/** Contextual configuration only; persistence and history are owned by the host designer. */
export function FieldInspector({
  providers,
  sourceDefaults,
  dataSources,
  field,
  section,
  onSectionChange,
  patch,
  references,
  containers,
  parent,
  onParentChange,
  onMove,
  onClone,
  onDelete,
  onError,
  canMoveUp,
  canMoveDown,
  canClone,
  readOnly,
  issues,
  historyRevision,
  width,
  onWidthChange,
  onSelectField,
  onAddColumn,
}: FieldInspectorProps) {
  const { t, locale } = useI18n();
  const required = (
    <Field label={t("Bắt buộc")}>
      <Checkbox
        checked={field.required}
        onCheckedChange={(value) => patch({ required: value === true })}
      />
    </Field>
  );
  return (
    <>
      <header className="fd-field-inspector-header">
        <span>{t("Thuộc tính trường")}</span>
        <h2>{field.label[locale] || t("Biểu mẫu chưa đặt tên")}</h2>
        <small>
          {t(fieldTypeLabels[field.type])} · {field.key}
        </small>
        <FieldConfigurationBadges field={field} onNavigate={onSectionChange} />
      </header>
      <Select
        label={t("Nhóm thuộc tính")}
        value={section}
        onValueChange={(next) => onSectionChange(next as InspectorSection)}
        options={[
          { value: "basic", label: t("Cơ bản") },
          { value: "validation", label: t("Kiểm tra dữ liệu") },
          { value: "logic", label: t("Điều kiện và tính toán") },
          { value: "data", label: t("Dữ liệu") },
          { value: "appearance", label: t("Hiển thị") },
          { value: "advanced", label: t("Nâng cao") },
        ]}
      />
      {field.type === "repeat" && (
        <section
          className="fd-repeat-settings"
          aria-label={t("Cài đặt bảng dòng lặp")}
        >
          <h3>{t("Cài đặt bảng dòng lặp")}</h3>
          <FieldGroup>
            <Field
              label={t("Tự động chừa dòng trống")}
              hint={t(
                "Dòng trống gợi ý không tính vào dữ liệu. Dòng bị xóa hết nội dung sẽ bỏ khi rời dòng, trừ số dòng tối thiểu.",
              )}
            >
              <Checkbox
                disabled={readOnly}
                checked={!!field.autoRows}
                onCheckedChange={(value) => patch({ autoRows: value === true })}
              />
            </Field>
            <Field label={t("Số dòng tối thiểu")}>
              <Input
                type="number"
                min={0}
                max={100}
                disabled={readOnly}
                value={field.minRows ?? ""}
                onChange={(event) =>
                  patch({
                    minRows:
                      event.target.value === ""
                        ? undefined
                        : Number(event.target.value),
                  })
                }
              />
            </Field>
            <Field label={t("Số dòng tối đa")}>
              <Input
                type="number"
                min={0}
                max={100}
                disabled={readOnly}
                value={field.maxRows ?? ""}
                onChange={(event) =>
                  patch({
                    maxRows:
                      event.target.value === ""
                        ? undefined
                        : Number(event.target.value),
                  })
                }
              />
            </Field>
            {onAddColumn && (
              <Field label={t("Thêm cột vào bảng")}>
                <Select
                  label={t("Thêm cột vào bảng")}
                  value=""
                  disabled={readOnly}
                  options={[
                    "text",
                    "textarea",
                    "number",
                    "currency",
                    "select",
                    "date",
                    "checkbox",
                    "email",
                  ].map((type) => ({
                    value: type,
                    label: t(fieldTypeLabels[type as FormFieldType]),
                  }))}
                  onValueChange={(type) => onAddColumn(type as FormFieldType)}
                />
              </Field>
            )}
          </FieldGroup>
          <p>{t("Chọn cột để sửa nhãn, kiểu dữ liệu và kiểm tra dữ liệu.")}</p>
          {(field.children ?? []).map((child, index, children) => (
            <div className="fd-repeat-column-setting" key={child.id}>
              <Button
                disabled={!onSelectField}
                onClick={() => onSelectField?.(child.id)}
              >
                {child.label[locale]}
              </Button>
              <Button
                aria-label={t("Lên trên")}
                disabled={readOnly || index === 0}
                onClick={() => {
                  const next = [...children];
                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];
                  patch({ children: next });
                }}
              >
                <ArrowUp />
              </Button>
              <Button
                aria-label={t("Xuống dưới")}
                disabled={readOnly || index === children.length - 1}
                onClick={() => {
                  const next = [...children];
                  [next[index + 1], next[index]] = [
                    next[index],
                    next[index + 1],
                  ];
                  patch({ children: next });
                }}
              >
                <ArrowDown />
              </Button>
            </div>
          ))}
        </section>
      )}
      <div className="fd-inspector-layout">
        <div className="fd-inspector-layout-heading">
          <strong>{t("Vị trí trường")}</strong>
          <span>{t("Sắp xếp trường trong canvas")}</span>
        </div>
        <Field label={t("Đặt trong nhóm")}>
          <Combobox
            label={t("Đặt trong nhóm")}
            value={parent || "__root__"}
            searchPlaceholder={t("Tìm nhóm...")}
            emptyLabel={t("Không tìm thấy nhóm")}
            options={[
              { value: "__root__", label: t("Không thuộc nhóm") },
              ...containers
                .filter(
                  (item) =>
                    !flattenFields([field]).some(
                      (child) => child.id === item.id,
                    ),
                )
                .map((item) => ({
                  value: item.id,
                  label: item.label[locale],
                })),
            ]}
            disabled={readOnly}
            onValueChange={(value) =>
              onParentChange(value === "__root__" ? "" : value)
            }
          />
        </Field>
        {["columns", "table"].includes(field.type) && (
          <>
            {field.type === "columns" && (
              <Field
                label={t("Hiển thị tiêu đề bố cục")}
                hint={t("Ẩn tiêu đề để bố cục gọn hơn trên canvas")}
              >
                <Checkbox
                  checked={field.hideLabel === false}
                  onCheckedChange={(value) =>
                    patch({ hideLabel: value !== true })
                  }
                />
              </Field>
            )}
            <Field label={t("Trường trên mỗi hàng")}>
              <Select
                label={t("Trường trên mỗi hàng")}
                value={String(field.columns ?? 2)}
                options={[1, 2, 3].map((number) => ({
                  value: String(number),
                  label: t("{{count}} trường", { count: number }),
                }))}
                onValueChange={(value) =>
                  patch({ columns: Number(value) as 1 | 2 | 3 })
                }
              />
            </Field>
          </>
        )}
        <div className="fd-inspector-layout-actions">
          <Button
            type="button"
            aria-label={t("Lên trên")}
            disabled={readOnly || !canMoveUp}
            onClick={() => onMove(-1)}
          >
            <ArrowUp data-icon="inline-start" /> {t("Lên trên")}
          </Button>
          <Button
            type="button"
            aria-label={t("Xuống dưới")}
            disabled={readOnly || !canMoveDown}
            onClick={() => onMove(1)}
          >
            <ArrowDown data-icon="inline-start" /> {t("Xuống dưới")}
          </Button>
        </div>
      </div>
      <fieldset disabled={readOnly} className="fd-form-property-fieldset">
        {section === "basic" ? (
          <FieldGroup>
            <Field label={t("Nhãn tiếng Việt")}>
              <Input
                value={field.label.vi}
                onChange={(e) =>
                  patch({ label: { ...field.label, vi: e.target.value } })
                }
              />
            </Field>
            <Field label={t("Nhãn tiếng Anh")}>
              <Input
                value={field.label.en}
                onChange={(e) =>
                  patch({ label: { ...field.label, en: e.target.value } })
                }
              />
            </Field>
            {required}
            {field.type === "person" && (
              <Field label={t("Cho phép chọn nhiều người")}>
                <Checkbox
                  checked={!!field.multiple}
                  onCheckedChange={(next) =>
                    patch({ multiple: next === true, defaultValue: undefined })
                  }
                />
              </Field>
            )}
            <Field label={t("Mã trường")}>
              <Input
                value={field.key}
                title={t(
                  "Chữ thường, số và gạch dưới; mã không đổi theo ngôn ngữ.",
                )}
                onChange={(e) => patch({ key: e.target.value })}
              />
            </Field>
            <Field label={t("Kiểu dữ liệu")}>
              <Select
                label={t("Kiểu dữ liệu")}
                value={field.type}
                options={formFieldTypes.map((type) => ({
                  value: type,
                  label: t(fieldTypeLabels[type]),
                }))}
                onValueChange={(next) => {
                  const type = next as FormFieldType;
                  if (
                    field.children?.length &&
                    !containerTypes.includes(type)
                  ) {
                    onError(
                      "Di chuyển hoặc xóa các trường con trước khi đổi sang kiểu đơn.",
                    );
                    return;
                  }
                  patch({
                    type,
                    ...(type !== "person"
                      ? { defaultValueSource: undefined }
                      : {}),
                    ...(type === "person"
                      ? {
                          options: [],
                          dataSource: field.dataSource ?? {
                            provider: "organization.people",
                          },
                        }
                      : {}),
                    children: containerTypes.includes(type)
                      ? (field.children ?? [])
                      : undefined,
                  });
                }}
              />
            </Field>
            <AdvancedProperties
              providers={providers}
              sourceDefaults={sourceDefaults}
              field={field}
              fields={references}
              patch={patch}
              section="general"
            />
          </FieldGroup>
        ) : (
          <FieldGroup>
            {section === "validation" && required}
            <AdvancedProperties
              providers={providers}
              sourceDefaults={sourceDefaults}
              dataSources={dataSources}
              key={field.id}
              field={field}
              fields={references}
              patch={patch}
              section={section}
            />
            {section === "data" &&
              choiceTypes.includes(field.type) &&
              !field.dataSource && (
                <OptionsEditor
                  key={`${field.id}-${historyRevision}`}
                  field={field}
                  onChange={(options) => patch({ options })}
                />
              )}
          </FieldGroup>
        )}
      </fieldset>
      <div className="fd-field-inspector-actions">
        <Button
          aria-label={t("Lên trên")}
          title={t("Lên trên")}
          disabled={readOnly || !canMoveUp}
          onClick={() => onMove(-1)}
        >
          <ArrowUp />
        </Button>
        <Button
          aria-label={t("Xuống dưới")}
          title={t("Xuống dưới")}
          disabled={readOnly || !canMoveDown}
          onClick={() => onMove(1)}
        >
          <ArrowDown />
        </Button>
        <Button
          aria-label={t("Nhân bản trường")}
          title={t("Nhân bản trường")}
          disabled={readOnly || !canClone}
          onClick={onClone}
        >
          <Copy />
        </Button>
        <Button variant="danger" disabled={readOnly} onClick={onDelete}>
          <Trash2 />
          {t("Xóa trường")}
        </Button>
      </div>
      <details className="fd-inspector-size">
        <summary>{t("Điều chỉnh độ rộng bảng")}</summary>
        <input
          type="range"
          min={260}
          max={380}
          step={10}
          value={width}
          aria-label={t("Độ rộng thuộc tính")}
          onChange={(e) => onWidthChange(Number(e.target.value))}
        />
      </details>
      {issues
        .filter((issue) => issue.fieldId === field.id)
        .map((issue, i) => (
          <Notice key={i} tone="danger">
            {t(issue.message, issue.params)}
          </Notice>
        ))}
    </>
  );
}
