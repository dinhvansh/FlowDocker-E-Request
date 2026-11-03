import { useI18n } from "@flowdocker/i18n";
import { ArrowRight } from "lucide-react";
import { Button, Notice } from "@flowdocker/ui";
import { flattenFields, type FormField, type FormIssue } from "../schema";
import "./form-schema-issues.css";

export interface FormSchemaIssuesProps {
  issues: readonly FormIssue[];
  fields: FormField[];
  onEditIssue?(issue: FormIssue): void;
}
/** Authoring diagnostics only; callbacks never mutate the definition. */
export function FormSchemaIssues({
  issues,
  fields,
  onEditIssue,
}: FormSchemaIssuesProps) {
  const { t, locale } = useI18n();
  const byId = new Map(flattenFields(fields).map((field) => [field.id, field]));
  return (
    <section
      className="fd-form-schema-issues"
      aria-label={t("Kiểm tra cấu hình biểu mẫu")}
    >
      <Notice tone={issues.length ? "warning" : "success"}>
        <p>
          {issues.length === 1
            ? t("Cần sửa 1 lỗi cấu hình")
            : issues.length
              ? t("Cần sửa {{count}} lỗi cấu hình", { count: issues.length })
              : t("Cấu hình hợp lệ, có thể xem thử biểu mẫu.")}
        </p>
        {issues.length > 0 && (
          <ul>
            {issues.map((issue, index) => {
              const field = issue.fieldId ? byId.get(issue.fieldId) : undefined;
              const content = (
                <span className="fd-form-schema-issue-text">
                  <span className="fd-form-schema-issue-target">
                    {field
                      ? `${field.label[locale] || field.key} · ${field.key}`
                      : t("Biểu mẫu")}
                  </span>
                  <span>{t(issue.message, issue.params)}</span>
                </span>
              );
              return (
                <li key={`${issue.fieldId ?? "form"}-${index}`}>
                  {onEditIssue ? (
                    <Button variant="ghost" onClick={() => onEditIssue(issue)}>
                      {content}
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Notice>
    </section>
  );
}
