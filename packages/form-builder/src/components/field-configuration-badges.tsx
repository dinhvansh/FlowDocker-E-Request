import {
  Calculator,
  Database,
  GitBranch,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@flowdocker/i18n";
import { Badge, Button } from "@flowdocker/ui";
import type { FormField } from "../schema";
import {
  configurationSection,
  fieldConfiguration,
  type ConfigurationKind,
  type ConfigurationSection,
} from "../field-configuration";
import "./field-configuration.css";

const indicators = {
  data: { label: "Dữ liệu", icon: Database, tone: "info" },
  conditions: { label: "Điều kiện", icon: GitBranch, tone: "warning" },
  calculation: { label: "Tính toán", icon: Calculator, tone: "success" },
  validation: {
    label: "Kiểm tra dữ liệu",
    icon: ShieldCheck,
    tone: "warning",
  },
  advanced: { label: "Nâng cao", icon: Settings2, tone: "neutral" },
} satisfies Record<
  ConfigurationKind,
  {
    label: string;
    icon: typeof Database;
    tone: "neutral" | "success" | "warning" | "danger" | "info";
  }
>;

export function FieldConfigurationBadges({
  field,
  onNavigate,
}: {
  field: FormField;
  onNavigate?(section: ConfigurationSection): void;
}) {
  const { t, locale } = useI18n();
  const configured = fieldConfiguration(field);
  if (!configured.length) return null;
  return (
    <div
      className="fd-field-configuration"
      role="group"
      aria-label={t("Cấu hình đã thiết lập cho {{field}}", {
        field: field.label[locale],
      })}
    >
      {configured.map((kind) => {
        const { label, icon: Icon, tone } = indicators[kind];
        const badge = (
          <Badge tone={tone}>
            <Icon aria-hidden="true" />
            {t(label)}
          </Badge>
        );
        return onNavigate ? (
          <Button
            key={kind}
            variant="ghost"
            className="fd-field-configuration-link"
            aria-label={t("Mở cấu hình {{group}} cho {{field}}", {
              group: t(label),
              field: field.label[locale],
            })}
            title={t("Mở cấu hình {{group}} cho {{field}}", {
              group: t(label),
              field: field.label[locale],
            })}
            onClick={(event) => {
              event.stopPropagation();
              onNavigate(configurationSection(kind));
            }}
          >
            {badge}
          </Button>
        ) : (
          <span key={kind}>{badge}</span>
        );
      })}
    </div>
  );
}
