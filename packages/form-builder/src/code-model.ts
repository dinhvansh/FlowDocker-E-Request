import {
  findNodeAtLocation,
  findNodeAtOffset,
  getLocation,
  getNodeValue,
  parseTree,
  modify,
  applyEdits,
  printParseErrorCode,
  type Node,
  type ParseError,
} from "jsonc-parser";
import {
  formFieldTypes,
  isFormDefinition,
  validateFormDefinition,
  type FormDefinition,
} from "./schema";

export interface CodeProblem {
  from: number;
  to: number;
  message: string;
  params?: Record<string, string | number>;
}
export interface CodeAnalysis {
  definition?: FormDefinition;
  problems: CodeProblem[];
}
function boundedTree(text: string, errors: ParseError[] = []) {
  if (text.length > 1000000) return undefined;
  try {
    return parseTree(text, errors, {
      disallowComments: true,
      allowTrailingComma: false,
    });
  } catch {
    return undefined;
  }
}

/** Patch only changed JSON paths; retain unrelated whitespace and authored ordering. */
export function reconcileFormCode(
  source: string,
  next: FormDefinition,
): string {
  let result = source;
  let previous: unknown;
  try {
    previous = JSON.parse(source);
  } catch {
    return JSON.stringify(next, null, 2);
  }
  const patch = (
    before: unknown,
    after: unknown,
    path: (string | number)[],
  ) => {
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    if (
      before &&
      after &&
      typeof before === "object" &&
      typeof after === "object" &&
      !Array.isArray(before) &&
      !Array.isArray(after)
    ) {
      const a = before as Record<string, unknown>,
        b = after as Record<string, unknown>;
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
        patch(a[key], b[key], [...path, key]);
    } else if (
      Array.isArray(before) &&
      Array.isArray(after) &&
      before.length === after.length
    ) {
      after.forEach((value, index) =>
        patch(before[index], value, [...path, index]),
      );
    } else {
      result = applyEdits(
        result,
        modify(result, path, after, {
          formattingOptions: {
            insertSpaces: true,
            tabSize: 2,
            eol: source.includes("\r\n") ? "\r\n" : "\n",
          },
        }),
      );
    }
  };
  patch(previous, next, []);
  return result;
}
export const codeProperties = {
  form: [
    "id",
    "title",
    "version",
    "status",
    "fields",
    "schemaVersion",
    "display",
    "orientation",
    "currency",
    "spacing",
    "decoration",
  ],
  field: [
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
    "disabled",
    "multiple",
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
    "aggregation",
    "children",
    "columns",
    "columnRatios",
    "hideLabel",
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
    "presentation",
  ],
  text: ["vi", "en"],
  spacing: ["rowGap", "columnGap", "sectionGap", "sectionPadding"],
  decoration: ["header", "footer"],
  header: ["enabled", "columns", "divider", "cells"],
  footer: ["enabled", "columns", "divider", "cells"],
  bandCell: ["kind", "align", "text", "size", "bold", "image", "imageWidth"],
  presentation: ["align", "size", "bold", "image", "imageWidth"],
  calculation: ["operator", "fields", "expression", "precision"],
  rule: ["mode", "conditions"],
  condition: ["field", "operator", "value"],
  compare: ["field", "operator"],
  dataSource: ["provider", "dependsOn", "valueField", "labelField"],
  numbering: ["segments", "sequenceDigits", "scope"],
  segment: ["kind", "value"],
  option: ["value", "label"],
} as const;

function objectKeys(path: (string | number)[]): readonly string[] {
  const last = path.at(-1);
  const parent = path.at(-2);
  if (!path.length) return codeProperties.form;
  if (typeof last === "number") {
    if (parent === "cells") return codeProperties.bandCell;
    if (parent === "fields" || parent === "children")
      return codeProperties.field;
    if (parent === "conditions") return codeProperties.condition;
    if (parent === "segments") return codeProperties.segment;
    if (parent === "options") return codeProperties.option;
  }
  if (["title", "label", "help", "placeholder"].includes(String(last)))
    return codeProperties.text;
  if (["visibleWhen", "requiredWhen", "disabledWhen"].includes(String(last)))
    return codeProperties.rule;
  return codeProperties[last as keyof typeof codeProperties] ?? [];
}
export function codeCompletions(text: string, offset: number) {
  const location = getLocation(text, offset);
  const path = location.path;
  const property = path.at(-1);
  if (location.isAtPropertyKey) return objectKeys(path.slice(0, -1));
  switch (property) {
    case "align":
      return ["left", "center", "right"];
    case "size":
      return ["body", "subtitle", "title"];
    case "type":
      return formFieldTypes;
    case "status":
      return ["DRAFT"];
    case "orientation":
      return ["portrait", "landscape"];
    case "display":
      return ["form", "wizard"];
    case "aggregation":
      return ["none", "sum", "average", "min", "max", "count"];
    case "defaultValueSource":
      return [
        "currentUser",
        "currentUser.name",
        "currentUser.email",
        "currentUser.employeeCode",
        "currentUser.department",
        "currentUser.position",
        "currentUser.managerName",
        "currentUser.managerId",
      ];
    case "mode":
      return ["all", "any"];
    case "operator":
      return path.at(-2) === "calculation"
        ? [
            "add",
            "subtract",
            "multiply",
            "divide",
            "sum",
            "average",
            "count",
            "min",
            "max",
          ]
        : [
            "eq",
            "ne",
            "gt",
            "gte",
            "lt",
            "lte",
            "empty",
            "notEmpty",
            "contains",
          ];
    case "scope":
      return ["app", "year"];
    case "kind":
      if (path.includes("decoration")) return ["title", "text", "image"];
      return [
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
      ];
    case "tone":
      return ["info", "warning", "danger", "success"];
    case "buttonAction":
      return ["submit", "reset"];
    default:
      return [];
  }
}
export function fieldCodeRanges(text: string) {
  const ranges = new Map<string, { from: number; to: number }>();
  const tree = boundedTree(text);
  const visit = (node: Node | undefined) => {
    for (const child of node?.children ?? []) {
      const id = findNodeAtLocation(child, ["id"]);
      if (id?.type === "string")
        ranges.set(String(id.value), {
          from: child.offset,
          to: child.offset + child.length,
        });
      visit(findNodeAtLocation(child, ["children"]));
    }
  };
  visit(tree && findNodeAtLocation(tree, ["fields"]));
  return ranges;
}
export function codeFieldAt(text: string, offset: number): string | undefined {
  return [...fieldCodeRanges(text)]
    .filter(([, r]) => offset >= r.from && offset <= r.to)
    .sort((a, b) => a[1].to - a[1].from - (b[1].to - b[1].from))[0]?.[0];
}
export function analyzeFormCode(text: string, formId: string): CodeAnalysis {
  if (text.length > 1000000)
    return { problems: [{ from: 0, to: 1, message: "Schema vượt quá 1 MB." }] };
  const errors: ParseError[] = [];
  const tree = boundedTree(text, errors);
  if (errors.length)
    return {
      problems: errors.map((e) => ({
        from: e.offset,
        to: e.offset + Math.max(1, e.length),
        message: "Lỗi JSON: {{reason}}",
        params: { reason: printParseErrorCode(e.error) },
      })),
    };
  if (!tree)
    return {
      problems: [{ from: 0, to: 0, message: "Cấu trúc biểu mẫu chưa hợp lệ." }],
    };
  const problems: CodeProblem[] = [];
  let visited = 0;
  const check = (node: Node, path: (string | number)[]) => {
    if (++visited > 100000 || path.length > 30) {
      if (!problems.length)
        problems.push({
          from: node.offset,
          to: node.offset + 1,
          message: "Dữ liệu biểu mẫu vượt giới hạn xử lý.",
        });
      return;
    }
    if (path.includes("defaultValue")) return;
    if (node.type === "object") {
      const keys = new Set<string>();
      for (const prop of node.children ?? []) {
        const key = prop.children![0];
        if (keys.has(key.value))
          problems.push({
            from: key.offset,
            to: key.offset + key.length,
            message: "Thuộc tính trùng: {{key}}",
            params: { key: String(key.value) },
          });
        keys.add(key.value);
        const allowed = objectKeys(path);
        if (allowed.length && !allowed.includes(String(key.value)))
          problems.push({
            from: key.offset,
            to: key.offset + key.length,
            message: "Thuộc tính không hỗ trợ: {{key}}",
            params: { key: String(key.value) },
          });
        check(prop.children![1], [...path, String(key.value)]);
      }
    } else if (node.type === "array")
      node.children?.forEach((child, index) => check(child, [...path, index]));
  };
  check(tree, []);
  if (problems.length) return { problems };
  const value: unknown = getNodeValue(tree);
  if (!isFormDefinition(value))
    return {
      problems: [
        {
          from: 0,
          to: Math.min(1, text.length),
          message: "Schema không hợp lệ hoặc có thuộc tính không được hỗ trợ.",
        },
      ],
    };
  if (value.id !== formId) {
    const id = findNodeAtLocation(tree, ["id"])!;
    return {
      problems: [
        {
          from: id.offset,
          to: id.offset + id.length,
          message: "Không thể đổi ID của biểu mẫu đang mở.",
        },
      ],
    };
  }
  const ranges = fieldCodeRanges(text);
  for (const issue of validateFormDefinition(value)) {
    const range = issue.fieldId ? ranges.get(issue.fieldId) : undefined;
    problems.push({
      from: range?.from ?? 0,
      to: range?.to ?? 1,
      message: issue.message,
      params: issue.params,
    });
  }
  return {
    definition: problems.length ? undefined : { ...value, schemaVersion: 2 },
    problems,
  };
}

/** Resolve the JSON node around the cursor for integrations without executing source. */
export function codeNodeAt(
  text: string,
  offset: number,
): { type: string; offset: number; length: number } | undefined {
  const tree = boundedTree(text);
  return tree ? findNodeAtOffset(tree, offset, true) : undefined;
}
