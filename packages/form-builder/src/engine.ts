import Decimal from "decimal.js";
import {
  isContainer,
  isFormDefinition,
  scopeFields,
  validateFormDefinition,
  type FormDefinition,
  type FormField,
  type FormIssue,
  type FormRule,
  type FormValue,
  type PreviewValues,
} from "./schema";
export type FieldAccess = Record<
  string,
  { read: "allow" | "mask" | "deny"; write: boolean }
>;
export const isRecord = (
  value: FormValue | undefined,
): value is PreviewValues =>
  !!value && typeof value === "object" && !Array.isArray(value);
export const emptyValue = (value: FormValue | undefined) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (typeof value === "string" && !value.trim()) ||
  (Array.isArray(value) && !value.length) ||
  (isRecord(value) && Object.keys(value).length === 0);
/** Bound external controlled values before recursive traversal or serialization. */
export function validRuntimeValues(value: unknown): value is PreviewValues {
  let nodes = 0;
  const walk = (item: unknown, depth: number): boolean => {
    if (++nodes > 100000 || depth > 20) return false;
    if (item === null || typeof item === "boolean") return true;
    if (typeof item === "number") return Number.isFinite(item);
    if (typeof item === "string") return item.length <= 100000;
    if (Array.isArray(item))
      return (
        item.length <= 10000 && item.every((child) => walk(child, depth + 1))
      );
    if (
      item &&
      typeof item === "object" &&
      Object.getPrototypeOf(item) === Object.prototype
    )
      return (
        Object.keys(item).length <= 1000 &&
        Object.entries(item).every(
          ([key, child]) =>
            !["__proto__", "constructor", "prototype"].includes(key) &&
            walk(child, depth + 1),
        )
      );
    return false;
  };
  return (
    !!value &&
    !Array.isArray(value) &&
    typeof value === "object" &&
    walk(value, 0)
  );
}
export function readReference(
  values: PreviewValues,
  key: string,
): FormValue | undefined {
  const [head, column] = key.split(".");
  const value = Object.hasOwn(values, head) ? values[head] : undefined;
  return column && Array.isArray(value)
    ? value
        .filter(isRecord)
        .map((row) => (Object.hasOwn(row, column) ? row[column] : null))
    : column && isRecord(value)
      ? value[column]
      : value;
}
export function evaluateRule(
  rule: FormRule | undefined,
  values: PreviewValues,
  fallback = true,
): boolean {
  if (!rule) return fallback;
  const results = rule.conditions.map(({ field, operator, value }) => {
    const actual = readReference(values, field);
    switch (operator) {
      case "empty":
        return emptyValue(actual);
      case "notEmpty":
        return !emptyValue(actual);
      case "eq":
        return actual === value;
      case "ne":
        return actual !== value;
      case "contains":
        return Array.isArray(actual)
          ? actual.some((item) => item === value)
          : typeof actual === "string" && actual.includes(String(value ?? ""));
      default: {
        if (
          emptyValue(actual) ||
          value === undefined ||
          typeof actual === "object" ||
          typeof actual === "boolean"
        )
          return false;
        const a = Number(actual);
        const b = Number(value);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
        return operator === "gt"
          ? a > b
          : operator === "gte"
            ? a >= b
            : operator === "lt"
              ? a < b
              : a <= b;
      }
    }
  });
  return rule.mode === "all" ? results.every(Boolean) : results.some(Boolean);
}
export function calculate(
  field: FormField,
  values: PreviewValues,
): string | null {
  if (!field.calculation) return null;
  const { operator, fields, precision = 2 } = field.calculation;
  const entries = fields.flatMap((key) => {
    const value = readReference(values, key);
    return Array.isArray(value) ? value : [value];
  });
  if (operator === "count")
    return String(entries.filter((value) => !emptyValue(value)).length);
  if (!entries.length) return "0";
  try {
    const numbers = entries.map((value) => {
      if (emptyValue(value)) return new Decimal(0);
      if (typeof value !== "string" && typeof value !== "number")
        throw new Error("Invalid operand");
      const result = new Decimal(value);
      if (!result.isFinite() || Math.abs(result.e) > 1000)
        throw new Error("Invalid operand");
      return result;
    });
    const first = numbers[0];
    const result =
      operator === "multiply"
        ? numbers.reduce((a, b) => a.mul(b), new Decimal(1))
        : operator === "subtract"
          ? numbers.slice(1).reduce((a, b) => a.sub(b), first)
          : operator === "divide"
            ? numbers.slice(1).reduce((a, b) => a.div(b), first)
            : operator === "min"
              ? Decimal.min(...numbers)
              : operator === "max"
                ? Decimal.max(...numbers)
                : numbers
                    .reduce((a, b) => a.add(b), new Decimal(0))
                    .div(operator === "average" ? numbers.length : 1);
    return result.isFinite() && Math.abs(result.e) <= 1000
      ? result.toFixed(precision)
      : null;
  } catch {
    return null;
  }
}
export function defaultValues(
  fields: FormField[],
  budget = { count: 0 },
): PreviewValues {
  const result: PreviewValues = {};
  for (const field of fields) {
    if (++budget.count > 10000) break;
    if (field.type === "repeat")
      result[field.key] = Array.from(
        { length: Math.min(field.minRows ?? 0, 100) },
        () => defaultValues(field.children ?? [], budget),
      );
    else if (field.type === "container")
      result[field.key] = defaultValues(field.children ?? [], budget);
    else if (isContainer(field))
      Object.assign(result, defaultValues(field.children ?? [], budget));
    else if (field.defaultValue !== undefined)
      result[field.key] = structuredClone(field.defaultValue);
  }
  return result;
}
/** Bounded convergence handles forward references and row aggregates without evaluating code. */
export function prepareValues(
  form: FormDefinition,
  input: PreviewValues,
  access: FieldAccess = {},
): PreviewValues {
  if (!isFormDefinition(form) || !validRuntimeValues(input)) return {};
  let result: PreviewValues = { ...defaultValues(form.fields), ...input };
  const pass = (
    fields: FormField[],
    local: PreviewValues,
    root: PreviewValues,
    budget: { count: number },
    prefix = "",
  ): PreviewValues => {
    let next = { ...local };
    for (const field of fields) {
      if (++budget.count > 10000) continue;
      const context = { ...root, ...next };
      const path = prefix + field.key;
      const policy = access[path] ?? access[field.key];
      if (
        policy?.read === "deny" ||
        policy?.read === "mask" ||
        !evaluateRule(field.visibleWhen, context)
      ) {
        delete next[field.key];
        if (isContainer(field) && !["repeat", "container"].includes(field.type))
          for (const child of scopeFields(field.children ?? []))
            delete next[child.key];
        continue;
      }
      if (field.type === "repeat")
        next[field.key] = Array.isArray(next[field.key])
          ? (next[field.key] as FormValue[]).map((row, index) =>
              isRecord(row) && index < 100
                ? pass(
                    field.children ?? [],
                    { ...defaultValues(field.children ?? []), ...row },
                    root,
                    budget,
                    `${path}.${index}.`,
                  )
                : row,
            )
          : (next[field.key] ?? []);
      else if (field.type === "container" && isRecord(next[field.key]))
        next[field.key] = pass(
          field.children ?? [],
          next[field.key] as PreviewValues,
          root,
          budget,
          `${path}.`,
        );
      else if (isContainer(field))
        next = pass(field.children ?? [], next, root, budget, prefix);
      else if (field.calculation)
        next[field.key] = calculate(field, { ...root, ...next });
    }
    return next;
  };
  for (
    let index = 0;
    index <= Math.min(scopeFields(form.fields).length + 2, 302);
    index++
  ) {
    const next = pass(form.fields, result, result, { count: 0 });
    if (JSON.stringify(next) === JSON.stringify(result)) return next;
    result = next;
  }
  return result;
}
export function checkFiles(
  field: FormField,
  files: { size: number; type: string; name: string }[],
  existing = 0,
): string | null {
  if (files.length + existing > (field.maxFiles ?? 1))
    return "Số tệp vượt giới hạn.";
  const accepted = (field.accept ?? "")
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);
  for (const file of files) {
    if (file.size > (field.maxFileSize ?? 10485760))
      return "Tệp vượt giới hạn dung lượng.";
    if (
      accepted.length &&
      !accepted.some((type) =>
        type.startsWith(".")
          ? file.name.toLowerCase().endsWith(type)
          : type.endsWith("/*")
            ? file.type.toLowerCase().startsWith(type.slice(0, -1))
            : file.type.toLowerCase() === type,
      )
    )
      return "Định dạng tệp không được chấp nhận.";
  }
  return null;
}
export function validatePreview(
  form: FormDefinition,
  values: PreviewValues,
  access: FieldAccess = {},
  suppliedOptions: Record<string, string[]> = {},
): FormIssue[] {
  const issues = validateFormDefinition(form);
  if (issues.length) return issues;
  if (!validRuntimeValues(values))
    return [{ message: "Dữ liệu biểu mẫu vượt giới hạn xử lý." }];
  const prepared = prepareValues(form, values, access);
  const walk = (
    fields: FormField[],
    data: PreviewValues,
    prefix = "",
    budget = { count: 0 },
  ) => {
    for (const field of fields) {
      if (++budget.count > 10000) {
        issues.push({ message: "Dữ liệu biểu mẫu vượt giới hạn xử lý." });
        return;
      }
      const path = prefix + field.key;
      const policy = access[path] ?? access[field.key];
      const context = { ...prepared, ...data };
      if (
        policy?.read === "deny" ||
        policy?.read === "mask" ||
        !evaluateRule(field.visibleWhen, context) ||
        field.type === "hidden" ||
        field.type === "content" ||
        field.type === "alert" ||
        field.type === "button"
      )
        continue;
      const value = Object.hasOwn(data, field.key)
        ? data[field.key]
        : undefined;
      const add = (message: string) =>
        issues.push({
          fieldId: field.id,
          path,
          message,
          params: { key: path },
        });
      if (isContainer(field) && !["repeat", "container"].includes(field.type)) {
        walk(field.children ?? [], data, prefix, budget);
        continue;
      }
      if (field.disabled || evaluateRule(field.disabledWhen, context, false))
        continue;
      const required =
        field.required || evaluateRule(field.requiredWhen, context, false);
      if (
        required &&
        (emptyValue(value) || (field.type === "checkbox" && value !== true))
      )
        add("Trường {{key}} là bắt buộc.");
      if (field.type === "container") {
        if (!isRecord(value)) add("Giá trị trường {{key}} không đúng kiểu.");
        else walk(field.children ?? [], value, `${path}.`, budget);
        continue;
      }
      if (
        field.type === "repeat" &&
        Array.isArray(value) &&
        value.length < (field.minRows ?? 0)
      )
        add("Số dòng của trường {{key}} vượt giới hạn.");
      if (emptyValue(value)) {
        if (field.calculation && value === null)
          add("Phép tính của trường {{key}} không hợp lệ.");
        continue;
      }
      if (field.type === "address") {
        if (
          !isRecord(value) ||
          Object.entries(value).some(
            ([key, entry]) =>
              !["street", "city", "region", "postal", "country"].includes(
                key,
              ) || typeof entry !== "string",
          ) ||
          (required &&
            ["street", "city", "country"].some((key) => emptyValue(value[key])))
        )
          add("Định dạng trường {{key}} không hợp lệ.");
        continue;
      }
      if (field.type === "day") {
        const iso = isRecord(value)
          ? `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`
          : "";
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
          !Number.isFinite(Date.parse(iso)) ||
          new Date(iso).toISOString().slice(0, 10) !== iso
        )
          add("Trường {{key}} cần ngày hợp lệ.");
        continue;
      }
      if (field.type === "repeat") {
        if (!Array.isArray(value) || value.some((row) => !isRecord(row))) {
          add("Giá trị trường {{key}} không đúng kiểu.");
          continue;
        }
        if (value.length > (field.maxRows ?? 100))
          add("Số dòng của trường {{key}} vượt giới hạn.");
        if (field.uniqueBy) {
          const keys = value
            .filter(isRecord)
            .map((row) => row[field.uniqueBy!])
            .filter((item) => !emptyValue(item));
          if (new Set(keys).size !== keys.length)
            add("Dữ liệu trường {{key}} có mã dòng bị trùng.");
        }
        value
          .slice(0, 100)
          .filter(isRecord)
          .forEach((row, index) =>
            walk(field.children ?? [], row, `${path}.${index}.`, budget),
          );
        continue;
      }
      if (field.type === "file") {
        if (
          !Array.isArray(value) ||
          value.some(
            (item) =>
              !isRecord(item) ||
              typeof item.name !== "string" ||
              typeof item.size !== "number" ||
              item.size < 0 ||
              typeof item.type !== "string",
          )
        ) {
          add("Giá trị trường {{key}} không đúng kiểu.");
          continue;
        }
        const files = value.filter(isRecord) as {
          name: string;
          size: number;
          type: string;
          status: string;
        }[];
        const error = checkFiles(field, files);
        if (error) add(error);
        if (
          value.some(
            (file) =>
              !isRecord(file) ||
              file.status !== "uploaded" ||
              typeof file.id !== "string" ||
              !file.id ||
              typeof file.reference !== "string" ||
              !file.reference,
          )
        )
          add("Tệp của trường {{key}} chưa tải lên thành công.");
        continue;
      }
      if (field.type === "signature") {
        if (
          !isRecord(value) ||
          (!(typeof value.typed === "string" && value.typed.trim()) &&
            !(
              Array.isArray(value.strokes) &&
              value.strokes.length <= 100 &&
              value.strokes.every(
                (stroke) =>
                  Array.isArray(stroke) &&
                  stroke.length <= 1000 &&
                  stroke.every(
                    (point) =>
                      isRecord(point) &&
                      typeof point.x === "number" &&
                      Number.isFinite(point.x) &&
                      point.x >= 0 &&
                      point.x <= 480 &&
                      typeof point.y === "number" &&
                      Number.isFinite(point.y) &&
                      point.y >= 0 &&
                      point.y <= 160,
                  ),
              ) &&
              value.strokes.some(
                (stroke) => Array.isArray(stroke) && stroke.length > 1,
              )
            ))
        )
          add("Trường {{key}} cần chữ ký hoặc tên xác nhận.");
        continue;
      }
      if (
        ["multiselect", "checkboxes", "tags"].includes(field.type) ||
        (field.type === "person" && field.multiple)
      ) {
        if (
          !Array.isArray(value) ||
          value.some((item) => typeof item !== "string") ||
          new Set(value).size !== value.length
        ) {
          add("Giá trị trường {{key}} không đúng kiểu.");
          continue;
        }
        if (
          field.type !== "tags" &&
          value.some(
            (item) =>
              !(
                suppliedOptions[path] ??
                field.options.map((option) => option.value)
              ).includes(String(item)),
          )
        )
          add("Lựa chọn của trường {{key}} không hợp lệ.");
        if (
          value.length < (field.minLength ?? 0) ||
          value.length > (field.maxLength ?? 100)
        )
          add("Độ dài trường {{key}} vượt giới hạn.");
        continue;
      }
      if (["keyvalue", "survey"].includes(field.type)) {
        if (!isRecord(value)) {
          add("Giá trị trường {{key}} không đúng kiểu.");
          continue;
        }
        if (
          Object.values(value).some((entry) => typeof entry !== "string") ||
          (field.type === "survey" &&
            Object.entries(value).some(
              ([key, entry]) =>
                !field.options.some((option) => option.value === key) ||
                !["1", "2", "3", "4", "5"].includes(String(entry)),
            ))
        )
          add("Giá trị trường {{key}} không đúng kiểu.");
        if (
          field.type === "survey" &&
          field.options.some(
            (option) => required && emptyValue(value[option.value]),
          )
        )
          add("Trường {{key}} là bắt buộc.");
        continue;
      }
      if (
        field.type === "person"
          ? typeof value !== "string"
          : field.type === "checkbox"
            ? typeof value !== "boolean"
            : typeof value !== "string" && typeof value !== "number"
      ) {
        add("Giá trị trường {{key}} không đúng kiểu.");
        continue;
      }
      const text = String(value);
      if (
        text.length < (field.minLength ?? 0) ||
        text.length > (field.maxLength ?? 10000)
      )
        add("Độ dài trường {{key}} vượt giới hạn.");
      if (["number", "currency"].includes(field.type)) {
        try {
          const number = new Decimal(text);
          if (!number.isFinite() || Math.abs(number.e) > 1000)
            throw new Error("invalid");
          if (
            (field.min !== undefined && number.lt(field.min)) ||
            (field.max !== undefined && number.gt(field.max)) ||
            (field.integer && !number.isInteger())
          )
            add("Giá trị số của trường {{key}} vượt giới hạn.");
        } catch {
          add("Trường {{key}} cần một số hữu hạn.");
        }
      }
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
        add("Định dạng trường {{key}} không hợp lệ.");
      if (field.type === "phone" && !/^\+?[\d ()-]{5,30}$/.test(text))
        add("Định dạng trường {{key}} không hợp lệ.");
      if (field.type === "url") {
        try {
          if (!["http:", "https:"].includes(new URL(text).protocol))
            throw new Error("invalid");
        } catch {
          add("Định dạng trường {{key}} không hợp lệ.");
        }
      }
      if (
        field.type === "date" &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(text) ||
          !Number.isFinite(Date.parse(text)) ||
          new Date(text).toISOString().slice(0, 10) !== text)
      )
        add("Trường {{key}} cần ngày hợp lệ.");
      if (
        field.type === "datetime" &&
        (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) ||
          !Number.isFinite(Date.parse(text)))
      )
        add("Định dạng trường {{key}} không hợp lệ.");
      if (field.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(text))
        add("Định dạng trường {{key}} không hợp lệ.");
      if (
        ["select", "radio", "person"].includes(field.type) &&
        !(
          suppliedOptions[path] ?? field.options.map((option) => option.value)
        ).includes(text)
      )
        add("Lựa chọn của trường {{key}} không hợp lệ.");
      if (field.compare) {
        const compared = readReference(context, field.compare.field);
        const a = ["number", "currency"].includes(field.type)
          ? Number(value)
          : text;
        const b = ["number", "currency"].includes(field.type)
          ? Number(compared)
          : String(compared ?? "");
        if (
          emptyValue(compared) ||
          (field.compare.operator === "eq"
            ? a !== b
            : field.compare.operator === "gte"
              ? a < b
              : a > b)
        )
          add("Trường {{key}} không thỏa điều kiện so sánh.");
      }
    }
  };
  walk(form.fields, prepared);
  return issues;
}
/** Only schema-registered values leave the UI; host still enforces all permissions server-side. */
export function submissionValues(
  form: FormDefinition,
  values: PreviewValues,
  access: FieldAccess = {},
): PreviewValues {
  if (!isFormDefinition(form) || !validRuntimeValues(values)) return {};
  const prepared = prepareValues(form, values, access);
  const pick = (
    fields: FormField[],
    data: PreviewValues,
    prefix = "",
  ): PreviewValues => {
    const output: PreviewValues = {};
    for (const field of fields) {
      const path = prefix + field.key;
      const policy = access[path] ?? access[field.key];
      if (
        policy?.read === "deny" ||
        policy?.read === "mask" ||
        policy?.write === false ||
        ["content", "alert", "button"].includes(field.type) ||
        field.disabled ||
        evaluateRule(field.disabledWhen, { ...prepared, ...data }, false) ||
        !evaluateRule(field.visibleWhen, { ...prepared, ...data })
      )
        continue;
      if (field.type === "container") {
        if (isRecord(data[field.key]))
          output[field.key] = pick(
            field.children ?? [],
            data[field.key] as PreviewValues,
            `${path}.`,
          );
      } else if (isContainer(field) && field.type !== "repeat")
        Object.assign(output, pick(field.children ?? [], data, prefix));
      else if (Object.hasOwn(data, field.key))
        output[field.key] =
          field.type === "repeat" && Array.isArray(data[field.key])
            ? (data[field.key] as FormValue[])
                .filter(isRecord)
                .map((row, index) =>
                  pick(field.children ?? [], row, `${path}.${index}.`),
                )
            : data[field.key];
    }
    return output;
  };
  return pick(form.fields, prepared);
}
