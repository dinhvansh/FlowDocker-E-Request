export type BilingualText = { vi: string; en: string };
export const formFieldTypes = [
  "person",
  "text",
  "textarea",
  "email",
  "url",
  "phone",
  "password",
  "number",
  "currency",
  "date",
  "datetime",
  "time",
  "checkbox",
  "select",
  "radio",
  "multiselect",
  "checkboxes",
  "tags",
  "file",
  "signature",
  "hidden",
  "content",
  "section",
  "columns",
  "tabs",
  "repeat",
  "keyvalue",
  "survey",
  "address",
  "day",
  "container",
  "table",
  "alert",
  "button",
] as const;
export type FormFieldType = (typeof formFieldTypes)[number];
export type FormValue =
  string | number | boolean | null | FormValue[] | { [key: string]: FormValue };
export type PreviewValues = Record<string, FormValue>;
export type RuleOperator =
  "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "empty" | "notEmpty" | "contains";
export interface FormRule {
  mode: "all" | "any";
  conditions: {
    field: string;
    operator: RuleOperator;
    value?: string | number | boolean;
  }[];
}
export interface Calculation {
  operator:
    | "add"
    | "subtract"
    | "multiply"
    | "divide"
    | "sum"
    | "average"
    | "count"
    | "min"
    | "max";
  fields: string[];
  /** Optional safe expression such as `amount * exchange_rate` or `SUM(lines.amount)`. */
  expression?: string;
  precision?: number;
}
export const creatorProfileLabels = {
  name: "Họ tên người tạo",
  email: "Email người tạo",
  employeeCode: "Mã nhân viên người tạo",
  department: "Phòng ban người tạo",
  position: "Chức danh người tạo",
  managerName: "Tên quản lý trực tiếp của người tạo",
  managerId: "Quản lý trực tiếp của người tạo",
} as const;
export type CreatorProfileAttribute = keyof typeof creatorProfileLabels;
export type DefaultValueSource =
  "currentUser" | `currentUser.${CreatorProfileAttribute}`;
export type NumberingTokenKind =
  | "literal"
  | "sequence"
  | "year"
  | "month"
  | "day"
  | "creator"
  | "employeeCode"
  | "department"
  | "position"
  | "managerId"
  | "managerName"
  | "typeCode";
export interface NumberingToken {
  kind: NumberingTokenKind;
  value?: string;
}
export interface NumberingConfig {
  segments: NumberingToken[];
  sequenceDigits: number;
  scope: "app" | "year";
}
export function defaultSourcesForType(
  type: FormFieldType,
): DefaultValueSource[] {
  if (type === "person") return ["currentUser", "currentUser.managerId"];
  if (type === "email") return ["currentUser.email"];
  if (["text", "textarea", "hidden"].includes(type))
    return (Object.keys(creatorProfileLabels) as CreatorProfileAttribute[])
      .filter((key) => key !== "managerId")
      .map((key) => `currentUser.${key}` as DefaultValueSource);
  return [];
}
export interface FormField {
  id: string;
  key: string;
  label: BilingualText;
  type: FormFieldType;
  required: boolean;
  multiple?: boolean;
  options: { value: string; label: BilingualText }[];
  help?: BilingualText;
  placeholder?: BilingualText;
  defaultValue?: FormValue;
  /** Resolved from host context when no saved value exists; never an identity credential. */
  defaultValueSource?: DefaultValueSource;
  /** Local numbering template; authoritative sequence allocation belongs to the host. */
  numbering?: NumberingConfig;
  readOnly?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  integer?: boolean;
  compare?: { field: string; operator: "eq" | "gte" | "lte" };
  visibleWhen?: FormRule;
  requiredWhen?: FormRule;
  disabledWhen?: FormRule;
  calculation?: Calculation;
  children?: FormField[];
  columns?: 1 | 2 | 3;
  /** Hide the visual legend for a columns layout while keeping it accessible. */
  hideLabel?: boolean;
  minRows?: number;
  maxRows?: number;
  autoRows?: boolean;
  uniqueBy?: string;
  currency?: string;
  accept?: string;
  maxFileSize?: number;
  maxFiles?: number;
  dataSource?: {
    provider: string;
    dependsOn?: string;
    valueField?: string;
    labelField?: string;
  };
  customRenderer?: string;
  buttonAction?: "submit" | "reset";
  tone?: "info" | "warning" | "danger" | "success";
}
export interface FormDefinition {
  id: string;
  title: BilingualText;
  version: number;
  status: "DRAFT";
  fields: FormField[];
  schemaVersion?: 1 | 2;
  display?: "form" | "wizard";
  orientation?: "portrait" | "landscape";
}
export interface FormIssue {
  fieldId?: string;
  path?: string;
  message: string;
  params?: Record<string, string | number>;
}
export const containerTypes: readonly FormFieldType[] = [
  "section",
  "columns",
  "tabs",
  "repeat",
  "container",
  "table",
];
export const choiceTypes: readonly FormFieldType[] = [
  "person",
  "select",
  "radio",
  "multiselect",
  "checkboxes",
  "survey",
];
export const fieldTypeLabels: Record<FormFieldType, string> = {
  person: "Chọn người",
  text: "Văn bản ngắn",
  textarea: "Văn bản dài",
  email: "Email",
  url: "Đường dẫn",
  phone: "Điện thoại",
  password: "Mật khẩu",
  number: "Số",
  currency: "Tiền tệ",
  date: "Ngày",
  datetime: "Ngày và giờ",
  time: "Giờ",
  checkbox: "Ô xác nhận",
  select: "Danh sách chọn",
  radio: "Chọn một",
  multiselect: "Chọn nhiều",
  checkboxes: "Nhóm xác nhận",
  tags: "Thẻ",
  file: "Tệp đính kèm",
  signature: "Chữ ký",
  hidden: "Trường ẩn",
  content: "Nội dung hướng dẫn",
  section: "Nhóm trường",
  columns: "Bố cục cột",
  tabs: "Bố cục tab",
  repeat: "Bảng dòng lặp",
  keyvalue: "Cặp mã và giá trị",
  survey: "Khảo sát",
  address: "Địa chỉ",
  day: "Ngày tách thành phần",
  container: "Nhóm dữ liệu",
  table: "Bảng bố cục",
  alert: "Thông báo biểu mẫu",
  button: "Nút thao tác",
};
export function isContainer(field: FormField) {
  return containerTypes.includes(field.type);
}
export function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) => [
    field,
    ...flattenFields(field.children ?? []),
  ]);
}
/** Visual containers share scope; repeats introduce a row scope. */
export function scopeFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) => [
    field,
    ...(["repeat", "container"].includes(field.type)
      ? []
      : scopeFields(field.children ?? [])),
  ]);
}
export function safeKey(key: string) {
  return (
    /^[a-z][a-z0-9_]{0,63}$/.test(key) &&
    !["constructor", "prototype"].includes(key)
  );
}
const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const textShape = (value: unknown): value is BilingualText =>
  isObject(value) &&
  typeof value.vi === "string" &&
  typeof value.en === "string" &&
  Object.keys(value).every((key) => ["vi", "en"].includes(key));
const boundedValue = (value: unknown, depth = 0): boolean =>
  depth <= 8 &&
  (value === null ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.length <= 100000) ||
    (Array.isArray(value) &&
      value.length <= 100 &&
      value.every((item) => boundedValue(item, depth + 1))) ||
    (isObject(value) &&
      Object.keys(value).length <= 100 &&
      Object.entries(value).every(
        ([key, item]) =>
          !["__proto__", "prototype", "constructor"].includes(key) &&
          boundedValue(item, depth + 1),
      )));
const ruleShape = (value: unknown): value is FormRule =>
  isObject(value) &&
  ["all", "any"].includes(String(value.mode)) &&
  Array.isArray(value.conditions) &&
  value.conditions.length > 0 &&
  value.conditions.length <= 20 &&
  value.conditions.every(
    (condition) =>
      isObject(condition) &&
      typeof condition.field === "string" &&
      [
        "eq",
        "ne",
        "gt",
        "gte",
        "lt",
        "lte",
        "empty",
        "notEmpty",
        "contains",
      ].includes(String(condition.operator)) &&
      (condition.value === undefined ||
        ["string", "number", "boolean"].includes(typeof condition.value)),
  );
const allowedKeys = new Set([
  "id",
  "key",
  "label",
  "type",
  "required",
  "options",
  "help",
  "placeholder",
  "defaultValue",
  "defaultValueSource",
  "numbering",
  "readOnly",
  "multiple",
  "disabled",
  "min",
  "max",
  "minLength",
  "maxLength",
  "integer",
  "compare",
  "visibleWhen",
  "requiredWhen",
  "disabledWhen",
  "calculation",
  "children",
  "columns",
  "minRows",
  "maxRows",
  "autoRows",
  "uniqueBy",
  "currency",
  "accept",
  "maxFileSize",
  "maxFiles",
  "dataSource",
  "customRenderer",
  "buttonAction",
  "tone",
]);
function fieldsShape(
  value: unknown,
  depth = 0,
  budget = { count: 0 },
): value is FormField[] {
  return (
    depth <= 5 &&
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every((field) => {
      if (
        ++budget.count > 300 ||
        !isObject(field) ||
        Object.keys(field).some((key) => !allowedKeys.has(key)) ||
        typeof field.id !== "string" ||
        !field.id ||
        typeof field.key !== "string" ||
        !textShape(field.label) ||
        !formFieldTypes.includes(field.type as FormFieldType) ||
        typeof field.required !== "boolean" ||
        !Array.isArray(field.options) ||
        field.options.length > 50 ||
        !field.options.every(
          (option) =>
            isObject(option) &&
            typeof option.value === "string" &&
            textShape(option.label),
        )
      )
        return false;
      for (const key of ["help", "placeholder"])
        if (field[key] !== undefined && !textShape(field[key])) return false;
      for (const key of [
        "min",
        "max",
        "minLength",
        "maxLength",
        "minRows",
        "maxRows",
        "maxFileSize",
        "maxFiles",
      ])
        if (
          field[key] !== undefined &&
          (typeof field[key] !== "number" || !Number.isFinite(field[key]))
        )
          return false;
      for (const key of [
        "readOnly",
        "disabled",
        "integer",
        "autoRows",
        "multiple",
      ])
        if (field[key] !== undefined && typeof field[key] !== "boolean")
          return false;
      if (
        field.buttonAction !== undefined &&
        !["submit", "reset"].includes(String(field.buttonAction))
      )
        return false;
      if (
        field.tone !== undefined &&
        !["info", "warning", "danger", "success"].includes(String(field.tone))
      )
        return false;
      for (const key of ["uniqueBy", "currency", "accept", "customRenderer"])
        if (field[key] !== undefined && typeof field[key] !== "string")
          return false;
      for (const key of ["visibleWhen", "requiredWhen", "disabledWhen"])
        if (field[key] !== undefined && !ruleShape(field[key])) return false;
      if (
        field.columns !== undefined &&
        ![1, 2, 3].includes(Number(field.columns))
      )
        return false;
      if (field.defaultValue !== undefined && !boundedValue(field.defaultValue))
        return false;
      if (
        field.defaultValueSource !== undefined &&
        (!defaultSourcesForType(field.type as FormFieldType).includes(
          field.defaultValueSource as DefaultValueSource,
        ) ||
          field.defaultValue !== undefined)
      )
        return false;
      if (
        field.numbering !== undefined &&
        (!isObject(field.numbering) ||
          !Array.isArray(field.numbering.segments) ||
          field.numbering.segments.length > 20 ||
          !Number.isInteger(field.numbering.sequenceDigits) ||
          Number(field.numbering.sequenceDigits) < 1 ||
          Number(field.numbering.sequenceDigits) > 12 ||
          !["app", "year"].includes(String(field.numbering.scope)) ||
          !field.numbering.segments.every(
            (segment) =>
              isObject(segment) &&
              [
                "literal",
                "sequence",
                "year",
                "month",
                "day",
                "creator",
                "employeeCode",
                "department",
                "position",
                "managerId",
                "managerName",
                "typeCode",
              ].includes(String(segment.kind)) &&
              (segment.value === undefined ||
                typeof segment.value === "string"),
          ))
      )
        return false;
      if (
        field.children !== undefined &&
        (!containerTypes.includes(field.type as FormFieldType) ||
          !fieldsShape(field.children, depth + 1, budget))
      )
        return false;
      if (
        field.compare !== undefined &&
        (!isObject(field.compare) ||
          typeof field.compare.field !== "string" ||
          !["eq", "gte", "lte"].includes(String(field.compare.operator)))
      )
        return false;
      if (
        field.dataSource !== undefined &&
        (!isObject(field.dataSource) ||
          typeof field.dataSource.provider !== "string" ||
          (field.dataSource.dependsOn !== undefined &&
            typeof field.dataSource.dependsOn !== "string") ||
          (field.dataSource.valueField !== undefined &&
            (typeof field.dataSource.valueField !== "string" ||
              !field.dataSource.valueField.trim())) ||
          (field.dataSource.labelField !== undefined &&
            (typeof field.dataSource.labelField !== "string" ||
              !field.dataSource.labelField.trim())))
      )
        return false;
      if (
        field.calculation !== undefined &&
        (!isObject(field.calculation) ||
          ![
            "add",
            "subtract",
            "multiply",
            "divide",
            "sum",
            "average",
            "count",
            "min",
            "max",
          ].includes(String(field.calculation.operator)) ||
          !Array.isArray(field.calculation.fields) ||
          field.calculation.fields.length > 20 ||
          !field.calculation.fields.every((key) => typeof key === "string") ||
          (field.calculation.expression !== undefined &&
            (typeof field.calculation.expression !== "string" ||
              field.calculation.expression.length > 500)) ||
          (field.calculation.precision !== undefined &&
            (!Number.isInteger(field.calculation.precision) ||
              Number(field.calculation.precision) < 0 ||
              Number(field.calculation.precision) > 8)))
      )
        return false;
      return true;
    })
  );
}
export function isFormDefinition(value: unknown): value is FormDefinition {
  return (
    isObject(value) &&
    Object.keys(value).every((key) =>
      [
        "id",
        "title",
        "version",
        "status",
        "fields",
        "schemaVersion",
        "display",
        "orientation",
      ].includes(key),
    ) &&
    typeof value.id === "string" &&
    !!value.id &&
    textShape(value.title) &&
    Number.isSafeInteger(value.version) &&
    Number(value.version) > 0 &&
    value.status === "DRAFT" &&
    (value.schemaVersion === undefined ||
      [1, 2].includes(Number(value.schemaVersion))) &&
    (value.display === undefined ||
      ["form", "wizard"].includes(String(value.display))) &&
    (value.orientation === undefined ||
      ["portrait", "landscape"].includes(String(value.orientation))) &&
    fieldsShape(value.fields)
  );
}
export function validateFormDefinition(form: FormDefinition): FormIssue[] {
  const issues: FormIssue[] = [];
  if (!isFormDefinition(form))
    return [
      { message: "Schema không hợp lệ hoặc có thuộc tính không được hỗ trợ." },
    ];
  const labels = (text: BilingualText) => text.vi.trim() && text.en.trim();
  if (!labels(form.title))
    issues.push({
      message: "Cần tên biểu mẫu bằng cả tiếng Việt và tiếng Anh.",
    });
  if (!Number.isSafeInteger(form.version) || form.version < 1)
    issues.push({ message: "Phiên bản biểu mẫu phải là số nguyên dương." });
  if (!form.fields.length || flattenFields(form.fields).length > 300)
    issues.push({ message: "Biểu mẫu cần từ 1 đến 300 trường." });
  const ids = new Set<string>();
  const checkScope = (fields: FormField[], outer: FormField[] = []) => {
    const flat = scopeFields(fields);
    const keys = new Set<string>();
    const available = new Map(
      [...outer, ...flat].map((field) => [field.key, field]),
    );
    const scopeWalk = (items: FormField[]) => {
      for (const field of items) {
        const add = (message: string) =>
          issues.push({
            fieldId: field.id,
            message,
            params: { key: field.key },
          });
        if (!safeKey(field.key))
          add("Mã trường {{key}} không hợp lệ hoặc được dành riêng.");
        if (keys.has(field.key) || ids.has(field.id))
          add("Mã hoặc ID trường {{key}} bị trùng.");
        keys.add(field.key);
        ids.add(field.id);
        if (!labels(field.label))
          add("Trường {{key}} cần nhãn bằng cả hai ngôn ngữ.");
        if (!formFieldTypes.includes(field.type))
          add("Trường {{key}} có kiểu không được hỗ trợ.");
        if (
          choiceTypes.includes(field.type) &&
          !field.dataSource &&
          (!field.options.length ||
            field.options.length > 50 ||
            field.options.some(
              (option) =>
                !option.value.trim() ||
                option.value === "__fd_clear__" ||
                !labels(option.label),
            ) ||
            new Set(field.options.map((option) => option.value)).size !==
              field.options.length)
        )
          add(
            "Trường {{key}} cần 1–50 lựa chọn có mã duy nhất và nhãn song ngữ.",
          );
        if (isContainer(field) && !field.children?.length)
          add("Nhóm {{key}} cần ít nhất một trường con.");
        if (
          (field.min !== undefined &&
            field.max !== undefined &&
            field.min > field.max) ||
          (field.minLength !== undefined &&
            field.maxLength !== undefined &&
            field.minLength > field.maxLength) ||
          (field.minRows !== undefined &&
            field.maxRows !== undefined &&
            field.minRows > field.maxRows)
        )
          add("Giới hạn của trường {{key}} không hợp lệ.");
        for (const prop of [
          "minLength",
          "maxLength",
          "minRows",
          "maxRows",
          "maxFiles",
          "maxFileSize",
        ] as const)
          if (
            field[prop] !== undefined &&
            (!Number.isSafeInteger(field[prop]) ||
              field[prop]! < 0 ||
              (["minRows", "maxRows", "maxFiles"].includes(prop) &&
                field[prop]! > 100))
          )
            add("Giới hạn của trường {{key}} không hợp lệ.");
        if (field.currency && !/^[A-Z]{3}$/.test(field.currency))
          add("Mã tiền tệ của trường {{key}} cần 3 chữ cái ISO.");
        const references = [
          ...[
            field.visibleWhen,
            field.requiredWhen,
            field.disabledWhen,
          ].flatMap(
            (rule) =>
              rule?.conditions.map((condition) => condition.field) ?? [],
          ),
          ...(field.calculation?.fields ?? []),
          ...(field.compare ? [field.compare.field] : []),
          ...(field.dataSource?.dependsOn ? [field.dataSource.dependsOn] : []),
        ];
        for (const ref of references) {
          const [key, childKey, extra] = ref.split(".");
          const source = available.get(key);
          if (
            !source ||
            extra ||
            (childKey &&
              (!["repeat", "container"].includes(source.type) ||
                !scopeFields(source.children ?? []).some(
                  (child) => child.key === childKey,
                ))) ||
            key === field.key
          )
            add("Tham chiếu của trường {{key}} không hợp lệ.");
        }
        if (field.calculation && !["number", "currency"].includes(field.type))
          add("Chỉ trường số hoặc tiền tệ được dùng phép tính.");
        if (["repeat", "container"].includes(field.type)) {
          if (
            field.uniqueBy &&
            !scopeFields(field.children ?? []).some(
              (child) => child.key === field.uniqueBy,
            )
          )
            add("Tham chiếu của trường {{key}} không hợp lệ.");
          checkScope(field.children ?? [], [...outer, ...flat]);
        } else scopeWalk(field.children ?? []);
      }
    };
    scopeWalk(fields);
    const visited = new Set<string>();
    const active = new Set<string>();
    const visit = (key: string): boolean => {
      if (active.has(key)) return true;
      if (visited.has(key)) return false;
      active.add(key);
      for (const ref of available.get(key)?.calculation?.fields ?? [])
        if (visit(ref.split(".")[0])) return true;
      active.delete(key);
      visited.add(key);
      return false;
    };
    if ([...available.keys()].some(visit))
      issues.push({ message: "Phép tính có vòng tham chiếu." });
  };
  checkScope(form.fields);
  // Resolve dependencies to field identities, including aggregates across repeat scopes.
  const edges = new Map<string, string[]>();
  const collect = (
    fields: FormField[],
    inherited = new Map<string, FormField>(),
  ) => {
    const flat = scopeFields(fields);
    const available = new Map([
      ...inherited,
      ...flat.map((item) => [item.key, item] as const),
    ]);
    for (const item of flat) {
      edges.set(
        item.id,
        (item.calculation?.fields ?? []).flatMap((ref) => {
          const [key, child] = ref.split(".");
          const source = available.get(key);
          const target = child
            ? scopeFields(source?.children ?? []).find(
                (entry) => entry.key === child,
              )
            : source;
          return target ? [target.id] : [];
        }),
      );
      if (["repeat", "container"].includes(item.type))
        collect(item.children ?? [], available);
    }
  };
  collect(form.fields);
  const activeIds = new Set<string>();
  const doneIds = new Set<string>();
  const cyclic = (id: string): boolean => {
    if (activeIds.has(id)) return true;
    if (doneIds.has(id)) return false;
    activeIds.add(id);
    if ((edges.get(id) ?? []).some(cyclic)) return true;
    activeIds.delete(id);
    doneIds.add(id);
    return false;
  };
  if (
    [...edges.keys()].some(cyclic) &&
    !issues.some((issue) => issue.message === "Phép tính có vòng tham chiếu.")
  )
    issues.push({ message: "Phép tính có vòng tham chiếu." });
  return issues;
}
export function importFormDefinition(json: string): FormDefinition {
  if (json.length > 1000000) throw new Error("Schema vượt quá 1 MB.");
  const value: unknown = JSON.parse(json);
  if (!isFormDefinition(value))
    throw new Error(
      "Schema không hợp lệ hoặc có thuộc tính không được hỗ trợ.",
    );
  const issues = validateFormDefinition(value);
  if (issues.length) throw new Error(issues[0].message);
  return { ...value, schemaVersion: 2 };
}
export function exportFormDefinition(form: FormDefinition): string {
  if (!isFormDefinition(form) || validateFormDefinition(form).length)
    throw new Error("Cấu trúc biểu mẫu chưa hợp lệ.");
  return JSON.stringify({ ...form, schemaVersion: 2 }, null, 2);
}
export function createField(
  type: FormFieldType,
  existing: FormField[],
): FormField {
  let count = 1;
  const keys = new Set(flattenFields(existing).map((field) => field.key));
  while (keys.has(`${type}_${count}`)) count++;
  return {
    id: crypto.randomUUID(),
    key: `${type}_${count}`,
    label: {
      vi: fieldTypeLabels[type],
      en: type === "person" ? "People picker" : type,
    },
    type,
    required: false,
    options: choiceTypes.includes(type)
      ? [{ value: "option_1", label: { vi: "Lựa chọn 1", en: "Option 1" } }]
      : [],
    ...(type === "person"
      ? { options: [], dataSource: { provider: "organization.people" } }
      : {}),
    ...(containerTypes.includes(type) ? { children: [] } : {}),
  };
}
export function updateFieldTree(
  fields: FormField[],
  id: string,
  update: (field: FormField) => FormField | null,
): FormField[] {
  return fields.flatMap((field) => {
    if (field.id === id) {
      const next = update(field);
      return next ? [next] : [];
    }
    return [
      {
        ...field,
        ...(field.children
          ? { children: updateFieldTree(field.children, id, update) }
          : {}),
      },
    ];
  });
}
export function duplicateField(
  field: FormField,
  existing: FormField[],
): FormField {
  const used = new Set(flattenFields(existing).map((item) => item.key));
  const replacements = new Map<string, string>();
  const clone = (item: FormField): FormField => {
    let key = `${item.key.slice(0, 48)}_copy`;
    let count = 2;
    while (used.has(key)) key = `${item.key.slice(0, 48)}_copy_${count++}`;
    used.add(key);
    replacements.set(item.key, key);
    return {
      ...structuredClone(item),
      id: crypto.randomUUID(),
      key,
      ...(item.children ? { children: item.children.map(clone) } : {}),
    };
  };
  const copy = clone(field);
  const reference = (key: string) =>
    key
      .split(".")
      .map((part) => replacements.get(part) ?? part)
      .join(".");
  const rewrite = (item: FormField): FormField => ({
    ...item,
    ...(item.uniqueBy ? { uniqueBy: reference(item.uniqueBy) } : {}),
    ...Object.fromEntries(
      (["visibleWhen", "requiredWhen", "disabledWhen"] as const)
        .filter((prop) => item[prop])
        .map((prop) => [
          prop,
          {
            ...item[prop],
            conditions: item[prop]!.conditions.map((condition) => ({
              ...condition,
              field: reference(condition.field),
            })),
          },
        ]),
    ),
    ...(item.calculation
      ? {
          calculation: {
            ...item.calculation,
            fields: item.calculation.fields.map(reference),
          },
        }
      : {}),
    ...(item.compare
      ? { compare: { ...item.compare, field: reference(item.compare.field) } }
      : {}),
    ...(item.dataSource
      ? {
          dataSource: {
            ...item.dataSource,
            dependsOn: item.dataSource.dependsOn
              ? reference(item.dataSource.dependsOn)
              : undefined,
          },
        }
      : {}),
    ...(item.children ? { children: item.children.map(rewrite) } : {}),
  });
  return rewrite(copy);
}
export { validatePreview } from "./engine";
