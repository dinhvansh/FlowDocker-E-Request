import type { FormField } from "./schema";
import type { FormBlockPresentation } from "./decoration";

export const clampContent = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));
export function contentPresentation(field: FormField): FormBlockPresentation {
  return {
    align: "left",
    size: "subtitle",
    bold: field.type === "content",
    ...field.presentation,
  };
}
export function contentPosition(p: FormBlockPresentation): number {
  return (
    p.horizontalPosition ??
    (p.align === "center" ? 50 : p.align === "right" ? 100 : 0)
  );
}
export function movedContent(
  p: FormBlockPresentation,
  dx: number,
  dy: number,
  availableWidth: number,
  snap = true,
): FormBlockPresentation {
  const position = clampContent(
    contentPosition(p) + (availableWidth > 0 ? (dx / availableWidth) * 100 : 0),
    0,
    100,
  );
  const snapped = snap
    ? ([0, 50, 100].find((anchor) => Math.abs(position - anchor) <= 2) ??
      position)
    : position;
  return {
    ...p,
    horizontalPosition: snapped,
    spaceAbove: clampContent((p.spaceAbove ?? 0) + dy, 0, 160),
  };
}
export function resizedContent(
  field: FormField,
  dx: number,
): FormBlockPresentation {
  const p = contentPresentation(field);
  return field.type === "image"
    ? { ...p, imageWidth: clampContent((p.imageWidth ?? 240) + dx, 32, 640) }
    : {
        ...p,
        fontSize: clampContent(
          (p.fontSize ??
            (p.size === "title" ? 18 : p.size === "subtitle" ? 14 : 12)) +
            dx / 6,
          12,
          48,
        ),
      };
}
