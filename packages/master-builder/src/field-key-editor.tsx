import { useRef, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Field, Input } from "@flowdocker/ui";
import {
  masterFieldKeyError,
  type MasterField,
} from "@flowdocker/app-contracts";

/** Draft text is local; only valid committed identifiers reach the host. */
export function FieldKeyEditor({
  field,
  fields,
  onCommit,
}: {
  field: MasterField;
  fields: readonly MasterField[];
  onCommit(key: string): Promise<void> | void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(field.key);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const committed = useRef(field.key);
  const issue = masterFieldKeyError(draft, fields, field.id);
  const error = issue
    ? t(issue)
    : failed
      ? t("Không lưu được mã trường. Kiểm tra kết nối lưu trữ và thử lại.")
      : undefined;
  const commit = async () => {
    if (issue || busy.current || draft === committed.current) return;
    busy.current = true;
    setSaving(true);
    setFailed(false);
    try {
      await onCommit(draft);
      committed.current = draft;
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <Field
      label={t("Mã trường")}
      error={error}
      hint={t(
        "Ví dụ: currency_name. Mã hợp lệ được lưu khi rời ô hoặc nhấn Enter; Escape để hủy sửa.",
      )}
    >
      <Input
        value={draft}
        disabled={saving}
        aria-invalid={!!error}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => {
          setDraft(event.target.value);
          setFailed(false);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(field.key);
            setFailed(false);
          }
        }}
      />
    </Field>
  );
}
