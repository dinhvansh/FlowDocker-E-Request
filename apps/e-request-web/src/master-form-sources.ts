import type { MasterEntity } from "@flowdocker/app-contracts";
import type { DataProvider, FormDataSource } from "@flowdocker/form-builder";

/** Adapts the host's synthetic master snapshot, not an ERP or authorization connector. */
export function masterFormSources(entities: readonly MasterEntity[]): {
  sources: FormDataSource[];
  providers: Record<string, DataProvider>;
} {
  const providers: Record<string, DataProvider> = {};
  const sources = entities.map((entity): FormDataSource => {
    const id = `master.${encodeURIComponent(entity.id)}`;
    const fields = entity.fields.filter(
      (field) =>
        ["PUBLIC", "INTERNAL"].includes(field.classification) &&
        ["text", "number", "reference"].includes(field.type),
    );
    const valueField =
      fields.find((field) => field.key === "id")?.key ??
      fields.find((field) => field.key === "code")?.key;
    const labelField =
      fields.find((field) => field.key === "name")?.key ??
      fields.find((field) => field.key === "label")?.key ??
      valueField;
    providers[id] = async ({
      query,
      valueField: valueKey,
      labelField: labelKey,
      signal,
    }) => {
      if (signal.aborted) throw new Error("Aborted");
      // Validate against current metadata on every read, including previously saved mappings.
      if (
        !valueKey ||
        !labelKey ||
        !fields.some((field) => field.key === valueKey) ||
        !fields.some((field) => field.key === labelKey)
      )
        throw new Error("Unavailable catalog mapping");
      const seen = new Set<string>();
      const activeField = entity.fields.some(
        (field) => field.key === "active" && field.type === "boolean",
      );
      const choices = entity.records.map((record) => {
        const value = Object.hasOwn(record, valueKey)
          ? record[valueKey]
          : undefined;
        const label = Object.hasOwn(record, labelKey)
          ? record[labelKey]
          : undefined;
        if (
          (typeof value !== "string" && typeof value !== "number") ||
          !String(value).trim() ||
          (typeof value === "number" && !Number.isFinite(value)) ||
          (typeof label !== "string" && typeof label !== "number") ||
          !String(label).trim() ||
          (typeof label === "number" && !Number.isFinite(label))
        )
          throw new Error("Invalid catalog record");
        const stableId = String(value);
        if (seen.has(stableId) || stableId === "__fd_clear__")
          throw new Error("Duplicate or reserved catalog key");
        seen.add(stableId);
        return {
          value: stableId,
          label: { vi: String(label), en: String(label) },
          active: !activeField || record.active !== false,
        };
      });
      const term = query.trim().toLocaleLowerCase();
      return choices
        .filter(
          (choice) =>
            choice.active &&
            `${choice.value} ${choice.label.vi}`
              .toLocaleLowerCase()
              .includes(term),
        )
        .slice(0, 500)
        .map(({ value, label }) => ({ value, label }));
    };
    return {
      id,
      kind: "record",
      label: {
        vi: `Master Data · ${entity.name}`,
        en: `Master Data · ${entity.name}`,
      },
      description: {
        vi: "Đọc danh mục Master Data hiện có trong trình duyệt. Chọn cột mã và tên bên dưới; dữ liệu không được chép vào biểu mẫu. Chưa kết nối đồng bộ bên ngoài.",
        en: "Reads the current browser-local Master Data catalog. Choose the key and name columns below; records are not copied into the form. External sync is not connected.",
      },
      mapping: {
        fields: fields.map((field) => ({
          key: field.key,
          label: { vi: field.label, en: field.label },
        })),
        defaultValueField: valueField,
        defaultLabelField: labelField,
      },
    };
  });
  return { sources, providers };
}
