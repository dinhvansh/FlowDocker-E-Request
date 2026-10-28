import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Field,
  Modal,
  Notice,
  Tabs,
} from "../src";
import "../styles.css";

function Examples() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState("default");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  return (
    <div className="fd-app" data-theme={theme}>
      <main
        style={{ maxWidth: 900, padding: 32, margin: "auto", width: "100%" }}
      >
        <h1>FlowDocker UI · isolated examples</h1>
        <p>Dữ liệu tổng hợp, không cần API hay credentials.</p>
        <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          Chuyển {theme === "light" ? "tối" : "sáng"}
        </Button>
        <div style={{ display: "flex", gap: 8, margin: "22px 0" }}>
          <Button variant="primary" onClick={() => setOpen(true)}>
            Mở dialog
          </Button>
          <Button disabled>Disabled</Button>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Error</Badge>
        </div>
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "default", label: "Default" },
            { id: "empty", label: "Empty" },
            { id: "error", label: "Error" },
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
              <Field label="Tìm dữ liệu mẫu">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                  { key: "name", heading: "TÊN", render: (r) => r.name },
                ]}
              />
            </>
          ) : tab === "empty" ? (
            <EmptyState
              title="Chưa có dữ liệu"
              detail="Trạng thái rỗng của bảng và pane."
            />
          ) : (
            <Notice tone="danger">Không thể tải dữ liệu mẫu.</Notice>
          )}
        </div>
        {open && (
          <Modal
            title="Ví dụ dialog"
            onClose={() => setOpen(false)}
            footer={<Button onClick={() => setOpen(false)}>Đóng</Button>}
          >
            <Field label="Tên">
              <input placeholder="Nhập tên" />
            </Field>
          </Modal>
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Examples />);
