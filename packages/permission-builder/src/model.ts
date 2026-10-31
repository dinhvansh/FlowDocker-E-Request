import { useState } from "react";
import type {
  AccessDecision,
  AccessFixture,
  Action,
  ResourceAction,
  Role,
  Scope,
} from "@flowdocker/app-contracts";

export interface PermissionBuilderProps {
  roles: Role[];
  resources: ResourceAction[];
  onSave(role: Role): Promise<void>;
  loading?: boolean;
  error?: string;
}
export const actions: Action[] = [
  "READ",
  "CREATE",
  "UPDATE",
  "ARCHIVE",
  "APPROVE",
  "EXPORT",
];
export const labels: Record<Action, string> = {
  READ: "Xem",
  CREATE: "Tạo",
  UPDATE: "Sửa",
  ARCHIVE: "Lưu trữ",
  APPROVE: "Duyệt",
  EXPORT: "Xuất",
};
export const scopes: Record<Scope, string> = {
  TENANT: "Tenant",
  COMPANY: "Công ty",
  DEPARTMENT: "Phòng ban",
  OWN: "Bản ghi của mình",
  ASSIGNED_TASK: "Tác vụ được giao",
};
const initialFixture: AccessFixture = {
  actorActive: true,
  sameTenant: true,
  sameCompany: true,
  sameDepartment: true,
  isOwner: false,
  assignedActiveTask: false,
};
export function usePermissionModel({
  roles,
  resources,
  onSave,
}: PermissionBuilderProps) {
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("matrix");
  const [modal, setModal] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [fixture, setFixture] = useState(initialFixture);
  const [testResource, setTestResource] = useState(
    resources[0]?.resource ?? "",
  );
  const [testAction, setTestAction] = useState<Action>("READ");
  const [decision, setDecision] = useState<AccessDecision | null>(null);
  const [message, setMessage] = useState("");
  const role = roles.find((r) => r.id === selectedId) ?? roles[0];
  const grantCount = resources.reduce(
    (count, resource) =>
      count +
      resource.actions.filter((action) =>
        role?.grants[resource.resource]?.includes(action),
      ).length,
    0,
  );
  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()),
  );
  const save = async (next: Role) => {
    await onSave({ ...next, status: "DRAFT" });
    setMessage("Đã lưu bản nháp vai trò trong trình duyệt");
    setDecision(null);
  };
  const patch = (value: Partial<Role>) => role && save({ ...role, ...value });
  const toggle = (resource: string, action: Action) => {
    if (!role) return;
    const set = new Set(role.grants[resource] ?? []);
    if (set.has(action)) set.delete(action);
    else set.add(action);
    patch({ grants: { ...role.grants, [resource]: [...set] } });
  };
  const create = async () => {
    const next: Role = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: "Vai trò tùy chỉnh",
      scope: "ASSIGNED_TASK",
      grants: {},
      fieldRules: {},
      version: 1,
      status: "DRAFT",
    };
    await onSave(next);
    setSelectedId(next.id);
    setModal(false);
    setNewName("");
    setMessage("Đã tạo vai trò bản nháp trong trình duyệt");
  };
  return {
    role,
    filtered,
    grantCount,
    query,
    setQuery,
    tab,
    setTab,
    modal,
    setModal,
    simulationOpen,
    setSimulationOpen,
    newName,
    setNewName,
    fixture,
    setFixture,
    testResource,
    setTestResource,
    testAction,
    setTestAction,
    decision,
    setDecision,
    message,
    setMessage,
    setSelectedId,
    patch,
    toggle,
    create,
  };
}
