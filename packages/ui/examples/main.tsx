import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LanguagePicker,
  Badge,
  Button,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  Notice,
  Select,
  Tabs,
} from "../src";
import "../styles.css";

function Examples() {
  const { t } = useI18n();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState("default");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("LOCAL_CATALOG");
  return (
    <div className="fd-app" data-theme={theme}>
      <main
        style={{ maxWidth: 900, padding: 32, margin: "auto", width: "100%" }}
      >
        <LanguagePicker />
        <h1>{t("FlowDocker UI · isolated examples")}</h1>
        <p>{t("Dữ liệu tổng hợp, không cần API hay credentials.")}</p>
        <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? t("Bật giao diện tối") : t("Bật giao diện sáng")}
        </Button>
        <div style={{ display: "flex", gap: 8, margin: "22px 0" }}>
          <Button variant="primary" onClick={() => setOpen(true)}>
            {t("Mở dialog")}
          </Button>
          <Button disabled>{t("Disabled")}</Button>
          <Badge tone="success">{t("Success")}</Badge>
          <Badge tone="warning">{t("Warning")}</Badge>
          <Badge tone="danger">{t("Error")}</Badge>
        </div>
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "default", label: t("Default") },
            { id: "empty", label: t("Empty") },
            { id: "error", label: t("Error") },
          ]}
        />
        <div
          style={{
            background: "var(--fd-surface-default)",
            padding: 20,
            border: "1px solid var(--fd-border)",
          }}
        >
          {tab === "default" ? (
            <>
              <Field label={t("Tìm dữ liệu mẫu")}>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
              <Field label={t("Loại entity")}>
                <Select
                  label={t("Loại entity")}
                  value={kind}
                  onValueChange={setKind}
                  options={[
                    { value: "LOCAL_CATALOG", label: t("Danh mục nội bộ") },
                    {
                      value: "EXTERNAL_MIRROR",
                      label: t("Dữ liệu nguồn ngoài"),
                    },
                  ]}
                />
              </Field>
              <DataTable
                rows={[
                  { id: "1", name: "Danh mục mẫu" },
                  { id: "2", name: "Vai trò mẫu" },
                ].filter((row) =>
                  row.name.toLowerCase().includes(search.toLowerCase()),
                )}
                rowKey={(r) => r.id}
                columns={[
                  { key: "name", heading: t("TÊN"), render: (r) => r.name },
                ]}
              />
            </>
          ) : tab === "empty" ? (
            <EmptyState
              title={t("Chưa có dữ liệu")}
              detail={t("Trạng thái rỗng của bảng và pane.")}
            />
          ) : (
            <Notice tone="danger">{t("Không thể tải dữ liệu mẫu.")}</Notice>
          )}
        </div>
        {open && (
          <Modal
            title={t("Ví dụ dialog")}
            onClose={() => setOpen(false)}
            footer={<Button onClick={() => setOpen(false)}>{t("Đóng")}</Button>}
          >
            <Field label={t("Tên")}>
              <Input placeholder={t("Nhập tên")} />
            </Field>
          </Modal>
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <Examples />
  </I18nProvider>,
);
