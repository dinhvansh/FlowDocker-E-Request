import { useState, type ReactNode } from "react";
import {
  Blocks,
  Database,
  LayoutGrid,
  LockKeyhole,
  Moon,
  Search,
  Settings2,
  Sun,
} from "lucide-react";
import { Badge, Button, Input } from "@flowdocker/ui";

export type PageId =
  | "workspace"
  | "master"
  | "permissions"
  | "applications"
  | "connections"
  | "flows";
const groups: {
  label: string;
  pages: { id: PageId; label: string; icon: typeof LayoutGrid }[];
}[] = [
  {
    label: "KHÔNG GIAN LÀM VIỆC",
    pages: [
      { id: "workspace", label: "Tổng quan", icon: LayoutGrid },
      { id: "applications", label: "Ứng dụng", icon: Blocks },
    ],
  },
  {
    label: "DỮ LIỆU",
    pages: [
      { id: "master", label: "Master Data", icon: Database },
      { id: "connections", label: "Kết nối", icon: Settings2 },
      { id: "flows", label: "Flow Studio", icon: Blocks },
    ],
  },
  {
    label: "BẢO MẬT",
    pages: [{ id: "permissions", label: "Phân quyền", icon: LockKeyhole }],
  },
];
export function AppShell({
  page,
  onPageChange,
  theme,
  onThemeChange,
  children,
}: {
  page: PageId;
  onPageChange(page: PageId): void;
  theme: "light" | "dark";
  onThemeChange(): void;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = groups.flatMap((g) => g.pages).find((p) => p.id === page);
  const navigate = (id: PageId) => {
    onPageChange(id);
    setNavOpen(false);
  };
  return (
    <div className="fd-app" data-theme={theme}>
      <aside
        className={`fd-sidebar ${navOpen ? "open" : ""}`}
        aria-label="Điều hướng chính"
      >
        <div className="fd-brand">
          <div className="fd-brand-mark">F</div>
          <div>
            <strong>FlowDocker</strong>
            <span>PLATFORM CONSOLE</span>
          </div>
        </div>
        <div
          className="fd-workspace-switch"
          aria-label="Không gian làm việc hiện tại: E-Request, môi trường Demo"
        >
          <span className="fd-workspace-avatar">E</span>
          <span>
            <strong>E-Request</strong>
            <small>Workspace demo</small>
          </span>
        </div>
        <div className="fd-nav-groups">
          {groups.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <p>{group.label}</p>
              {group.pages.map((item) => {
                const Icon = item.icon;
                const planned = [
                  "applications",
                  "connections",
                  "flows",
                ].includes(item.id);
                return (
                  <button
                    key={item.id}
                    className={`fd-nav-link ${page === item.id ? "active" : ""}`}
                    aria-current={page === item.id ? "page" : undefined}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {planned && <i aria-label="Dự kiến">Sắp có</i>}
                  </button>
                );
              })}
            </nav>
          ))}
        </div>
        <div className="fd-sidebar-bottom">
          <span className="fd-avatar">VA</span>
          <div>
            <strong>Platform Admin</strong>
            <small>Tài khoản minh họa</small>
          </div>
        </div>
      </aside>
      <div className="fd-main-wrap">
        <header className="fd-topbar">
          <button
            className="fd-mobile-menu fd-icon-button"
            aria-label="Mở điều hướng"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(!navOpen)}
          >
            ☰
          </button>
          <div className="fd-breadcrumb">
            Workspace <span>/</span> <strong>{selected?.label}</strong>
          </div>
          <div className="fd-top-actions">
            <label className="fd-global-search">
              <Search size={16} />
              <span className="sr-only">Tìm trong menu</span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm trong menu..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const match = groups
                      .flatMap((g) => g.pages)
                      .find((p) =>
                        p.label.toLowerCase().includes(search.toLowerCase()),
                      );
                    if (match) {
                      navigate(match.id);
                      setSearch("");
                    }
                  }
                }}
              />
              <kbd>↵</kbd>
            </label>
            <Badge tone="warning">DEMO · dữ liệu mẫu</Badge>
            <Button
              variant="ghost"
              aria-label={
                theme === "light" ? "Bật giao diện tối" : "Bật giao diện sáng"
              }
              onClick={onThemeChange}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
            <span className="fd-top-avatar">VA</span>
          </div>
        </header>
        <main id="main-content" className="fd-main">
          {children}
        </main>
      </div>
    </div>
  );
}
