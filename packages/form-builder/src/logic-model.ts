import { formulaReferences } from "./engine";
import { scopeFields, type FormField } from "./schema";

export interface LogicNode {
  field: FormField;
  path: string;
  references: FormField[];
  dependencies: { key: string; fieldId?: string }[];
}
export function hasLogic(field: FormField): boolean {
  return !!(
    field.visibleWhen ||
    field.requiredWhen ||
    field.disabledWhen ||
    field.calculation ||
    field.compare ||
    field.dataSource?.dependsOn
  );
}
/** Resolve references using the runtime's root + current object/row scopes. */
export function logicInventory(fields: FormField[]): LogicNode[] {
  const nodes: LogicNode[] = [];
  const candidates = (items: FormField[]): FormField[] =>
    scopeFields(items).flatMap((field) => [
      field,
      ...(["repeat", "container"].includes(field.type)
        ? scopeFields(field.children ?? []).map((child) => ({
            ...child,
            key: `${field.key}.${child.key}`,
          }))
        : []),
    ]);
  const root = candidates(fields);
  const walk = (items: FormField[], scope: FormField[], prefix: string) => {
    for (const field of items) {
      const references = [
        ...new Map(
          [...root, ...scope].map((item) => [item.key, item]),
        ).values(),
      ];
      const keys = new Set([
        ...[field.visibleWhen, field.requiredWhen, field.disabledWhen].flatMap(
          (rule) => rule?.conditions.map((condition) => condition.field) ?? [],
        ),
        ...(field.calculation?.expression?.trim()
          ? formulaReferences(field.calculation.expression)
          : (field.calculation?.fields ?? [])),
        ...(field.compare ? [field.compare.field] : []),
        ...(field.dataSource?.dependsOn ? [field.dataSource.dependsOn] : []),
      ]);
      const path = `${prefix}${field.key}`;
      nodes.push({
        field,
        path,
        references: references.filter((item) => item.id !== field.id),
        dependencies: [...keys].map((key) => ({
          key,
          fieldId: references.find((item) => item.key === key)?.id,
        })),
      });
      if (field.children) {
        const objectScope = ["repeat", "container"].includes(field.type);
        walk(
          field.children,
          objectScope ? candidates(field.children) : scope,
          objectScope ? `${path}.` : prefix,
        );
      }
    }
  };
  walk(fields, root, "");
  return nodes;
}
