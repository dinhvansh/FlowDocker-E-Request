import { useI18n } from "@flowdocker/i18n";
import { Button, Field, Input, Notice, Select } from "@flowdocker/ui";
import { X } from "lucide-react";
import type {
  FormField,
  NumberingConfig,
  NumberingToken,
  NumberingTokenKind,
} from "../schema";

const tokenKinds: NumberingTokenKind[] = [
  "sequence",
  "year",
  "month",
  "day",
  "typeCode",
  "creator",
  "employeeCode",
  "department",
  "position",
  "managerId",
  "managerName",
  "literal",
];

const defaultNumbering: NumberingConfig = {
  segments: [
    { kind: "literal", value: "DNTT" },
    { kind: "literal", value: "-" },
    { kind: "year" },
    { kind: "literal", value: "-" },
    { kind: "sequence" },
  ],
  sequenceDigits: 4,
  scope: "year",
};

function tokenLabel(kind: NumberingTokenKind, t: (key: string) => string) {
  return t(
    (
      {
        sequence: "Số thứ tự",
        year: "Năm",
        month: "Tháng",
        day: "Ngày",
        typeCode: "Mã loại",
        creator: "Người tạo",
        employeeCode: "Mã nhân viên",
        department: "Phòng ban",
        position: "Chức danh",
        managerId: "Mã quản lý",
        managerName: "Tên quản lý",
        literal: "Chữ cố định",
      } satisfies Record<NumberingTokenKind, string>
    )[kind],
  );
}

function tokenPreview(
  token: NumberingToken,
  digits: number,
  t: (key: string) => string,
) {
  if (token.kind === "literal") return token.value ?? "";
  if (token.kind === "sequence") return "0".repeat(digits);
  return (
    {
      sequence: "0000",
      year: "2026",
      month: "01",
      day: "01",
      typeCode: "TYPE",
      creator: `[${t("Người tạo")}]`,
      employeeCode: "[EMP]",
      department: `[${t("Phòng ban")}]`,
      position: `[${t("Chức danh")}]`,
      managerId: "[MANAGER_ID]",
      managerName: `[${t("Tên quản lý")}]`,
      literal: "",
    } satisfies Record<NumberingTokenKind, string>
  )[token.kind];
}

export function NumberingEditor({
  field,
  patch,
}: {
  field: FormField;
  patch(value: Partial<FormField>): void;
}) {
  const { t } = useI18n();
  const config = field.numbering ?? defaultNumbering;
  const update = (changes: Partial<NumberingConfig>) =>
    patch({ numbering: { ...config, ...changes } });
  const preview = config.segments
    .map((token) => tokenPreview(token, config.sequenceDigits, t))
    .join("");

  return (
    <div className="fd-numbering-editor">
      <Field
        label={t("Thêm thành phần")}
        hint={t("Ghép các thành phần thành mã số tự động.")}
      >
        <Select
          label={t("Thêm thành phần")}
          value="__empty__"
          options={[
            { value: "__empty__", label: t("Chọn thành phần") },
            ...tokenKinds.map((kind) => ({
              value: kind,
              label: tokenLabel(kind, t),
            })),
          ]}
          onValueChange={(value) => {
            if (value === "__empty__") return;
            const kind = value as NumberingTokenKind;
            const token: NumberingToken =
              kind === "literal" ? { kind, value: "-" } : { kind };
            update({ segments: [...config.segments, token] });
          }}
        />
      </Field>
      <div className="fd-numbering-segments" role="list">
        {config.segments.map((token, index) => (
          <div
            className="fd-numbering-segment"
            key={`${token.kind}-${index}`}
            role="listitem"
          >
            <span>
              {token.kind === "literal"
                ? token.value || t("Chữ cố định")
                : tokenLabel(token.kind, t)}
            </span>
            <Button
              variant="ghost"
              aria-label={t("Xóa thành phần")}
              title={t("Xóa thành phần")}
              onClick={() =>
                update({
                  segments: config.segments.filter(
                    (_, position) => position !== index,
                  ),
                })
              }
            >
              <X />
            </Button>
          </div>
        ))}
      </div>
      {config.segments.some((token) => token.kind === "literal") && (
        <Field label={t("Chữ cố định cuối cùng")}>
          <Input
            value={
              [...config.segments]
                .reverse()
                .find((token) => token.kind === "literal")?.value ?? ""
            }
            onChange={(event) => {
              const position = [...config.segments]
                .map((token, index) => ({ token, index }))
                .reverse()
                .find(({ token }) => token.kind === "literal")?.index;
              if (position === undefined) return;
              update({
                segments: config.segments.map((token, index) =>
                  index === position
                    ? { ...token, value: event.target.value }
                    : token,
                ),
              });
            }}
          />
        </Field>
      )}
      <Field label={t("Số chữ số thứ tự")}>
        <Input
          type="number"
          min={1}
          max={12}
          value={config.sequenceDigits}
          onChange={(event) =>
            update({
              sequenceDigits: Math.min(
                12,
                Math.max(1, Number(event.target.value) || 1),
              ),
            })
          }
        />
      </Field>
      <Field label={t("Phạm vi đánh số")}>
        <Select
          label={t("Phạm vi đánh số")}
          value={config.scope}
          options={[
            { value: "year", label: t("Đặt lại theo năm") },
            { value: "app", label: t("Liên tục trong ứng dụng") },
          ]}
          onValueChange={(value) =>
            update({ scope: value as NumberingConfig["scope"] })
          }
        />
      </Field>
      <Notice>
        {t("Xem trước mã")}: <strong>{preview || "—"}</strong>
      </Notice>
    </div>
  );
}
