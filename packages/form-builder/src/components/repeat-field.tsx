import { useRef, type FocusEvent, type ReactNode } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Trash2 } from "lucide-react";
import { Button } from "@flowdocker/ui";
import { defaultValues } from "../engine";
import { isContainer, type FormField, type PreviewValues } from "../schema";

// False is an unchecked checkbox; numeric zero is intentional row data.
function hasRowData(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasRowData);
  if (typeof value === "object") return Object.values(value).some(hasRowData);
  return true;
}

export interface RepeatFieldProps {
  field: FormField;
  rows: PreviewValues[];
  onChange(rows: PreviewValues[]): void;
  disabled: boolean;
  design: boolean;
  renderFields(
    fields: FormField[],
    row: PreviewValues,
    index: number,
    onChange: (row: PreviewValues) => void,
  ): ReactNode;
}
/** Presentation adapter. The existing engine still owns row validation and calculations. */
export function RepeatField({
  field,
  rows,
  onChange,
  disabled,
  design,
  renderFields,
}: RepeatFieldProps) {
  const { t, locale } = useI18n();
  const children = field.children ?? [];
  const root = useRef<HTMLDivElement>(null);
  const auto = !!field.autoRows && !design && !disabled;
  const placeholder =
    auto &&
    rows.length < (field.maxRows ?? 100) &&
    (!rows.length || hasRowData(rows[rows.length - 1]));
  const displayed = design
    ? [rows[0] ?? defaultValues(children)]
    : placeholder
      ? [...rows, defaultValues(children)]
      : rows;
  const leaveRow = (index: number, event: FocusEvent<HTMLElement>) => {
    const target = event.relatedTarget;
    if (
      !auto ||
      index >= rows.length ||
      rows.length <= (field.minRows ?? 0) ||
      hasRowData(rows[index]) ||
      !(target instanceof Element) ||
      event.currentTarget.contains(target) ||
      target.closest(
        '[data-radix-popper-content-wrapper], [role="dialog"], [role="listbox"], [role="option"]',
      )
    )
      return;
    onChange(rows.filter((_, i) => i !== index));
  };
  const tabular =
    children.length > 0 &&
    children.every(
      (child) =>
        !isContainer(child) &&
        ![
          "file",
          "signature",
          "survey",
          "address",
          "keyvalue",
          "content",
          "alert",
          "button",
          "hidden",
        ].includes(child.type),
    );
  const update = (index: number, next: PreviewValues) =>
    onChange(
      design
        ? [next]
        : index === rows.length
          ? hasRowData(next)
            ? [...rows, next]
            : rows
          : rows.map((row, i) => (i === index ? next : row)),
    );
  const remove = (index: number) => (
    <Button
      type="button"
      variant="ghost"
      disabled={
        disabled || index >= rows.length || rows.length <= (field.minRows ?? 0)
      }
      aria-label={t("Xóa dòng {{index}}", { index: index + 1 })}
      title={t("Xóa dòng")}
      onClick={() => onChange(rows.filter((_, i) => i !== index))}
    >
      <Trash2 />
    </Button>
  );
  return (
    <div ref={root} className="fd-repeat-field" data-design={design}>
      {tabular ? (
        <div
          className="fd-repeat-table-scroll"
          role="region"
          aria-label={field.label[locale]}
          tabIndex={0}
        >
          <table className="fd-repeat-table" aria-label={field.label[locale]}>
            <thead>
              <tr>
                <th scope="col">{t("Dòng")}</th>
                {children.map((child) => (
                  <th scope="col" key={child.id}>
                    {child.label[locale]}
                    {child.required && (
                      <span className="fd-required-mark" aria-hidden="true">
                        *
                      </span>
                    )}
                  </th>
                ))}
                {!design && (
                  <th scope="col">
                    <span className="sr-only">{t("Thao tác")}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayed.map((row, index) => (
                <tr
                  key={index}
                  data-placeholder={
                    (index >= rows.length && !design) || undefined
                  }
                  onBlur={(event) => leaveRow(index, event)}
                >
                  <th scope="row">{index + 1}</th>
                  {children.map((child) => (
                    <td key={child.id}>
                      {renderFields([child], row, index, (next) =>
                        update(index, next),
                      )}
                    </td>
                  ))}
                  {!design && <td>{remove(index)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        displayed.map((row, index) => (
          <div
            className="fd-repeat-row"
            key={index}
            data-placeholder={(index >= rows.length && !design) || undefined}
            onBlur={(event) => leaveRow(index, event)}
          >
            <div className="fd-section-heading">
              <h3>{t("Dòng {{index}}", { index: index + 1 })}</h3>
              {!design && remove(index)}
            </div>
            {renderFields(children, row, index, (next) => update(index, next))}
          </div>
        ))
      )}
      {design ? (
        <p className="fd-repeat-design-hint">
          {t("Một dòng minh họa · thêm và xóa dòng trong Xem thử")}
        </p>
      ) : (
        <div className="fd-repeat-footer">
          <span>
            {auto
              ? t("Dòng trống cuối bảng chỉ là gợi ý, không được lưu.")
              : t("{{count}} dòng", { count: rows.length })}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || rows.length >= (field.maxRows ?? 100)}
            onClick={() => {
              if (auto) {
                const entries = root.current?.querySelectorAll<HTMLElement>(
                  "tbody tr, .fd-repeat-row",
                );
                const last = entries?.[entries.length - 1];
                last
                  ?.querySelector<HTMLElement>(
                    'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex="0"]',
                  )
                  ?.focus();
              } else onChange([...rows, defaultValues(children)]);
            }}
          >
            {t("Thêm dòng")}
          </Button>
        </div>
      )}
    </div>
  );
}
