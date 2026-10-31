import { describe, expect, it } from "vitest";
import {
  analyzeFormCode,
  reconcileFormCode,
  codeCompletions,
  codeFieldAt,
  fieldCodeRanges,
} from "./code-model";
import { createField, type FormDefinition } from "./schema";

const child = { ...createField("number", []), id: "amount", key: "amount" };
const form: FormDefinition = {
  id: "test",
  title: { vi: "Test", en: "Test" },
  version: 1,
  status: "DRAFT",
  fields: [
    {
      ...createField("repeat", []),
      id: "lines",
      key: "lines",
      children: [child],
    },
  ],
};
describe("live schema source model", () => {
  it("keeps identity and rejects invalid schema, duplicate JSON keys and unknown properties", () => {
    expect(
      analyzeFormCode(JSON.stringify(form), "test").definition?.fields[0]
        .children?.[0],
    ).toEqual(child);
    expect(
      analyzeFormCode(JSON.stringify({ ...form, id: "other" }), "test")
        .problems[0].message,
    ).toContain("ID");
    expect(
      analyzeFormCode('{"id":"a","id":"b"}', "test").problems[0].message,
    ).toContain("trùng");
    expect(
      analyzeFormCode(JSON.stringify({ ...form, eval: "bad" }), "test")
        .definition,
    ).toBeUndefined();
    expect(
      analyzeFormCode("{", "test").problems[0].from,
    ).toBeGreaterThanOrEqual(0);
  });
  it("resolves the deepest nested field and context-aware property and enum suggestions", () => {
    const source = JSON.stringify(form, null, 2);
    const ranges = fieldCodeRanges(source);
    expect(codeFieldAt(source, ranges.get("amount")!.from + 10)).toBe("amount");
    expect(codeCompletions('{"or', 4)).toContain("orientation");
    expect(
      codeCompletions(
        '{"fields":[{"type":"cur',
        '{"fields":[{"type":"cur'.length,
      ),
    ).toContain("currency");
    expect(
      codeCompletions(
        '{"fields":[{"calculation":{"op',
        '{"fields":[{"calculation":{"op'.length,
      ),
    ).toContain("operator");
  });
});

it("patches visual edits without replacing unrelated source formatting", () => {
  const source = JSON.stringify(form, null, 4);
  const next = structuredClone(form);
  next.fields[0].children![0].label.vi = "Amount changed";
  const patched = reconcileFormCode(source, next);
  expect(JSON.parse(patched)).toEqual(next);
  expect(patched).toContain('    "title": {');
  expect(patched).toContain('"vi": "Amount changed"');
});
