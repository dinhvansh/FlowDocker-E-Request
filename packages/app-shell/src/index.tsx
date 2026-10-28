import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Blocks,
  Database,
  LayoutGrid,
  LockKeyhole,
  Menu,
  Moon,
  Search,
  Settings2,
  Sun,
  X,
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
    label: "Không gian",
    pages: [
      { id: "workspace", label: "Tổng quan", icon: LayoutGrid },
      { id: "applications", label: "Ứng dụng", icon: Blocks },
    ],
  },
  {
    label: "Dữ liệu",
    pages: [
      { id: "master", label: "Master Data", icon: Database },
      { id: "connections", label: "Kết nối", icon: Settings2 },
      { id: "flows", label: "Flow Studio", icon: Blocks },
    ],
  },
  {
    label: "Quản trị",
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
  const sidebarRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState("");
  const selected = groups.flatMap((g) => g.pages).find((p) => p.id === page);
  const navigate = (id: PageId) => {
    onPageChange(id);
    setNavOpen(false);
  };
  useEffect(() => {
    if (!navOpen) return;
    sidebarRef.current
      ?.querySelector<HTMLElement>(".fd-sidebar-close")
      ?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    const menuTrigger = menuTriggerRef.current;
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      menuTrigger?.focus();
    };
  }, [navOpen]);
  return (
    <div className="fd-app" data-theme={theme}>
      {navOpen && (
        <button
          type="button"
          className="fd-sidebar-scrim"
          aria-label="Đóng điều hướng"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className="fd-sidebar"
        data-open={navOpen}
        aria-label="Điều hướng chính"
      >
        <div className="fd-brand">
          <div className="fd-brand-mark">F</div>
          <div className="fd-brand-copy">
            <strong>FlowDocker</strong>
            <span>Application Platform</span>
          </div>
          <button
            type="button"
            className="fd-sidebar-close"
            aria-label="Đóng điều hướng"
            onClick={() => setNavOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div
          className="fd-workspace-switch"
          aria-label="Không gian làm việc hiện tại: E-Request, môi trường Demo"
        >
          <span className="fd-workspace-avatar">E</span>
          <span className="fd-workspace-copy">
            <strong>E-Request</strong>
            <small>Ứng dụng hiện tại</small>
          </span>
          <span className="fd-workspace-demo">Demo</span>
        </div>
        <div className="fd-nav-groups">
          {groups.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <p className="fd-nav-heading">{group.label}</p>
              {group.pages.map((item) => {
                const Icon = item.icon;
                const planned = [
                  "applications",
                  "connections",
                  "flows",
                ].includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className="fd-nav-link"
                    data-active={page === item.id}
                    aria-current={page === item.id ? "page" : undefined}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon size={18} strokeWidth={1.85} aria-hidden="true" />
                    <span>{item.label}</span>
                    {planned && <small>Chưa có</small>}
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
            <small>Vai trò demo</small>
          </div>
        </div>
      </aside>
      <div className="fd-main-wrap">
        <header className="fd-topbar">
          <button
            ref={menuTriggerRef}
            className="fd-mobile-menu fd-icon-button"
            aria-label="Mở điều hướng"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(!navOpen)}
          >
            <Menu size={20} aria-hidden="true" />
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
