import { useI18n } from "@flowdocker/i18n";
import {
  cloneElement,
  isValidElement,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";
import { Button as ShadButton } from "./components/ui/button";
import { Badge as ShadBadge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import {
  Field as ShadField,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./components/ui/field";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "./components/ui/empty";
import { Alert, AlertDescription } from "./components/ui/alert";
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
    <Empty className="fd-empty">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {detail && <EmptyDescription>{detail}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
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
  const id = useId();
  const controlId = isValidElement(children)
    ? ((children.props as { id?: string }).id ?? id)
    : id;
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          id?: string;
          "aria-invalid"?: boolean;
          "aria-describedby"?: string;
        }>,
        {
          id: controlId,
          "aria-invalid": error ? true : undefined,
          "aria-describedby":
            [
              (children.props as { "aria-describedby"?: string })[
                "aria-describedby"
              ],
              hint ? `${id}-hint` : undefined,
              error ? `${id}-error` : undefined,
            ]
              .filter(Boolean)
              .join(" ") || undefined,
        },
      )
    : children;
  return (
    <ShadField className="fd-field" data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      {control}
      {hint && <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </ShadField>
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
    <Alert
      variant={tone === "danger" ? "destructive" : "default"}
      className={`fd-notice fd-notice-${tone}`}
      role="status"
    >
      <AlertDescription>{children}</AlertDescription>
    </Alert>
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
  const { t } = useI18n();
  if (!rows.length) return <EmptyState title={t(empty)} />;
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
