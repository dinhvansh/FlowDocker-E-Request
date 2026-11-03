import { CircleAlert } from "lucide-react";
import { useI18n } from "@flowdocker/i18n";
import { Badge, Button } from "@flowdocker/ui";
import type { FormField } from "../schema";
import "./field-configuration.css";

export interface FieldIssueBadgeProps {
  field: FormField;
  count: number;
  onNavigate?(): void;
}
/** Configuration errors only, independent of entered runtime values. */
export function FieldIssueBadge({
  field,
  count,
  onNavigate,
}: FieldIssueBadgeProps) {
  const { t, locale } = useI18n();
  if (count <= 0) return null;
  const label = t("Mở {{count}} lỗi cấu hình của {{field}}", {
    count,
    field: field.label[locale] || field.key,
  });
  const badge = (
    <Badge tone="warning">
      <CircleAlert aria-hidden="true" />
      {count === 1 ? t("1 lỗi") : t("{{count}} lỗi", { count })}
    </Badge>
  );
  return onNavigate ? (
    <Button
      variant="ghost"
      className="fd-field-configuration-link fd-field-issue-link"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onNavigate();
      }}
    >
      {badge}
    </Button>
  ) : (
    <span className="fd-field-issue-link" title={label}>
      {badge}
    </span>
  );
}
