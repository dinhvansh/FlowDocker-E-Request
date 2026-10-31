import { expect, it } from "vitest";
import { buildFormAIContext, formAuthoringSchema } from "./code-assistance";
import { codeProperties } from "./code-model";
import { createField, formFieldTypes, type FormDefinition } from "./schema";
it("exports every supported configuration key and type without host runtime data", () => {
  expect(
    Object.keys(formAuthoringSchema.$defs.Field.properties).sort(),
  ).toEqual([...codeProperties.field].sort());
  expect(Object.keys(formAuthoringSchema.properties).sort()).toEqual(
    [...codeProperties.form].sort(),
  );
  expect(formAuthoringSchema.$defs.Field.properties.type).toEqual({
    enum: [...formFieldTypes],
  });
  const form: FormDefinition = {
    id: "form",
    title: { vi: "Form", en: "Form" },
    version: 1,
    status: "DRAFT",
    fields: [createField("currency", [])],
  };
  const context = buildFormAIContext(
    form,
    ["master.demo", "master.demo"],
    "Add a total",
  );
  expect(context).toContain("Add a total");
  expect(context).toContain(JSON.stringify(form, null, 2));
  expect(context).toContain('["master.demo"]');
  expect(context).not.toContain("currentUserId");
});
