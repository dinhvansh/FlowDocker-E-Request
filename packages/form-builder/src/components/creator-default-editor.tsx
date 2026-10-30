import { useI18n } from "@flowdocker/i18n";
import { Checkbox, Field, Select } from "@flowdocker/ui";
import {
  creatorProfileLabels,
  defaultSourcesForType,
  type CreatorProfileAttribute,
  type DefaultValueSource,
  type FormField,
} from "../schema";

/** Host-independent defaults; attributes are supplied through runtimeContext. */
export function CreatorDefaultEditor({
  field,
  patch,
}: {
  field: FormField;
  patch(value: Partial<FormField>): void;
}) {
  const { t } = useI18n();
  const sources = defaultSourcesForType(field.type);
  if (!sources.length) return null;
  return (
    <>
      <Field
        label={t("Nguồn giá trị mặc định")}
        hint={
          field.defaultValueSource
            ? t(
                "Tự điền khi trường chưa có giá trị. Giữ nguyên dữ liệu đã lưu hoặc đã xóa.",
              )
            : undefined
        }
      >
        <Select
          label={t(
            field.type === "person"
              ? "Giá trị mặc định"
              : "Nguồn giá trị mặc định",
          )}
          value={field.defaultValueSource ?? "fixed"}
          options={[
            {
              value: "fixed",
              label: t(
                field.type === "person"
                  ? "Chọn người cụ thể"
                  : "Nhập giá trị cố định",
              ),
            },
            ...sources.map((source) => ({
              value: source,
              label: t(
                source === "currentUser"
                  ? "Người đang tạo biểu mẫu"
                  : creatorProfileLabels[
                      source.slice(
                        "currentUser.".length,
                      ) as CreatorProfileAttribute
                    ],
              ),
            })),
          ]}
          onValueChange={(value) =>
            patch({
              defaultValueSource:
                value === "fixed" ? undefined : (value as DefaultValueSource),
              defaultValue: undefined,
            })
          }
        />
      </Field>
      {(field.type === "person" || field.defaultValueSource) && (
        <Field
          label={t(
            field.type === "person"
              ? "Cho phép đổi người"
              : "Cho phép sửa giá trị",
          )}
        >
          <Checkbox
            checked={!field.readOnly}
            onCheckedChange={(checked) => patch({ readOnly: checked !== true })}
          />
        </Field>
      )}
    </>
  );
}
