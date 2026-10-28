import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Blocks, Database, LockKeyhole } from "lucide-react";
import { AppShell, type PageId } from "@flowdocker/app-shell";
import { MasterBuilder } from "@flowdocker/master-builder";
import { PermissionBuilder } from "@flowdocker/permission-builder";
import { Badge, Button, DataTable, EmptyState, Notice } from "@flowdocker/ui";
import type { MasterEntity, Role } from "@flowdocker/app-contracts";
import { entityService, resources, roleService } from "./mock";
import "@flowdocker/ui/styles.css";

function initialPage(): PageId {
  const hash = location.hash.slice(1);
  return [
    "workspace",
    "master",
    "permissions",
    "applications",
    "connections",
    "flows",
  ].includes(hash)
    ? (hash as PageId)
    : "workspace";
}
function App() {
  const [page, setPage] = useState<PageId>(initialPage);
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
    const onHash = () => setPage(initialPage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (id: PageId) => {
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
  const saveRole = async (value: Role) => {
    await roleService.save(value);
    setRoles(await roleService.list());
  };
  return (
    <AppShell
      page={page}
      onPageChange={navigate}
      theme={theme}
      onThemeChange={changeTheme}
    >
      {page === "master" && (
        <MasterBuilder
          entities={entities}
          onSave={saveEntity}
          loading={loading}
          error={error}
        />
      )}
      {page === "permissions" && (
        <PermissionBuilder
          roles={roles}
          resources={resources}
          onSave={saveRole}
          loading={loading}
          error={error}
        />
      )}
      {page === "workspace" && (
        <section className="fd-screen">
          <div className="fd-page-toolbar">
            <div>
              <div className="fd-overline">WORKSPACE / E-REQUEST</div>
              <h1>Không gian làm việc</h1>
              <p>Quản lý cấu hình nền tảng và công việc đang mở</p>
            </div>
            <div className="fd-toolbar-actions">
              <Badge tone="warning">Môi trường demo</Badge>
              <Button
                disabled
                title="Application Builder sẽ được triển khai ở PR 3"
              >
                <Blocks size={16} /> Tạo ứng dụng · PR 3
              </Button>
            </div>
          </div>
          <div className="fd-overview">
            <div className="fd-overview-main">
              <div className="fd-section-heading">
                <div>
                  <h2>Tiếp tục công việc</h2>
                  <p>Các cấu hình frontend có thể thử ngay trên dữ liệu mẫu.</p>
                </div>
              </div>
              <div className="fd-quick-links">
                <button onClick={() => navigate("master")}>
                  <span className="fd-quick-icon">
                    <Database size={19} />
                  </span>
                  <span>
                    <strong>Master Data Builder</strong>
                    <small>Định nghĩa entity, trường và nguồn sở hữu</small>
                  </span>
                  <ArrowRight size={17} />
                </button>
                <button onClick={() => navigate("permissions")}>
                  <span className="fd-quick-icon purple">
                    <LockKeyhole size={19} />
                  </span>
                  <span>
                    <strong>Permission Builder</strong>
                    <small>Ma trận quyền, phạm vi và mô phỏng truy cập</small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              </div>
              <div className="fd-section-heading">
                <div>
                  <h2>Entity gần đây</h2>
                  <p>Cấu hình mẫu trong trình duyệt hiện tại</p>
                </div>
                <Button variant="ghost" onClick={() => navigate("master")}>
                  Xem tất cả <ArrowRight size={15} />
                </Button>
              </div>
              {loading ? (
                <p>Đang tải...</p>
              ) : (
                <DataTable
                  rows={entities.slice(0, 5)}
                  rowKey={(e) => e.id}
                  onRowClick={() => navigate("master")}
                  columns={[
                    {
                      key: "name",
                      heading: "ENTITY",
                      render: (e) => <strong>{e.name}</strong>,
                    },
                    {
                      key: "type",
                      heading: "LOẠI",
                      render: (e) =>
                        e.kind === "LOCAL_CATALOG"
                          ? "Danh mục nội bộ"
                          : "Nguồn ngoài",
                    },
                    {
                      key: "owner",
                      heading: "OWNER",
                      render: (e) => e.businessOwner,
                    },
                    {
                      key: "status",
                      heading: "TRẠNG THÁI",
                      render: (e) => (
                        <Badge
                          tone={e.status === "DRAFT" ? "warning" : "success"}
                        >
                          {e.status === "DRAFT"
                            ? "Bản nháp"
                            : `Mẫu v${e.version}`}
                        </Badge>
                      ),
                    },
                  ]}
                />
              )}
            </div>
            <aside className="fd-overview-side">
              <h2>Trạng thái nền tảng</h2>
              <div className="fd-status-line">
                <span>Master Builder</span>
                <Badge tone="info">Frontend demo</Badge>
              </div>
              <div className="fd-status-line">
                <span>Permission Builder</span>
                <Badge tone="info">Frontend demo</Badge>
              </div>
              <div className="fd-status-line">
                <span>Backend & authorization</span>
                <Badge tone="warning">Chưa triển khai</Badge>
              </div>
              <Notice tone="warning">
                Dữ liệu ở đây là dữ liệu tổng hợp. Không có ERP, identity,
                policy engine hay quyền máy chủ.
              </Notice>
              <h3>Giai đoạn kế tiếp</h3>
              <ul className="fd-next-list">
                <li>PR 2 · Connections & Flow Studio</li>
                <li>PR 3 · Application Builder & tích hợp UI</li>
              </ul>
            </aside>
          </div>
        </section>
      )}
      {["applications", "connections", "flows"].includes(page) && (
        <section className="fd-screen">
          <div className="fd-page-toolbar">
            <div>
              <div className="fd-overline">NỀN TẢNG / KẾ HOẠCH</div>
              <h1>
                {page === "applications"
                  ? "Application Builder"
                  : page === "connections"
                    ? "Connection Manager"
                    : "Master Data Flow Studio"}
              </h1>
              <p>
                {page === "applications"
                  ? "Dự kiến trong PR 3"
                  : "Dự kiến trong PR 2"}
              </p>
            </div>
            <Badge tone="warning">Chưa triển khai</Badge>
          </div>
          <div className="fd-planned">
            <EmptyState
              title="Màn hình này đang trong kế hoạch"
              detail={
                page === "applications"
                  ? "Tạo app, chọn module và App Manifest sẽ được thực hiện ở PR 3."
                  : page === "connections"
                    ? "Danh sách kết nối và trình cấu hình sẽ được thực hiện ở PR 2; chưa có kiểm tra kết nối thật."
                    : "Canvas React Flow và Dry Run sẽ được thực hiện ở PR 2; chưa có graph runtime."
              }
            />
            <Button onClick={() => navigate("workspace")}>
              Về không gian làm việc
            </Button>
          </div>
        </section>
      )}
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
