import { lazy, Suspense, useMemo, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import type { MasterEntity } from "@flowdocker/app-contracts";
import {
  MasterBuilder,
  type MasterBuilderProps,
} from "@flowdocker/master-builder";
import {
  Badge,
  Button,
  EmptyState,
  Notice,
  Select,
  Tabs,
} from "@flowdocker/ui";
import { organizationDirectory } from "./organization";
const OrganizationCanvas = lazy(() =>
  import("@flowdocker/flow-canvas").then((module) => ({
    default: module.OrganizationCanvas,
  })),
);

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
  const [view, setView] = useState("diagram");
  const [selectedId, setSelectedId] = useState("");
  const { people, departments } = useMemo(
    () => organizationDirectory(entities),
    [entities],
  );
  const filtered = people.filter(
    (person) => departmentId === "all" || person.departmentId === departmentId,
  );
  const ids = new Set(filtered.map((person) => person.id));
  const visualPeople = useMemo(
    () =>
      people
        .filter(
          (person) =>
            departmentId === "all" || person.departmentId === departmentId,
        )
        .map((person) => ({
          ...person,
          department:
            departments.find((row) => row.id === person.departmentId)?.name ??
            t("Chưa có phòng ban"),
          isHead: departments.some((row) => row.headId === person.id),
        })),
    [people, departments, departmentId, t],
  );
  const selected = filtered.find((person) => person.id === selectedId);
  const selectedDepartment = departments.find(
    (row) => row.id === selected?.departmentId,
  );
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
      <div className="fd-org-viewbar">
        <Tabs
          active={view}
          onChange={setView}
          tabs={[
            { id: "diagram", label: t("Sơ đồ") },
            { id: "list", label: t("Danh sách") },
          ]}
        />
        <span>
          {t("{{count}} nhân viên · {{departments}} phòng ban", {
            count: filtered.length,
            departments: new Set(filtered.map((person) => person.departmentId))
              .size,
          })}
        </span>
      </div>
      {filtered.length ? (
        view === "diagram" ? (
          <Suspense
            fallback={<Notice>{t("Đang tải sơ đồ tổ chức...")}</Notice>}
          >
            <OrganizationCanvas
              people={visualPeople}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Suspense>
        ) : (
          <ul className="fd-org-tree" aria-label={t("Quan hệ báo cáo")}>
            {roots.map((person) => renderPerson(person, new Set()))}
            {filtered
              .filter((person) => !visited.has(person.id))
              .map((person) => renderPerson(person, new Set()))}
          </ul>
        )
      ) : (
        <EmptyState title={t("Không có nhân viên đang hoạt động")} />
      )}
      {view === "diagram" && selected && (
        <aside className="fd-org-detail" aria-label={t("Thông tin nhân viên")}>
          <header>
            <div>
              <strong>{selected.name}</strong>
              <p>{selected.title}</p>
            </div>
            <Button onClick={() => setSelectedId("")}>
              {t("Đóng thông tin")}
            </Button>
          </header>
          <dl>
            <div>
              <dt>{t("Email")}</dt>
              <dd>{selected.email}</dd>
            </div>
            <div>
              <dt>{t("Phòng ban")}</dt>
              <dd>{selectedDepartment?.name ?? t("Chưa có phòng ban")}</dd>
            </div>
            <div>
              <dt>{t("Quản lý trực tiếp")}</dt>
              <dd>
                {people.find((person) => person.id === selected.managerId)
                  ?.name ?? t("Chưa có người quản lý")}
              </dd>
            </div>
            <div>
              <dt>{t("Trưởng phòng")}</dt>
              <dd>
                {people.find(
                  (person) => person.id === selectedDepartment?.headId,
                )?.name ?? t("Chưa có người quản lý")}
              </dd>
            </div>
          </dl>
        </aside>
      )}
    </section>
  );
}
