import { describe, expect, it } from "vitest";
import {
  organizationLayout,
  type OrganizationPerson,
} from "./organization-layout";
const person = (id: string, managerId = ""): OrganizationPerson => ({
  id,
  managerId,
  name: id,
  title: "sample",
  department: "demo",
});
describe("organization forest layout", () => {
  it("aligns each generation, centers parent above children and separates sibling branches", () => {
    const result = organizationLayout([
      person("ceo"),
      person("it", "ceo"),
      person("finance", "ceo"),
      person("dev", "it"),
    ]);
    const byId = (id: string) => result.find((node) => node.id === id)!;
    expect(byId("it").y).toBe(byId("finance").y);
    expect(byId("finance").x - byId("it").x).toBeGreaterThan(248);
    expect(byId("ceo").x).toBe((byId("it").x + byId("finance").x) / 2);
    expect(byId("dev").parentId).toBe("it");
    expect(byId("dev").y).toBeGreaterThan(byId("it").y);
  });
  it("hides descendants while retaining branch counts and restores without data mutations", () => {
    const people = [person("a"), person("b", "a"), person("c", "b")];
    expect(organizationLayout(people, new Set(["a"]))).toMatchObject([
      { id: "a", childCount: 1 },
    ]);
    expect(organizationLayout(people)).toHaveLength(3);
    expect(people[1].managerId).toBe("a");
  });
  it("terminates on self/cycles, preserves disconnected roots and handles empty input", () => {
    expect(organizationLayout([])).toEqual([]);
    const result = organizationLayout([
      person("a", "b"),
      person("b", "a"),
      person("self", "self"),
      person("orphan", "missing"),
    ]);
    expect(new Set(result.map((node) => node.id)).size).toBe(4);
    expect(
      result.every(
        (node) => Number.isFinite(node.x) && Number.isFinite(node.y),
      ),
    ).toBe(true);
    expect(
      result.find((node) => node.id === "orphan")?.parentId,
    ).toBeUndefined();
  });
});
