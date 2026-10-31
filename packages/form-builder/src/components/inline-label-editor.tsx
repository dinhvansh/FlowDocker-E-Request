import { useRef, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Input } from "@flowdocker/ui";

export interface InlineLabelEditorProps {
  value: string;
  onFinish(value: string | null, restoreFocus: boolean): void;
}
/** A label edit becomes one history operation; Escape never changes the schema. */
export function InlineLabelEditor({ value, onFinish }: InlineLabelEditorProps) {
  const { t } = useI18n();
  const [text, setText] = useState(value);
  const finished = useRef(false);
  const finish = (commit: boolean, restoreFocus: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onFinish(commit ? text : null, restoreFocus);
  };
  return (
    <div className="fd-inline-label-editor">
      <Input
        autoFocus
        aria-label={t("Nhãn trên canvas")}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => finish(true, false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            finish(event.key === "Enter", true);
          }
        }}
      />
      <small>{t("Enter để lưu · Esc để hủy")}</small>
    </div>
  );
}
