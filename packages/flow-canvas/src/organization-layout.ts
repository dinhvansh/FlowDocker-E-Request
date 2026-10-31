export type OrganizationPerson = {
  id: string;
  name: string;
  title: string;
  department: string;
  managerId: string;
  isHead?: boolean;
};
export interface OrganizationPosition {
  id: string;
  parentId?: string;
  x: number;
  y: number;
  depth: number;
  childCount: number;
}
export const organizationCardWidth = 248;
/** Stable forest layout. Invalid/cyclic parent links become roots, never approval assignments. */
export function organizationLayout(
  people: readonly OrganizationPerson[],
  collapsed: ReadonlySet<string> = new Set(),
): OrganizationPosition[] {
  const unique = new Map(people.map((person) => [person.id, person]));
  const parents = new Map<string, string>();
  for (const person of unique.values()) {
    let cursor: string | undefined = person.managerId;
    const seen = new Set([person.id]);
    while (cursor && unique.has(cursor) && !seen.has(cursor)) {
      seen.add(cursor);
      cursor = parents.get(cursor);
    }
    if (unique.has(person.managerId) && !cursor)
      parents.set(person.id, person.managerId);
  }
  const children = new Map<string, string[]>();
  for (const [id, parent] of parents)
    children.set(parent, [...(children.get(parent) ?? []), id]);
  const widths = new Map<string, number>();
  const measure = (id: string): number => {
    const branch = collapsed.has(id) ? [] : (children.get(id) ?? []);
    const width = branch.length
      ? branch.reduce((total, child) => total + measure(child), 0)
      : organizationCardWidth + 40;
    widths.set(id, width);
    return width;
  };
  const roots = [...unique.keys()].filter((id) => !parents.has(id));
  roots.forEach(measure);
  const result: OrganizationPosition[] = [];
  const place = (id: string, left: number, depth: number) => {
    result.push({
      id,
      parentId: parents.get(id),
      x: left + (widths.get(id)! - organizationCardWidth) / 2,
      y: depth * 156,
      depth,
      childCount: children.get(id)?.length ?? 0,
    });
    if (!collapsed.has(id))
      for (const child of children.get(id) ?? []) {
        place(child, left, depth + 1);
        left += widths.get(child)!;
      }
  };
  let left = 0;
  for (const id of roots) {
    place(id, left, 0);
    left += widths.get(id)! + 40;
  }
  return result;
}
