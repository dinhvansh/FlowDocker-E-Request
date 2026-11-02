import { useEffect, useRef, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  Button,
  Checkbox,
  Field,
  FieldGroup,
  Input,
  Modal,
  Notice,
  Select,
  Tabs,
  Textarea,
} from "@flowdocker/ui";
import {
  defaultDecoration,
  emptyBandCell,
  prepareBandImage,
  type FormBand,
  type FormBandCell,
  type FormDecoration,
} from "../decoration";
import type { BilingualText } from "../schema";
import { FormBandView } from "./form-band";
import "../decoration.css";

export interface FormDecorationEditorProps {
  value?: FormDecoration;
  title: BilingualText;
  disabled?: boolean;
  onChange(value: FormDecoration): void;
}
export function FormDecorationEditor({
  value,
  title,
  disabled,
  onChange,
}: FormDecorationEditorProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"header" | "footer">("header");
  const [selectedColumn, setColumn] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const uploadRevision = useRef(0);
  useEffect(
    () => () => {
      uploadRevision.current++;
    },
    [],
  );
  const latest = useRef({ value, disabled, onChange });
  latest.current = { value, disabled, onChange };
  const current = value ?? defaultDecoration();
  const band = current[placement];
  const column = Math.min(selectedColumn, band.columns - 1);
  const cell = band.cells[column];
  const patchBand = (patch: Partial<FormBand>) => {
    if (!disabled) onChange({ ...current, [placement]: { ...band, ...patch } });
  };
  const patchCell = (patch: Partial<FormBandCell>) =>
    patchBand({
      cells: band.cells.map((c, i) => (i === column ? { ...c, ...patch } : c)),
    });
  const close = () => {
    uploadRevision.current++;
    setOpen(false);
    setUploading(false);
    setImageError(false);
  };
  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)}>
        {t("Đầu trang / Chân trang")}
      </Button>
      {open && (
        <Modal
          title={t("Đầu trang / Chân trang")}
          onClose={close}
          footer={<Button onClick={close}>{t("Đóng")}</Button>}
        >
          <div className="fd-decoration-editor">
            <p>
              {t(
                "Chỉnh trực tiếp; thay đổi đồng bộ với canvas và Code Studio. Lưu bản nháp để giữ thiết kế.",
              )}
            </p>
            <Tabs
              active={placement}
              onChange={(next) => {
                uploadRevision.current++;
                setPlacement(next as typeof placement);
                setColumn(0);
                setUploading(false);
                setImageError(false);
              }}
              tabs={[
                { id: "header", label: t("Đầu trang") },
                { id: "footer", label: t("Chân trang") },
              ]}
            />
            <FieldGroup>
              <Field label={t("Hiển thị phần này")}>
                <Checkbox
                  disabled={disabled}
                  checked={band.enabled}
                  onCheckedChange={(checked) =>
                    patchBand({ enabled: checked === true })
                  }
                />
              </Field>
              <Field label={t("Bố cục đầu / chân trang")}>
                <Select
                  label={t("Bố cục đầu / chân trang")}
                  disabled={disabled || !band.enabled}
                  value={String(band.columns)}
                  options={[1, 2, 3].map((n) => ({
                    value: String(n),
                    label: t("{{count}} cột", { count: n }),
                  }))}
                  onValueChange={(n) => {
                    uploadRevision.current++;
                    setUploading(false);
                    setColumn(0);
                    patchBand({ columns: Number(n) as 1 | 2 | 3 });
                  }}
                />
              </Field>
              <Field label={t("Đường phân cách")}>
                <Checkbox
                  disabled={disabled || !band.enabled}
                  checked={band.divider}
                  onCheckedChange={(checked) =>
                    patchBand({ divider: checked === true })
                  }
                />
              </Field>
            </FieldGroup>
            <div className="fd-toolbar-actions">
              <Button
                disabled={disabled}
                onClick={() => {
                  uploadRevision.current++;
                  setUploading(false);
                  setColumn(0);
                  patchBand({
                    enabled: true,
                    columns: 3,
                    cells: [
                      { ...emptyBandCell(), kind: "image" },
                      {
                        ...emptyBandCell(),
                        kind: "title",
                        align: "center",
                        size: "title",
                        bold: true,
                      },
                      { ...emptyBandCell(), align: "right" },
                    ],
                  });
                }}
              >
                {t("Mẫu logo và tiêu đề")}
              </Button>
              <Button
                disabled={disabled}
                onClick={() => {
                  uploadRevision.current++;
                  setUploading(false);
                  setPlacement("footer");
                  setColumn(0);
                  onChange({
                    ...current,
                    footer: {
                      enabled: true,
                      columns: 3,
                      divider: true,
                      cells: [
                        {
                          vi: "Người đề nghị\n(Ký, ghi rõ họ tên)",
                          en: "Requester\n(Signature and full name)",
                        },
                        {
                          vi: "Người kiểm tra\n(Ký, ghi rõ họ tên)",
                          en: "Reviewer\n(Signature and full name)",
                        },
                        {
                          vi: "Người phê duyệt\n(Ký, ghi rõ họ tên)",
                          en: "Approver\n(Signature and full name)",
                        },
                      ].map((text) => ({
                        ...emptyBandCell(),
                        align: "center" as const,
                        text,
                        bold: true,
                      })),
                    },
                  });
                }}
              >
                {t("Mẫu khu vực chữ ký")}
              </Button>
            </div>
            <div
              className="fd-decoration-preview"
              aria-label={t("Xem thử đầu / chân trang")}
            >
              <FormBandView
                title={title}
                decoration={current}
                placement={placement}
              />
            </div>
            {band.enabled && (
              <FieldGroup>
                <Field label={t("Cột đang chỉnh")}>
                  <Select
                    label={t("Cột đang chỉnh")}
                    disabled={disabled}
                    value={String(column)}
                    options={Array.from({ length: band.columns }, (_, i) => ({
                      value: String(i),
                      label: t("Cột {{number}}", { number: i + 1 }),
                    }))}
                    onValueChange={(i) => {
                      uploadRevision.current++;
                      setUploading(false);
                      setImageError(false);
                      setColumn(Number(i));
                    }}
                  />
                </Field>
                <Field label={t("Loại nội dung")}>
                  <Select
                    label={t("Loại nội dung")}
                    disabled={disabled}
                    value={cell.kind}
                    options={[
                      { value: "title", label: t("Tên biểu mẫu") },
                      { value: "text", label: t("Nội dung chữ") },
                      { value: "image", label: t("Ảnh / Logo") },
                    ]}
                    onValueChange={(kind) => {
                      uploadRevision.current++;
                      setUploading(false);
                      patchCell({ kind: kind as FormBandCell["kind"] });
                    }}
                  />
                </Field>
                <Field label={t("Căn nội dung")}>
                  <Select
                    label={t("Căn nội dung")}
                    disabled={disabled}
                    value={cell.align}
                    options={[
                      { value: "left", label: t("Căn trái") },
                      { value: "center", label: t("Căn giữa") },
                      { value: "right", label: t("Căn phải") },
                    ]}
                    onValueChange={(align) =>
                      patchCell({ align: align as FormBandCell["align"] })
                    }
                  />
                </Field>
                {cell.kind === "title" && (
                  <Notice>
                    {t(
                      "Tiêu đề lấy từ tên biểu mẫu và tự cập nhật khi đổi tên.",
                    )}
                  </Notice>
                )}
                {cell.kind !== "title" && (
                  <>
                    <Field
                      label={
                        cell.kind === "image"
                          ? t("Mô tả ảnh · tiếng Việt")
                          : t("Nội dung · tiếng Việt")
                      }
                    >
                      <Textarea
                        disabled={disabled}
                        rows={3}
                        maxLength={4000}
                        value={cell.text.vi}
                        onChange={(e) =>
                          patchCell({
                            text: { ...cell.text, vi: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field
                      label={
                        cell.kind === "image"
                          ? t("Mô tả ảnh · tiếng Anh")
                          : t("Nội dung · tiếng Anh")
                      }
                    >
                      <Textarea
                        disabled={disabled}
                        rows={3}
                        maxLength={4000}
                        value={cell.text.en}
                        onChange={(e) =>
                          patchCell({
                            text: { ...cell.text, en: e.target.value },
                          })
                        }
                      />
                    </Field>
                  </>
                )}
                {cell.kind === "image" ? (
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
                        onChange={async (e) => {
                          const file = e.currentTarget.files?.[0];
                          e.currentTarget.value = "";
                          if (!file) return;
                          const revision = ++uploadRevision.current;
                          setUploading(true);
                          setImageError(false);
                          try {
                            const image = await prepareBandImage(file);
                            if (revision !== uploadRevision.current) return;
                            const state = latest.current;
                            if (state.disabled) return;
                            const d = state.value ?? defaultDecoration();
                            if (
                              !d[placement].enabled ||
                              column >= d[placement].columns ||
                              d[placement].cells[column].kind !== "image"
                            )
                              return;
                            state.onChange({
                              ...d,
                              [placement]: {
                                ...d[placement],
                                cells: d[placement].cells.map((c, i) =>
                                  i === column ? { ...c, image } : c,
                                ),
                              },
                            });
                          } catch {
                            if (revision === uploadRevision.current)
                              setImageError(true);
                          } finally {
                            if (revision === uploadRevision.current)
                              setUploading(false);
                          }
                        }}
                      />
                    </Field>
                    {uploading && <Notice>{t("Đang chuẩn bị ảnh...")}</Notice>}
                    {imageError && (
                      <Notice tone="danger">
                        {t(
                          "Không dùng được ảnh này. Chọn PNG, JPEG hoặc WebP nhỏ hơn 5 MB.",
                        )}
                      </Notice>
                    )}
                    <Field label={t("Chiều rộng ảnh (px)")}>
                      <Input
                        disabled={disabled}
                        type="number"
                        min={32}
                        max={320}
                        value={cell.imageWidth ?? 96}
                        onChange={(e) => {
                          const width = Number(e.target.value);
                          if (
                            Number.isInteger(width) &&
                            width >= 32 &&
                            width <= 320
                          )
                            patchCell({ imageWidth: width });
                        }}
                      />
                    </Field>
                    <Button
                      disabled={disabled || !cell.image}
                      onClick={() => {
                        uploadRevision.current++;
                        setUploading(false);
                        const next = { ...cell };
                        delete next.image;
                        patchBand({
                          cells: band.cells.map((c, i) =>
                            i === column ? next : c,
                          ),
                        });
                      }}
                    >
                      {t("Xóa ảnh")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Field label={t("Cỡ chữ nội dung")}>
                      <Select
                        label={t("Cỡ chữ nội dung")}
                        disabled={disabled}
                        value={cell.size}
                        options={[
                          { value: "body", label: t("Nội dung thường") },
                          { value: "subtitle", label: t("Tiêu đề phụ") },
                          { value: "title", label: t("Tiêu đề lớn") },
                        ]}
                        onValueChange={(size) =>
                          patchCell({ size: size as FormBandCell["size"] })
                        }
                      />
                    </Field>
                    <Field label={t("In đậm")}>
                      <Checkbox
                        disabled={disabled}
                        checked={cell.bold}
                        onCheckedChange={(checked) =>
                          patchCell({ bold: checked === true })
                        }
                      />
                    </Field>
                  </>
                )}
              </FieldGroup>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
