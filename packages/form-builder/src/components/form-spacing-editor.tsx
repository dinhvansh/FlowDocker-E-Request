import { useId, useRef, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  Button,
  Field,
  FieldGroup,
  Select,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@flowdocker/ui";
import { SlidersHorizontal } from "lucide-react";
import type { FormSpacing } from "../schema";
import { compactSpacing, standardSpacing } from "../spacing";

export interface FormSpacingEditorProps {
  value?: FormSpacing;
  disabled?: boolean;
  onChange(value: FormSpacing, recordHistory: boolean): void;
}
export function FormSpacingEditor({
  value,
  disabled,
  onChange,
}: FormSpacingEditorProps) {
  const { t } = useI18n();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const gesture = useRef(false);
  const changed = useRef(false);
  const current = value ?? standardSpacing;
  const same = (other: FormSpacing) =>
    (Object.keys(other) as (keyof FormSpacing)[]).every(
      (key) => current[key] === other[key],
    );
  const preset = same(standardSpacing)
    ? "standard"
    : same(compactSpacing)
      ? "compact"
      : "custom";
  const controls = [
    { key: "rowGap", label: "Giữa các hàng", max: 48 },
    { key: "columnGap", label: "Giữa các cột", max: 64 },
    { key: "sectionGap", label: "Giữa các nhóm", max: 64 },
    { key: "sectionPadding", label: "Lề trong nhóm", max: 40 },
  ] as const;
  const start = () => {
    if (!gesture.current) {
      gesture.current = true;
      changed.current = false;
    }
  };
  const finish = () => {
    gesture.current = false;
    changed.current = false;
  };
  return (
    <div className="fd-form-spacing-editor" ref={root}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          finish();
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button>
            <SlidersHorizontal aria-hidden="true" />
            {t("Khoảng cách")}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="fd-form-spacing-panel"
          align="end"
          aria-label={t("Khoảng cách")}
          portalContainer={
            root.current?.closest<HTMLElement>(".fd-app") ?? undefined
          }
        >
          <FieldGroup>
            <Select
              label={t("Kiểu khoảng cách")}
              disabled={disabled}
              value={preset}
              options={[
                { value: "compact", label: t("Gọn") },
                { value: "standard", label: t("Tiêu chuẩn") },
                { value: "custom", label: t("Tùy chỉnh") },
              ]}
              onValueChange={(next) => {
                finish();
                if (next !== "custom")
                  onChange(
                    {
                      ...(next === "compact"
                        ? compactSpacing
                        : standardSpacing),
                    },
                    true,
                  );
              }}
            />
            {controls.map(({ key, label, max }) => (
              <div className="fd-spacing-control" key={key}>
                <Field label={t(label)}>
                  <input
                    id={`${id}-${key}`}
                    type="range"
                    min={0}
                    max={max}
                    step={1}
                    value={current[key]}
                    disabled={disabled}
                    aria-label={t(label)}
                    aria-valuetext={`${t("{{value}} px", { value: current[key] })}`}
                    onPointerDown={(event) => {
                      start();
                      event.currentTarget.setPointerCapture?.(event.pointerId);
                    }}
                    onPointerUp={finish}
                    onPointerCancel={finish}
                    onLostPointerCapture={finish}
                    onBlur={finish}
                    onKeyDown={(event) => {
                      if (
                        [
                          "ArrowLeft",
                          "ArrowRight",
                          "ArrowUp",
                          "ArrowDown",
                          "PageUp",
                          "PageDown",
                          "Home",
                          "End",
                        ].includes(event.key)
                      )
                        start();
                    }}
                    onKeyUp={finish}
                    onChange={(event) => {
                      if (disabled) return;
                      onChange(
                        { ...current, [key]: Number(event.target.value) },
                        !gesture.current || !changed.current,
                      );
                      changed.current = true;
                    }}
                  />
                </Field>
                <output htmlFor={`${id}-${key}`}>
                  {t("{{value}} px", { value: current[key] })}
                </output>
              </div>
            ))}
            <Button
              disabled={disabled}
              onClick={() => {
                finish();
                onChange({ ...standardSpacing }, true);
              }}
            >
              {t("Đặt lại khoảng cách")}
            </Button>
          </FieldGroup>
        </PopoverContent>
      </Popover>
    </div>
  );
}
