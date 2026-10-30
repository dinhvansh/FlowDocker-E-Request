import type { FormField } from "./schema";

export type ConfigurationKind =
  "data" | "conditions" | "calculation" | "validation" | "advanced";
export type ConfigurationSection = "data" | "logic" | "validation" | "advanced";

/** Presence hints only, never a replacement for schema/runtime validation. */
export function fieldConfiguration(field: FormField): ConfigurationKind[] {
  const result: ConfigurationKind[] = [];
  const value = field.defaultValue;
  const hasDefault =
    value !== undefined &&
    value !== null &&
    value !== "" &&
    (typeof value !== "object" || Object.keys(value).length > 0);
  if (
    field.dataSource?.provider.trim() ||
    field.defaultValueSource ||
    hasDefault ||
    field.options.length
  )
    result.push("data");
  if (
    [field.visibleWhen, field.requiredWhen, field.disabledWhen].some(
      (rule) => rule?.conditions.length,
    ) ||
    field.compare?.field.trim()
  )
    result.push("conditions");
  if (field.calculation) result.push("calculation");
  if (
    field.readOnly ||
    field.disabled ||
    field.integer ||
    field.uniqueBy?.trim() ||
    field.accept?.trim() ||
    [
      field.min,
      field.max,
      field.minLength,
      field.maxLength,
      field.minRows,
      field.maxRows,
      field.maxFileSize,
      field.maxFiles,
    ].some((bound) => bound !== undefined)
  )
    result.push("validation");
  if (field.customRenderer?.trim()) result.push("advanced");
  return result;
}

export function configurationSection(
  kind: ConfigurationKind,
): ConfigurationSection {
  return kind === "conditions" || kind === "calculation" ? "logic" : kind;
}
