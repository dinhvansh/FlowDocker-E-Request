import { useI18n } from "@flowdocker/i18n";
import type { ReactNode } from "react";
import type { BilingualText } from "../schema";
import { validFormDecoration, type FormDecoration } from "../decoration";
import "../decoration.css";

export function FormBandView({
  decoration,
  placement,
}: {
  decoration?: FormDecoration;
  placement: "header" | "footer";
  title: BilingualText;
  renderTitle?: () => ReactNode;
}) {
  const { locale } = useI18n();
  // The form name belongs to the catalog; document headings are authored blocks.
  if (!decoration) return null;
  if (!validFormDecoration(decoration)) return null;
  const band = decoration[placement];
  if (!band.enabled) return null;
  const cells = band.cells
    .slice(0, band.columns)
    .filter((cell) => cell.kind !== "title");
  if (
    !cells.some((cell) =>
      cell.kind === "image" ? !!cell.image : !!cell.text[locale].trim(),
    )
  )
    return null;
  return (
    <div
      className="fd-form-band"
      data-placement={placement}
      data-divider={band.divider}
      data-columns={band.columns}
    >
      {cells.map((cell, index) => (
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
          ) : (
            <p>{cell.text[locale]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
