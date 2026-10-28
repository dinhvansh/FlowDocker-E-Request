import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";
import { Button as ShadButton } from "./components/ui/button";
import { Badge as ShadBadge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Tabs as ShadTabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";

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
  const shadVariant = {
    primary: "default",
    secondary: "outline",
    ghost: "ghost",
    danger: "destructive",
  } as const;
  return (
    <ShadButton variant={shadVariant[variant]} className={className} {...props}>
      {children}
    </ShadButton>
  );
}
export type BadgeProps = {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
};
export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <ShadBadge variant="outline" className={`fd-badge fd-badge-${tone}`}>
      {children}
    </ShadBadge>
  );
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
    <ShadTabs value={active} onValueChange={onChange}>
      <TabsList variant="line" className="fd-tabs">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadTabs>
  );
}
export function SearchInput(
  props: InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <label className="fd-search">
      <span className="sr-only">{label}</span>
      <Search size={15} aria-hidden="true" />
      <Input type="search" placeholder={label} {...rest} />
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
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="fd-modal gap-0 p-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="fd-modal-body">{children}</div>
        {footer && (
          <DialogFooter className="border-t px-5 py-4">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
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
      <Table className="fd-table">
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} style={{ width: c.width }}>
                {c.heading}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
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
                <TableCell key={c.key}>{c.render(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
