import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import {
  createField,
  exportFormDefinition,
  importFormDefinition,
  isFormDefinition,
  type FormDefinition,
} from "./schema";
import { ContentBlock } from "./components/content-block";
import {
  defaultValues,
  prepareValues,
  submissionValues,
  validatePreview,
} from "./engine";
import { resolveFormInsertion } from "./insertion";
import { analyzeFormCode, codeCompletions } from "./code-model";
const form = (): FormDefinition => ({
  id: "blocks",
  title: { vi: "Thử", en: "Test" },
  version: 1,
  status: "DRAFT",
  schemaVersion: 2,
  fields: [
    createField("content", []),
    createField("image", []),
    createField("divider", []),
  ],
});
afterEach(cleanup);
describe("presentation blocks and insertion targets", () => {
  it("round-trips blocks, nested columns and presentation in schema and code", () => {
    const f = form();
    f.fields[1].presentation = {
      align: "right",
      size: "body",
      bold: false,
      image: "data:image/png;base64,AAAA",
      imageWidth: 480,
    };
    const columns = createField("columns", f.fields);
    columns.hideLabel = true;
    columns.children = f.fields;
    f.fields = [columns];
    expect(importFormDefinition(exportFormDefinition(f))).toEqual(f);
    expect(analyzeFormCode(JSON.stringify(f), f.id).definition).toEqual(f);
    const prompt = '{"fields":[{"presentation":{"';
    expect(codeCompletions(prompt, prompt.length)).toContain("imageWidth");
    columns.hideLabel = "yes" as unknown as boolean;
    expect(isFormDefinition(f)).toBe(false);
  });
  it("rejects unsafe or unbounded image presentation", () => {
    for (const image of [
      "https://example.com/a.png",
      "data:image/svg+xml;base64,AAAA",
      "data:image/png;base64," + "A".repeat(140000),
    ]) {
      const f = form();
      f.fields[1].presentation = {
        align: "left",
        size: "body",
        bold: false,
        image,
      };
      expect(isFormDefinition(f)).toBe(false);
    }
    const f = form();
    f.fields[1].presentation = {
      align: "left",
      size: "body",
      bold: false,
      imageWidth: 641,
    };
    expect(isFormDefinition(f)).toBe(false);
  });
  it("never treats presentation as input, required values or submitted data", () => {
    const f = form();
    f.fields.forEach((field) => {
      field.required = true;
      field.defaultValue = "unexpected";
    });
    const input = Object.fromEntries(
      f.fields.map((field) => [field.key, "injected"]),
    );
    expect(defaultValues(f.fields)).toEqual({});
    expect(prepareValues(f, input)).toEqual({});
    expect(validatePreview(f, {})).toEqual([]);
    expect(submissionValues(f, input)).toEqual({});
  });
  it("renders localized escaped text, image alt and a divider", () => {
    const f = form();
    f.fields[0].label.en = "<b>Title</b>";
    f.fields[1].label.en = "Demo logo";
    f.fields[1].presentation = {
      align: "center",
      size: "body",
      bold: false,
      image: "data:image/png;base64,AAAA",
    };
    render(
      <I18nProvider locale="en">
        {f.fields.map((field) => (
          <ContentBlock key={field.id} field={field} />
        ))}
      </I18nProvider>,
    );
    expect(screen.getByText("<b>Title</b>")).toBeTruthy();
    expect(document.querySelector("b")).toBeNull();
    expect(screen.getByRole("img", { name: "Demo logo" })).toBeTruthy();
    expect(screen.getByRole("separator")).toBeTruthy();
  });
  it("resolves root and nested before/after placement including removal during a move", () => {
    const a = createField("text", []),
      b = createField("columns", []),
      c = createField("number", []);
    const child = createField("image", []);
    b.children = [child];
    const fields = [a, b, c];
    expect(resolveFormInsertion(fields, { edge: "start" })).toEqual({
      parentId: "",
      index: 0,
    });
    expect(resolveFormInsertion(fields, { edge: "end" }, a.id)).toEqual({
      parentId: "",
      index: 2,
    });
    expect(
      resolveFormInsertion(fields, { fieldId: b.id, edge: "before" }),
    ).toEqual({ parentId: "", index: 1 });
    expect(
      resolveFormInsertion(fields, { fieldId: b.id, edge: "after" }, a.id),
    ).toEqual({ parentId: "", index: 1 });
    expect(
      resolveFormInsertion(fields, { fieldId: child.id, edge: "before" }),
    ).toEqual({ parentId: b.id, index: 0 });
    expect(
      resolveFormInsertion(fields, { fieldId: a.id, edge: "before" }, a.id),
    ).toBeUndefined();
  });
});
