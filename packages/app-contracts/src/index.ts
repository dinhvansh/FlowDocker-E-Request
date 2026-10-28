export type EntityKind =
  "LOCAL_CATALOG" | "EXTERNAL_MIRROR" | "COMPOSITE_READ_MODEL";
export type FieldType = "text" | "number" | "date" | "boolean" | "reference";
export type Classification = "PUBLIC" | "INTERNAL" | "SENSITIVE";
export type Scope =
  "TENANT" | "COMPANY" | "DEPARTMENT" | "OWN" | "ASSIGNED_TASK";
export type Action =
  "READ" | "CREATE" | "UPDATE" | "ARCHIVE" | "APPROVE" | "EXPORT";

export interface MasterField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  classification: Classification;
  referenceEntity?: string;
}
export interface MasterEntity {
  id: string;
  key: string;
  name: string;
  kind: EntityKind;
  sourceOwner: string;
  businessOwner: string;
  scope: "TENANT" | "COMPANY";
  version: number;
  status: "DRAFT" | "PUBLISHED";
  fields: MasterField[];
  records: Record<string, string | number | boolean>[];
}
export interface ResourceAction {
  resource: string;
  label: string;
  actions: Action[];
}
export interface Role {
  id: string;
  name: string;
  description: string;
  scope: Scope;
  grants: Record<string, Action[]>;
  fieldRules: Record<string, "READ" | "MASK" | "DENY">;
  version: number;
  status: "DRAFT" | "PUBLISHED";
}
export interface AccessFixture {
  actorActive: boolean;
  sameTenant: boolean;
  sameCompany: boolean;
  sameDepartment: boolean;
  isOwner: boolean;
  assignedActiveTask: boolean;
}
export interface AccessDecision {
  effect: "ALLOW" | "DENY";
  reasons: string[];
  simulated: true;
}
export interface MockService<T> {
  list(): Promise<T[]>;
  save(value: T): Promise<T>;
}
export function evaluateAccess(
  role: Role,
  resource: string,
  action: Action,
  fixture: AccessFixture,
): AccessDecision {
  const reasons: string[] = [];
  if (!fixture.actorActive) reasons.push("Người dùng không còn hoạt động");
  if (!fixture.sameTenant) reasons.push("Khác tenant");
  if (!(role.grants[resource] ?? []).includes(action))
    reasons.push("Vai trò chưa được cấp hành động này");
  if (role.scope === "COMPANY" && !fixture.sameCompany)
    reasons.push("Ngoài phạm vi công ty");
  if (role.scope === "DEPARTMENT" && !fixture.sameDepartment)
    reasons.push("Ngoài phạm vi phòng ban");
  if (role.scope === "OWN" && !fixture.isOwner)
    reasons.push("Không phải chủ sở hữu");
  if (role.scope === "ASSIGNED_TASK" && !fixture.assignedActiveTask)
    reasons.push("Không có tác vụ đang hiệu lực được giao");
  return {
    effect: reasons.length ? "DENY" : "ALLOW",
    reasons: reasons.length ? reasons : ["Đạt các điều kiện của mô phỏng"],
    simulated: true,
  };
}
export function validateEntity(entity: MasterEntity): string[] {
  const errors: string[] = [];
  if (!/^[a-z][a-z0-9_]*$/.test(entity.key))
    errors.push("Mã entity chỉ dùng chữ thường, số và dấu gạch dưới.");
  if (!entity.name.trim()) errors.push("Tên entity là bắt buộc.");
  if (!entity.businessOwner.trim()) errors.push("Cần chỉ định business owner.");
  if (entity.fields.length === 0) errors.push("Cần ít nhất một trường.");
  const keys = new Set<string>();
  for (const field of entity.fields) {
    if (!/^[a-z][a-z0-9_]*$/.test(field.key))
      errors.push(`Mã trường ${field.label || "(chưa đặt tên)"} không hợp lệ.`);
    if (keys.has(field.key)) errors.push(`Mã trường ${field.key} bị trùng.`);
    keys.add(field.key);
    if (field.type === "reference" && !field.referenceEntity)
      errors.push(`Trường ${field.key} cần entity tham chiếu.`);
  }
  return errors;
}
