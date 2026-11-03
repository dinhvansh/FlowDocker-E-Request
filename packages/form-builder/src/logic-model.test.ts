import { describe, it, expect } from "vitest";
import { formulaReferences, prepareValues } from "./engine";
import { logicInventory, hasLogic } from "./logic-model";
import type { FormField, FormDefinition } from "./schema";
const field = (id: string, extra: Partial<FormField> = {}): FormField => ({
  id,
  key: id,
  label: { vi: id, en: id },
  type: "number",
  required: false,
  options: [],
  ...extra,
});
describe("Logic inventory", () => {
  it("uses the actual formula tokenizer, excluding function names", () => {
    expect(
      formulaReferences("IF(qty > 2, SUM(lines.amount), qty * price)"),
    ).toEqual(["qty", "lines.amount", "price"]);
  });
  it("resolves repeat-local shadowing, aggregates, unresolved and downstream references", () => {
    const root = field("qty");
    const local = field("local", { key: "qty" });
    const total = field("total", {
      calculation: { operator: "sum", fields: [], expression: "qty * price" },
    });
    const rows = field("lines", { type: "repeat", children: [local, total] });
    const summary = field("summary", {
      calculation: { operator: "sum", fields: ["lines.total"] },
    });
    const nodes = logicInventory([root, rows, summary]);
    expect(nodes.find((n) => n.field.id === "total")?.dependencies).toEqual([
      { key: "qty", fieldId: "local" },
      { key: "price", fieldId: undefined },
    ]);
    expect(nodes.find((n) => n.field.id === "summary")?.dependencies).toEqual([
      { key: "lines.total", fieldId: "total" },
    ]);
    expect(nodes.find((n) => n.field.id === "total")?.path).toBe("lines.total");
    expect(hasLogic(total)).toBe(true);
    expect(hasLogic(root)).toBe(false);
  });
  it("keeps layout scopes transparent and scenario results on the actual engine", () => {
    const total = field("total", {
      calculation: {
        operator: "multiply",
        fields: ["qty", "price"],
        precision: 2,
      },
    });
    const form: FormDefinition = {
      id: "test",
      title: { vi: "Test", en: "Test" },
      version: 1,
      status: "DRAFT",
      fields: [
        field("qty"),
        field("price"),
        field("layout", { type: "columns", children: [total] }),
      ],
    };
    expect(
      logicInventory(form.fields).find((n) => n.field.id === "total")?.path,
    ).toBe("total");
    expect(prepareValues(form, { qty: 2, price: 15 }).total).toBe("30.00");
  });
});
