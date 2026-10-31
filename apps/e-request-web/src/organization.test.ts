import { describe, expect, it } from "vitest";
import { validateEntity } from "@flowdocker/app-contracts";
import {
  exportFormDefinition,
  importFormDefinition,
  validateFormDefinition,
  validatePreview,
} from "@flowdocker/form-builder";
import {
  organizationDirectory,
  organizationForm,
  organizationSeeds,
  peopleOptions,
  withOrganizationSamples,
} from "./organization";

describe("synthetic organization and people contract", () => {
  it("provides coherent catalogs, distinct manager/head relationships and inactive exclusion", () => {
    organizationSeeds.forEach((entity) =>
      expect(validateEntity(entity)).toEqual([]),
    );
    const { people, departments } = organizationDirectory(organizationSeeds);
    const employee = people.find((person) => person.id === "person_04")!;
    const department = departments.find(
      (row) => row.id === employee.departmentId,
    )!;
    expect(employee.managerId).not.toBe(department.headId);
    expect(
      peopleOptions(organizationSeeds).some(
        (person) => person.value === "person_08",
      ),
    ).toBe(false);
    expect(peopleOptions(organizationSeeds)).toHaveLength(7);
    for (const person of people) {
      expect(departments.some((row) => row.id === person.departmentId)).toBe(
        true,
      );
      const visited = new Set<string>();
      let current: typeof person | undefined = person;
      while (current) {
        expect(visited.has(current.id)).toBe(false);
        visited.add(current.id);
        const managerId: string = current.managerId;
        if (managerId)
          expect(people.some((row) => row.id === managerId)).toBe(true);
        current = people.find((row) => row.id === managerId);
      }
    }
  });
  it("preserves saved records and uses edited local masters for picker suggestions", () => {
    const saved = structuredClone(organizationSeeds[1]);
    saved.records[0].name = "Edited sample";
    const merged = withOrganizationSamples([saved]);
    expect(merged.find((row) => row.id === saved.id)).toBe(saved);
    expect(peopleOptions(merged)[0].label.vi).toBe("Edited sample");
    expect(merged).toHaveLength(2);
    expect(withOrganizationSamples(merged)).toEqual(merged);
  });
  it("roundtrips person fields and validates required, IDs, multi duplicates and inactive IDs", () => {
    expect(validateFormDefinition(organizationForm)).toEqual([]);
    expect(
      importFormDefinition(exportFormDefinition(organizationForm)),
    ).toEqual(organizationForm);
    const ids = peopleOptions(organizationSeeds).map((person) => person.value);
    const supplied = { requester: ids, colleagues: ids };
    expect(
      validatePreview(organizationForm, {}, {}, supplied).length,
    ).toBeGreaterThan(0);
    expect(
      validatePreview(
        organizationForm,
        { requester: "person_04", colleagues: ["person_02", "person_03"] },
        {},
        supplied,
      ),
    ).toEqual([]);
    for (const colleagues of [
      ["person_08"],
      ["person_02", "person_02"],
      "person_02",
    ]) {
      expect(
        validatePreview(
          organizationForm,
          { requester: "person_04", colleagues },
          {},
          supplied,
        ).length,
      ).toBeGreaterThan(0);
    }
    expect(
      validatePreview(
        organizationForm,
        { requester: "someone@example.test" },
        {},
        supplied,
      ).length,
    ).toBeGreaterThan(0);
  });
});
