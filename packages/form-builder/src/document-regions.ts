import { createField, type FormDefinition, type FormField } from "./schema";

export type DocumentRegion = "header" | "footer";
export function documentFieldOrder(fields: FormField[]): FormField[] {
  return [
    ...fields.filter((field) => field.documentRegion === "header"),
    ...fields.filter((field) => !field.documentRegion),
    ...fields.filter((field) => field.documentRegion === "footer"),
  ];
}
export function toggleDocumentRegion(
  form: FormDefinition,
  region: DocumentRegion,
): FormDefinition {
  const found = form.fields.find((field) => field.documentRegion === region);
  const fields = found
    ? form.fields.map((field) =>
        field === found
          ? { ...field, regionEnabled: field.regionEnabled === false }
          : field,
      )
    : [
        ...form.fields,
        {
          ...createField("section", form.fields),
          label:
            region === "header"
              ? { vi: "Đầu trang", en: "Header" }
              : { vi: "Chân trang", en: "Footer" },
          documentRegion: region,
          regionEnabled: true,
          required: false,
          children: [],
        },
      ];
  return { ...form, schemaVersion: 2, fields: documentFieldOrder(fields) };
}
