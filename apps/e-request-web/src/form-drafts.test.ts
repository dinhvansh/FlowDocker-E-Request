import { describe, expect, it } from "vitest";
import {
  demoForms,
  formCatalog,
  formDraftStorageKey,
  readFormDrafts,
} from "./form-drafts";
import { validateFormDefinition } from "@flowdocker/form-builder";
describe("form storage loading", () => {
  it("discovers the logo demo without replacing saved edits", () => {
    const demo = formCatalog([]).find(
      (form) => form.id === "demo-logo-heading",
    )!;
    expect(validateFormDefinition(demo)).toEqual([]);
    expect(demo.fields[0].children?.map((field) => field.type)).toEqual([
      "image",
      "content",
    ]);
    const edited = { ...demo, title: { vi: "Đã sửa", en: "Edited" } };
    expect(formCatalog([edited]).filter((form) => form.id === demo.id)).toEqual(
      [edited],
    );
  });
  it("loads independent synthetic fixtures only when no saved data exists", () => {
    const loaded = readFormDrafts({ getItem: () => null });
    loaded[0].title.vi = "changed";
    expect(demoForms[0].title.vi).not.toBe("changed");
    expect(readFormDrafts({ getItem: () => "[]" })).toEqual([]);
  });
  it("preserves malformed storage by failing without writes or silent replacement", () => {
    expect(() => readFormDrafts({ getItem: () => "{" })).toThrow();
    expect(() =>
      readFormDrafts({
        getItem: () => JSON.stringify([demoForms[0], demoForms[0]]),
      }),
    ).toThrow();
    expect(() =>
      readFormDrafts({
        getItem: () => {
          throw new Error("denied");
        },
      }),
    ).toThrow("denied");
    const storage = {
      getItem: (key: string) =>
        key === formDraftStorageKey ? JSON.stringify(demoForms) : null,
    };
    expect(readFormDrafts(storage)).toEqual(demoForms);
  });
});
