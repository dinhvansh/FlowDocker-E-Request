import type { MasterEntity, MasterField } from "@flowdocker/app-contracts";
import type { ChoiceOption, FormDefinition } from "@flowdocker/form-builder";

export const peopleEntityId = "demo_org_people";
export const departmentsEntityId = "demo_org_departments";
const field = (
  key: string,
  label: string,
  type: MasterField["type"] = "text",
  referenceEntity?: string,
): MasterField => ({
  id: key,
  key,
  label,
  type,
  required: ["id", "name"].includes(key),
  classification: "INTERNAL",
  ...(referenceEntity ? { referenceEntity } : {}),
});
const base = {
  kind: "LOCAL_CATALOG",
  sourceOwner: "Dữ liệu mẫu",
  businessOwner: "HR · Demo",
  scope: "TENANT",
  version: 1,
  status: "DRAFT",
} as const;
export const organizationSeeds: MasterEntity[] = [
  {
    ...base,
    id: departmentsEntityId,
    key: departmentsEntityId,
    name: "Phòng ban · mẫu tổ chức",
    fields: [
      field("id", "Mã định danh"),
      field("code", "Mã phòng ban"),
      field("name", "Tên phòng ban"),
      field(
        "parent_id",
        "Phòng ban cấp trên",
        "reference",
        departmentsEntityId,
      ),
      field("head_id", "Trưởng phòng", "reference", peopleEntityId),
    ],
    records: [
      {
        id: "org_company",
        code: "DEMO",
        name: "Công ty mẫu",
        parent_id: "",
        head_id: "person_01",
      },
      {
        id: "org_it",
        code: "IT",
        name: "Công nghệ thông tin",
        parent_id: "org_company",
        head_id: "person_02",
      },
      {
        id: "org_finance",
        code: "FIN",
        name: "Tài chính",
        parent_id: "org_company",
        head_id: "person_05",
      },
      {
        id: "org_hr",
        code: "HR",
        name: "Nhân sự",
        parent_id: "org_company",
        head_id: "person_07",
      },
    ],
  },
  {
    ...base,
    id: peopleEntityId,
    key: peopleEntityId,
    name: "Nhân viên · mẫu tổ chức",
    fields: [
      field("id", "Mã định danh"),
      field("name", "Họ tên"),
      field("email", "Email"),
      field("title", "Chức danh"),
      field("department_id", "Phòng ban", "reference", departmentsEntityId),
      field("manager_id", "Quản lý trực tiếp", "reference", peopleEntityId),
      field("active", "Đang hoạt động", "boolean"),
    ],
    records: [
      {
        id: "person_01",
        name: "An Demo",
        email: "an@example.test",
        title: "Giám đốc",
        department_id: "org_company",
        manager_id: "",
        active: true,
      },
      {
        id: "person_02",
        name: "Bình Demo",
        email: "binh@example.test",
        title: "Trưởng phòng IT",
        department_id: "org_it",
        manager_id: "person_01",
        active: true,
      },
      {
        id: "person_03",
        name: "Chi Demo",
        email: "chi@example.test",
        title: "Trưởng nhóm ứng dụng",
        department_id: "org_it",
        manager_id: "person_02",
        active: true,
      },
      {
        id: "person_04",
        name: "Dũng Demo",
        email: "dung@example.test",
        title: "Chuyên viên ứng dụng",
        department_id: "org_it",
        manager_id: "person_03",
        active: true,
      },
      {
        id: "person_05",
        name: "Hà Demo",
        email: "ha@example.test",
        title: "Trưởng phòng tài chính",
        department_id: "org_finance",
        manager_id: "person_01",
        active: true,
      },
      {
        id: "person_06",
        name: "Lan Demo",
        email: "lan@example.test",
        title: "Kế toán",
        department_id: "org_finance",
        manager_id: "person_05",
        active: true,
      },
      {
        id: "person_07",
        name: "Minh Demo",
        email: "minh@example.test",
        title: "Trưởng phòng nhân sự",
        department_id: "org_hr",
        manager_id: "person_01",
        active: true,
      },
      {
        id: "person_08",
        name: "Nam Demo",
        email: "nam@example.test",
        title: "Nhân viên đã nghỉ · mẫu",
        department_id: "org_it",
        manager_id: "person_02",
        active: false,
      },
    ],
  },
];

/** Add only missing fixture catalogs; preserve all saved definitions and records. */
export function withOrganizationSamples(
  entities: MasterEntity[],
): MasterEntity[] {
  return [
    ...entities,
    ...structuredClone(
      organizationSeeds.filter(
        (seed) => !entities.some((entity) => entity.id === seed.id),
      ),
    ),
  ];
}
export function organizationDirectory(entities: MasterEntity[]) {
  const departments = (
    entities.find((entity) => entity.id === departmentsEntityId)?.records ?? []
  )
    .filter((row) => typeof row.id === "string" && typeof row.name === "string")
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      parentId: String(row.parent_id ?? ""),
      headId: String(row.head_id ?? ""),
    }));
  const people = (
    entities.find((entity) => entity.id === peopleEntityId)?.records ?? []
  )
    .filter(
      (row) =>
        row.active === true &&
        typeof row.id === "string" &&
        typeof row.name === "string",
    )
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email ?? ""),
      title: String(row.title ?? ""),
      departmentId: String(row.department_id ?? ""),
      managerId: String(row.manager_id ?? ""),
    }));
  return { departments, people };
}
export function peopleOptions(entities: MasterEntity[]): ChoiceOption[] {
  const { departments, people } = organizationDirectory(entities);
  return people.map((person) => {
    const detail = `${person.email} · ${departments.find((department) => department.id === person.departmentId)?.name ?? person.departmentId}`;
    return {
      value: person.id,
      label: { vi: person.name, en: person.name },
      description: { vi: detail, en: detail },
    };
  });
}
export const organizationForm: FormDefinition = {
  id: "demo-organization-people",
  schemaVersion: 2,
  version: 1,
  status: "DRAFT",
  title: {
    vi: "Chọn người và tổ chức · mẫu",
    en: "People and organization · sample",
  },
  fields: [
    {
      id: "requester",
      key: "requester",
      label: { vi: "Người yêu cầu", en: "Requester" },
      type: "person",
      required: true,
      options: [],
      dataSource: { provider: "organization.people" },
      help: {
        vi: "Chọn từ danh mục nhân viên mẫu.",
        en: "Select from the sample employee directory.",
      },
    },
    {
      id: "colleagues",
      key: "colleagues",
      label: { vi: "Người phối hợp", en: "Collaborators" },
      type: "person",
      multiple: true,
      required: false,
      options: [],
      dataSource: { provider: "organization.people" },
    },
  ],
};
