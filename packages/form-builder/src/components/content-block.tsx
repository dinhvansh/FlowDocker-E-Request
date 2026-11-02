import { useI18n } from "@flowdocker/i18n";
import type { FormField } from "../schema";
import { safeBandImage } from "../decoration";
import "../decoration.css";

export function ContentBlock({ field }: { field: FormField }) {
  const { locale, t } = useI18n();
  const p = field.presentation;
  if (field.type === "divider")
    return (
      <hr className="fd-content-divider" aria-label={field.label[locale]} />
    );
  return (
    <section
      className="fd-content-block"
      data-align={p?.align ?? "left"}
      data-size={p?.size ?? "subtitle"}
      data-bold={p?.bold ?? field.type === "content"}
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
    </section>
  );
}
