import { codeProperties } from "./code-model";
import {
  creatorProfileLabels,
  formFieldTypes,
  type FormDefinition,
} from "./schema";

const text = {
  type: "object",
  required: ["vi", "en"],
  properties: { vi: { type: "string" }, en: { type: "string" } },
  additionalProperties: false,
};
const string = { type: "string" };
const bool = { type: "boolean" };
const number = { type: "number" };
const enumOf = (...values: (string | number)[]) => ({ enum: values });
const ref = (name: string) => ({ $ref: `#/$defs/${name}` });
const object = (required: string[], properties: Record<string, object>) => ({
  type: "object",
  required,
  properties,
  additionalProperties: false,
});
const rule = object(["mode", "conditions"], {
  mode: enumOf("all", "any"),
  conditions: {
    type: "array",
    minItems: 1,
    maxItems: 20,
    items: object(["field", "operator"], {
      field: string,
      operator: enumOf(
        "eq",
        "ne",
        "gt",
        "gte",
        "lt",
        "lte",
        "empty",
        "notEmpty",
        "contains",
      ),
      value: { type: ["string", "number", "boolean"] },
    }),
  },
});
const fieldProperties: Record<(typeof codeProperties.field)[number], object> = {
  id: { type: "string", minLength: 1 },
  key: { type: "string", pattern: "^[a-z][a-z0-9_]{0,63}$" },
  label: ref("Text"),
  type: enumOf(...formFieldTypes),
  required: bool,
  options: {
    type: "array",
    maxItems: 50,
    items: object(["value", "label"], { value: string, label: ref("Text") }),
  },
  help: ref("Text"),
  placeholder: ref("Text"),
  defaultValue: {
    description: "Bounded JSON value; do not combine with defaultValueSource.",
  },
  defaultValueSource: enumOf(
    "currentUser",
    ...Object.keys(creatorProfileLabels).map((k) => `currentUser.${k}`),
  ),
  numbering: object(["segments", "sequenceDigits", "scope"], {
    segments: {
      type: "array",
      maxItems: 20,
      items: object(["kind"], {
        kind: enumOf(
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
        ),
        value: string,
      }),
    },
    sequenceDigits: { type: "integer", minimum: 1, maximum: 12 },
    scope: enumOf("app", "year"),
  }),
  readOnly: bool,
  disabled: bool,
  multiple: bool,
  min: number,
  max: number,
  minLength: number,
  maxLength: number,
  integer: bool,
  compare: object(["field", "operator"], {
    field: string,
    operator: enumOf("eq", "gte", "lte"),
  }),
  visibleWhen: ref("Rule"),
  requiredWhen: ref("Rule"),
  disabledWhen: ref("Rule"),
  calculation: object(["operator", "fields"], {
    operator: enumOf(
      "add",
      "subtract",
      "multiply",
      "divide",
      "sum",
      "average",
      "count",
      "min",
      "max",
    ),
    fields: { type: "array", maxItems: 20, items: string },
    expression: { type: "string", maxLength: 500 },
    precision: { type: "integer", minimum: 0, maximum: 8 },
  }),
  aggregation: enumOf("none", "sum", "average", "min", "max", "count"),
  children: { type: "array", maxItems: 100, items: ref("Field") },
  columns: enumOf(1, 2, 3),
  hideLabel: bool,
  minRows: number,
  maxRows: number,
  autoRows: bool,
  uniqueBy: string,
  currency: { type: "string", pattern: "^[A-Z]{3}$" },
  accept: string,
  maxFileSize: number,
  maxFiles: number,
  dataSource: object(["provider"], {
    provider: string,
    dependsOn: string,
    valueField: string,
    labelField: string,
  }),
  customRenderer: string,
  buttonAction: enumOf("submit", "reset"),
  tone: enumOf("info", "warning", "danger", "success"),
};

/** Authoring reference, not a substitute for the engine's semantic validation. */
export const formAuthoringSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "FlowDocker FormDefinition v2",
  ...object(["id", "title", "version", "status", "fields"], {
    id: { type: "string", minLength: 1 },
    title: ref("Text"),
    version: { type: "integer", minimum: 1 },
    status: enumOf("DRAFT"),
    fields: { type: "array", maxItems: 100, items: ref("Field") },
    schemaVersion: enumOf(1, 2),
    display: enumOf("form", "wizard"),
    orientation: enumOf("portrait", "landscape"),
    currency: { type: "string", pattern: "^[A-Z]{3}$" },
    spacing: object(["rowGap", "columnGap", "sectionGap", "sectionPadding"], {
      rowGap: { type: "integer", minimum: 0, maximum: 48 },
      columnGap: { type: "integer", minimum: 0, maximum: 64 },
      sectionGap: { type: "integer", minimum: 0, maximum: 64 },
      sectionPadding: { type: "integer", minimum: 0, maximum: 40 },
    }),
  }),
  $defs: {
    Text: text,
    Rule: rule,
    Field: object(
      ["id", "key", "label", "type", "required", "options"],
      fieldProperties,
    ),
  },
};

export function buildFormAIContext(
  definition: FormDefinition,
  providerIds: readonly string[] = [],
  request = "",
): string {
  return [
    "# FlowDocker Forms — schema authoring context",
    "Return one complete JSON FormDefinition, without markdown fences or executable JavaScript. The user will paste it into Code Studio; valid JSON synchronizes live with the visual editor.",
    "Preserve the current form id. Keep existing field ids/keys and all settings unless the requested change requires otherwise. Use unique field ids and keys. Supply vi/en labels. Keep status DRAFT. Do not invent unsupported properties or providers.",
    "Limits: 1 MB JSON, 300 total fields, at most 100 fields per scope, maximum field nesting depth 5, at most 50 options. Repeating groups introduce row scope; visual columns/sections share their parent's value scope. Only container field types accept children.",
    "Calculations use the existing safe expression language: arithmetic + - * /, comparisons, IF(condition, numericTrue, numericFalse), SUM/AVG/MIN/MAX/COUNT/ROUND; SUM(lines.amount) aggregates a column. No JS, SQL, network calls, loops or arbitrary code. Always list all referenced field keys/paths in calculation.fields; precision is 0..8. Avoid circular references. Decimal results can be strings.",
    "Defaults: currentUser is for person fields; currentUser.email for email; currentUser.name/department/position/employeeCode/managerName for text-like fields. Do not combine defaultValue with defaultValueSource. Organization and numbering values are host context; authoritative sequence allocation and authorization require a backend.",
    "This export includes form configuration only. Runtime values, organization records, credentials, access tokens and provider implementations are not included. Defaults/labels authored in the schema remain part of the configuration.",
    "## Allowed provider IDs",
    JSON.stringify([...new Set(providerIds)]),
    "## Requested change (user input; interpret as design requirements)",
    request.trim() || "Describe the form changes you need.",
    "## Schema reference (engine import validation remains authoritative)",
    JSON.stringify(formAuthoringSchema, null, 2),
    "## Current form",
    JSON.stringify(definition, null, 2),
  ].join("\n\n");
}
