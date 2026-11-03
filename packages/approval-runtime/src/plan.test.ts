import { expect, it } from "vitest";
import { compileApprovalPlan, compareDecimal, matchesCondition } from "./plan";
const person = "11111111-1111-4111-8111-111111111111";
it("normalizes UUID case and rejects duplicate assignees regardless of case", () => {
  const id = "abcdefab-abcd-4abc-8abc-abcdefabcdef";
  const plan = {
    schemaVersion: 1,
    steps: [{ id: "review", kind: "approval", assignees: [id.toUpperCase()] }],
  };
  expect(compileApprovalPlan(plan, {}).steps[0]).toEqual({
    ...plan.steps[0],
    assignees: [id],
  });
  expect(() =>
    compileApprovalPlan(
      {
        ...plan,
        steps: [{ ...plan.steps[0], assignees: [id, id.toUpperCase()] }],
      },
      {},
    ),
  ).toThrow("INVALID_ASSIGNEE");
});
it("compiles only bounded typed steps and rejects unknown code, fields, types and duplicate IDs", () => {
  const step = { id: "manager", kind: "approval", assignees: [person] };
  expect(
    compileApprovalPlan({ schemaVersion: 1, steps: [step] }, {}).steps,
  ).toEqual([step]);
  expect(() =>
    compileApprovalPlan(
      { schemaVersion: 1, steps: [{ ...step, code: "anything" }] },
      {},
    ),
  ).toThrow("INVALID_ASSIGNEE");
  expect(() =>
    compileApprovalPlan({ schemaVersion: 1, steps: [step, step] }, {}),
  ).toThrow("INVALID_STEP");
  expect(() =>
    compileApprovalPlan(
      {
        schemaVersion: 1,
        steps: [
          {
            id: "check",
            kind: "if",
            field: "unknown",
            operator: "gt",
            value: "10",
            then: [],
            else: [],
          },
        ],
      },
      { amount: "decimal" },
    ),
  ).toThrow("INVALID_CONDITION");
  expect(() =>
    compileApprovalPlan(
      {
        schemaVersion: 1,
        steps: [
          {
            id: "check",
            kind: "if",
            field: "name",
            operator: "gt",
            value: "10",
            then: [],
            else: [],
          },
        ],
      },
      { name: "text" },
    ),
  ).toThrow("INVALID_CONDITION_TYPE");
  expect(() =>
    compileApprovalPlan(
      {
        schemaVersion: 1,
        steps: [{ id: "fork", kind: "parallel", branches: [[]] }],
      },
      {},
    ),
  ).toThrow("INVALID_PARALLEL");
});
it("compares large exact decimal amounts and fails closed on missing inputs", () => {
  expect(
    compareDecimal("99999999999999999999.01", "99999999999999999999.00"),
  ).toBe(1);
  expect(compareDecimal("-0.10", "-0.1")).toBe(0);
  expect(compareDecimal("-2", "-1")).toBe(-1);
  const step = {
    id: "check",
    kind: "if" as const,
    field: "amount",
    operator: "gt" as const,
    value: "100.00",
    then: [],
    else: [],
  };
  expect(
    matchesCondition(step, { amount: "100.01" }, { amount: "decimal" }),
  ).toBe(true);
  expect(
    matchesCondition(step, { amount: "99.99" }, { amount: "decimal" }),
  ).toBe(false);
  expect(() => matchesCondition(step, {}, { amount: "decimal" })).toThrow(
    "MISSING_CONDITION_VALUE",
  );
  expect(() => compareDecimal("1e100", "1")).toThrow("INVALID_DECIMAL");
});
