import { describe, expect, it } from "vitest";
import { createPaymentDefinition } from "./payment-example";
import {
  isFormDefinition,
  exportFormDefinition,
  importFormDefinition,
  validateFormDefinition,
  validatePreview,
  type FormDefinition,
} from "./schema";
const form: FormDefinition = {
  id: "test",
  title: { vi: "Mẫu", en: "Sample" },
  version: 1,
  status: "DRAFT",
  fields: [
    {
      id: "qty",
      key: "quantity",
      label: { vi: "Số lượng", en: "Quantity" },
      type: "number",
      required: true,
      options: [],
    },
    {
      id: "kind",
      key: "kind",
      label: { vi: "Loại", en: "Kind" },
      type: "select",
      required: false,
      options: [{ value: "it", label: { vi: "IT", en: "IT" } }],
    },
    {
      id: "day",
      key: "day",
      label: { vi: "Ngày", en: "Day" },
      type: "date",
      required: false,
      options: [],
    },
    {
      id: "yes",
      key: "yes",
      label: { vi: "Đồng ý", en: "Agree" },
      type: "checkbox",
      required: true,
      options: [],
    },
  ],
};
describe("form draft and preview boundaries", () => {
  it("round-trips optional form orientation and rejects unknown values", () => {
    expect(isFormDefinition(form)).toBe(true);
    for (const orientation of ["portrait", "landscape"] as const) {
      const next = { ...form, orientation };
      expect(validateFormDefinition(next)).toEqual([]);
      expect(importFormDefinition(exportFormDefinition(next)).orientation).toBe(
        orientation,
      );
    }
    expect(isFormDefinition({ ...form, orientation: "diagonal" })).toBe(false);
  });
  it("keeps the full payment fixture valid with distinct repeat and root descriptions", () => {
    expect(validateFormDefinition(createPaymentDefinition())).toEqual([]);
  });
  it("rejects malformed persisted shapes but allows repairable incomplete schemas", () => {
    expect(isFormDefinition({ ...form, fields: [null] })).toBe(false);
    expect(
      isFormDefinition({
        ...form,
        fields: [{ ...form.fields[0], options: [null] }],
      }),
    ).toBe(false);
    expect(isFormDefinition({ ...form, fields: [] })).toBe(true);
    expect(validateFormDefinition({ ...form, fields: [] })).toHaveLength(1);
  });
  it("rejects duplicate and reserved keys, missing bilingual labels and option collisions", () => {
    const invalid = structuredClone(form);
    invalid.fields[0].key = "constructor";
    invalid.fields[1].key = "constructor";
    invalid.fields[1].options.push(invalid.fields[1].options[0]);
    invalid.fields[0].label.en = "";
    expect(validateFormDefinition(invalid).length).toBeGreaterThanOrEqual(5);
  });
  it("accepts zero and valid leap days; rejects non-finite, wrong types, unknown choices and impossible dates", () => {
    expect(
      validatePreview(form, {
        quantity: "0",
        kind: "it",
        day: "2024-02-29",
        yes: true,
      }),
    ).toEqual([]);
    const errors = validatePreview(form, {
      quantity: "Infinity",
      kind: "admin",
      day: "2025-02-29",
      yes: false,
    });
    expect(new Set(errors.map((issue) => issue.fieldId))).toEqual(
      new Set(["qty", "kind", "day", "yes"]),
    );
    expect(
      validatePreview(form, { quantity: true, yes: "true" }).map(
        (issue) => issue.fieldId,
      ),
    ).toContain("qty");
    expect(
      validatePreview(form, {}).some((issue) => issue.fieldId === "qty"),
    ).toBe(true);
  });
});
