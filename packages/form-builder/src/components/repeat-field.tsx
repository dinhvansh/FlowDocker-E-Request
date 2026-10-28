import type { ReactNode } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@flowdocker/ui";
import { defaultValues } from "../engine";
import { isContainer, type FormField, type PreviewValues } from "../schema";

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
  const displayed = design ? [rows[0] ?? defaultValues(children)] : rows;
  const tabular =
    children.length > 0 &&
    children.length <= 6 &&
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
      design ? [next] : rows.map((row, i) => (i === index ? next : row)),
    );
  const remove = (index: number) => (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled || rows.length <= (field.minRows ?? 0)}
      aria-label={t("Xóa dòng {{index}}", { index: index + 1 })}
      title={t("Xóa dòng")}
      onClick={() => onChange(rows.filter((_, i) => i !== index))}
    >
      <Trash2 />
    </Button>
  );
  return (
    <div className="fd-repeat-field" data-design={design}>
      {tabular ? (
        <table className="fd-repeat-table" aria-label={field.label[locale]}>
          <thead>
            <tr>
              <th scope="col">{t("Dòng")}</th>
              {children.map((child) => (
                <th scope="col" key={child.id}>
                  {child.label[locale]}
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
              <tr key={index}>
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
      ) : (
        displayed.map((row, index) => (
          <div className="fd-repeat-row" key={index}>
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
        <Button
          type="button"
          variant="ghost"
          disabled={disabled || rows.length >= (field.maxRows ?? 100)}
          onClick={() => onChange([...rows, defaultValues(children)])}
        >
          <Plus />
          {t("Thêm dòng")}
        </Button>
      )}
    </div>
  );
}
