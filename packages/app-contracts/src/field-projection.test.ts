import { describe, expect, it } from "vitest";
import {
  simulateFieldProjection,
  type Role,
  type ResourceAction,
  type AccessFixture,
} from "./index";

const resource: ResourceAction = {
  resource: "demo.record",
  label: "Demo",
  actions: ["READ", "EXPORT"],
  fields: [
    { key: "demo.name", label: "Name", sampleValue: "SYNTHETIC" },
    { key: "demo.secret", label: "Secret", sampleValue: "SYNTHETIC-SECRET" },
    { key: "demo.amount", label: "Amount", sampleValue: 0 },
  ],
};
const role: Role = {
  id: "demo",
  name: "Demo",
  description: "",
  scope: "COMPANY",
  version: 1,
  status: "DRAFT",
  grants: { "demo.record": ["READ", "EXPORT"] },
  fieldRules: { "demo.name": "READ", "demo.secret": "MASK" },
};
const fixture: AccessFixture = {
  actorActive: true,
  sameTenant: true,
  sameCompany: true,
  sameDepartment: true,
  isOwner: false,
  assignedActiveTask: false,
};
describe("synthetic field projection (not backend authorization)", () => {
  it("shows only explicit readable values, masks fully and omits unknown values", () => {
    const result = simulateFieldProjection(role, resource, "READ", fixture);
    expect(result.fields).toEqual([
      { key: "demo.name", effect: "READ", value: "SYNTHETIC" },
      { key: "demo.secret", effect: "MASK", value: "••••" },
      { key: "demo.amount", effect: "DENY" },
    ]);
    expect(JSON.stringify(result)).not.toContain("SYNTHETIC-SECRET");
  });
  it.each([
    { actorActive: false },
    { sameTenant: false },
    { sameCompany: false },
  ])("denies every value when scope/identity fails: %j", (context) => {
    const result = simulateFieldProjection(role, resource, "READ", {
      ...fixture,
      ...context,
    });
    expect(result.decision.effect).toBe("DENY");
    expect(
      result.fields.every(
        (field) => field.effect === "DENY" && !Object.hasOwn(field, "value"),
      ),
    ).toBe(true);
  });
  it("does not let field READ grant resource access", () => {
    expect(
      simulateFieldProjection(
        { ...role, grants: {} },
        resource,
        "READ",
        fixture,
      ).fields.every((field) => field.effect === "DENY"),
    ).toBe(true);
  });
  it("requires both READ and EXPORT and registration for export", () => {
    for (const grants of [["READ"], ["EXPORT"]] as const) {
      expect(
        simulateFieldProjection(
          { ...role, grants: { "demo.record": [...grants] } },
          resource,
          "EXPORT",
          fixture,
        ).decision.effect,
      ).toBe("DENY");
    }
    expect(
      simulateFieldProjection(
        role,
        { ...resource, actions: ["READ"] },
        "EXPORT",
        fixture,
      ).decision.effect,
    ).toBe("DENY");
    expect(
      simulateFieldProjection(
        role,
        { ...resource, actions: ["EXPORT"] },
        "EXPORT",
        fixture,
      ).decision.effect,
    ).toBe("DENY");
    expect(
      simulateFieldProjection(role, resource, "EXPORT", fixture).fields[1]
        .value,
    ).toBe("••••");
  });
  it("preserves explicit zero/false and input objects, supports an absent field catalog", () => {
    const original = JSON.stringify({ role, resource, fixture });
    const next = { ...role, fieldRules: { "demo.amount": "READ" as const } };
    expect(
      simulateFieldProjection(next, resource, "READ", fixture).fields[2].value,
    ).toBe(0);
    expect(
      simulateFieldProjection(
        next,
        {
          ...resource,
          fields: [{ key: "demo.amount", label: "Flag", sampleValue: false }],
        },
        "READ",
        fixture,
      ).fields[0].value,
    ).toBe(false);
    expect(
      simulateFieldProjection(
        role,
        { ...resource, fields: undefined },
        "READ",
        fixture,
      ).fields,
    ).toEqual([]);
    expect(JSON.stringify({ role, resource, fixture })).toBe(original);
  });
});
