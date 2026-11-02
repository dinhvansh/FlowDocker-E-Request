import { useI18n } from "@flowdocker/i18n";
import type { ReactNode } from "react";
import type { BilingualText } from "../schema";
import { validFormDecoration, type FormDecoration } from "../decoration";
import "../decoration.css";

export function FormBandView({
  decoration,
  placement,
  title,
  renderTitle,
}: {
  decoration?: FormDecoration;
  placement: "header" | "footer";
  title: BilingualText;
  renderTitle?: () => ReactNode;
}) {
  const { locale } = useI18n();
  if (!decoration)
    return placement === "header" ? (
      renderTitle ? (
        renderTitle()
      ) : (
        <h2>{title[locale]}</h2>
      )
    ) : null;
  if (!validFormDecoration(decoration)) return null;
  const band = decoration[placement];
  if (!band.enabled) return null;
  return (
    <div
      className="fd-form-band"
      data-placement={placement}
      data-divider={band.divider}
      data-columns={band.columns}
    >
      {band.cells.slice(0, band.columns).map((cell, index) => (
        <div
          key={index}
          className="fd-form-band-cell"
          data-align={cell.align}
          data-size={cell.size}
          data-bold={cell.bold}
        >
          {cell.kind === "image" ? (
            cell.image && (
              <img
                src={cell.image}
                alt={cell.text[locale]}
                style={{ width: cell.imageWidth ?? 96 }}
              />
            )
          ) : cell.kind === "title" ? (
            renderTitle ? (
              renderTitle()
            ) : (
              <h2>{title[locale]}</h2>
            )
          ) : (
            <p>{cell.text[locale]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
