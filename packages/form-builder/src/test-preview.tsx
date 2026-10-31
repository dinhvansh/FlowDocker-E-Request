import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Button, Field, FieldGroup, Notice, Textarea } from "@flowdocker/ui";
import { prepareValues, validRuntimeValues } from "./engine";
import { FormPreview, type FormPreviewProps } from "./runtime";
import type { PreviewValues } from "./schema";

export function parseTestValues(source: string): PreviewValues | undefined {
  if (source.length > 1000000) return undefined;
  try {
    const value: unknown = JSON.parse(source);
    return validRuntimeValues(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Local test harness using the same renderer/defaults/calculation/validation as the host. */
export function FormTestPreview(props: FormPreviewProps) {
  const { t } = useI18n();
  const [source, setSource] = useState(() =>
    JSON.stringify(props.values, null, 2),
  );
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    if (!invalid) setSource(JSON.stringify(props.values, null, 2));
  }, [props.values, invalid]);
  const prepared = useMemo(
    () =>
      prepareValues(
        props.definition,
        props.values,
        props.access,
        props.runtimeContext,
      ),
    [props.definition, props.values, props.access, props.runtimeContext],
  );
  return (
    <div className="fd-test-preview">
      <Notice>
        {t(
          "Thử cục bộ bằng engine hiện có. Dữ liệu thử không gửi lên máy chủ.",
        )}
      </Notice>
      <FormPreview {...props} />
      <details>
        <summary>{t("Dữ liệu thử và kết quả tính toán")}</summary>
        <FieldGroup>
          <Field
            label={t("Dữ liệu đầu vào JSON")}
            error={
              invalid
                ? t(
                    "Dữ liệu thử phải là đối tượng JSON hợp lệ trong giới hạn xử lý.",
                  )
                : undefined
            }
          >
            <Textarea
              className="fd-technical-json"
              rows={8}
              value={source}
              aria-invalid={invalid}
              onChange={(event) => {
                const raw = event.target.value;
                setSource(raw);
                const next = parseTestValues(raw);
                setInvalid(!next);
                if (next) props.onChange(next);
              }}
            />
          </Field>
          <Button
            onClick={() => {
              setInvalid(false);
              props.onChange({});
              setSource("{}");
            }}
          >
            {t("Đặt lại JSON")}
          </Button>
          <Field label={t("Kết quả sau mặc định và tính toán")}>
            <Textarea
              className="fd-technical-json"
              rows={8}
              readOnly
              value={JSON.stringify(prepared, null, 2)}
            />
          </Field>
        </FieldGroup>
      </details>
    </div>
  );
}
