import { expect, it, vi } from "vitest";
import { masterDeleteBlockers, removeLocalMaster } from "./master-deletion";
import { seedEntities, seedRoles } from "./mock";
import { organizationSeeds } from "./organization";
import { demoForms } from "./form-drafts";
import type { MasterEntity } from "@flowdocker/app-contracts";
const entity: MasterEntity = {
  ...seedEntities[0],
  id: "qa-delete",
  key: "qa_delete",
  status: "DRAFT",
  records: [],
};
const key = "flowdocker.demo.entities.v1";
it("deletes only the selected draft, persists and leaves other records unchanged", () => {
  const data = new Map([[key, JSON.stringify([seedEntities[0], entity])]]);
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  removeLocalMaster(storage, [], entity.id, (current) =>
    expect(masterDeleteBlockers(current[1], current, [], [])).toEqual([]),
  );
  expect(JSON.parse(data.get(key)!)).toEqual([seedEntities[0]]);
  expect(() => removeLocalMaster(storage, [], entity.id, () => {})).toThrow();
});
it("protects published/external/system catalogs and direct master/role/form dependencies", () => {
  expect(
    masterDeleteBlockers(seedEntities[0], seedEntities, seedRoles, demoForms)
      .length,
  ).toBeGreaterThan(0);
  expect(
    masterDeleteBlockers({ ...entity, kind: "EXTERNAL_MIRROR" }, [], [], [])
      .length,
  ).toBeGreaterThan(0);
  expect(
    masterDeleteBlockers(organizationSeeds[0], [], [], []).length,
  ).toBeGreaterThan(0);
  const reference = {
    ...entity,
    id: "other",
    fields: [{ ...entity.fields[0], referenceEntity: entity.key }],
  };
  expect(masterDeleteBlockers(entity, [reference], [], [])).toHaveLength(1);
  expect(
    masterDeleteBlockers(
      entity,
      [],
      [{ ...seedRoles[0], grants: { "master.qa_delete": ["READ"] } }],
      [],
    ),
  ).toHaveLength(1);
  const form = structuredClone(demoForms[0]);
  form.fields[0].dataSource = { provider: "master.qa-delete" };
  expect(masterDeleteBlockers(entity, [], [], [form])).toHaveLength(1);
});
it("never overwrites malformed storage, changed dependencies or a blocked write", () => {
  const setItem = vi.fn();
  for (const raw of ["{", "{}", "[null]", JSON.stringify([entity, entity])])
    expect(() =>
      removeLocalMaster(
        { getItem: () => raw, setItem },
        [],
        entity.id,
        () => {},
      ),
    ).toThrow();
  expect(setItem).not.toHaveBeenCalled();
  expect(() =>
    removeLocalMaster(
      { getItem: () => JSON.stringify([entity]), setItem },
      [],
      entity.id,
      () => {
        throw Error("new dependency");
      },
    ),
  ).toThrow("new dependency");
  expect(setItem).not.toHaveBeenCalled();
  expect(() =>
    removeLocalMaster(
      {
        getItem: () => null,
        setItem: () => {
          throw Error("blocked");
        },
      },
      [entity],
      entity.id,
      () => {},
    ),
  ).toThrow("blocked");
});
