import type { FormField } from "./schema";
export interface FormInsertionTarget {
  fieldId?: string;
  edge: "before" | "after" | "start" | "end";
}
/** Resolve against the current tree; moving within a scope accounts for removal. */
export function resolveFormInsertion(
  fields: FormField[],
  target: FormInsertionTarget,
  movingId?: string,
): { parentId: string; index: number } | undefined {
  const inScope = (
    items: FormField[],
    parentId: string,
  ): { parentId: string; index: number } | undefined => {
    const anchor = items.findIndex((item) => item.id === target.fieldId);
    if (anchor >= 0) {
      if (target.fieldId === movingId) return undefined;
      let index = anchor + (target.edge === "after" ? 1 : 0);
      const moving = items.findIndex((item) => item.id === movingId);
      if (moving >= 0 && moving < index) index--;
      return { parentId, index };
    }
    for (const item of items) {
      const found = inScope(item.children ?? [], item.id);
      if (found) return found;
    }
    return undefined;
  };
  if (target.edge === "start") return { parentId: "", index: 0 };
  if (target.edge === "end")
    return {
      parentId: "",
      index: fields.filter((field) => field.id !== movingId).length,
    };
  return inScope(fields, "");
}
