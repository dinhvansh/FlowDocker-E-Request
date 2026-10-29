import type {
  MasterEntity,
  MockService,
  ResourceAction,
  Role,
} from "@flowdocker/app-contracts";
import { withOrganizationSamples } from "./organization";

export const seedEntities: MasterEntity[] = [
  {
    id: "asset_category",
    key: "asset_category",
    name: "Asset Category",
    kind: "LOCAL_CATALOG",
    sourceOwner: "IT nội bộ",
    businessOwner: "IT Operations",
    scope: "TENANT",
    version: 1,
    status: "PUBLISHED",
    fields: [
      {
        id: "ac_code",
        key: "code",
        label: "Mã danh mục",
        type: "text",
        required: true,
        classification: "INTERNAL",
      },
      {
        id: "ac_name",
        key: "name",
        label: "Tên danh mục",
        type: "text",
        required: true,
        classification: "INTERNAL",
      },
      {
        id: "ac_active",
        key: "active",
        label: "Đang dùng",
        type: "boolean",
        required: false,
        classification: "INTERNAL",
      },
    ],
    records: [
      { code: "LAPTOP", name: "Laptop", active: true },
      { code: "MONITOR", name: "Màn hình", active: true },
    ],
  },
  {
    id: "vendor",
    key: "vendor",
    name: "Vendor",
    kind: "EXTERNAL_MIRROR",
    sourceOwner: "ERP · chưa kết nối",
    businessOwner: "Finance",
    scope: "COMPANY",
    version: 2,
    status: "PUBLISHED",
    fields: [
      {
        id: "v_code",
        key: "code",
        label: "Mã nhà cung cấp",
        type: "text",
        required: true,
        classification: "INTERNAL",
      },
      {
        id: "v_name",
        key: "name",
        label: "Tên nhà cung cấp",
        type: "text",
        required: true,
        classification: "INTERNAL",
      },
      {
        id: "v_bank",
        key: "bank_account",
        label: "Tài khoản ngân hàng",
        type: "text",
        required: false,
        classification: "SENSITIVE",
      },
    ],
    records: [
      { code: "V-001", name: "Nhà cung cấp mẫu A", bank_account: "•••• 4821" },
    ],
  },
  {
    id: "expense_type",
    key: "expense_type",
    name: "Expense Type",
    kind: "LOCAL_CATALOG",
    sourceOwner: "Finance nội bộ",
    businessOwner: "Finance",
    scope: "TENANT",
    version: 1,
    status: "DRAFT",
    fields: [
      {
        id: "et_code",
        key: "code",
        label: "Mã loại chi phí",
        type: "text",
        required: true,
        classification: "INTERNAL",
      },
      {
        id: "et_name",
        key: "name",
        label: "Tên loại chi phí",
        type: "text",
        required: true,
        classification: "INTERNAL",
      },
    ],
    records: [],
  },
  {
    id: "department",
    key: "department",
    name: "Department",
    kind: "EXTERNAL_MIRROR",
    sourceOwner: "HR · chưa kết nối",
    businessOwner: "HR",
    scope: "TENANT",
    version: 1,
    status: "PUBLISHED",
    fields: [
      {
        id: "dep_code",
        key: "code",
        label: "Mã phòng ban",
        type: "text",
        required: true,
        classification: "INTERNAL",
      },
      {
        id: "dep_name",
        key: "name",
        label: "Tên phòng ban",
        type: "text",
        required: true,
        classification: "INTERNAL",
      },
    ],
    records: [],
  },
];
export const resources: ResourceAction[] = [
  {
    resource: "master.asset_category",
    label: "Asset Category",
    actions: ["READ", "CREATE", "UPDATE", "ARCHIVE", "EXPORT"],
  },
  { resource: "master.vendor", label: "Vendor", actions: ["READ", "EXPORT"] },
  {
    resource: "request.payment",
    label: "Payment Request",
    actions: ["READ", "CREATE", "UPDATE", "APPROVE", "EXPORT"],
  },
  {
    resource: "task.approval",
    label: "Approval Task",
    actions: ["READ", "APPROVE"],
  },
];
export const seedRoles: Role[] = [
  {
    id: "data_steward",
    name: "Data Steward",
    description: "Quản trị danh mục nội bộ",
    scope: "COMPANY",
    grants: {
      "master.asset_category": ["READ", "CREATE", "UPDATE"],
      "master.vendor": ["READ"],
    },
    fieldRules: { "vendor.bank_account": "MASK" },
    version: 1,
    status: "DRAFT",
  },
  {
    id: "manager",
    name: "Manager",
    description: "Duyệt tác vụ được giao",
    scope: "ASSIGNED_TASK",
    grants: {
      "request.payment": ["READ"],
      "task.approval": ["READ", "APPROVE"],
    },
    fieldRules: { "vendor.bank_account": "DENY" },
    version: 2,
    status: "DRAFT",
  },
  {
    id: "finance",
    name: "Finance Reviewer",
    description: "Kiểm tra yêu cầu tài chính",
    scope: "ASSIGNED_TASK",
    grants: {
      "request.payment": ["READ", "APPROVE"],
      "master.vendor": ["READ"],
    },
    fieldRules: { "vendor.bank_account": "MASK" },
    version: 4,
    status: "DRAFT",
  },
];
function makeService<T extends { id: string }>(
  key: string,
  seed: T[],
  merge: (rows: T[]) => T[] = (rows) => rows,
): MockService<T> {
  const read = (): T[] => {
    try {
      const stored = localStorage.getItem(key);
      return merge(
        stored ? (JSON.parse(stored) as T[]) : structuredClone(seed),
      );
    } catch {
      return merge(structuredClone(seed));
    }
  };
  return {
    async list() {
      return structuredClone(read());
    },
    async save(value) {
      const rows = read();
      const index = rows.findIndex((row) => row.id === value.id);
      if (index < 0) rows.push(value);
      else rows[index] = value;
      localStorage.setItem(key, JSON.stringify(rows));
      return structuredClone(value);
    },
  };
}
export const entityService = makeService(
  "flowdocker.demo.entities.v1",
  seedEntities,
  withOrganizationSamples,
);
export const roleService = makeService("flowdocker.demo.roles.v1", seedRoles);
