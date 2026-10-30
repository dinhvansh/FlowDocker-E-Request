import { masterDeleteBlockers, removeLocalMaster } from "./master-deletion";
import { formCatalog, readFormDrafts } from "./form-drafts";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ArrowRight, Blocks, Database, LockKeyhole } from "lucide-react";
import { AppShell, type PageId } from "@flowdocker/app-shell";
import { OrganizationMasterPage } from "./organization-page";
import { PermissionBuilder } from "@flowdocker/permission-builder";
import { Badge, Button, DataTable, Notice } from "@flowdocker/ui";
import type { MasterEntity, Role } from "@flowdocker/app-contracts";
import { entityService, resources, roleService } from "./mock";
import { ConnectionsPage } from "./connections";
import { ApplicationsPage } from "./applications";
import { FormsPage, type FormsPageHandle } from "./forms";
import { ProfilePage } from "./profile";
import { demoProfile } from "./demo-profile";
import "@flowdocker/ui/styles.css";

const FlowStudioPage = lazy(() =>
  import("./flow-studio").then((module) => ({
    default: module.FlowStudioPage,
  })),
);
const AntPermissionBuilder = lazy(() =>
  import("@flowdocker/permission-builder/antd-preview").then((module) => ({
    default: module.AntPermissionBuilder,
  })),
);
const permissionPreview =
  new URLSearchParams(location.search).get("permission-ui") === "antd";

function initialPage(): PageId {
  const hash = location.hash.slice(1);
  return [
    "workspace",
    "master",
    "permissions",
    "applications",
    "forms",
    "connections",
    "flows",
    "profile",
  ].includes(hash)
    ? (hash as PageId)
    : "workspace";
}
function App() {
  const { t } = useI18n();
  useEffect(() => {
    document.title = t("FlowDocker · Platform Console");
  }, [t]);

  const [page, setPage] = useState<PageId>(initialPage);
  const formsRef = useRef<FormsPageHandle>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("flowdocker.theme") === "dark" ? "dark" : "light",
  );
  const [entities, setEntities] = useState<MasterEntity[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([entityService.list(), roleService.list()])
      .then(([e, r]) => {
        setEntities(e);
        setRoles(r);
      })
      .catch(() => setError("Không tải được dữ liệu mẫu."))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const onHash = () => {
      const next = initialPage();
      if (next === "forms") formsRef.current?.openCatalog();
      setPage(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (id: PageId) => {
    if (id === "forms") formsRef.current?.openCatalog();
    location.hash = id;
    setPage(id);
  };
  const changeTheme = () =>
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem("flowdocker.theme", next);
      return next;
    });
  const saveEntity = async (value: MasterEntity) => {
    await entityService.save(value);
    setEntities(await entityService.list());
  };
  const deleteBlockers = (entity: MasterEntity) => {
    try {
      return masterDeleteBlockers(entity, entities, roles, [
        ...formCatalog(readFormDrafts(localStorage)),
        ...(formsRef.current?.getDefinitions() ?? []),
      ]).map((issue) => t(issue));
    } catch {
      return [t("Không đọc được dữ liệu phụ thuộc. Chưa thể xóa entity.")];
    }
  };
  const deleteEntity = async (id: string) => {
    const rawRoles = localStorage.getItem("flowdocker.demo.roles.v1");
    const currentRoles: Role[] =
      rawRoles === null ? roles : JSON.parse(rawRoles);
    if (
      !Array.isArray(currentRoles) ||
      !currentRoles.every(
        (role) => role && role.grants && typeof role.grants === "object",
      )
    )
      throw new Error("Invalid role storage");
    const savedForms = formCatalog(readFormDrafts(localStorage));
    const liveForms = formsRef.current?.getDefinitions() ?? [];
    removeLocalMaster(localStorage, entities, id, (current) => {
      const entity = current.find((item) => item.id === id)!;
      const issues = masterDeleteBlockers(entity, current, currentRoles, [
        ...savedForms,
        ...liveForms,
      ]);
      if (issues.length) throw new Error(issues.join(" "));
    });
    setEntities(await entityService.list());
  };
  const saveRole = async (value: Role) => {
    await roleService.save(value);
    setRoles(await roleService.list());
  };
  return (
    <AppShell
      page={page}
      account={{
        displayName: demoProfile.name,
        initials: demoProfile.initials,
        subtitle: demoProfile.sidebarSubtitle,
      }}
      onPageChange={navigate}
      theme={theme}
      onThemeChange={changeTheme}
    >
      {page === "master" && (
        <OrganizationMasterPage
          entities={entities}
          onSave={saveEntity}
          onDelete={deleteEntity}
          getDeleteBlockers={deleteBlockers}
          loading={loading}
          error={error}
        />
      )}
      {page === "permissions" &&
        (permissionPreview ? (
          <Suspense
            fallback={
              <section className="fd-screen">{t("Đang tải...")}</section>
            }
          >
            <AntPermissionBuilder
              roles={roles}
              resources={resources}
              onSave={saveRole}
              loading={loading}
              error={error}
              theme={theme}
            />
          </Suspense>
        ) : (
          <PermissionBuilder
            roles={roles}
            resources={resources}
            onSave={saveRole}
            loading={loading}
            error={error}
          />
        ))}
      {page === "connections" && (
        <ConnectionsPage onOpenFlows={() => navigate("flows")} />
      )}
      {page === "flows" && (
        <Suspense
          fallback={
            <section className="fd-screen fd-loading-screen">
              {t("Đang tải Flow Studio...")}
            </section>
          }
        >
          <FlowStudioPage onOpenConnections={() => navigate("connections")} />
        </Suspense>
      )}
      {page === "profile" && (
        <ProfilePage
          profile={demoProfile}
          theme={theme}
          onThemeChange={changeTheme}
        />
      )}
      {page === "workspace" && (
        <section className="fd-screen">
          <div className="fd-page-toolbar">
            <div>
              <div className="fd-overline">{t("WORKSPACE / E-REQUEST")}</div>
              <h1>{t("Không gian làm việc")}</h1>
              <p>{t("Quản lý cấu hình nền tảng và công việc đang mở")}</p>
            </div>
            <div className="fd-toolbar-actions">
              <Badge tone="warning">{t("Môi trường demo")}</Badge>
              <Button onClick={() => navigate("applications")}>
                <Blocks size={16} />
                {t("Tạo ứng dụng")}
              </Button>
            </div>
          </div>
          <div className="fd-overview">
            <div className="fd-overview-main">
              <div className="fd-section-heading">
                <div>
                  <h2>{t("Tiếp tục công việc")}</h2>
                  <p>
                    {t(
                      "Các cấu hình frontend có thể thử ngay trên dữ liệu mẫu.",
                    )}
                  </p>
                </div>
              </div>
              <div className="fd-quick-links">
                <a href="#master">
                  <span className="fd-quick-icon">
                    <Database size={19} />
                  </span>
                  <span>
                    <strong>{t("Master Data Builder")}</strong>
                    <small>
                      {t("Định nghĩa entity, trường và nguồn sở hữu")}
                    </small>
                  </span>
                  <ArrowRight size={17} />
                </a>
                <a href="#permissions">
                  <span className="fd-quick-icon purple">
                    <LockKeyhole size={19} />
                  </span>
                  <span>
                    <strong>{t("Permission Builder")}</strong>
                    <small>
                      {t("Ma trận quyền, phạm vi và mô phỏng truy cập")}
                    </small>
                  </span>
                  <ArrowRight size={17} />
                </a>
              </div>
              <div className="fd-section-heading">
                <div>
                  <h2>{t("Entity gần đây")}</h2>
                  <p>{t("Cấu hình mẫu trong trình duyệt hiện tại")}</p>
                </div>
                <Button variant="ghost" onClick={() => navigate("master")}>
                  {t("Xem tất cả")}
                  <ArrowRight size={15} />
                </Button>
              </div>
              {loading ? (
                <p>{t("Đang tải...")}</p>
              ) : (
                <DataTable
                  rows={entities.slice(0, 5)}
                  rowKey={(e) => e.id}
                  onRowClick={() => navigate("master")}
                  columns={[
                    {
                      key: "name",
                      heading: t("ENTITY"),
                      render: (e) => <strong>{e.name}</strong>,
                    },
                    {
                      key: "type",
                      heading: t("LOẠI"),
                      render: (e) =>
                        e.kind === "LOCAL_CATALOG"
                          ? t("Danh mục nội bộ")
                          : t("Nguồn ngoài"),
                    },
                    {
                      key: "owner",
                      heading: t("OWNER"),
                      render: (e) => e.businessOwner,
                    },
                    {
                      key: "status",
                      heading: t("TRẠNG THÁI"),
                      render: (e) => (
                        <Badge
                          tone={e.status === "DRAFT" ? "warning" : "success"}
                        >
                          {e.status === "DRAFT"
                            ? t("Bản nháp")
                            : t("Mẫu v{{version}}", { version: e.version })}
                        </Badge>
                      ),
                    },
                  ]}
                />
              )}
            </div>
            <aside className="fd-overview-side">
              <h2>{t("Trạng thái nền tảng")}</h2>
              <div className="fd-status-line">
                <span>{t("Master Builder")}</span>
                <Badge tone="info">{t("Frontend demo")}</Badge>
              </div>
              <div className="fd-status-line">
                <span>{t("Permission Builder")}</span>
                <Badge tone="info">{t("Frontend demo")}</Badge>
              </div>
              <div className="fd-status-line">
                <span>{t("Backend & authorization")}</span>
                <Badge tone="warning">{t("Chưa triển khai")}</Badge>
              </div>
              <Notice tone="warning">
                {t(
                  "Dữ liệu ở đây là dữ liệu tổng hợp. Không có ERP, identity, policy engine hay quyền máy chủ.",
                )}
              </Notice>
              <h3>{t("Lộ trình giao diện")}</h3>
              <ul className="fd-next-list">
                <li>{t("PR 2 · Connections & Flow Studio: frontend demo")}</li>
                <li>{t("PR 3 · Application Builder: bản nháp frontend")}</li>
                <li>{t("PR 4 · Form Studio: thiết kế và xem thử bản nháp")}</li>
              </ul>
            </aside>
          </div>
        </section>
      )}
      {page === "applications" && <ApplicationsPage onOpenModule={navigate} />}
      <div hidden={page !== "forms"}>
        <FormsPage ref={formsRef} entities={entities} />
      </div>
    </AppShell>
  );
}

const root: Root =
  import.meta.hot?.data.root ?? createRoot(document.getElementById("root")!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
