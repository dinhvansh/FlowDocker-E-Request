import { ArrowUpRight, FilePenLine, LayoutGrid } from "lucide-react";
import type { FormDefinition } from "@flowdocker/form-builder";
import { useI18n } from "@flowdocker/i18n";
import { Badge, EmptyState, SearchInput } from "@flowdocker/ui";
import "./form-catalog.css";

interface FormCatalogProps {
  forms: readonly FormDefinition[];
  activeId?: string;
  query: string;
  onQueryChange(query: string): void;
  onOpen(form: FormDefinition): void;
}

export function FormCatalog({
  forms,
  activeId,
  query,
  onQueryChange,
  onOpen,
}: FormCatalogProps) {
  const { t, locale } = useI18n();
  const matches = forms.filter((form) =>
    `${form.title.vi} ${form.title.en}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <aside className="fd-form-catalog" aria-label={t("Danh sách biểu mẫu")}>
      <div className="fd-form-catalog-tools">
        <SearchInput
          label={t("Tìm biểu mẫu...")}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <p
          className="fd-form-catalog-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <LayoutGrid aria-hidden="true" />
          {t("{{visible}} trên {{total}} biểu mẫu", {
            visible: matches.length,
            total: forms.length,
          })}
        </p>
      </div>
      {matches.length ? (
        <ul className="fd-form-catalog-grid">
          {matches.map((form) => (
            <li key={form.id}>
              <button
                type="button"
                className="fd-form-template"
                data-active={activeId === form.id}
                aria-label={form.title[locale]}
                onClick={() => onOpen(form)}
              >
                <span className="fd-form-template-preview" aria-hidden="true">
                  <span className="fd-form-template-paper">
                    <span className="fd-form-template-paper-heading">
                      <FilePenLine />
                      <span>{form.title[locale]}</span>
                    </span>
                    {form.fields
                      .filter((field) => field.type !== "hidden")
                      .slice(0, 3)
                      .map((field) => (
                        <span className="fd-form-template-line" key={field.id}>
                          <span>{field.label[locale]}</span>
                          <span
                            className="fd-form-template-input"
                            data-kind={field.type}
                          >
                            <i />
                            <i />
                            <i />
                          </span>
                        </span>
                      ))}
                    {!form.fields.length && (
                      <span className="fd-form-template-blank">
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                  </span>
                  <span className="fd-form-template-status">
                    <Badge tone={activeId === form.id ? "info" : "neutral"}>
                      {activeId === form.id
                        ? t("Đang chỉnh sửa")
                        : t("Bản nháp")}
                    </Badge>
                  </span>
                </span>
                <span className="fd-form-template-details">
                  <strong>{form.title[locale]}</strong>
                  <span className="fd-form-template-meta">
                    {t("{{count}} trường · nháp v{{version}}", {
                      count: form.fields.length,
                      version: form.version,
                    })}
                  </span>
                  <span className="fd-form-template-open">
                    {t("Mở thiết kế")}
                    <ArrowUpRight aria-hidden="true" />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={t("Không tìm thấy biểu mẫu")}
          detail={t("Thử tên khác hoặc xóa từ khóa tìm kiếm.")}
        />
      )}
    </aside>
  );
}
