import type { ReactNode } from "react";
import { contentPosition, contentPresentation } from "../content-position";
import { useI18n } from "@flowdocker/i18n";
import type { FormField } from "../schema";
import { safeBandImage } from "../decoration";
import "../decoration.css";

export function ContentBlock({
  field,
  controls,
}: {
  field: FormField;
  controls?: ReactNode;
}) {
  const { locale, t } = useI18n();
  const p = field.presentation;
  if (field.type === "divider")
    return (
      <hr className="fd-content-divider" aria-label={field.label[locale]} />
    );
  return (
    <section
      className="fd-content-block"
      style={{ paddingTop: p?.spaceAbove, fontSize: p?.fontSize }}
      data-align={p?.align ?? "left"}
      data-size={p?.size ?? "subtitle"}
      data-bold={p?.bold ?? field.type === "content"}
    >
      <div
        className="fd-content-object"
        style={{
          left: `${contentPosition(contentPresentation(field))}%`,
          transform: `translateX(-${contentPosition(contentPresentation(field))}%)`,
        }}
      >
        {field.type === "image" ? (
          p?.image && safeBandImage(p.image) ? (
            <img
              src={p.image}
              alt={field.label[locale]}
              style={{ width: p.imageWidth ?? 240 }}
            />
          ) : (
            <p className="fd-content-image-empty">{t("Chưa chọn hình ảnh")}</p>
          )
        ) : (
          <h3>{field.label[locale]}</h3>
        )}
        {field.help?.[locale] && <p>{field.help[locale]}</p>}
        {controls}
      </div>
    </section>
  );
}
