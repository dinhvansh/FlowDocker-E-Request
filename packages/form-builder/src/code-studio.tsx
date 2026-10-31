import { useMemo } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Button, Notice } from "@flowdocker/ui";
import { JsonCodeEditor } from "./json-code-editor";
import { analyzeFormCode, codeFieldAt, fieldCodeRanges } from "./code-model";

export interface FormCodeStudioProps {
  value: string;
  formId: string;
  onChange(value: string): void;
  selectedFieldId?: string;
  revealField?: { id: string; revision: number };
  onSelectField?(id: string): void;
}

export default function FormCodeStudio({
  value,
  formId,
  onChange,
  selectedFieldId,
  revealField,
  onSelectField,
}: FormCodeStudioProps) {
  const { t } = useI18n();
  const analysis = useMemo(
    () => analyzeFormCode(value, formId),
    [value, formId],
  );
  const reveal = useMemo(() => {
    if (!revealField) return undefined;
    const range = fieldCodeRanges(value).get(revealField.id);
    return range && { ...range, revision: revealField.revision };
  }, [value, revealField]);
  return (
    <section className="fd-code-panel" aria-label={t("Code Studio")}>
      <div className="fd-code-panel-toolbar">
        <strong>{t("Schema biểu mẫu · Code Studio")}</strong>
        <Button
          disabled={!analysis.definition}
          onClick={() => onChange(JSON.stringify(JSON.parse(value), null, 2))}
        >
          {t("Định dạng mã")}
        </Button>
      </div>
      <p className="fd-code-hint">
        {t(
          "Mã hợp lệ đồng bộ ngay. Ctrl+Space để gợi ý; Esc rồi Tab để rời editor.",
        )}
      </p>
      <JsonCodeEditor
        value={value}
        formId={formId}
        label={t("Schema biểu mẫu · Code Studio")}
        onChange={onChange}
        reveal={reveal}
        onCursor={(offset) => {
          const id = codeFieldAt(value, offset);
          if (id && id !== selectedFieldId) onSelectField?.(id);
        }}
      />
      <div aria-live="polite" className="fd-code-status">
        {analysis.problems.length ? (
          <Notice tone="danger">
            {t("Mã chưa hợp lệ; hãy sửa mã để tiếp tục thiết kế và lưu.")}
          </Notice>
        ) : (
          t("Đã đồng bộ với canvas")
        )}
        {analysis.problems.slice(0, 5).map((p, index) => (
          <div key={index}>
            {t("Dòng {{line}} · {{message}}", {
              line: value.slice(0, p.from).split("\n").length,
              message: t(p.message, p.params),
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
