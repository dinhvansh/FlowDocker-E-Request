import { expect, it } from "vitest";
import {
  exportFormDefinition,
  importFormDefinition,
  prepareValues,
  validateFormDefinition,
  validatePreview,
} from "@flowdocker/form-builder";
import { createExpenseRequestTemplate } from "./expense-request-template";

const input = {
  requester: "Demo User",
  department: "demo-it",
  beneficiary_name: "Demo Supplier",
  account_number: "DEMO-001",
  bank_name: "Demo Bank",
  transfer_description: "Synthetic payment",
  lines: [
    {
      invoice_date: "2026-01-15",
      invoice_ref: "DEMO-INV-001",
      description: "Software example",
      expense_type: "software",
      amount: "2500000",
    },
  ],
};

it("round-trips the landscape template and calculates invoice totals and settlement", () => {
  const form = createExpenseRequestTemplate();
  expect(validateFormDefinition(form)).toEqual([]);
  expect(importFormDefinition(exportFormDefinition(form))).toEqual(form);
  const values = prepareValues(form, input);
  expect(validatePreview(form, values)).toEqual([]);
  expect(values.total_payment).toBe("2500000.00");
  expect(values.difference).toBe("-2500000.00");
  expect(values.lines).toEqual([
    expect.objectContaining({
      amount_vnd: "2500000.00",
      exchange_rate: "1",
      currency_code: "VND",
    }),
  ]);
  const changed = prepareValues(form, {
    ...input,
    advance_amount: "1000000",
    advance_ref: "DEMO-ADV-001",
    lines: [
      ...input.lines,
      { ...input.lines[0], invoice_ref: "DEMO-INV-002", amount: "500000.25" },
    ],
  });
  expect(changed.total_payment).toBe("3000000.25");
  expect(changed.difference).toBe("-2000000.25");
  expect(validatePreview(form, changed)).toEqual([]);
});

it("requires invoice details and an advance reference when an advance is entered", () => {
  const form = createExpenseRequestTemplate();
  const missing = prepareValues(form, {
    ...input,
    advance_amount: "1000000",
    lines: [{ amount: "2500000" }],
  });
  const paths = validatePreview(form, missing).map((issue) => issue.path);
  expect(paths).toContain("advance_ref");
  for (const key of [
    "invoice_date",
    "invoice_ref",
    "description",
    "expense_type",
  ]) {
    expect(paths).toContain(`lines.0.${key}`);
  }
  const negative = prepareValues(form, {
    ...input,
    lines: [{ ...input.lines[0], amount: "-1" }],
  });
  expect(
    validatePreview(form, negative).some(
      (issue) => issue.path === "lines.0.amount",
    ),
  ).toBe(true);
});
