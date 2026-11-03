import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import {
  createField,
  exportFormDefinition,
  importFormDefinition,
  isFormDefinition,
  type FormDefinition,
  type FormField,
} from "./schema";
import { documentFieldOrder, toggleDocumentRegion } from "./document-regions";
import { submissionValues, validatePreview } from "./engine";
import { FormPreview } from "./runtime";
import { moveField } from "./designer";
import { analyzeFormCode } from "./code-model";
afterEach(cleanup);
const text = (id: string): FormField => ({
  ...createField("text", []),
  id,
  key: id,
  required: false,
  label: { vi: id, en: id },
});
function fixture(): FormDefinition {
  let form: FormDefinition = {
    schemaVersion: 2,
    id: "regions",
    title: { vi: "Test", en: "Test" },
    version: 1,
    status: "DRAFT",
    fields: [text("body_one"), text("body_two")],
  };
  form = toggleDocumentRegion(toggleDocumentRegion(form, "header"), "footer");
  return {
    ...form,
    fields: form.fields.map((field) =>
      field.documentRegion
        ? {
            ...field,
            children: [
              { ...text(field.documentRegion + "_value"), required: true },
            ],
          }
        : field,
    ),
  };
}
it("round-trips unique root regions and rejects nested, duplicated or mistyped metadata", () => {
  const form = fixture();
  expect(importFormDefinition(exportFormDefinition(form))).toEqual(form);
  expect(analyzeFormCode(JSON.stringify(form), form.id).definition).toEqual(
    form,
  );
  expect(
    isFormDefinition({ ...form, fields: [...form.fields, form.fields[0]] }),
  ).toBe(false);
  expect(
    isFormDefinition({
      ...form,
      fields: [{ ...text("bad"), documentRegion: "header" }],
    }),
  ).toBe(false);
  expect(
    isFormDefinition({
      ...form,
      fields: [{ ...form.fields[0], children: [form.fields[3]] }],
    }),
  ).toBe(false);
  expect(
    isFormDefinition({
      ...form,
      fields: [{ ...text("bad"), regionEnabled: false }],
    }),
  ).toBe(false);
});
it("disables and re-enables without losing children, position or IDs", () => {
  const form = fixture(),
    original = form.fields[0];
  const off = toggleDocumentRegion(form, "header");
  expect(off.fields[0]).toEqual({ ...original, regionEnabled: false });
  expect(toggleDocumentRegion(off, "header")).toEqual(form);
  expect(
    documentFieldOrder([...form.fields].reverse()).map((f) => f.documentRegion),
  ).toEqual(["header", undefined, undefined, "footer"]);
});
it("skips required fields and submitted values in disabled regions", () => {
  const form = toggleDocumentRegion(
    toggleDocumentRegion(fixture(), "header"),
    "footer",
  );
  expect(validatePreview(form, {})).toEqual([]);
  expect(
    submissionValues(form, {
      header_value: "hidden",
      footer_value: "hidden",
      body_one: "kept",
    }),
  ).toEqual({ body_one: "kept" });
  expect(
    validatePreview(toggleDocumentRegion(form, "header"), {}).some(
      (issue) => issue.fieldId === "header_value",
    ),
  ).toBe(true);
  render(
    <I18nProvider locale="en">
      <FormPreview definition={form} values={{}} onChange={() => {}} />
    </I18nProvider>,
  );
  expect(screen.queryByRole("textbox", { name: /header_value/ })).toBeNull();
  expect(screen.getByRole("textbox", { name: "body_one" })).toBeTruthy();
});
it("moves ordinary fields into/out of regions and refuses nested document regions", () => {
  const form = fixture(),
    header = form.fields[0];
  const moved = moveField(form.fields, "body_one", header.id);
  expect(moved[0].children?.some((field) => field.id === "body_one")).toBe(
    true,
  );
  expect(moveField(moved, header.id, form.fields[3].id)).toBe(moved);
  const restored = moveField(moved, "body_one", "");
  expect(restored.some((field) => field.id === "body_one")).toBe(true);
});
it("keeps header/footer on wizard pages without creating extra steps", () => {
  const form = { ...fixture(), display: "wizard" as const };
  render(
    <I18nProvider locale="en">
      <FormPreview
        definition={form}
        values={{ header_value: "H", footer_value: "F" }}
        onChange={() => {}}
      />
    </I18nProvider>,
  );
  expect(screen.getByRole("textbox", { name: /header_value/ })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: /footer_value/ })).toBeTruthy();
  expect(screen.queryByRole("textbox", { name: "body_two" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  expect(screen.getByRole("textbox", { name: "body_two" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: /header_value/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Next/ })).toBeNull();
});
