import { useI18n } from "@flowdocker/i18n";
import { Field, Select } from "@flowdocker/ui";
import type { BilingualText, FormField } from "../schema";

/** Host-owned display metadata. Only IDs with registered runtime providers are offered. */
export interface FormDataSource {
  id: string;
  /** Optional host metadata; person fields exclude sources of other records. */
  kind?: "person" | "record";
  label: BilingualText;
  description: BilingualText;
}

export function DataSourceEditor({
  field,
  sources = [],
  patch,
}: {
  field: FormField;
  sources?: readonly FormDataSource[];
  patch(value: Partial<FormField>): void;
}) {
  const { t, locale } = useI18n();
  const compatibleSources = sources.filter(
    (source) => field.type !== "person" || source.kind !== "record",
  );
  const provider = field.dataSource?.provider;
  const selected = compatibleSources.find((source) => source.id === provider);
  const unavailable = !!provider && !selected;
  const incompatible = sources.some(
    (source) => source.id === provider && !compatibleSources.includes(source),
  );
  const description = incompatible
    ? t(
        "Nguồn này không chứa danh sách người. Chọn Người trong tổ chức hoặc nhập danh sách người thủ công.",
      )
    : unavailable
      ? t(
          "Nguồn {{source}} chưa có trong ứng dụng này. Chọn nguồn khác hoặc dùng danh sách nhập tay.",
          { source: provider },
        )
      : (selected?.description[locale] ??
        t("Tự nhập các lựa chọn bên dưới; không lấy dữ liệu từ nguồn khác."));
  return (
    <Field label={t("Nguồn dữ liệu")} hint={description}>
      <Select
        label={t("Nguồn dữ liệu")}
        value={provider ? `source:${provider}` : "manual"}
        options={[
          { value: "manual", label: t("Danh sách nhập tay") },
          ...compatibleSources.map((source) => ({
            value: `source:${source.id}`,
            label: source.label[locale],
          })),
          ...(unavailable
            ? [
                {
                  value: `source:${provider}`,
                  label: t("Nguồn không khả dụng: {{source}}", {
                    source: provider,
                  }),
                  disabled: true,
                },
              ]
            : []),
        ]}
        onValueChange={(value) => {
          if (value === "manual") patch({ dataSource: undefined });
          else {
            const source = compatibleSources.find(
              (item) => `source:${item.id}` === value,
            );
            if (source && source.id !== provider)
              patch({ dataSource: { provider: source.id } });
          }
        }}
      />
    </Field>
  );
}
