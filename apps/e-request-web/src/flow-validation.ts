import type { Edge } from "@xyflow/react";
import type { FlowNode } from "@flowdocker/flow-canvas";

export type StepKind =
  | "Source"
  | "RAW / Staging"
  | "Filter"
  | "Field Mapper"
  | "Validate"
  | "Master Upsert";
export function validateGraph(
  nodes: FlowNode[],
  edges: Edge[],
  mapping: Record<string, string>,
): string[] {
  const errors: string[] = [];
  const byKind = (kind: StepKind) =>
    nodes.filter((node) => node.data.category === kind);
  for (const kind of [
    "Source",
    "RAW / Staging",
    "Field Mapper",
    "Validate",
    "Master Upsert",
  ] as StepKind[])
    if (!byKind(kind).length) errors.push(`Thiếu node ${kind}.`);
  const ids = new Set(nodes.map((node) => node.id));
  if (edges.some((edge) => !ids.has(edge.source) || !ids.has(edge.target)))
    errors.push("Có cạnh nối tới node không tồn tại.");
  const adjacency = new Map(
    nodes.map((node) => [
      node.id,
      edges
        .filter((edge) => edge.source === node.id)
        .map((edge) => edge.target),
    ]),
  );
  const visited = new Set<string>();
  const path = new Set<string>();
  const visit = (id: string): boolean => {
    if (path.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    path.add(id);
    const cycle = (adjacency.get(id) || []).some(visit);
    path.delete(id);
    return cycle;
  };
  if (nodes.some((node) => visit(node.id)))
    errors.push("Flow có vòng lặp; chỉ hỗ trợ DAG.");
  const required = (
    [
      "Source",
      "RAW / Staging",
      "Field Mapper",
      "Validate",
      "Master Upsert",
    ] as StepKind[]
  ).map((kind) => byKind(kind)[0]);
  const upsert = required[4];
  if (required.every(Boolean)) {
    const explore = (
      start: string,
      end: string,
      seen: Set<string>,
    ): boolean => {
      if (start === end) return true;
      if (seen.has(start)) return false;
      seen.add(start);
      return (adjacency.get(start) || []).some((next) =>
        explore(next, end, seen),
      );
    };
    for (let index = 0; index < required.length - 1; index++) {
      if (!explore(required[index].id, required[index + 1].id, new Set()))
        errors.push(
          `Chưa nối ${required[index].data.category} tới ${required[index + 1].data.category}.`,
        );
    }
    const incoming = edges.filter((edge) => edge.target === upsert.id);
    if (
      incoming.some(
        (edge) =>
          nodes.find((node) => node.id === edge.source)?.data.category !==
          "Validate",
      )
    )
      errors.push("Master Upsert chỉ nhận bản ghi đã qua Validate.");
  }
  for (const key of ["code", "name", "company"])
    if (!mapping[key]) errors.push(`Thiếu ánh xạ ${key}.`);
  for (const key of ["code", "name", "company"])
    if (mapping[key] === "Active")
      errors.push(`Trường ${key} cần kiểu chuỗi, Active là boolean.`);
  if (mapping.active && mapping.active !== "Active")
    errors.push("Trường active cần kiểu boolean.");
  return errors;
}
