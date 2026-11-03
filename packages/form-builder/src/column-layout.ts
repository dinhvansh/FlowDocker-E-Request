import type { CSSProperties } from "react";
import type { FormField } from "./schema";

export function validColumnRatios(
  value: unknown,
  count: number,
): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === count &&
    value.every((item) => Number.isInteger(item) && item >= 1 && item <= 100)
  );
}
export function columnPercentages(
  field: Pick<FormField, "columns" | "columnRatios">,
): number[] {
  const count = field.columns ?? 2;
  const ratios = validColumnRatios(field.columnRatios, count)
    ? field.columnRatios
    : Array<number>(count).fill(1);
  const sum = ratios.reduce((a, b) => a + b, 0);
  const result = ratios.map((value) =>
    Math.max(1, Math.round((value / sum) * 100)),
  );
  result[result.indexOf(Math.max(...result))] +=
    100 - result.reduce((a, b) => a + b, 0);
  return result;
}
export function resizeColumns(
  ratios: number[],
  index: number,
  boundary: number,
): number[] {
  const next = [...ratios];
  const before = ratios.slice(0, index).reduce((a, b) => a + b, 0);
  const pair = ratios[index] + ratios[index + 1];
  const first = Math.max(1, Math.min(pair - 1, Math.round(boundary - before)));
  next[index] = first;
  next[index + 1] = pair - first;
  return next;
}
export function columnStyle(field: FormField): CSSProperties | undefined {
  if (field.type !== "columns") return undefined;
  const ratios = validColumnRatios(field.columnRatios, field.columns ?? 2)
    ? field.columnRatios
    : Array<number>(field.columns ?? 2).fill(1);
  return {
    "--fd-column-template": ratios
      .map((ratio) => `minmax(0, ${ratio}fr)`)
      .join(" "),
  } as CSSProperties;
}
