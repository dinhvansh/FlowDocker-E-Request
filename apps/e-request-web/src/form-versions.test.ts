import { expect, it } from "vitest";
import {
  createField,
  validateFormDefinition,
  type FormDefinition,
} from "@flowdocker/form-builder";
import {
  captureFormVersion,
  compareFormVersions,
  createFromTemplate,
  formVersionsKey,
  readFormVersions,
  removeFormVersion,
} from "./form-versions";
const form = (): FormDefinition => ({
  id: "test",
  title: { vi: "Mẫu", en: "Sample" },
  version: 1,
  status: "DRAFT",
  fields: [
    { ...createField("text", []), id: "one", key: "one" },
    { ...createField("text", []), id: "two", key: "two" },
  ],
});
const storage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
};
it("captures immutable configuration and deletes only the chosen snapshot", () => {
  const store = storage(),
    original = form();
  const first = captureFormVersion(store, original, " First ");
  original.title.en = "Edited";
  expect(readFormVersions(store)[0].definition.title.en).toBe("Sample");
  first[0].definition.fields = [];
  expect(readFormVersions(store)[0].definition.fields).toHaveLength(2);
  const second = captureFormVersion(store, original, "Second");
  expect(second).toHaveLength(2);
  expect(removeFormVersion(store, second[0].id).map((v) => v.label)).toEqual([
    "First",
  ]);
});
it("rejects corrupt, invalid and over-limit writes without erasing existing storage", () => {
  const store = storage();
  store.setItem(formVersionsKey, "broken");
  expect(() => captureFormVersion(store, form(), "test")).toThrow();
  expect(store.getItem(formVersionsKey)).toBe("broken");
  const bounded = storage();
  for (let index = 0; index < 20; index++)
    captureFormVersion(bounded, form(), String(index));
  const before = bounded.getItem(formVersionsKey);
  expect(() => captureFormVersion(bounded, form(), "21")).toThrow();
  expect(bounded.getItem(formVersionsKey)).toBe(before);
  expect(() =>
    captureFormVersion(bounded, { ...form(), fields: [] }, "Invalid"),
  ).toThrow();
  expect(bounded.getItem(formVersionsKey)).toBe(before);
  expect(() =>
    captureFormVersion(
      {
        getItem: () => null,
        setItem: () => {
          throw Error("quota");
        },
      },
      form(),
      "Fail",
    ),
  ).toThrow();
});
it("clones template identities while preserving calculation references and layout", () => {
  const template = form();
  template.fields[0] = { ...template.fields[0], type: "number" };
  template.fields[1] = {
    ...template.fields[1],
    type: "number",
    calculation: { operator: "sum", fields: ["one"] },
  };
  const before = JSON.stringify(template),
    copy = createFromTemplate(template, { vi: "Bản mới", en: "New" });
  expect(copy.id).not.toBe(template.id);
  expect(copy.fields[0].id).not.toBe(template.fields[0].id);
  expect(copy.fields[1].calculation?.fields).toEqual(["one"]);
  expect(validateFormDefinition(copy)).toEqual([]);
  expect(JSON.stringify(template)).toBe(before);
});
it("compares metadata, positions, additions/removals and form settings without object-order noise", () => {
  const original = form();
  const next = {
    ...original,
    title: { en: "Changed", vi: "Mẫu" },
    fields: [
      { ...original.fields[1], required: true },
      { ...createField("number", []), id: "three", key: "three" },
    ],
  };
  const diff = compareFormVersions(original, next);
  expect(diff.settings).toEqual(["title"]);
  expect(diff.fields.map((f) => [f.id, f.kind])).toEqual([
    ["one", "removed"],
    ["two", "changed"],
    ["three", "added"],
  ]);
  expect(diff.fields[1].properties).toEqual(["required", "position"]);
  expect(
    compareFormVersions(original, {
      ...original,
      title: { en: "Sample", vi: "Mẫu" },
    }),
  ).toEqual({ settings: [], fields: [] });
});
