import { useRef, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Pencil } from "lucide-react";
import { Button } from "@flowdocker/ui";
import type { BilingualText } from "../schema";
import { InlineLabelEditor } from "./inline-label-editor";

export interface EditableFormTitleProps {
  title: BilingualText;
  disabled?: boolean;
  onChange(title: BilingualText): void;
}
export function EditableFormTitle({
  title,
  disabled,
  onChange,
}: EditableFormTitleProps) {
  const { locale, t } = useI18n();
  const [editing, setEditing] = useState(false);
  const trigger = useRef<HTMLDivElement>(null);
  if (disabled) return <h2>{title[locale]}</h2>;
  return (
    <div ref={trigger} className="fd-canvas-form-title">
      {editing ? (
        <InlineLabelEditor
          value={title[locale]}
          label={t("Tên biểu mẫu trên canvas")}
          onFinish={(value, restoreFocus) => {
            setEditing(false);
            if (value !== null && value.trim() !== title[locale])
              onChange({ ...title, [locale]: value.trim() });
            if (restoreFocus)
              requestAnimationFrame(() =>
                trigger.current
                  ?.querySelector<HTMLButtonElement>("button")
                  ?.focus(),
              );
          }}
        />
      ) : (
        <h2>
          <Button
            variant="ghost"
            aria-label={t("Sửa tiêu đề biểu mẫu")}
            title={t("Sửa tiêu đề biểu mẫu")}
            onClick={() => setEditing(true)}
          >
            <span>{title[locale] || t("Biểu mẫu chưa đặt tên")}</span>
            <Pencil aria-hidden="true" />
          </Button>
        </h2>
      )}
    </div>
  );
}
