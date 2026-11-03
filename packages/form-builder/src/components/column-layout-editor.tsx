import { useRef } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Button } from "@flowdocker/ui";
import { columnPercentages, resizeColumns } from "../column-layout";
import type { FormField } from "../schema";
import "./column-layout-editor.css";

export interface ColumnLayoutEditorProps {
  field: FormField;
  disabled?: boolean;
  resize?: boolean;
  onChange(ratios: number[], recordHistory: boolean): void;
}
export function ColumnLayoutEditor({
  field,
  disabled,
  resize = true,
  onChange,
}: ColumnLayoutEditorProps) {
  const { t } = useI18n();
  const bar = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    ratios: number[];
    original: number[];
    index: number;
    left: number;
    width: number;
  } | null>(null);
  const ratios = columnPercentages(field);
  const count = field.columns ?? 2;
  const presets =
    count === 3
      ? [
          [1, 1, 1],
          [1, 2, 1],
          [2, 1, 1],
          [1, 1, 2],
        ]
      : count === 2
        ? [
            [1, 1],
            [1, 2],
            [2, 1],
            [1, 3],
            [3, 1],
          ]
        : [[1]];
  return (
    <div className="fd-column-editor" aria-label={t("Tỷ lệ cột")}>
      <div className="fd-column-presets">
        {presets.map((preset) => (
          <Button
            key={preset.join(":")}
            disabled={disabled}
            variant="ghost"
            aria-label={t("Tỷ lệ {{ratio}}", { ratio: preset.join(":") })}
            onClick={() => onChange(preset, true)}
          >
            {preset.join(" : ")}
          </Button>
        ))}
      </div>
      {resize && count > 1 && (
        <>
          <div
            ref={bar}
            className="fd-column-resize"
            style={{
              gridTemplateColumns: ratios
                .map((value) => `${value}fr`)
                .join(" "),
            }}
          >
            {ratios.map((value, index) => (
              <div key={index} className="fd-column-segment">
                <span>{`${value}%`}</span>
                {index < count - 1 && (
                  <button
                    type="button"
                    className="fd-column-handle"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={t("Đổi độ rộng cột {{count}}", {
                      count: index + 1,
                    })}
                    aria-valuenow={ratios
                      .slice(0, index + 1)
                      .reduce((a, b) => a + b, 0)}
                    aria-valuemin={
                      ratios.slice(0, index).reduce((a, b) => a + b, 0) + 1
                    }
                    aria-valuemax={
                      ratios.slice(0, index + 2).reduce((a, b) => a + b, 0) - 1
                    }
                    disabled={disabled}
                    onPointerDown={(event) => {
                      if (disabled || event.button !== 0) return;
                      event.stopPropagation();
                      const rect = bar.current!.getBoundingClientRect();
                      drag.current = {
                        ratios,
                        original:
                          field.columnRatios ?? Array<number>(count).fill(1),
                        index,
                        left: rect.left,
                        width: rect.width,
                      };
                      event.currentTarget.setPointerCapture(event.pointerId);
                      onChange(drag.current.original, true);
                    }}
                    onPointerMove={(event) => {
                      if (!drag.current) return;
                      event.stopPropagation();
                      const start = drag.current;
                      onChange(
                        resizeColumns(
                          start.ratios,
                          start.index,
                          ((event.clientX - start.left) / start.width) * 100,
                        ),
                        false,
                      );
                    }}
                    onPointerUp={(event) => {
                      if (!drag.current) return;
                      event.stopPropagation();
                      drag.current = null;
                      if (
                        event.currentTarget.hasPointerCapture(event.pointerId)
                      )
                        event.currentTarget.releasePointerCapture(
                          event.pointerId,
                        );
                    }}
                    onPointerCancel={() => {
                      if (drag.current) onChange(drag.current.original, false);
                      drag.current = null;
                    }}
                    onKeyDown={(event) => {
                      if (
                        !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                          event.key,
                        )
                      )
                        return;
                      event.preventDefault();
                      event.stopPropagation();
                      const boundary = ratios
                        .slice(0, index + 1)
                        .reduce((a, b) => a + b, 0);
                      onChange(
                        resizeColumns(
                          ratios,
                          index,
                          event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? 100
                              : boundary +
                                (event.key === "ArrowLeft" ? -1 : 1) *
                                  (event.shiftKey ? 10 : 1),
                        ),
                        true,
                      );
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <p>
            {t(
              "Kéo vạch chia hoặc dùng phím mũi tên. Điện thoại tự xếp một cột.",
            )}
          </p>
        </>
      )}
    </div>
  );
}
