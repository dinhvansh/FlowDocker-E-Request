import type { CSSProperties } from "react";
import { validFormSpacing, type FormSpacing } from "./schema";

export const standardSpacing: Readonly<FormSpacing> = Object.freeze({
  rowGap: 16,
  columnGap: 16,
  sectionGap: 24,
  sectionPadding: 16,
});
export const compactSpacing: Readonly<FormSpacing> = Object.freeze({
  rowGap: 8,
  columnGap: 12,
  sectionGap: 16,
  sectionPadding: 12,
});
export function spacingStyle(value?: FormSpacing): CSSProperties | undefined {
  if (!validFormSpacing(value)) return undefined;
  return {
    "--fd-form-row-gap": `${value.rowGap}px`,
    "--fd-form-column-gap": `${value.columnGap}px`,
    "--fd-form-section-gap": `${value.sectionGap}px`,
    "--fd-form-section-padding": `${value.sectionPadding}px`,
    "--fd-field-gap": `${value.rowGap}px`,
  } as CSSProperties;
}
