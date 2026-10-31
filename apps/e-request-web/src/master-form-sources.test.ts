import { expect, it } from "vitest";
import type { MasterEntity } from "@flowdocker/app-contracts";
import { masterFormSources } from "./master-form-sources";

const entity: MasterEntity = {
  id: "catalog-id",
  key: "catalog",
  name: "Synthetic catalog",
  kind: "LOCAL_CATALOG",
  sourceOwner: "Demo",
  businessOwner: "Demo",
  scope: "TENANT",
  version: 1,
  status: "DRAFT",
  fields: [
    {
      id: "code",
      key: "code",
      label: "Code",
      type: "text",
      classification: "INTERNAL",
      required: true,
    },
    {
      id: "name",
      key: "name",
      label: "Name",
      type: "text",
      classification: "PUBLIC",
      required: true,
    },
    {
      id: "bank",
      key: "bank",
      label: "Sensitive",
      type: "text",
      classification: "SENSITIVE",
      required: false,
    },
    {
      id: "active",
      key: "active",
      label: "Active",
      type: "boolean",
      classification: "INTERNAL",
      required: false,
    },
  ],
  records: [
    { code: "A1", name: "Synthetic one", bank: "DO-NOT-RETURN", active: true },
    { code: "A2", name: "Synthetic two", active: false },
  ],
};
function read(
  value = entity,
  mapping = { valueField: "code", labelField: "name" },
  query = "",
) {
  const { sources, providers } = masterFormSources([value]);
  return providers[sources[0].id]({
    query,
    dependency: undefined,
    signal: new AbortController().signal,
    ...mapping,
  });
}
it("registers stable catalog IDs and safe metadata; reads current active records as IDs and labels only", async () => {
  const before = JSON.stringify(entity);
  const { sources } = masterFormSources([entity]);
  expect(sources[0].mapping?.fields.map((field) => field.key)).toEqual([
    "code",
    "name",
  ]);
  expect(sources[0].mapping?.defaultValueField).toBe("code");
  expect(
    masterFormSources([{ ...entity, name: "Renamed", key: "renamed" }])
      .sources[0].id,
  ).toBe(sources[0].id);
  expect(await read()).toEqual([
    { value: "A1", label: { vi: "Synthetic one", en: "Synthetic one" } },
  ]);
  expect(JSON.stringify(await read())).not.toContain("DO-NOT-RETURN");
  expect(await read(entity, undefined, "not-found")).toEqual([]);
  expect(
    await read({ ...entity, records: [{ code: "A1", name: "Updated" }] }),
  ).toEqual([{ value: "A1", label: { vi: "Updated", en: "Updated" } }]);
  expect(JSON.stringify(entity)).toBe(before);
});
it("fails closed on sensitive/missing mappings, duplicates and blank keys instead of inventing IDs", async () => {
  for (const mapping of [
    { valueField: "bank", labelField: "name" },
    { valueField: "code", labelField: "gone" },
    { valueField: "", labelField: "name" },
  ])
    await expect(read(entity, mapping)).rejects.toThrow();
  for (const records of [
    [
      { code: "A", name: "One" },
      { code: "A", name: "Two" },
    ],
    [{ code: "", name: "Blank" }],
    [{ code: "__fd_clear__", name: "Reserved" }],
    [{ name: "Missing" }],
  ])
    await expect(read({ ...entity, records })).rejects.toThrow();
});
it("keeps numeric zero IDs, supports empty/new catalogs, and never proposes row indexes or names as IDs", async () => {
  expect(
    (await read({ ...entity, records: [{ code: 0, name: "Zero" }] }))[0].value,
  ).toBe("0");
  expect(await read({ ...entity, records: [] })).toEqual([]);
  const source = masterFormSources([
    {
      ...entity,
      fields: entity.fields.filter((field) => field.key !== "code"),
    },
  ]).sources[0];
  expect(source.mapping?.defaultValueField).toBeUndefined();
  expect(
    masterFormSources([entity, { ...entity, id: "second" }]).sources,
  ).toHaveLength(2);
});
