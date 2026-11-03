import {
  flattenFields,
  isFormDefinition,
  validateFormDefinition,
  type FormDefinition,
  type FormField,
} from "@flowdocker/form-builder";

export const formVersionsKey = "flowdocker.form-versions.v1";
export interface FormDesignVersion {
  id: string;
  formId: string;
  createdAt: string;
  label: string;
  definition: FormDefinition;
}
type StoragePort = Pick<Storage, "getItem" | "setItem">;
const maxCharacters = 2_000_000;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function readFormVersions(
  storage: Pick<Storage, "getItem">,
): FormDesignVersion[] {
  const raw = storage.getItem(formVersionsKey);
  if (raw === null) return [];
  if (raw.length > maxCharacters) throw Error("version-storage-invalid");
  const parsed: unknown = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Object.keys(parsed).some((key) => !["version", "entries"].includes(key)) ||
    !("version" in parsed) ||
    parsed.version !== 1 ||
    !("entries" in parsed) ||
    !Array.isArray(parsed.entries) ||
    parsed.entries.length > 100
  )
    throw Error("version-storage-invalid");
  const ids = new Set<string>();
  const counts = new Map<string, number>();
  for (const entry of parsed.entries as unknown[]) {
    if (!entry || typeof entry !== "object")
      throw Error("version-storage-invalid");
    if (
      Object.keys(entry).some(
        (key) =>
          !["id", "formId", "createdAt", "label", "definition"].includes(key),
      )
    )
      throw Error("version-storage-invalid");
    const item = entry as FormDesignVersion;
    if (
      typeof item.id !== "string" ||
      !item.id ||
      ids.has(item.id) ||
      typeof item.formId !== "string" ||
      typeof item.label !== "string" ||
      item.label.length > 80 ||
      typeof item.createdAt !== "string" ||
      item.createdAt.length !== 24 ||
      !/^\d{4}-\d\d-\d\dT/.test(item.createdAt) ||
      !Number.isFinite(Date.parse(item.createdAt)) ||
      !isFormDefinition(item.definition) ||
      item.definition.id !== item.formId ||
      validateFormDefinition(item.definition).length
    )
      throw Error("version-storage-invalid");
    ids.add(item.id);
    counts.set(item.formId, (counts.get(item.formId) ?? 0) + 1);
    if ((counts.get(item.formId) ?? 0) > 20)
      throw Error("version-storage-invalid");
  }
  return clone(parsed.entries as FormDesignVersion[]);
}
function writeVersions(storage: StoragePort, entries: FormDesignVersion[]) {
  const serialized = JSON.stringify({ version: 1, entries });
  if (serialized.length > maxCharacters) throw Error("version-storage-full");
  storage.setItem(formVersionsKey, serialized);
  return clone(entries);
}
export function captureFormVersion(
  storage: StoragePort,
  definition: FormDefinition,
  label: string,
): FormDesignVersion[] {
  if (
    !isFormDefinition(definition) ||
    validateFormDefinition(definition).length ||
    label.trim().length > 80
  )
    throw Error("version-definition-invalid");
  const current = readFormVersions(storage);
  if (
    current.length >= 100 ||
    current.filter((item) => item.formId === definition.id).length >= 20
  )
    throw Error("version-storage-full");
  return writeVersions(storage, [
    {
      id: crypto.randomUUID(),
      formId: definition.id,
      createdAt: new Date().toISOString(),
      label: label.trim(),
      definition: clone(definition),
    },
    ...current,
  ]);
}
export function removeFormVersion(
  storage: StoragePort,
  id: string,
): FormDesignVersion[] {
  return writeVersions(
    storage,
    readFormVersions(storage).filter((item) => item.id !== id),
  );
}
export function createFromTemplate(
  template: FormDefinition,
  title: FormDefinition["title"],
): FormDefinition {
  if (
    !title.vi.trim() ||
    !title.en.trim() ||
    validateFormDefinition(template).length
  )
    throw Error("template-invalid");
  const next = clone(template);
  next.id = crypto.randomUUID();
  next.title = { vi: title.vi.trim(), en: title.en.trim() };
  next.version = 1;
  next.status = "DRAFT";
  // Field references use keys. Preserve keys, assign independent authoring identities.
  const remap = (fields: FormField[]): FormField[] =>
    fields.map((field) => ({
      ...field,
      id: crypto.randomUUID(),
      ...(field.children ? { children: remap(field.children) } : {}),
    }));
  next.fields = remap(next.fields);
  return next;
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => JSON.stringify(k) + ":" + stable(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "undefined";
}

export interface FormVersionChange {
  id: string;
  kind: "added" | "removed" | "changed";
  before?: FormField;
  after?: FormField;
  properties: string[];
}
/** Configuration comparison only: stable IDs + metadata + parent/order, not runtime values. */
export function compareFormVersions(
  before: FormDefinition,
  after: FormDefinition,
): { settings: string[]; fields: FormVersionChange[] } {
  const properties = (a: Record<string, unknown>, b: Record<string, unknown>) =>
    [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
      (key) =>
        !["fields", "children", "id"].includes(key) &&
        stable(a[key]) !== stable(b[key]),
    );
  const locations = (fields: FormField[]) => {
    const result = new Map<string, string>();
    const walk = (items: FormField[], parent = "") =>
      items.forEach((field, index) => {
        result.set(field.id, `${parent}:${index}`);
        if (field.children) walk(field.children, field.id);
      });
    walk(fields);
    return result;
  };
  const oldFields = new Map(
    flattenFields(before.fields).map((field) => [field.id, field]),
  );
  const newFields = new Map(
    flattenFields(after.fields).map((field) => [field.id, field]),
  );
  const oldLocations = locations(before.fields),
    newLocations = locations(after.fields);
  const fields: FormVersionChange[] = [];
  for (const [id, field] of oldFields) {
    const next = newFields.get(id);
    if (!next)
      fields.push({ id, kind: "removed", before: field, properties: [] });
    else {
      const changed = properties({ ...field }, { ...next });
      if (oldLocations.get(id) !== newLocations.get(id))
        changed.push("position");
      if (changed.length)
        fields.push({
          id,
          kind: "changed",
          before: field,
          after: next,
          properties: changed,
        });
    }
  }
  for (const [id, field] of newFields)
    if (!oldFields.has(id))
      fields.push({ id, kind: "added", after: field, properties: [] });
  return { settings: properties({ ...before }, { ...after }), fields };
}
