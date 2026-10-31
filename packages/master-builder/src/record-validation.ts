import {
  isTechnicalKey,
  type MasterEntity,
  type MasterField,
} from "@flowdocker/app-contracts";
export type MasterRecord = MasterEntity["records"][number];
export const recordIdentity = (row: MasterRecord) =>
  String(row.id ?? row.code ?? row.name ?? Object.values(row)[0] ?? "—");
export function recordFieldError(
  field: MasterField,
  value: unknown,
  entity: MasterEntity,
  entities: MasterEntity[],
  index?: number,
): string | undefined {
  const empty =
    value === undefined ||
    value === "" ||
    (typeof value === "string" && !value.trim());
  if (empty) return field.required ? "Trường này là bắt buộc." : undefined;
  if (
    field.type === "number" &&
    (typeof value !== "number" || !Number.isFinite(value))
  )
    return "Nhập một số hợp lệ.";
  if (field.type === "boolean" && typeof value !== "boolean")
    return "Chọn Có hoặc Không.";
  if (
    (field.type === "text" ||
      field.type === "reference" ||
      field.type === "date") &&
    typeof value !== "string"
  )
    return "Giá trị phải là văn bản.";
  if (field.type === "date") {
    const date = new Date(`${value}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    )
      return "Chọn ngày hợp lệ.";
  }
  if (
    ["id", "code"].includes(field.key) &&
    entity.records.some(
      (row, i) => i !== index && String(row[field.key]) === String(value),
    )
  )
    return "Mã bản ghi đã tồn tại.";
  if (["id", "code"].includes(field.key) && value === "__fd_clear__")
    return "Mã bản ghi này được dành riêng cho hệ thống.";
  if (field.type === "reference") {
    const target = entities.find(
      (e) => e.id === field.referenceEntity || e.key === field.referenceEntity,
    );
    if (
      !target?.records.some(
        (row) =>
          String(row.id ?? row.code ?? row.value ?? row.key ?? "") === value,
      )
    )
      return "Chọn bản ghi có trong danh mục tham chiếu.";
  }
  return undefined;
}
export function recordsSchemaValid(entity: MasterEntity) {
  return (
    entity.fields.length > 0 &&
    entity.fields.every((f) => isTechnicalKey(f.key)) &&
    new Set(entity.fields.map((f) => f.key)).size === entity.fields.length
  );
}
/** Local prototype invariants, not server authorization or historical request integrity. */
export function assertRecordChange(
  expected: MasterEntity,
  records: MasterRecord[],
  entities: MasterEntity[],
) {
  if (expected.kind !== "LOCAL_CATALOG" || !recordsSchemaValid(expected))
    throw Error("Read-only or invalid schema");
  // A UI command may add, edit or remove exactly one row; existing record IDs stay stable.
  const removed = expected.records.length === records.length + 1;
  const added = records.length === expected.records.length + 1;
  const equal = (a: MasterRecord, b: MasterRecord) =>
    JSON.stringify(a) === JSON.stringify(b);
  let changedIndex = -1;
  if (added) {
    if (!expected.records.every((row, i) => equal(row, records[i])))
      throw Error("Invalid append");
    changedIndex = records.length - 1;
  } else if (removed) {
    changedIndex = expected.records.findIndex(
      (row, i) => !records[i] || !equal(row, records[i]),
    );
    if (
      !expected.records
        .filter((_, i) => i !== changedIndex)
        .every((row, i) => equal(row, records[i]))
    )
      throw Error("Invalid removal");
  } else if (records.length === expected.records.length) {
    const differences = records.flatMap((row, i) =>
      equal(row, expected.records[i]) ? [] : [i],
    );
    if (differences.length > 1) throw Error("Multiple record updates");
    changedIndex = differences[0] ?? -1;
    if (
      changedIndex >= 0 &&
      expected.records[changedIndex].id !== undefined &&
      expected.records[changedIndex].id !== records[changedIndex].id
    )
      throw Error("Record ID is immutable");
  } else throw Error("Invalid record mutation");
  if (changedIndex < 0) return;
  const next = removed ? undefined : records[changedIndex];
  if (next) {
    const newKeys = Object.keys(next).filter(
      (key) =>
        !expected.fields.some((f) => f.key === key) &&
        !(key in (expected.records[changedIndex] ?? {})),
    );
    const original = expected.records[changedIndex] ?? {};
    const legacyChanged = Object.keys(original).some(
      (key) =>
        !expected.fields.some((f) => f.key === key) &&
        next[key] !== original[key],
    );
    if (
      legacyChanged ||
      newKeys.length ||
      expected.fields.some((f) =>
        recordFieldError(
          f,
          next[f.key],
          { ...expected, records },
          entities,
          changedIndex,
        ),
      )
    )
      throw Error("Invalid record values");
  }
  const previous = added ? undefined : expected.records[changedIndex];
  if (previous)
    for (const other of entities)
      for (const field of other.fields) {
        if (
          field.type !== "reference" ||
          ![expected.id, expected.key].includes(field.referenceEntity ?? "")
        )
          continue;
        const changedValues = ["id", "code", "value", "key"].flatMap((key) => {
          const value = previous[key];
          return value !== undefined &&
            value !== "" &&
            (!next || next[key] !== value)
            ? [value]
            : [];
        });
        const currentRows = other.id === expected.id ? records : other.records;
        if (
          currentRows.some((row) =>
            changedValues.some(
              (value) => String(row[field.key]) === String(value),
            ),
          )
        )
          throw Error("Record is referenced");
      }
}
