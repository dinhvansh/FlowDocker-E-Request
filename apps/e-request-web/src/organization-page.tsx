import { useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import type { MasterEntity } from "@flowdocker/app-contracts";
import {
  MasterBuilder,
  type MasterBuilderProps,
} from "@flowdocker/master-builder";
import { Badge, EmptyState, Notice, Select, Tabs } from "@flowdocker/ui";
import { organizationDirectory } from "./organization";

export function OrganizationMasterPage(props: MasterBuilderProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState("catalog");
  return (
    <div className="fd-organization-page">
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "catalog", label: t("Danh mục") },
          { id: "organization", label: t("Sơ đồ tổ chức") },
        ]}
      />
      {tab === "catalog" ? (
        <MasterBuilder {...props} />
      ) : (
        <OrganizationChart entities={props.entities} />
      )}
    </div>
  );
}
export function OrganizationChart({ entities }: { entities: MasterEntity[] }) {
  const { t } = useI18n();
  const [departmentId, setDepartmentId] = useState("all");
  const { people, departments } = organizationDirectory(entities);
  const filtered = people.filter(
    (person) => departmentId === "all" || person.departmentId === departmentId,
  );
  const ids = new Set(filtered.map((person) => person.id));
  const roots = filtered.filter((person) => !ids.has(person.managerId));
  const visited = new Set<string>();
  const renderPerson = (
    person: (typeof people)[number],
    ancestors: Set<string>,
  ) => {
    if (ancestors.has(person.id) || visited.has(person.id)) return null;
    visited.add(person.id);
    const next = new Set([...ancestors, person.id]);
    const department = departments.find(
      (row) => row.id === person.departmentId,
    );
    const manager = people.find((row) => row.id === person.managerId);
    const children = filtered.filter(
      (row) => row.managerId === person.id && !next.has(row.id),
    );
    return (
      <li key={person.id}>
        <div className="fd-org-person">
          <span className="fd-org-avatar" aria-hidden="true">
            {person.name.slice(0, 1)}
          </span>
          <div>
            <strong>{person.name}</strong>
            <p>
              {person.title} · {department?.name ?? t("Chưa có phòng ban")}
            </p>
            <small>{person.email}</small>
            <small>
              {t("Quản lý trực tiếp")}:{" "}
              {manager?.name ??
                (person.managerId
                  ? t("Không tìm thấy người quản lý")
                  : t("Chưa có người quản lý"))}
            </small>
          </div>
          {department?.headId === person.id && (
            <Badge>{t("Trưởng phòng")}</Badge>
          )}
        </div>
        {children.length > 0 && (
          <ul>{children.map((child) => renderPerson(child, next))}</ul>
        )}
      </li>
    );
  };
  return (
    <section className="fd-screen fd-org-chart">
      <div className="fd-page-toolbar">
        <div>
          <h1>{t("Sơ đồ tổ chức")}</h1>
          <p>
            {t("Quan hệ báo cáo trực tiếp và trưởng phòng từ danh mục mẫu.")}
          </p>
        </div>
        <Select
          label={t("Lọc phòng ban")}
          value={departmentId}
          onValueChange={setDepartmentId}
          options={[
            { value: "all", label: t("Tất cả phòng ban") },
            ...departments.map((row) => ({ value: row.id, label: row.name })),
          ]}
        />
      </div>
      <Notice>
        {t(
          "Dữ liệu tổ chức giả lập, chỉ lưu trên trình duyệt. Chưa kết nối Microsoft 365.",
        )}
      </Notice>
      {filtered.length ? (
        <ul className="fd-org-tree" aria-label={t("Quan hệ báo cáo")}>
          {roots.map((person) => renderPerson(person, new Set()))}
          {filtered
            .filter((person) => !visited.has(person.id))
            .map((person) => renderPerson(person, new Set()))}
        </ul>
      ) : (
        <EmptyState title={t("Không có nhân viên đang hoạt động")} />
      )}
    </section>
  );
}
