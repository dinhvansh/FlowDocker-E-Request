import { describe, expect, it } from "vitest";
import type { Edge } from "@xyflow/react";
import type { FlowNode } from "@flowdocker/flow-canvas";
import { validateGraph } from "./flow-validation";

const categories = [
  "Source",
  "RAW / Staging",
  "Field Mapper",
  "Validate",
  "Master Upsert",
];
const nodes: FlowNode[] = categories.map((category, index) => ({
  id: String(index),
  type: "flowStep",
  position: { x: index * 100, y: 0 },
  data: { label: category, category },
}));
const edges: Edge[] = categories.slice(1).map((_, index) => ({
  id: `e${index}`,
  source: String(index),
  target: String(index + 1),
}));
const mapping = { code: "VendorNum", name: "Name", company: "Company" };

describe("flow draft structural validation", () => {
  it("accepts the ordered synthetic flow", () => {
    expect(validateGraph(nodes, edges, mapping)).toEqual([]);
  });
  it("rejects bypassing staging and mapper", () => {
    const bypass = [{ id: "direct", source: "0", target: "3" }, edges[3]];
    expect(validateGraph(nodes, bypass, mapping).join(" ")).toContain(
      "RAW / Staging",
    );
  });
  it("rejects a cycle and missing required mapping", () => {
    const result = validateGraph(
      nodes,
      [...edges, { id: "back", source: "4", target: "1" }],
      { ...mapping, company: "" },
    );
    expect(result.some((error) => error.includes("vòng lặp"))).toBe(true);
    expect(result.some((error) => error.includes("company"))).toBe(true);
  });
  it("rejects a direct edge into the target without Validate", () => {
    expect(
      validateGraph(
        nodes,
        [...edges, { id: "unsafe", source: "2", target: "4" }],
        mapping,
      ).join(" "),
    ).toContain("Validate");
  });
  it("rejects a sample field type mismatch", () => {
    expect(
      validateGraph(nodes, edges, { ...mapping, active: "Name" }).join(" "),
    ).toContain("boolean");
  });
});
