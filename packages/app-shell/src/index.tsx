import { useI18n } from "@flowdocker/i18n";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  FilePenLine,
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
import { Badge, Button, Input, LanguagePicker } from "@flowdocker/ui";

export type PageId =
  | "workspace"
  | "master"
  | "permissions"
  | "applications"
  | "forms"
  | "connections"
  | "flows"
  | "profile";
const groups: {
  label: string;
  pages: { id: PageId; label: string; icon: typeof LayoutGrid }[];
}[] = [
  {
    label: "Không gian",
    pages: [
      { id: "workspace", label: "Tổng quan", icon: LayoutGrid },
      { id: "applications", label: "Ứng dụng", icon: Blocks },
      { id: "forms", label: "Biểu mẫu", icon: FilePenLine },
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
  account,
  onPageChange,
  getPageHref = (id) => `#${id}`,
  theme,
  onThemeChange,
  children,
}: {
  page: PageId;
  account: { displayName: string; initials: string; subtitle: string };
  onPageChange(page: PageId): void;
  getPageHref?(page: PageId): string;
  theme: "light" | "dark";
  onThemeChange(): void;
  children: ReactNode;
}) {
  const { t, storageWarning } = useI18n();

  const [navOpen, setNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const sidebarId = useId();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState("");
  const selected = groups.flatMap((g) => g.pages).find((p) => p.id === page);
  const navigate = (id: PageId) => {
    onPageChange(id);
    setNavOpen(false);
  };
  const followLink = (event: MouseEvent<HTMLAnchorElement>, id: PageId) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(id);
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
    <div
      className="fd-app"
      data-theme={theme}
      data-nav-collapsed={navCollapsed}
    >
      {navOpen && (
        <button
          type="button"
          className="fd-sidebar-scrim"
          aria-label={t("Đóng điều hướng")}
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        id={sidebarId}
        ref={sidebarRef}
        className="fd-sidebar"
        data-open={navOpen}
        aria-label={t("Điều hướng chính")}
      >
        <div className="fd-brand">
          <div className="fd-brand-mark">{t("F")}</div>
          <div className="fd-brand-copy">
            <strong>{t("FlowDocker")}</strong>
            <span>{t("Application Platform")}</span>
          </div>
          <button
            type="button"
            className="fd-sidebar-close"
            aria-label={t("Đóng điều hướng")}
            onClick={() => setNavOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div
          className="fd-workspace-switch"
          aria-label={t(
            "Không gian làm việc hiện tại: E-Request, môi trường Demo",
          )}
        >
          <span className="fd-workspace-avatar">{t("E")}</span>
          <span className="fd-workspace-copy">
            <strong>{t("E-Request")}</strong>
            <small>{t("Ứng dụng hiện tại")}</small>
          </span>
          <span className="fd-workspace-demo">{t("Demo")}</span>
        </div>
        <div className="fd-nav-groups">
          {groups.map((group) => (
            <nav key={group.label} aria-label={t(group.label)}>
              <p className="fd-nav-heading">{t(group.label)}</p>
              {group.pages.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    href={getPageHref(item.id)}
                    key={item.id}
                    className="fd-nav-link"
                    data-active={page === item.id}
                    aria-current={page === item.id ? "page" : undefined}
                    onClick={(event) => followLink(event, item.id)}
                  >
                    <Icon size={18} strokeWidth={1.85} aria-hidden="true" />
                    <span>{t(item.label)}</span>
                  </a>
                );
              })}
            </nav>
          ))}
        </div>
        <a
          href={getPageHref("profile")}
          className="fd-sidebar-bottom fd-profile-link"
          data-active={page === "profile"}
          aria-current={page === "profile" ? "page" : undefined}
          onClick={(event) => followLink(event, "profile")}
          aria-label={t("Mở hồ sơ cá nhân")}
        >
          <span className="fd-avatar">{account.initials}</span>
          <div>
            <strong>{account.displayName}</strong>
            <small>{account.subtitle}</small>
          </div>
        </a>
      </aside>
      <div className="fd-main-wrap">
        <header className="fd-topbar">
          <button
            type="button"
            className="fd-desktop-nav-toggle fd-icon-button"
            aria-label={
              navCollapsed
                ? t("Mở thanh điều hướng")
                : t("Thu gọn thanh điều hướng")
            }
            title={
              navCollapsed
                ? t("Mở thanh điều hướng")
                : t("Thu gọn thanh điều hướng")
            }
            aria-controls={sidebarId}
            aria-expanded={!navCollapsed}
            onClick={() => setNavCollapsed((collapsed) => !collapsed)}
          >
            {navCollapsed ? (
              <ChevronRight aria-hidden="true" />
            ) : (
              <ChevronLeft aria-hidden="true" />
            )}
          </button>
          <button
            ref={menuTriggerRef}
            className="fd-mobile-menu fd-icon-button"
            aria-label={t("Mở điều hướng")}
            aria-expanded={navOpen}
            onClick={() => setNavOpen(!navOpen)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="fd-breadcrumb">
            {t("Workspace")}
            <span>/</span>{" "}
            <strong>
              {page === "profile"
                ? t("Hồ sơ cá nhân")
                : t(selected?.label ?? "")}
            </strong>
          </div>
          <div className="fd-top-actions">
            <label className="fd-global-search">
              <Search size={16} />
              <span className="sr-only">{t("Tìm trong menu")}</span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Tìm trong menu...")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const match = groups
                      .flatMap((g) => g.pages)
                      .find((p) =>
                        t(p.label).toLowerCase().includes(search.toLowerCase()),
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
            <div className="fd-language-picker">
              <LanguagePicker />
            </div>
            <Badge tone="warning">{t("DEMO · dữ liệu mẫu")}</Badge>
            <Button
              variant="ghost"
              aria-label={
                theme === "light"
                  ? t("Bật giao diện tối")
                  : t("Bật giao diện sáng")
              }
              onClick={onThemeChange}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </div>
        </header>
        <main id="main-content" className="fd-main">
          {storageWarning && (
            <p role="status">
              {t(
                "Lựa chọn ngôn ngữ chỉ áp dụng trong phiên này vì trình duyệt không cho phép lưu.",
              )}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
