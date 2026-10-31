import { useMemo, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Button, Field, FieldGroup, Notice, Textarea } from "@flowdocker/ui";
import { buildFormAIContext, formAuthoringSchema } from "./code-assistance";
import { JsonCodeEditor } from "./json-code-editor";
import { analyzeFormCode, codeFieldAt, fieldCodeRanges } from "./code-model";

export interface FormCodeStudioProps {
  value: string;
  formId: string;
  onChange(value: string): void;
  selectedFieldId?: string;
  revealField?: { id: string; revision: number };
  onSelectField?(id: string): void;
  providerIds?: readonly string[];
}

export default function FormCodeStudio({
  value,
  formId,
  onChange,
  selectedFieldId,
  revealField,
  onSelectField,
  providerIds = [],
}: FormCodeStudioProps) {
  const { t } = useI18n();
  const [request, setRequest] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
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
      <details className="fd-code-assistance">
        <summary>{t("Dùng AI hỗ trợ thiết kế")}</summary>
        <FieldGroup>
          <p>
            {t(
              "Xuất ngữ cảnh rồi đưa cho AI bạn dùng. Dán JSON trả về vào editor để tiếp tục kéo thả. Chưa kết nối dịch vụ AI.",
            )}
          </p>
          <Field label={t("Yêu cầu thay đổi cho AI")}>
            <Textarea
              rows={3}
              value={request}
              onChange={(event) => setRequest(event.target.value)}
            />
          </Field>
          <div className="fd-toolbar-actions">
            <Button
              disabled={!analysis.definition}
              onClick={async () => {
                if (!analysis.definition) return;
                try {
                  await navigator.clipboard.writeText(
                    buildFormAIContext(
                      analysis.definition,
                      providerIds,
                      request,
                    ),
                  );
                  setCopyStatus("Đã sao chép ngữ cảnh cho AI.");
                } catch {
                  setCopyStatus("Không sao chép được. Hãy dùng tải ngữ cảnh.");
                }
              }}
            >
              {t("Sao chép ngữ cảnh AI")}
            </Button>
            <Button
              disabled={!analysis.definition}
              onClick={() => {
                if (!analysis.definition) return;
                const url = URL.createObjectURL(
                  new Blob(
                    [
                      buildFormAIContext(
                        analysis.definition,
                        providerIds,
                        request,
                      ),
                    ],
                    { type: "text/markdown;charset=utf-8" },
                  ),
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = "flowdocker-form-ai-context.md";
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              {t("Tải ngữ cảnh AI")}
            </Button>
          </div>
          {copyStatus && <Notice>{t(copyStatus)}</Notice>}
          <details>
            <summary>{t("Tham chiếu schema cho AI")}</summary>
            <pre>{JSON.stringify(formAuthoringSchema, null, 2)}</pre>
          </details>
        </FieldGroup>
      </details>
    </section>
  );
}
