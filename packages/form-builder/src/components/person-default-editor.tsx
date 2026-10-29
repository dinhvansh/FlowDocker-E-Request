import { useI18n } from "@flowdocker/i18n";
import {
  Button,
  Field,
  FieldGroup,
  Notice,
  PeoplePicker,
} from "@flowdocker/ui";
import type { FormField, FormValue } from "../schema";
import type { FormRendererProps } from "../runtime";
import { useChoices } from "../use-choices";

/** Uses the same injected choice adapter as the runtime; never queries a directory directly. */
export function PersonDefaultEditor({
  field,
  providers,
  dependency,
  patch,
}: {
  field: FormField;
  providers?: FormRendererProps["providers"];
  dependency?: FormValue;
  patch(value: Partial<FormField>): void;
}) {
  const { t, locale } = useI18n();
  const source = field.dataSource;
  const choice = useChoices(
    field,
    dependency,
    source ? providers?.[source.provider] : undefined,
  );
  const selected = Array.isArray(field.defaultValue)
    ? field.defaultValue.filter(
        (value): value is string => typeof value === "string",
      )
    : typeof field.defaultValue === "string" && field.defaultValue
      ? [field.defaultValue]
      : [];
  const missingSelection =
    choice.status === "ready" &&
    selected.some(
      (id) => !choice.options.some((option) => option.value === id),
    );
  return (
    <FieldGroup>
      <Field
        label={t("Người mặc định")}
        hint={t(
          "Tìm và chọn người từ nguồn dữ liệu của trường. Để trống nếu không cần mặc định.",
        )}
      >
        <PeoplePicker
          label={t("Người mặc định")}
          value={selected}
          multiple={field.multiple}
          disabled={choice.status !== "ready"}
          options={[
            ...choice.options.map((option) => ({
              value: option.value,
              label: option.label[locale],
              description: option.description?.[locale],
            })),
            ...selected
              .filter(
                (id) => !choice.options.some((option) => option.value === id),
              )
              .map((id) => ({
                value: id,
                label: t("Người không còn khả dụng"),
                disabled: true,
              })),
          ]}
          onChange={(ids) =>
            patch({
              defaultValue: field.multiple
                ? ids.length
                  ? ids
                  : undefined
                : ids[0],
            })
          }
        />
      </Field>
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
      {source?.dependsOn && (dependency === undefined || dependency === "") && (
        <Notice tone="info">
          {t(
            "Nguồn này phụ thuộc trường {{field}}. Hãy đặt giá trị mặc định cho trường đó để chọn người.",
            { field: source.dependsOn },
          )}
        </Notice>
      )}
      {missingSelection && (
        <Notice tone="warning">
          {t(
            "Một số người mặc định không còn trong nguồn. Chọn lại hoặc bỏ mặc định.",
          )}
        </Notice>
      )}
      {(choice.status === "error" ||
        (choice.status === "ready" && !!source && !choice.options.length)) && (
        <Button type="button" onClick={choice.reload}>
          {t("Tải lại danh sách")}
        </Button>
      )}
      {!!selected.length && (choice.status !== "ready" || missingSelection) && (
        <Button
          type="button"
          onClick={() => patch({ defaultValue: undefined })}
        >
          {t("Bỏ mặc định")}
        </Button>
      )}
    </FieldGroup>
  );
}
