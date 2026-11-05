import { useI18n } from "@flowdocker/i18n";
import { Button, Combobox, Input, Notice, Select } from "@flowdocker/ui";
import type { FormField, FormRule, PreviewValues } from "../schema";
import type { FormRendererProps } from "../runtime";
import { readReference } from "../engine";
import { useChoices } from "../use-choices";

type Condition = FormRule["conditions"][number];

/** Forms adapter: host supplies authorized choices; rules keep stable scalar IDs. */
export function ConditionValueEditor({
  source,
  condition,
  providers,
  sourceDefaults,
  onChange,
}: {
  source: FormField;
  condition: Condition;
  providers?: FormRendererProps["providers"];
  sourceDefaults?: PreviewValues;
  onChange(value: Condition["value"]): void;
}) {
  const { t, locale } = useI18n();
  const dependency = source.dataSource?.dependsOn
    ? readReference(sourceDefaults ?? {}, source.dataSource.dependsOn)
    : undefined;
  const choice = useChoices(
    source,
    dependency,
    source.dataSource ? providers?.[source.dataSource.provider] : undefined,
  );
  const label = t("Giá trị so sánh");
  const value = String(condition.value ?? "");
  if (source.type === "checkbox")
    return (
      <Select
        label={label}
        value={value}
        options={[
          { value: "true", label: t("Có") },
          { value: "false", label: t("Không") },
        ]}
        onValueChange={(next) => onChange(next === "true")}
      />
    );
  if (
    source.dataSource ||
    source.options.length ||
    [
      "person",
      "select",
      "radio",
      "multiselect",
      "checkboxes",
      "survey",
    ].includes(source.type)
  ) {
    const missing =
      choice.status === "ready" &&
      value !== "" &&
      !choice.options.some((option) => option.value === value);
    return (
      <>
        <Combobox
          label={label}
          value={value}
          disabled={choice.status !== "ready"}
          aria-invalid={missing || undefined}
          options={[
            { value: "__fd_clear__", label: t("Bỏ lựa chọn") },
            ...choice.options.map((option) => ({
              value: option.value,
              label: option.label[locale],
              description: option.description?.[locale],
            })),
            ...(missing
              ? [
                  {
                    value,
                    label: `${t("Giá trị không còn trong danh sách")}: ${value}`,
                    disabled: true,
                  },
                ]
              : []),
          ]}
          onValueChange={(next) =>
            onChange(next === "__fd_clear__" ? undefined : next)
          }
        />
        {choice.status !== "ready" && (
          <Notice tone={choice.status === "loading" ? "info" : "warning"}>
            {t(
              choice.status === "loading"
                ? "Đang tải lựa chọn..."
                : choice.status === "missing"
                  ? "Chưa cấu hình nguồn lựa chọn."
                  : "Không tải được lựa chọn. Hãy thử tìm lại.",
            )}
          </Notice>
        )}
        {missing && (
          <Notice tone="warning">
            {t(
              "Giá trị so sánh đã lưu không còn trong danh sách. Hãy chọn lại.",
            )}
          </Notice>
        )}
        {source.dataSource?.dependsOn &&
          (dependency === undefined ||
            dependency === "" ||
            dependency === null) && (
            <Notice>
              {t(
                "Nguồn lựa chọn phụ thuộc {{field}}. Đặt dữ liệu thử cho trường này để tải lựa chọn.",
                { field: source.dataSource.dependsOn },
              )}
            </Notice>
          )}
        {(choice.status === "error" ||
          (choice.status === "ready" &&
            !!source.dataSource &&
            !choice.options.length)) && (
          <Button type="button" onClick={choice.reload}>
            {t("Tải lại danh sách")}
          </Button>
        )}
      </>
    );
  }
  const type =
    source.type === "datetime"
      ? "datetime-local"
      : ["date", "time", "number", "currency"].includes(source.type)
        ? source.type === "currency"
          ? "number"
          : source.type
        : "text";
  return (
    <Input
      aria-label={label}
      type={type}
      step={type === "number" ? "any" : undefined}
      value={value}
      onChange={(event) => {
        const next = event.target.value;
        onChange(
          next === ""
            ? undefined
            : source.type === "number"
              ? Number(next)
              : next,
        );
      }}
    />
  );
}
