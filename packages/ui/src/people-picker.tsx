import { useI18n } from "@flowdocker/i18n";
import { Combobox, type ComboboxOption } from "./combobox";

export interface PeoplePickerProps {
  id?: string;
  label: string;
  value: readonly string[];
  options: readonly ComboboxOption[];
  multiple?: boolean;
  disabled?: boolean;
  onChange(value: string[]): void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}
/** Host supplies authorized directory suggestions; only stable IDs leave this control. */
export function PeoplePicker({
  value,
  multiple,
  onChange,
  options,
  ...props
}: PeoplePickerProps) {
  const { t } = useI18n();
  return (
    <Combobox
      {...props}
      value={multiple ? "" : (value[0] ?? "")}
      selectedValues={multiple ? value : undefined}
      placeholder={t("Chọn người")}
      searchPlaceholder={t("Tìm tên, email hoặc phòng ban...")}
      emptyLabel={t("Không tìm thấy người phù hợp")}
      options={[{ value: "__fd_clear__", label: t("Bỏ lựa chọn") }, ...options]}
      onValueChange={(key) =>
        onChange(
          key === "__fd_clear__"
            ? []
            : multiple
              ? value.includes(key)
                ? value.filter((item) => item !== key)
                : [...value, key]
              : [key],
        )
      }
    />
  );
}
