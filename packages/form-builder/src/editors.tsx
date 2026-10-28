import { useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  Button,
  Checkbox,
  Field,
  FieldGroup,
  Input,
  Select,
  Textarea,
} from "@flowdocker/ui";
import { type FormField, type FormRule, type RuleOperator } from "./schema";
function ConditionValue({
  condition,
  fields,
  onChange,
}: {
  condition: FormRule["conditions"][number];
  fields: FormField[];
  onChange(value: string | number | boolean): void;
}) {
  const { t, locale } = useI18n();
  const source = fields.find((field) => field.key === condition.field);
  if (source?.type === "checkbox")
    return (
      <Select
        label={t("Giá trị so sánh")}
        value={String(condition.value ?? false)}
        options={[
          { value: "true", label: t("Có") },
          { value: "false", label: t("Không") },
        ]}
        onValueChange={(value) => onChange(value === "true")}
      />
    );
  if (source?.options.length)
    return (
      <Select
        label={t("Giá trị so sánh")}
        value={String(condition.value ?? "")}
        options={source.options.map((option) => ({
          value: option.value,
          label: option.label[locale],
        }))}
        onValueChange={onChange}
      />
    );
  const numeric = ["number", "currency"].includes(source?.type ?? "");
  return (
    <Input
      type={numeric ? "number" : "text"}
      value={String(condition.value ?? "")}
      onChange={(event) =>
        onChange(
          numeric && event.target.value.trim()
            ? Number(event.target.value)
            : event.target.value,
        )
      }
    />
  );
}
export function OptionsEditor({
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
export function RuleEditor({
  label,
  rule,
  fields,
  onChange,
}: {
  label: string;
  rule?: FormRule;
  fields: FormField[];
  onChange(rule: FormRule | undefined): void;
}) {
  const { t, locale } = useI18n();
  const operators: Record<RuleOperator, string> = {
    eq: "Bằng",
    ne: "Khác",
    gt: "Lớn hơn",
    gte: "Lớn hơn hoặc bằng",
    lt: "Nhỏ hơn",
    lte: "Nhỏ hơn hoặc bằng",
    empty: "Trống",
    notEmpty: "Không trống",
    contains: "Chứa",
  };
  return (
    <section className="fd-rule-editor">
      <h3>{label}</h3>
      {rule && (
        <>
          <Select
            label={t("Kết hợp điều kiện")}
            value={rule.mode}
            options={[
              { value: "all", label: t("Tất cả điều kiện") },
              { value: "any", label: t("Một trong các điều kiện") },
            ]}
            onValueChange={(mode) =>
              onChange({ ...rule, mode: mode as "all" | "any" })
            }
          />
          {rule.conditions.map((condition, index) => (
            <FieldGroup key={index} className="fd-rule-condition">
              <Field label={t("Trường điều kiện")}>
                <Select
                  label={t("Trường điều kiện")}
                  value={condition.field}
                  options={fields.map((field) => ({
                    value: field.key,
                    label: `${field.label[locale]} (${field.key})`,
                  }))}
                  onValueChange={(field) =>
                    onChange({
                      ...rule,
                      conditions: rule.conditions.map((item, position) =>
                        position === index ? { ...item, field } : item,
                      ),
                    })
                  }
                />
              </Field>
              <Field label={t("Phép so sánh")}>
                <Select
                  label={t("Phép so sánh")}
                  value={condition.operator}
                  options={Object.entries(operators).map(([value, label]) => ({
                    value,
                    label: t(label),
                  }))}
                  onValueChange={(operator) =>
                    onChange({
                      ...rule,
                      conditions: rule.conditions.map((item, position) =>
                        position === index
                          ? { ...item, operator: operator as RuleOperator }
                          : item,
                      ),
                    })
                  }
                />
              </Field>
              {!["empty", "notEmpty"].includes(condition.operator) && (
                <Field label={t("Giá trị so sánh")}>
                  <ConditionValue
                    condition={condition}
                    fields={fields}
                    onChange={(value) => {
                      onChange({
                        ...rule,
                        conditions: rule.conditions.map((item, position) =>
                          position === index ? { ...item, value } : item,
                        ),
                      });
                    }}
                  />
                </Field>
              )}
              <Button
                type="button"
                onClick={() =>
                  onChange(
                    rule.conditions.length === 1
                      ? undefined
                      : {
                          ...rule,
                          conditions: rule.conditions.filter(
                            (_, position) => position !== index,
                          ),
                        },
                  )
                }
              >
                {t("Xóa điều kiện")}
              </Button>
            </FieldGroup>
          ))}
        </>
      )}
      <Button
        type="button"
        disabled={!fields.length || (rule?.conditions.length ?? 0) >= 20}
        onClick={() =>
          onChange({
            mode: rule?.mode ?? "all",
            conditions: [
              ...(rule?.conditions ?? []),
              { field: fields[0].key, operator: "notEmpty" },
            ],
          })
        }
      >
        {t("Thêm điều kiện")}
      </Button>
    </section>
  );
}
export function AdvancedProperties({
  section = "all",
  field,
  fields,
  patch,
}: {
  section?: string;
  field: FormField;
  fields: FormField[];
  patch(value: Partial<FormField>): void;
}) {
  const { t } = useI18n();
  const numberInput = (
    key:
      | "min"
      | "max"
      | "minLength"
      | "maxLength"
      | "minRows"
      | "maxRows"
      | "maxFileSize"
      | "maxFiles",
    label: string,
  ) => (
    <Field label={t(label)}>
      <Input
        type="number"
        value={field[key] ?? ""}
        onChange={(event) =>
          patch({
            [key]:
              event.target.value === ""
                ? undefined
                : Number(event.target.value),
          })
        }
      />
    </Field>
  );
  return (
    <FieldGroup>
      {(section === "all" ||
        section === "appearance" ||
        section === "general") && (
        <>
          <Field label={t("Gợi ý tiếng Việt")}>
            <Textarea
              value={field.help?.vi ?? ""}
              onChange={(event) =>
                patch({
                  help: { vi: event.target.value, en: field.help?.en ?? "" },
                })
              }
            />
          </Field>
          <Field label={t("Gợi ý tiếng Anh")}>
            <Textarea
              value={field.help?.en ?? ""}
              onChange={(event) =>
                patch({
                  help: { en: event.target.value, vi: field.help?.vi ?? "" },
                })
              }
            />
          </Field>
          <Field label={t("Placeholder tiếng Việt")}>
            <Input
              value={field.placeholder?.vi ?? ""}
              onChange={(event) =>
                patch({
                  placeholder: {
                    vi: event.target.value,
                    en: field.placeholder?.en ?? "",
                  },
                })
              }
            />
          </Field>
          <Field label={t("Placeholder tiếng Anh")}>
            <Input
              value={field.placeholder?.en ?? ""}
              onChange={(event) =>
                patch({
                  placeholder: {
                    en: event.target.value,
                    vi: field.placeholder?.vi ?? "",
                  },
                })
              }
            />
          </Field>
        </>
      )}
      {(section === "all" || section === "data" || section === "general") && (
        <>
          <Field label={t("Giá trị mặc định")}>
            <Input
              value={
                typeof field.defaultValue === "string" ||
                typeof field.defaultValue === "number" ||
                typeof field.defaultValue === "boolean"
                  ? String(field.defaultValue)
                  : ""
              }
              onChange={(event) =>
                patch({
                  defaultValue:
                    field.type === "checkbox"
                      ? event.target.value === "true"
                      : event.target.value,
                })
              }
            />
          </Field>
          {field.type === "button" && (
            <Field label={t("Hành động nút")}>
              <Select
                label={t("Hành động nút")}
                value={field.buttonAction ?? "submit"}
                options={[
                  { value: "submit", label: t("Gửi biểu mẫu") },
                  { value: "reset", label: t("Xóa dữ liệu thử") },
                ]}
                onValueChange={(value) =>
                  patch({ buttonAction: value as "submit" | "reset" })
                }
              />
            </Field>
          )}
          {field.type === "alert" && (
            <Field label={t("Mức thông báo")}>
              <Select
                label={t("Mức thông báo")}
                value={field.tone ?? "info"}
                options={[
                  { value: "info", label: t("Thông tin") },
                  { value: "warning", label: t("Cảnh báo") },
                  { value: "danger", label: t("Lỗi") },
                  { value: "success", label: t("Thành công") },
                ]}
                onValueChange={(value) =>
                  patch({ tone: value as FormField["tone"] })
                }
              />
            </Field>
          )}
        </>
      )}
      {(section === "all" || section === "appearance") && (
        <>
          {["columns", "table"].includes(field.type) && (
            <Field label={t("Số cột")}>
              <Select
                label={t("Số cột")}
                value={String(field.columns ?? 2)}
                options={[1, 2, 3].map((number) => ({
                  value: String(number),
                  label: String(number),
                }))}
                onValueChange={(value) =>
                  patch({ columns: Number(value) as 1 | 2 | 3 })
                }
              />
            </Field>
          )}
        </>
      )}
      {(section === "all" || section === "validation") && (
        <>
          <Field label={t("Chỉ đọc")}>
            <Checkbox
              checked={!!field.readOnly}
              onCheckedChange={(checked) =>
                patch({ readOnly: checked === true })
              }
            />
          </Field>
          <Field label={t("Vô hiệu hóa")}>
            <Checkbox
              checked={!!field.disabled}
              onCheckedChange={(checked) =>
                patch({ disabled: checked === true })
              }
            />
          </Field>
        </>
      )}
      {(section === "all" || section === "validation") && (
        <>
          {["number", "currency"].includes(field.type) && (
            <>
              {numberInput("min", "Giá trị nhỏ nhất")}
              {numberInput("max", "Giá trị lớn nhất")}
              <Field label={t("Chỉ số nguyên")}>
                <Checkbox
                  checked={!!field.integer}
                  onCheckedChange={(checked) =>
                    patch({ integer: checked === true })
                  }
                />
              </Field>
            </>
          )}
          {![
            "section",
            "columns",
            "tabs",
            "repeat",
            "checkbox",
            "file",
            "signature",
          ].includes(field.type) && (
            <>
              {numberInput("minLength", "Độ dài tối thiểu")}
              {numberInput("maxLength", "Độ dài tối đa")}
            </>
          )}
          {field.type === "currency" && (
            <Field label={t("Mã tiền tệ ISO")}>
              <Input
                value={field.currency ?? "VND"}
                onChange={(event) => patch({ currency: event.target.value })}
              />
            </Field>
          )}
          {field.type === "repeat" && (
            <>
              {numberInput("minRows", "Số dòng tối thiểu")}
              {numberInput("maxRows", "Số dòng tối đa")}
              <Field label={t("Mã trường duy nhất trong mỗi dòng")}>
                <Input
                  value={field.uniqueBy ?? ""}
                  onChange={(event) =>
                    patch({ uniqueBy: event.target.value || undefined })
                  }
                />
              </Field>
            </>
          )}
          {field.type === "file" && (
            <>
              <Field
                label={t("Định dạng tệp cho phép")}
                hint={t("Ví dụ: .pdf,image/*")}
              >
                <Input
                  value={field.accept ?? ""}
                  onChange={(event) => patch({ accept: event.target.value })}
                />
              </Field>
              {numberInput("maxFileSize", "Dung lượng tối đa mỗi tệp (byte)")}
              {numberInput("maxFiles", "Số tệp tối đa")}
            </>
          )}
        </>
      )}
      {(section === "all" || section === "logic") && (
        <>
          <RuleEditor
            label={t("Hiển thị khi")}
            rule={field.visibleWhen}
            fields={fields}
            onChange={(visibleWhen) => patch({ visibleWhen })}
          />
          <RuleEditor
            label={t("Bắt buộc khi")}
            rule={field.requiredWhen}
            fields={fields}
            onChange={(requiredWhen) => patch({ requiredWhen })}
          />
          <RuleEditor
            label={t("Vô hiệu hóa khi")}
            rule={field.disabledWhen}
            fields={fields}
            onChange={(disabledWhen) => patch({ disabledWhen })}
          />
          <Field label={t("Trường để so sánh chéo")}>
            <Select
              label={t("Trường để so sánh chéo")}
              value={field.compare?.field ?? "__none__"}
              options={[
                { value: "__none__", label: t("Không dùng") },
                ...fields.map((item) => ({ value: item.key, label: item.key })),
              ]}
              onValueChange={(value) =>
                patch({
                  compare:
                    value === "__none__"
                      ? undefined
                      : { field: value, operator: "gte" },
                })
              }
            />
          </Field>
          {field.compare && (
            <Field label={t("Phép so sánh chéo")}>
              <Select
                label={t("Phép so sánh chéo")}
                value={field.compare.operator}
                options={[
                  { value: "eq", label: t("Bằng") },
                  { value: "gte", label: t("Lớn hơn hoặc bằng") },
                  { value: "lte", label: t("Nhỏ hơn hoặc bằng") },
                ]}
                onValueChange={(operator) =>
                  patch({
                    compare: {
                      ...field.compare!,
                      operator: operator as "eq" | "gte" | "lte",
                    },
                  })
                }
              />
            </Field>
          )}
          {["number", "currency"].includes(field.type) && (
            <>
              <Field label={t("Phép tính")}>
                <Select
                  label={t("Phép tính")}
                  value={field.calculation?.operator ?? "__none__"}
                  options={[
                    { value: "__none__", label: t("Không dùng") },
                    ...[
                      "add",
                      "subtract",
                      "multiply",
                      "divide",
                      "sum",
                      "average",
                      "count",
                      "min",
                      "max",
                    ].map((value) => ({ value, label: t(`calc.${value}`) })),
                  ]}
                  onValueChange={(value) =>
                    patch({
                      calculation:
                        value === "__none__"
                          ? undefined
                          : {
                              operator: value as NonNullable<
                                FormField["calculation"]
                              >["operator"],
                              fields: field.calculation?.fields ?? [],
                              precision: 2,
                            },
                    })
                  }
                />
              </Field>
              {field.calculation && (
                <>
                  <Field
                    label={t("Các mã trường đầu vào")}
                    hint={t(
                      "Phân cách bằng dấu phẩy; tổng dòng lặp dùng lines.amount.",
                    )}
                  >
                    <Input
                      value={field.calculation.fields.join(",")}
                      onChange={(event) =>
                        patch({
                          calculation: {
                            ...field.calculation!,
                            fields: event.target.value
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label={t("Số chữ số thập phân")}>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      value={field.calculation.precision ?? 2}
                      onChange={(event) =>
                        patch({
                          calculation: {
                            ...field.calculation!,
                            precision: Number(event.target.value),
                          },
                        })
                      }
                    />
                  </Field>
                </>
              )}
            </>
          )}
        </>
      )}
      {(section === "all" || section === "data") && (
        <>
          {["select", "radio", "multiselect", "checkboxes"].includes(
            field.type,
          ) && (
            <>
              <Field
                label={t("Mã nguồn lựa chọn")}
                hint={t(
                  "Ứng dụng chủ đăng ký provider; schema không chứa URL hay token.",
                )}
              >
                <Input
                  value={field.dataSource?.provider ?? ""}
                  onChange={(event) =>
                    patch({
                      dataSource: event.target.value
                        ? {
                            provider: event.target.value,
                            dependsOn: field.dataSource?.dependsOn,
                          }
                        : undefined,
                    })
                  }
                />
              </Field>
              {field.dataSource && (
                <Field label={t("Phụ thuộc mã trường")}>
                  <Input
                    value={field.dataSource.dependsOn ?? ""}
                    onChange={(event) =>
                      patch({
                        dataSource: {
                          ...field.dataSource!,
                          dependsOn: event.target.value || undefined,
                        },
                      })
                    }
                  />
                </Field>
              )}
            </>
          )}
        </>
      )}
      {(section === "all" || section === "advanced") && (
        <>
          <Field label={t("Mã bộ hiển thị tùy chỉnh")}>
            <Input
              value={field.customRenderer ?? ""}
              onChange={(event) =>
                patch({ customRenderer: event.target.value || undefined })
              }
            />
          </Field>
        </>
      )}
    </FieldGroup>
  );
}
