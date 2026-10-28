import { useId, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  Field,
  FieldGroup,
  Input,
  Notice,
  Select,
  Textarea,
} from "@flowdocker/ui";
import {
  formFieldTypes,
  validateFormDefinition,
  validatePreview,
  type FormDefinition,
  type FormField,
  type FormFieldType,
  type FormIssue,
  type PreviewValues,
} from "./schema";
export * from "./schema";

const typeLabels: Record<FormFieldType, string> = {
  text: "Văn bản ngắn",
  textarea: "Văn bản dài",
  number: "Số",
  date: "Ngày",
  checkbox: "Ô xác nhận",
  select: "Danh sách chọn",
};
function OptionsEditor({
  field,
  onChange,
}: {
  field: FormField;
  onChange(options: FormField["options"]): void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState(() =>
    field.options
      .map((option) => `${option.value}|${option.label.vi}|${option.label.en}`)
      .join("\n"),
  );
  return (
    <Field
      label={t("Lựa chọn song ngữ")}
      hint={t("Mỗi dòng: mã | nhãn Việt | nhãn Anh. Tối đa 50 dòng.")}
    >
      <Textarea
        rows={5}
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          onChange(
            next.split("\n").map((line) => {
              const [value = "", vi = "", en = ""] = line.split("|");
              return {
                value: value.trim(),
                label: { vi: vi.trim(), en: en.trim() },
              };
            }),
          );
        }}
      />
    </Field>
  );
}
export interface FormDesignerProps {
  definition: FormDefinition;
  onChange(definition: FormDefinition): void;
}
export function FormDesigner({ definition, onChange }: FormDesignerProps) {
  const { t, locale } = useI18n();
  const [selectedId, setSelectedId] = useState("");
  const field =
    definition.fields.find((item) => item.id === selectedId) ??
    definition.fields[0];
  const issues = validateFormDefinition(definition);
  const patch = (changes: Partial<FormField>) =>
    onChange({
      ...definition,
      fields: definition.fields.map((item) =>
        item.id === field?.id ? { ...item, ...changes } : item,
      ),
    });
  const move = (offset: number) => {
    const index = definition.fields.findIndex((item) => item.id === field?.id);
    if (
      index < 0 ||
      index + offset < 0 ||
      index + offset >= definition.fields.length
    )
      return;
    const fields = [...definition.fields];
    [fields[index], fields[index + offset]] = [
      fields[index + offset],
      fields[index],
    ];
    onChange({ ...definition, fields });
  };
  const add = () => {
    const id = crypto.randomUUID();
    let suffix = definition.fields.length + 1;
    while (definition.fields.some((item) => item.key === `field_${suffix}`))
      suffix++;
    onChange({
      ...definition,
      fields: [
        ...definition.fields,
        {
          id,
          key: `field_${suffix}`,
          label: { vi: "Trường mới", en: "New field" },
          type: "text",
          required: false,
          options: [],
        },
      ],
    });
    setSelectedId(id);
  };
  return (
    <div className="fd-form-designer">
      <section className="fd-form-schema" aria-label={t("Cấu trúc biểu mẫu")}>
        <div className="fd-section-heading">
          <h2>{t("Cấu trúc biểu mẫu")}</h2>
          <Button disabled={definition.fields.length >= 100} onClick={add}>
            <Plus data-icon="inline-start" />
            {t("Thêm trường")}
          </Button>
        </div>
        <DataTable
          rows={definition.fields}
          rowKey={(item) => item.id}
          selectedKey={field?.id}
          onRowClick={(item) => setSelectedId(item.id)}
          empty={t("Chưa có trường. Thêm trường để bắt đầu.")}
          columns={[
            {
              key: "name",
              heading: t("Nhãn trường"),
              render: (item) => (
                <>
                  <strong>{item.label[locale] || item.key}</strong>
                  <small className="fd-form-key">{item.key}</small>
                </>
              ),
            },
            {
              key: "type",
              heading: t("Kiểu dữ liệu"),
              render: (item) => t(typeLabels[item.type]),
            },
            {
              key: "required",
              heading: t("Bắt buộc"),
              render: (item) =>
                item.required ? (
                  <Badge tone="warning">{t("Bắt buộc")}</Badge>
                ) : (
                  t("Tùy chọn")
                ),
            },
          ]}
        />
      </section>
      <aside className="fd-form-properties" aria-label={t("Thuộc tính trường")}>
        {field ? (
          <>
            <h2>{t("Thuộc tính trường")}</h2>
            <FieldGroup>
              <Field
                label={t("Mã trường")}
                hint={t(
                  "Chữ thường, số và gạch dưới; mã không đổi theo ngôn ngữ.",
                )}
              >
                <Input
                  value={field.key}
                  onChange={(event) => patch({ key: event.target.value })}
                />
              </Field>
              <Field label={t("Nhãn tiếng Việt")}>
                <Input
                  value={field.label.vi}
                  onChange={(event) =>
                    patch({ label: { ...field.label, vi: event.target.value } })
                  }
                />
              </Field>
              <Field label={t("Nhãn tiếng Anh")}>
                <Input
                  value={field.label.en}
                  onChange={(event) =>
                    patch({ label: { ...field.label, en: event.target.value } })
                  }
                />
              </Field>
              <Field label={t("Kiểu dữ liệu")}>
                <Select
                  label={t("Kiểu dữ liệu")}
                  value={field.type}
                  options={formFieldTypes.map((type) => ({
                    value: type,
                    label: t(typeLabels[type]),
                  }))}
                  onValueChange={(type) =>
                    patch({ type: type as FormFieldType })
                  }
                />
              </Field>
              <Field label={t("Bắt buộc")}>
                <Checkbox
                  checked={field.required}
                  onCheckedChange={(checked) =>
                    patch({ required: checked === true })
                  }
                />
              </Field>
              {field.type === "select" && (
                <OptionsEditor
                  key={field.id}
                  field={field}
                  onChange={(options) => patch({ options })}
                />
              )}
            </FieldGroup>
            <div className="fd-form-order">
              <Button
                disabled={definition.fields[0]?.id === field.id}
                onClick={() => move(-1)}
              >
                <ArrowUp data-icon="inline-start" />
                {t("Lên trên")}
              </Button>
              <Button
                disabled={definition.fields.at(-1)?.id === field.id}
                onClick={() => move(1)}
              >
                <ArrowDown data-icon="inline-start" />
                {t("Xuống dưới")}
              </Button>
            </div>
            <Button
              variant="danger"
              onClick={() => {
                onChange({
                  ...definition,
                  fields: definition.fields.filter(
                    (item) => item.id !== field.id,
                  ),
                });
                setSelectedId("");
              }}
            >
              <Trash2 data-icon="inline-start" />
              {t("Xóa trường")}
            </Button>
            {issues
              .filter((issue) => issue.fieldId === field.id)
              .map((issue, index) => (
                <Notice key={index} tone="danger">
                  {t(issue.message, issue.params)}
                </Notice>
              ))}
          </>
        ) : (
          <EmptyState title={t("Chọn hoặc thêm một trường")} />
        )}
      </aside>
    </div>
  );
}

export interface FormPreviewProps {
  definition: FormDefinition;
  values: PreviewValues;
  onChange(values: PreviewValues): void;
}
/** Preview only: no submit callback, persistence, network or financial calculations. */
export function FormPreview({
  definition,
  values,
  onChange,
}: FormPreviewProps) {
  const { t, locale } = useI18n();
  const prefix = useId();
  const [checked, setChecked] = useState(false);
  const schemaIssues = validateFormDefinition(definition);
  const valueIssues: FormIssue[] = checked
    ? validatePreview(definition, values)
    : [];
  if (schemaIssues.length)
    return (
      <Notice tone="warning">
        {t("Sửa lỗi cấu trúc trước khi xem thử biểu mẫu.")}
      </Notice>
    );
  const setValue = (key: string, value: string | boolean) => {
    onChange({ ...values, [key]: value });
    setChecked(false);
  };
  return (
    <div className="fd-form-preview">
      <h2>{definition.title[locale]}</h2>
      <Notice>
        {t("Xem thử cục bộ. Giá trị nhập không được gửi hoặc lưu.")}
      </Notice>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setChecked(true);
        }}
      >
        <FieldGroup>
          {definition.fields.map((field) => {
            const id = `${prefix}-${field.id}`;
            const error = valueIssues.find(
              (issue) => issue.fieldId === field.id,
            );
            const label = field.label[locale];
            const value =
              typeof values[field.key] === "string"
                ? (values[field.key] as string)
                : "";
            return (
              <Field
                key={field.id}
                label={
                  field.required ? t("{{label}} (bắt buộc)", { label }) : label
                }
                error={error ? t(error.message, error.params) : undefined}
              >
                {field.type === "checkbox" ? (
                  <Checkbox
                    id={id}
                    checked={values[field.key] === true}
                    onCheckedChange={(checked) =>
                      setValue(field.key, checked === true)
                    }
                  />
                ) : field.type === "select" ? (
                  <Select
                    id={id}
                    label={label}
                    value={value}
                    options={field.options.map((option) => ({
                      value: option.value,
                      label: option.label[locale],
                    }))}
                    onValueChange={(next) => setValue(field.key, next)}
                  />
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={id}
                    value={value}
                    onChange={(event) =>
                      setValue(field.key, event.target.value)
                    }
                  />
                ) : (
                  <Input
                    id={id}
                    type={field.type === "text" ? "text" : field.type}
                    step={field.type === "number" ? "any" : undefined}
                    value={value}
                    onChange={(event) =>
                      setValue(field.key, event.target.value)
                    }
                  />
                )}
              </Field>
            );
          })}
        </FieldGroup>
        <div className="fd-form-order">
          <Button type="submit" variant="primary">
            {t("Kiểm tra dữ liệu thử")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onChange({});
              setChecked(false);
            }}
          >
            {t("Xóa dữ liệu thử")}
          </Button>
        </div>
      </form>
      {checked && (
        <Notice tone={valueIssues.length ? "warning" : "success"}>
          {valueIssues.length
            ? t("Cần sửa {{count}} lỗi trong dữ liệu thử.", {
                count: valueIssues.length,
              })
            : t("Dữ liệu thử hợp lệ trên trình duyệt; chưa gửi yêu cầu.")}
        </Notice>
      )}
    </div>
  );
}
