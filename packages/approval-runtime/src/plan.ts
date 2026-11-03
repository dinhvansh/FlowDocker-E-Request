export type Scalar = string | boolean;
export type ApprovalStep =
  | { id: string; kind: "approval"; assignees: string[] }
  | {
      id: string;
      kind: "if";
      field: string;
      operator: "gt" | "gte" | "eq" | "ne";
      value: Scalar;
      then: ApprovalStep[];
      else: ApprovalStep[];
    }
  | { id: string; kind: "parallel"; branches: ApprovalStep[][] };
export interface ApprovalPlan {
  schemaVersion: 1;
  steps: ApprovalStep[];
}
export type ExposedFields = Record<string, "decimal" | "text" | "boolean">;
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const decimal = /^-?\d{1,20}(?:\.\d{1,8})?$/;
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
function keys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every((key) => allowed.includes(key));
}
/** Structured, bounded plan; graph editors must compile to this representation. */
export function compileApprovalPlan(
  value: unknown,
  fields: ExposedFields,
): ApprovalPlan {
  if (
    !record(value) ||
    !keys(value, ["schemaVersion", "steps"]) ||
    value.schemaVersion !== 1
  )
    throw new Error("INVALID_PLAN");
  let count = 0;
  const ids = new Set<string>();
  const walk = (items: unknown, depth: number): ApprovalStep[] => {
    if (!Array.isArray(items) || depth > 8 || items.length > 100)
      throw new Error("INVALID_PLAN");
    return items.map((item) => {
      if (
        !record(item) ||
        ++count > 100 ||
        typeof item.id !== "string" ||
        !/^[a-z][a-z0-9_]{0,63}$/.test(item.id) ||
        ids.has(item.id)
      )
        throw new Error("INVALID_STEP");
      ids.add(item.id);
      const id = item.id;
      if (item.kind === "approval") {
        if (
          !keys(item, ["id", "kind", "assignees"]) ||
          !Array.isArray(item.assignees) ||
          !item.assignees.length ||
          item.assignees.length > 16 ||
          !item.assignees.every(
            (actor) => typeof actor === "string" && uuid.test(actor),
          ) ||
          new Set(
            item.assignees.map((actor) =>
              typeof actor === "string" ? actor.toLowerCase() : actor,
            ),
          ).size !== item.assignees.length
        )
          throw new Error("INVALID_ASSIGNEE");
        return {
          id,
          kind: "approval",
          assignees: item.assignees.map((actor: string) => actor.toLowerCase()),
        };
      }
      if (item.kind === "if") {
        if (
          !keys(item, [
            "id",
            "kind",
            "field",
            "operator",
            "value",
            "then",
            "else",
          ]) ||
          typeof item.field !== "string" ||
          !Object.hasOwn(fields, item.field) ||
          !["gt", "gte", "eq", "ne"].includes(String(item.operator))
        )
          throw new Error("INVALID_CONDITION");
        const type = fields[item.field];
        if (
          (type === "boolean" && typeof item.value !== "boolean") ||
          (type !== "boolean" && typeof item.value !== "string") ||
          (type === "decimal" && !decimal.test(String(item.value))) ||
          (type !== "decimal" && ["gt", "gte"].includes(String(item.operator)))
        )
          throw new Error("INVALID_CONDITION_TYPE");
        return {
          id,
          kind: "if",
          field: item.field,
          operator: item.operator as "gt" | "gte" | "eq" | "ne",
          value: item.value as Scalar,
          then: walk(item.then, depth + 1),
          else: walk(item.else, depth + 1),
        };
      }
      if (item.kind === "parallel") {
        if (
          !keys(item, ["id", "kind", "branches"]) ||
          !Array.isArray(item.branches) ||
          item.branches.length < 2 ||
          item.branches.length > 8 ||
          item.branches.some(
            (branch) => !Array.isArray(branch) || !branch.length,
          )
        )
          throw new Error("INVALID_PARALLEL");
        return {
          id,
          kind: "parallel",
          branches: item.branches.map((branch) => walk(branch, depth + 1)),
        };
      }
      throw new Error("UNSUPPORTED_STEP");
    });
  };
  const steps = walk(value.steps, 0);
  if (!steps.length) throw new Error("EMPTY_PLAN");
  return { schemaVersion: 1, steps };
}
/** Exact fixed-decimal comparison without floating point or executing expressions. */
export function compareDecimal(left: string, right: string): number {
  if (!decimal.test(left) || !decimal.test(right))
    throw new Error("INVALID_DECIMAL");
  const parts = (value: string) => {
    const [integer, fraction = ""] = value.replace(/^-/, "").split(".");
    return { integer, fraction, negative: value.startsWith("-") };
  };
  const a = parts(left),
    b = parts(right),
    scale = Math.max(a.fraction.length, b.fraction.length);
  const scaled = (v: ReturnType<typeof parts>) =>
    BigInt(v.integer + v.fraction.padEnd(scale, "0")) * (v.negative ? -1n : 1n);
  const x = scaled(a),
    y = scaled(b);
  return x < y ? -1 : x > y ? 1 : 0;
}
export function matchesCondition(
  step: Extract<ApprovalStep, { kind: "if" }>,
  input: Record<string, Scalar>,
  fields: ExposedFields,
): boolean {
  if (!Object.hasOwn(input, step.field))
    throw new Error("MISSING_CONDITION_VALUE");
  const value = input[step.field];
  const compared =
    fields[step.field] === "decimal"
      ? compareDecimal(String(value), String(step.value))
      : value === step.value
        ? 0
        : 1;
  return step.operator === "gt"
    ? compared > 0
    : step.operator === "gte"
      ? compared >= 0
      : step.operator === "eq"
        ? compared === 0
        : compared !== 0;
}
