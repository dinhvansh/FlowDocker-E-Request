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
}
/** Contextual configuration only; persistence and history are owned by the host designer. */
export function FieldInspector({
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
      <div className="fd-inspector-layout">
        <div className="fd-inspector-layout-heading">
          <strong>{t("Vị trí bố cục")}</strong>
          <span>{t("Sắp xếp trường trong canvas")}</span>
        </div>
        <Field label={t("Đặt trong nhóm")}>
          <Combobox
            label={t("Đặt trong nhóm")}
            value={parent || "__root__"}
            searchPlaceholder={t("Tìm nhóm...")}
            emptyLabel={t("Không tìm thấy nhóm")}
            options={[
              { value: "__root__", label: t("Cấp ngoài cùng") },
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
                    children: containerTypes.includes(type)
                      ? (field.children ?? [])
                      : undefined,
                  });
                }}
              />
            </Field>
            <AdvancedProperties
              field={field}
              fields={references}
              patch={patch}
              section="general"
            />
          </FieldGroup>
        ) : (
          <>
            {section === "validation" && required}
            {section === "data" && choiceTypes.includes(field.type) && (
              <OptionsEditor
                key={`${field.id}-${historyRevision}`}
                field={field}
                onChange={(options) => patch({ options })}
              />
            )}
            <AdvancedProperties
              key={field.id}
              field={field}
              fields={references}
              patch={patch}
              section={section}
            />
          </>
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
