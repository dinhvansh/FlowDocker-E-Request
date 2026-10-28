export type BilingualText = { vi: string; en: string };
export const formFieldTypes = [
  "text",
  "textarea",
  "number",
  "date",
  "checkbox",
  "select",
] as const;
export type FormFieldType = (typeof formFieldTypes)[number];
export interface FormField {
  id: string;
  key: string;
  label: BilingualText;
  type: FormFieldType;
  required: boolean;
  options: { value: string; label: BilingualText }[];
}
export interface FormDefinition {
  id: string;
  title: BilingualText;
  version: number;
  status: "DRAFT";
  fields: FormField[];
}
export type PreviewValues = Record<string, string | boolean>;
export interface FormIssue {
  fieldId?: string;
  message: string;
  params?: Record<string, string | number>;
}
const keyPattern = /^[a-z][a-z0-9_]{0,63}$/;
const safeKey = (key: string) =>
  keyPattern.test(key) && !["constructor", "prototype"].includes(key);
const hasLabels = (label: BilingualText) => label.vi.trim() && label.en.trim();
export function validateFormDefinition(form: FormDefinition): FormIssue[] {
  const issues: FormIssue[] = [];
  if (!hasLabels(form.title))
    issues.push({
      message: "Cần tên biểu mẫu bằng cả tiếng Việt và tiếng Anh.",
    });
  if (!Number.isSafeInteger(form.version) || form.version < 1)
    issues.push({ message: "Phiên bản biểu mẫu phải là số nguyên dương." });
  if (!form.fields.length || form.fields.length > 100)
    issues.push({ message: "Biểu mẫu cần từ 1 đến 100 trường." });
  const keys = new Set<string>();
  const ids = new Set<string>();
  for (const field of form.fields) {
    const add = (message: string) =>
      issues.push({ fieldId: field.id, message, params: { key: field.key } });
    if (!safeKey(field.key))
      add("Mã trường {{key}} không hợp lệ hoặc được dành riêng.");
    if (keys.has(field.key) || ids.has(field.id))
      add("Mã hoặc ID trường {{key}} bị trùng.");
    keys.add(field.key);
    ids.add(field.id);
    if (!hasLabels(field.label))
      add("Trường {{key}} cần nhãn bằng cả hai ngôn ngữ.");
    if (!formFieldTypes.includes(field.type))
      add("Trường {{key}} có kiểu không được hỗ trợ.");
    if (
      field.type === "select" &&
      (!field.options.length ||
        field.options.length > 50 ||
        field.options.some(
          (option) => !option.value.trim() || !hasLabels(option.label),
        ) ||
        new Set(field.options.map((option) => option.value)).size !==
          field.options.length)
    )
      add("Trường {{key}} cần 1–50 lựa chọn có mã duy nhất và nhãn song ngữ.");
  }
  return issues;
}
export function validatePreview(
  form: FormDefinition,
  values: PreviewValues,
): FormIssue[] {
  const issues = validateFormDefinition(form);
  for (const field of form.fields) {
    const value = Object.hasOwn(values, field.key)
      ? values[field.key]
      : undefined;
    const empty =
      value === undefined ||
      value === "" ||
      (typeof value === "string" && !value.trim());
    const add = (message: string) =>
      issues.push({ fieldId: field.id, message, params: { key: field.key } });
    if (
      field.required &&
      (empty || (field.type === "checkbox" && value !== true))
    )
      add("Trường {{key}} là bắt buộc.");
    if (empty) continue;
    if (
      field.type === "checkbox"
        ? typeof value !== "boolean"
        : typeof value !== "string"
    ) {
      add("Giá trị trường {{key}} không đúng kiểu.");
      continue;
    }
    if (field.type === "number" && !Number.isFinite(Number(value)))
      add("Trường {{key}} cần một số hữu hạn.");
    if (
      field.type === "date" &&
      (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value)
    )
      add("Trường {{key}} cần ngày hợp lệ.");
    if (
      field.type === "select" &&
      !field.options.some((option) => option.value === value)
    )
      add("Lựa chọn của trường {{key}} không hợp lệ.");
  }
  return issues;
}
function isText(value: unknown): value is BilingualText {
  return (
    !!value &&
    typeof value === "object" &&
    "vi" in value &&
    "en" in value &&
    typeof value.vi === "string" &&
    typeof value.en === "string"
  );
}
/** Shape checks allow incomplete drafts; validation separately gates Save and Preview. */
export function isFormDefinition(value: unknown): value is FormDefinition {
  if (!value || typeof value !== "object") return false;
  const form = value as FormDefinition;
  return (
    typeof form.id === "string" &&
    form.id.length > 0 &&
    isText(form.title) &&
    Number.isSafeInteger(form.version) &&
    form.version > 0 &&
    form.status === "DRAFT" &&
    Array.isArray(form.fields) &&
    form.fields.length <= 100 &&
    form.fields.every(
      (field) =>
        !!field &&
        typeof field === "object" &&
        typeof field.id === "string" &&
        field.id.length > 0 &&
        typeof field.key === "string" &&
        isText(field.label) &&
        formFieldTypes.includes(field.type) &&
        typeof field.required === "boolean" &&
        Array.isArray(field.options) &&
        field.options.length <= 50 &&
        field.options.every(
          (option) =>
            !!option &&
            typeof option.value === "string" &&
            isText(option.label),
        ),
    )
  );
}
