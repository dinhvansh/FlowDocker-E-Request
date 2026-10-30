import { expect, it, vi } from "vitest";
import type { MasterEntity, MasterField } from "@flowdocker/app-contracts";
import { assertRecordChange } from "@flowdocker/master-builder";
import { recordFieldError } from "../../../packages/master-builder/src/record-validation";
import { saveLocalMasterRecords } from "./master-records";
const field: MasterField = {
  id: "code",
  key: "code",
  label: "Code",
  type: "text",
  required: true,
  classification: "PUBLIC",
};
const entity: MasterEntity = {
  id: "qa_records",
  key: "qa_records",
  name: "Synthetic records",
  kind: "LOCAL_CATALOG",
  scope: "TENANT",
  status: "PUBLISHED",
  version: 4,
  businessOwner: "Demo",
  sourceOwner: "Demo",
  fields: [field, { ...field, id: "name", key: "name", label: "Name" }],
  records: [
    { code: "A", name: "Alpha" },
    { code: "B", name: "Beta" },
  ],
};
const key = "flowdocker.demo.entities.v1";
it("strictly edits/adds/deletes one local row and preserves schema/status/version and unrelated entities", () => {
  const other = { ...entity, id: "other", key: "other" };
  let raw = JSON.stringify([entity, other]);
  const storage = {
    getItem: () => raw,
    setItem: (_k: string, v: string) => {
      raw = v;
    },
  };
  let expected = entity;
  for (const records of [
    [{ code: "A", name: "Changed" }, entity.records[1]],
    [
      { code: "A", name: "Changed" },
      entity.records[1],
      { code: "C", name: "Gamma" },
    ],
    [{ code: "A", name: "Changed" }, entity.records[1]],
  ]) {
    saveLocalMasterRecords(storage, [entity, other], expected, records);
    const saved = JSON.parse(raw);
    expect(saved[0]).toEqual({ ...expected, records });
    expect(saved[1]).toEqual(other);
    expected = saved[0];
  }
});
it("rejects malformed storage, duplicate IDs, vanished entities, stale edits and write errors without replacing data", () => {
  const setItem = vi.fn();
  for (const raw of [
    "{",
    "{}",
    "[null]",
    JSON.stringify([entity, entity]),
    "[]",
    JSON.stringify([{ ...entity, records: [] }]),
  ])
    expect(() =>
      saveLocalMasterRecords(
        { getItem: () => raw, setItem },
        [entity],
        entity,
        [entity.records[0]],
      ),
    ).toThrow();
  expect(setItem).not.toHaveBeenCalled();
  expect(() =>
    saveLocalMasterRecords(
      {
        getItem: () => JSON.stringify([entity]),
        setItem: () => {
          throw Error("quota");
        },
      },
      [entity],
      entity,
      [entity.records[0]],
    ),
  ).toThrow("quota");
});
it("denies external writes, duplicate keys, invalid types and multiple-row changes", () => {
  expect(() =>
    assertRecordChange({ ...entity, kind: "EXTERNAL_MIRROR" }, [], []),
  ).toThrow();
  expect(() =>
    assertRecordChange(
      entity,
      [...entity.records, { code: "A", name: "New" }],
      [],
    ),
  ).toThrow();
  expect(() =>
    assertRecordChange(
      entity,
      [
        { code: "C", name: "New" },
        { code: "D", name: "Newer" },
      ],
      [],
    ),
  ).toThrow();
  for (const [type, value] of [
    ["number", NaN],
    ["number", "12"],
    ["date", "2026-02-30"],
    ["boolean", "false"],
    ["reference", "missing"],
  ] as const)
    expect(
      recordFieldError(
        { ...field, type, referenceEntity: entity.id },
        value,
        entity,
        [entity],
      ),
    ).toBeTruthy();
  expect(
    recordFieldError({ ...field, type: "boolean" }, false, entity, []),
  ).toBeUndefined();
  expect(
    recordFieldError({ ...field, type: "number" }, 0, entity, []),
  ).toBeUndefined();
  expect(
    recordFieldError({ ...field, type: "date" }, "2024-02-29", entity, []),
  ).toBeUndefined();
});
it("preserves legacy properties and stable IDs, and blocks referenced deletes/key changes", () => {
  const reference = {
    ...entity,
    id: "ref",
    key: "ref",
    fields: [
      { ...field, type: "reference" as const, referenceEntity: entity.id },
    ],
    records: [{ code: "A" }],
  };
  expect(() =>
    assertRecordChange(entity, [entity.records[1]], [entity, reference]),
  ).toThrow("referenced");
  expect(() =>
    assertRecordChange(
      entity,
      [{ code: "C", name: "A" }, entity.records[1]],
      [entity, reference],
    ),
  ).toThrow("referenced");
  expect(() =>
    assertRecordChange(
      entity,
      [{ code: "A", name: "Changed" }, entity.records[1]],
      [entity, reference],
    ),
  ).not.toThrow();
  const legacy = {
    ...entity,
    records: [{ id: "stable", code: "A", name: "Alpha", old: "keep" }],
  };
  expect(() =>
    assertRecordChange(legacy, [{ ...legacy.records[0], id: "new" }], []),
  ).toThrow();
  expect(() =>
    assertRecordChange(legacy, [{ ...legacy.records[0], old: "changed" }], []),
  ).toThrow();
  expect(() =>
    assertRecordChange(legacy, [{ ...legacy.records[0], name: "Changed" }], []),
  ).not.toThrow();
});
it("falls back to current synthetic snapshot only when storage is absent", () => {
  const setItem = vi.fn();
  saveLocalMasterRecords({ getItem: () => null, setItem }, [entity], entity, [
    entity.records[0],
  ]);
  expect(
    JSON.parse(setItem.mock.calls[0][1]).find(
      (e: MasterEntity) => e.id === entity.id,
    ).records,
  ).toEqual([entity.records[0]]);
  expect(setItem.mock.calls[0][0]).toBe(key);
});
