import type { MasterEntity, Role } from "@flowdocker/app-contracts";
import { flattenFields, type FormDefinition } from "@flowdocker/form-builder";
import { departmentsEntityId, peopleEntityId } from "./organization";

/** Local prototype dependency policy. Backend authorization remains required. */
export function masterDeleteBlockers(
  entity: MasterEntity,
  entities: MasterEntity[],
  roles: Role[],
  forms: FormDefinition[],
): string[] {
  const blockers: string[] = [];
  if ([departmentsEntityId, peopleEntityId].includes(entity.id))
    blockers.push("Danh mục tổ chức mẫu được hệ thống sử dụng, không thể xóa.");
  if (entity.kind !== "LOCAL_CATALOG" || entity.status !== "DRAFT")
    blockers.push("Chỉ có thể xóa danh mục nội bộ ở trạng thái bản nháp.");
  if (
    entities.some(
      (other) =>
        other.id !== entity.id &&
        other.fields.some(
          (field) =>
            field.referenceEntity === entity.id ||
            field.referenceEntity === entity.key,
        ),
    )
  )
    blockers.push(
      "Danh mục đang được trường tham chiếu của danh mục khác sử dụng.",
    );
  if (
    roles.some((role) =>
      Object.keys(role.grants).some(
        (key) =>
          key === `master.${entity.key}` || key === `master.${entity.id}`,
      ),
    )
  )
    blockers.push("Danh mục đang được cấu hình trong vai trò phân quyền.");
  if (
    forms.some((form) =>
      flattenFields(form.fields).some(
        (field) =>
          field.dataSource?.provider ===
          `master.${encodeURIComponent(entity.id)}`,
      ),
    )
  )
    blockers.push(
      "Danh mục đang được biểu mẫu sử dụng. Đổi nguồn dữ liệu của trường trước khi xóa.",
    );
  return blockers;
}

/** Strict read-modify-write: never replace malformed storage with seeded fixtures. */
export function removeLocalMaster(
  storage: Pick<Storage, "getItem" | "setItem">,
  entities: MasterEntity[],
  id: string,
  guard: (current: MasterEntity[]) => void,
): void {
  const key = "flowdocker.demo.entities.v1";
  const raw = storage.getItem(key);
  const current: unknown = raw === null ? entities : JSON.parse(raw);
  if (
    !Array.isArray(current) ||
    !current.every(
      (row) =>
        row &&
        typeof row.id === "string" &&
        Array.isArray(row.fields) &&
        Array.isArray(row.records),
    )
  )
    throw new Error("Invalid local master storage");
  if (new Set(current.map((row) => row.id)).size !== current.length)
    throw new Error("Duplicate local master IDs");
  if (!current.some((row) => row.id === id))
    throw new Error("Entity no longer exists");
  guard(current);
  storage.setItem(key, JSON.stringify(current.filter((row) => row.id !== id)));
}
