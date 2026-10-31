import { describe, expect, it } from "vitest";
import { fieldConfiguration } from "./field-configuration";
import type { FormField } from "./schema";

const plain: FormField = {
  id: "demo",
  key: "demo",
  type: "text",
  label: { vi: "Mẫu", en: "Sample" },
  required: true,
  options: [],
};
describe("designer configuration presence (not validation)", () => {
  it("keeps plain required fields clear and ignores empty settings", () => {
    expect(fieldConfiguration(plain)).toEqual([]);
    expect(
      fieldConfiguration({
        ...plain,
        defaultValue: [],
        dataSource: { provider: "  " },
        visibleWhen: { mode: "all", conditions: [] },
        customRenderer: " ",
      }),
    ).toEqual([]);
    for (const defaultValue of [undefined, null, "", {}])
      expect(fieldConfiguration({ ...plain, defaultValue })).toEqual([]);
  });
  it("recognizes data sources, current creator, choices and meaningful defaults including false/zero", () => {
    for (const patch of [
      { defaultValue: 0 },
      { defaultValue: false },
      { defaultValue: ["id"] },
      { defaultValueSource: "currentUser" as const },
      { dataSource: { provider: "demo.people" } },
      { options: [{ value: "a", label: { vi: "A", en: "A" } }] },
    ])
      expect(fieldConfiguration({ ...plain, ...patch })).toContain("data");
  });
  it("recognizes every rule, comparison and incomplete calculation as configured", () => {
    for (const key of ["visibleWhen", "requiredWhen", "disabledWhen"] as const)
      expect(
        fieldConfiguration({
          ...plain,
          [key]: {
            mode: "all",
            conditions: [{ field: "other", operator: "eq", value: 0 }],
          },
        }),
      ).toEqual(["conditions"]);
    expect(
      fieldConfiguration({
        ...plain,
        compare: { field: "other", operator: "eq" },
        calculation: { operator: "add", fields: [] },
      }),
    ).toEqual(["conditions", "calculation"]);
  });
  it("marks validation and custom renderer, removes indicators when cleared, and does not inherit child settings", () => {
    const configured = {
      ...plain,
      min: 0,
      customRenderer: "demo.renderer",
      children: [{ ...plain, defaultValue: "nested" }],
    };
    const before = JSON.stringify(configured);
    expect(fieldConfiguration(configured)).toEqual(["validation", "advanced"]);
    expect(
      fieldConfiguration({
        ...configured,
        min: undefined,
        customRenderer: undefined,
      }),
    ).toEqual([]);
    expect(JSON.stringify(configured)).toBe(before);
  });
});
