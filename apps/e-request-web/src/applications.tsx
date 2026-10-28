import { useI18n } from "@flowdocker/i18n";
import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import {
  appModules,
  isAppDraft,
  validateAppDraft,
  type AppDraft,
} from "@flowdocker/app-contracts";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Field,
  Input,
  Modal,
  Notice,
  SearchInput,
} from "@flowdocker/ui";

const key = "flowdocker.pr3.apps";
const fixtures: AppDraft[] = [
  {
    appId: "flowdocker.e-request",
    title: "E-Request",
    version: "0.1.0",
    status: "DRAFT",
    modules: [
      "identity",
      "permissions",
      "master",
      "connections",
      "flows",
      "forms",
    ],
  },
  {
    appId: "flowdocker.it-assets",
    title: "IT Assets · mẫu tổng hợp",
    version: "0.1.0",
    status: "DRAFT",
    modules: ["identity", "permissions", "master"],
  },
];
function loadApps(): { apps: AppDraft[]; error: string } {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return { apps: fixtures, error: "" };
    const data: unknown = JSON.parse(stored);
    if (
      !Array.isArray(data) ||
      !data.every(isAppDraft) ||
      new Set(data.map((app) => app.appId)).size !== data.length
    )
      throw new Error();
    return { apps: data, error: "" };
  } catch {
    return {
      apps: fixtures,
      error:
        "Không đọc được bản nháp đã lưu. Đang hiển thị dữ liệu mẫu; dữ liệu lưu cũ chưa bị thay đổi.",
    };
  }
}
export function ApplicationsPage({
  onOpenModule,
}: {
  onOpenModule(id: "master" | "permissions" | "connections" | "flows"): void;
}) {
  const { t, validation } = useI18n();

  const [initial] = useState(loadApps);
  const [apps, setApps] = useState(initial.apps);
  const [notice, setNotice] = useState(initial.error);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initial.apps[0]?.appId);
  const [draft, setDraft] = useState<AppDraft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [validated, setValidated] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const selected = apps.find((app) => app.appId === selectedId);
  const openCreate = () => {
    setEditingId(null);
    setValidated("");
    setErrors([]);
    setDraft({
      appId: "flowdocker.",
      title: "",
      version: "0.1.0",
      modules: ["identity", "permissions"],
      status: "DRAFT",
    });
  };
  const save = () => {
    if (!draft) return;
    const problems = validateAppDraft(
      draft,
      apps.filter((app) => app.appId !== editingId).map((app) => app.appId),
    );
    setErrors(problems);
    if (problems.length) return;
    const saved = { ...draft, title: draft.title.trim() };
    const next = editingId
      ? apps.map((app) => (app.appId === editingId ? saved : app))
      : [...apps, saved];
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      setErrors([
        "Không thể lưu vào trình duyệt. Hãy kiểm tra dung lượng hoặc quyền lưu trữ rồi thử lại.",
      ]);
      return;
    }
    setApps(next);
    setSelectedId(draft.appId);
    setDraft(null);
    setNotice(
      "Đã lưu bản nháp trong trình duyệt này. Chưa đăng ký ứng dụng với máy chủ.",
    );
  };
  return (
    <section className="fd-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">
            {t("NỀN TẢNG / APPLICATION BUILDER")}
          </div>
          <h1>{t("Ứng dụng")}</h1>
          <p>{t("Cấu hình module và xem manifest bản nháp")}</p>
        </div>
        <div className="fd-toolbar-actions">
          <Badge tone="warning">{t("Frontend demo")}</Badge>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            {t("Tạo ứng dụng")}
          </Button>
        </div>
      </div>
      <div className="fd-app-builder">
        <Notice tone="warning">
          {t(
            "Bản nháp chỉ lưu cục bộ. Chọn module không cài đặt dịch vụ, cấp quyền hay chia sẻ dữ liệu giữa ứng dụng.",
          )}
        </Notice>
        {notice && <Notice>{t(notice)}</Notice>}
        <div className="fd-app-builder-grid">
          <div>
            <SearchInput
              label={t("Tìm ứng dụng theo tên hoặc App ID")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <DataTable
              rows={apps.filter((app) =>
                `${app.title} ${app.appId}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )}
              rowKey={(app) => app.appId}
              selectedKey={selectedId}
              onRowClick={(app) => setSelectedId(app.appId)}
              empty={t("Không tìm thấy ứng dụng")}
              columns={[
                {
                  key: "name",
                  heading: t("Ứng dụng"),
                  render: (app) => (
                    <div>
                      <strong>{app.title}</strong>
                      <div className="fd-app-id">{app.appId}</div>
                    </div>
                  ),
                },
                {
                  key: "version",
                  heading: t("Version"),
                  render: (app) => app.version,
                },
                {
                  key: "modules",
                  heading: t("Module"),
                  render: (app) => app.modules.length,
                },
                {
                  key: "status",
                  heading: t("Trạng thái"),
                  render: () => (
                    <Badge tone="warning">{t("Nháp cục bộ")}</Badge>
                  ),
                },
              ]}
            />
          </div>
          <aside
            className="fd-app-inspector"
            aria-label={t("Chi tiết ứng dụng")}
          >
            {selected ? (
              <>
                <h2>{selected.title}</h2>
                <p className="fd-app-id">
                  {selected.appId}
                  {t("· v")}
                  {selected.version}
                </p>
                <h3>{t("Module đã chọn")}</h3>
                <Button
                  onClick={() => {
                    setEditingId(selected.appId);
                    setDraft({ ...selected, modules: [...selected.modules] });
                    setErrors([]);
                    setValidated("");
                  }}
                >
                  {t("Chỉnh sửa bản nháp")}
                </Button>
                {appModules
                  .filter((module) => selected.modules.includes(module.id))
                  .map((module) => (
                    <div className="fd-app-module" key={module.id}>
                      <span>
                        {module.label}
                        <small className="fd-module-description">
                          {t(module.description)}
                        </small>
                      </span>
                      <Badge tone={module.available ? "info" : "neutral"}>
                        {module.available ? "UI demo" : t("Thiết kế")}
                      </Badge>
                    </div>
                  ))}
                <h3>{t("Manifest bản nháp")}</h3>
                <pre className="fd-app-manifest" tabIndex={0}>
                  {JSON.stringify(
                    {
                      ...selected,
                      resources: [],
                      handlers: [],
                      migrations: [],
                    },
                    null,
                    2,
                  )}
                </pre>
                <p className="fd-app-id">
                  {t(
                    "Chưa có backend handlers; manifest này không đăng ký resource/action hoặc thực thi quyền.",
                  )}
                </p>
                <Button
                  disabled
                  title={t("Cần backend registry, authorization và review")}
                >
                  {t("Publish · cần backend")}
                </Button>
                {selected.appId === "flowdocker.e-request" && (
                  <Button
                    variant="ghost"
                    onClick={() => onOpenModule("master")}
                  >
                    {t("Mở Master Data demo")}
                    <ArrowRight size={15} />
                  </Button>
                )}
              </>
            ) : (
              <p>{t("Chọn một ứng dụng để xem manifest.")}</p>
            )}
          </aside>
        </div>
      </div>
      {draft && (
        <Modal
          title={
            editingId
              ? t("Chỉnh sửa bản nháp ứng dụng")
              : t("Tạo bản nháp ứng dụng")
          }
          onClose={() => setDraft(null)}
          footer={
            <>
              <Button onClick={() => setDraft(null)}>{t("Hủy")}</Button>
              <Button
                onClick={() => {
                  setValidated(JSON.stringify(draft));
                  setErrors(
                    validateAppDraft(
                      draft,
                      apps
                        .filter((app) => app.appId !== editingId)
                        .map((app) => app.appId),
                    ),
                  );
                }}
              >
                {t("Kiểm tra")}
              </Button>
              <Button variant="primary" onClick={save}>
                {t("Lưu nháp cục bộ")}
              </Button>
            </>
          }
        >
          <div className="fd-app-form">
            <Field label={t("Tên ứng dụng")}>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label={t("App ID")} hint={t("Ví dụ: flowdocker.my-app")}>
              <Input
                value={draft.appId}
                disabled={editingId !== null}
                onChange={(e) => setDraft({ ...draft, appId: e.target.value })}
              />
            </Field>
            <Field label={t("Version")}>
              <Input
                value={draft.version}
                onChange={(e) =>
                  setDraft({ ...draft, version: e.target.value })
                }
              />
            </Field>
            <fieldset>
              <legend>{t("Chức năng dùng chung (module)")}</legend>
              <p className="fd-app-id">
                {t(
                  "Chọn các nhóm chức năng ứng dụng cần dùng. Hiện chỉ lưu cấu hình dự kiến.",
                )}
              </p>
              {appModules.map((module) => (
                <label className="fd-app-module" key={module.id}>
                  <span className="fd-app-module-label">
                    <Checkbox
                      checked={draft.modules.includes(module.id)}
                      disabled={module.required}
                      onCheckedChange={(checked) =>
                        setDraft({
                          ...draft,
                          modules:
                            checked === true
                              ? [...draft.modules, module.id]
                              : draft.modules.filter((id) => id !== module.id),
                        })
                      }
                    />
                    <span>
                      {module.label}
                      <small className="fd-module-description">
                        {t(module.description)}
                      </small>
                    </span>
                  </span>
                  <span className="fd-app-id">
                    {module.required
                      ? t("Bắt buộc")
                      : module.available
                        ? "UI demo"
                        : t("Thiết kế")}
                  </span>
                </label>
              ))}
            </fieldset>
            <Notice>
              {t(
                "Flow Studio cần chọn cả Master Data Builder và Connection Manager.",
              )}
            </Notice>
            {validated === JSON.stringify(draft) && errors.length === 0 && (
              <Notice tone="success">
                {t(
                  "Cấu hình bản nháp hợp lệ ở frontend. Chưa kiểm tra backend.",
                )}
              </Notice>
            )}
            {errors.length > 0 && (
              <Notice tone="danger">
                <ul>
                  {errors.map((error) => (
                    <li key={error}>{validation(error)}</li>
                  ))}
                </ul>
              </Notice>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
