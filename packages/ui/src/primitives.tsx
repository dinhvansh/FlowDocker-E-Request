import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
};
export function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`fd-button fd-button-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export type BadgeProps = {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
};
export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`fd-badge fd-badge-${tone}`}>{children}</span>;
}
export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="fd-empty">
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
      {action}
    </div>
  );
}
export type Tab = { id: string; label: string };
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange(id: string): void;
}) {
  return (
    <div className="fd-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={active === t.id ? "active" : ""}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
export function SearchInput(
  props: InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <label className="fd-search">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">⌕</span>
      <input type="search" placeholder={label} {...rest} />
    </label>
  );
}
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="fd-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && (
        <small className="fd-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  children: ReactNode;
}) {
  return (
    <div className={`fd-notice fd-notice-${tone}`} role="status">
      {children}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose(): void;
  footer?: ReactNode;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const selectors =
      "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)";
    (
      dialogRef.current?.querySelector("input") ??
      dialogRef.current?.querySelector("button")
    )?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !(
          e.target instanceof HTMLElement &&
          e.target.closest(".fd-select-content")
        ) &&
        !document.querySelector('.fd-select-content[data-state="open"]')
      )
        onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(selectors),
      ];
      if (!items.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="fd-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="fd-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button
            className="fd-icon-button"
            aria-label="Đóng"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="fd-modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
}
export type TableColumn<T> = {
  key: string;
  heading: string;
  render(row: T): ReactNode;
  width?: string;
};
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
  empty = "Chưa có dữ liệu",
}: {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey(row: T): string;
  onRowClick?(row: T): void;
  selectedKey?: string;
  empty?: string;
}) {
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <div className="fd-table-scroll">
      <table className="fd-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width }}>
                {c.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={selectedKey === rowKey(row) ? "selected" : ""}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {columns.map((c) => (
                <td key={c.key}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
