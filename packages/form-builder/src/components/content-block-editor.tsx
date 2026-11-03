import { useEffect, useRef, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  Button,
  Checkbox,
  Field,
  FieldGroup,
  Input,
  Notice,
  Select,
  Textarea,
} from "@flowdocker/ui";
import { prepareBandImage, type FormBlockPresentation } from "../decoration";
import type { FormField } from "../schema";

export interface ContentBlockEditorProps {
  field: FormField;
  disabled?: boolean;
  onChange(changes: Partial<FormField>): void;
}
export function ContentBlockEditor({
  field,
  disabled,
  onChange,
}: ContentBlockEditorProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const revision = useRef(0);
  const latest = useRef({ field, disabled, onChange });
  latest.current = { field, disabled, onChange };
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  const p = field.presentation ?? {
    align: "left",
    size: "subtitle",
    bold: field.type === "content",
  };
  const patch = (value: Partial<FormBlockPresentation>) => {
    if (!disabled) onChange({ presentation: { ...p, ...value } });
  };
  return (
    <FieldGroup>
      {field.type !== "divider" && (
        <>
          <Field label={t("Căn nội dung")}>
            <Select
              label={t("Căn nội dung")}
              disabled={disabled}
              value={p.align}
              options={[
                { value: "left", label: t("Căn trái") },
                { value: "center", label: t("Căn giữa") },
                { value: "right", label: t("Căn phải") },
              ]}
              onValueChange={(align) =>
                patch({
                  align: align as FormBlockPresentation["align"],
                  horizontalPosition: undefined,
                })
              }
            />
          </Field>
          <Field label={t("Vị trí ngang (%)")}>
            <Input
              type="number"
              min={0}
              max={100}
              disabled={disabled}
              value={
                p.horizontalPosition ??
                (p.align === "center" ? 50 : p.align === "right" ? 100 : 0)
              }
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isInteger(next) && next >= 0 && next <= 100)
                  patch({ horizontalPosition: next });
              }}
            />
          </Field>
          <Field label={t("Khoảng trống phía trên (px)")}>
            <Input
              type="number"
              min={0}
              max={160}
              disabled={disabled}
              value={p.spaceAbove ?? 0}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isInteger(next) && next >= 0 && next <= 160)
                  patch({ spaceAbove: next });
              }}
            />
          </Field>
          {field.type === "content" && (
            <>
              <Field label={t("Cỡ chữ nội dung")}>
                <Select
                  label={t("Cỡ chữ nội dung")}
                  disabled={disabled}
                  value={p.size}
                  options={[
                    { value: "body", label: t("Nội dung thường") },
                    { value: "subtitle", label: t("Tiêu đề phụ") },
                    { value: "title", label: t("Tiêu đề lớn") },
                  ]}
                  onValueChange={(size) =>
                    patch({
                      size: size as FormBlockPresentation["size"],
                      fontSize: undefined,
                    })
                  }
                />
              </Field>
              <Field label={t("In đậm")}>
                <Checkbox
                  disabled={disabled}
                  checked={p.bold}
                  onCheckedChange={(v) => patch({ bold: v === true })}
                />
              </Field>
            </>
          )}
          {field.type === "image" && (
            <>
              <Field
                label={t("Tải ảnh / Logo")}
                hint={t(
                  "PNG, JPEG hoặc WebP, tối đa 5 MB. Ảnh được thu nhỏ và lưu cùng thiết kế.",
                )}
              >
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={disabled || uploading}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file || disabled) return;
                    const task = ++revision.current;
                    const originalImage = field.presentation?.image;
                    setUploading(true);
                    setError(false);
                    try {
                      const image = await prepareBandImage(file);
                      const current = latest.current;
                      if (
                        task !== revision.current ||
                        current.disabled ||
                        current.field.id !== field.id ||
                        current.field.type !== "image" ||
                        current.field.presentation?.image !== originalImage
                      )
                        return;
                      current.onChange({
                        presentation: {
                          align: "left",
                          size: "subtitle",
                          bold: false,
                          ...current.field.presentation,
                          image,
                        },
                      });
                    } catch {
                      if (task === revision.current) setError(true);
                    } finally {
                      if (task === revision.current) setUploading(false);
                    }
                  }}
                />
              </Field>
              {uploading && <Notice>{t("Đang chuẩn bị ảnh...")}</Notice>}
              {error && (
                <Notice tone="danger">
                  {t(
                    "Không dùng được ảnh này. Chọn PNG, JPEG hoặc WebP nhỏ hơn 5 MB.",
                  )}
                </Notice>
              )}
              <Field label={t("Chiều rộng ảnh (px)")}>
                <Input
                  type="number"
                  min={32}
                  max={640}
                  disabled={disabled}
                  value={p.imageWidth ?? 240}
                  onChange={(e) => {
                    const width = Number(e.target.value);
                    if (Number.isInteger(width) && width >= 32 && width <= 640)
                      patch({ imageWidth: width });
                  }}
                />
              </Field>
              <Button
                disabled={disabled || !p.image}
                onClick={() => {
                  revision.current++;
                  setUploading(false);
                  const next = { ...p };
                  delete next.image;
                  onChange({ presentation: next });
                }}
              >
                {t("Xóa ảnh")}
              </Button>
            </>
          )}
          <Field label={t("Nội dung bổ sung · tiếng Việt")}>
            <Textarea
              maxLength={4000}
              disabled={disabled}
              value={field.help?.vi ?? ""}
              onChange={(e) =>
                onChange({
                  help: { vi: e.target.value, en: field.help?.en ?? "" },
                })
              }
            />
          </Field>
          <Field label={t("Nội dung bổ sung · tiếng Anh")}>
            <Textarea
              maxLength={4000}
              disabled={disabled}
              value={field.help?.en ?? ""}
              onChange={(e) =>
                onChange({
                  help: { en: e.target.value, vi: field.help?.vi ?? "" },
                })
              }
            />
          </Field>
        </>
      )}
    </FieldGroup>
  );
}
