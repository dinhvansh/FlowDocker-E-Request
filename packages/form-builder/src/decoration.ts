import type { BilingualText } from "./schema";

export interface FormBandCell {
  kind: "title" | "text" | "image";
  align: "left" | "center" | "right";
  text: BilingualText;
  size: "body" | "subtitle" | "title";
  bold: boolean;
  image?: string;
  imageWidth?: number;
}
export interface FormBand {
  enabled: boolean;
  columns: 1 | 2 | 3;
  divider: boolean;
  /** Three retained slots; only the first `columns` slots are displayed. */
  cells: FormBandCell[];
}
export interface FormDecoration {
  header: FormBand;
  footer: FormBand;
}
export type FormBlockPresentation = Pick<
  FormBandCell,
  "align" | "size" | "bold" | "image" | "imageWidth"
> & { horizontalPosition?: number; spaceAbove?: number; fontSize?: number };
export function validBlockPresentation(
  value: unknown,
): value is FormBlockPresentation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  return (
    Object.keys(p).every((key) =>
      [
        "align",
        "size",
        "bold",
        "image",
        "imageWidth",
        "horizontalPosition",
        "spaceAbove",
        "fontSize",
      ].includes(key),
    ) &&
    ["left", "center", "right"].includes(String(p.align)) &&
    ["body", "subtitle", "title"].includes(String(p.size)) &&
    typeof p.bold === "boolean" &&
    (
      [
        ["horizontalPosition", 0, 100],
        ["spaceAbove", 0, 160],
        ["fontSize", 12, 48],
      ] as const
    ).every(
      ([key, min, max]) =>
        p[key] === undefined ||
        (Number.isInteger(p[key]) &&
          Number(p[key]) >= min &&
          Number(p[key]) <= max),
    ) &&
    (p.image === undefined || safeBandImage(p.image)) &&
    (p.imageWidth === undefined ||
      (Number.isInteger(p.imageWidth) &&
        Number(p.imageWidth) >= 32 &&
        Number(p.imageWidth) <= 640))
  );
}

export const emptyBandCell = (): FormBandCell => ({
  kind: "text",
  align: "left",
  text: { vi: "", en: "" },
  size: "body",
  bold: false,
});
export function defaultDecoration(): FormDecoration {
  return {
    header: {
      enabled: true,
      columns: 1,
      divider: true,
      cells: [
        { ...emptyBandCell(), kind: "title", size: "title", bold: true },
        emptyBandCell(),
        emptyBandCell(),
      ],
    },
    footer: {
      enabled: false,
      columns: 1,
      divider: true,
      cells: [emptyBandCell(), emptyBandCell(), emptyBandCell()],
    },
  };
}
export const bandImagePattern =
  "^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$";
export function safeBandImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 140_000 &&
    new RegExp(bandImagePattern).test(value)
  );
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const keys = (value: Record<string, unknown>, allowed: string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));
export function validFormDecoration(value: unknown): value is FormDecoration {
  if (!record(value) || !keys(value, ["header", "footer"])) return false;
  return [value.header, value.footer].every((band) => {
    if (
      !record(band) ||
      !keys(band, ["enabled", "columns", "divider", "cells"]) ||
      typeof band.enabled !== "boolean" ||
      typeof band.divider !== "boolean" ||
      ![1, 2, 3].includes(band.columns as number) ||
      !Array.isArray(band.cells) ||
      band.cells.length !== 3
    )
      return false;
    return band.cells.every(
      (cell) =>
        record(cell) &&
        keys(cell, [
          "kind",
          "align",
          "text",
          "size",
          "bold",
          "image",
          "imageWidth",
        ]) &&
        ["title", "text", "image"].includes(cell.kind as string) &&
        ["left", "center", "right"].includes(cell.align as string) &&
        ["body", "subtitle", "title"].includes(cell.size as string) &&
        typeof cell.bold === "boolean" &&
        record(cell.text) &&
        keys(cell.text, ["vi", "en"]) &&
        typeof cell.text.vi === "string" &&
        cell.text.vi.length <= 4000 &&
        typeof cell.text.en === "string" &&
        cell.text.en.length <= 4000 &&
        (cell.image === undefined || safeBandImage(cell.image)) &&
        (cell.imageWidth === undefined ||
          (Number.isInteger(cell.imageWidth) &&
            Number(cell.imageWidth) >= 32 &&
            Number(cell.imageWidth) <= 320)),
    );
  });
}

/** Decode raster files locally; embed a bounded, resized image, never SVG/HTML. */
export async function prepareBandImage(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5_000_000
  )
    throw new Error("image");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / bitmap.width, 320 / bitmap.height);
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("image");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL("image/webp", 0.8);
    if (!safeBandImage(result)) throw new Error("image");
    return result;
  } finally {
    bitmap.close();
  }
}
