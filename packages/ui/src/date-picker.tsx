import { useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { CalendarDays } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { enUS, vi } from "react-day-picker/locale";
import { Calendar } from "./components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Button } from "./primitives";
import { Select } from "./select";

export type DatePickerProps = {
  /** Local calendar value: YYYY-MM-DD or YYYY-MM-DDTHH:mm. Never converted to UTC. */
  value: string;
  onValueChange(value: string): void;
  label: string;
  withTime?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/** Controlled, bilingual date input shared by authoring and runtime forms. */
export function DatePicker({
  value,
  onValueChange,
  label,
  withTime = false,
  disabled,
  placeholder,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  const hour = selected ? format(selected, "HH") : "00";
  const minute = selected ? format(selected, "mm") : "00";
  const language = locale === "vi" ? "vi-VN" : "en-US";
  const themeRoot =
    typeof document === "undefined"
      ? undefined
      : (document.querySelector<HTMLElement>(".fd-app") ?? undefined);
  const selectDate = (day: Date) => {
    onValueChange(
      format(day, "yyyy-MM-dd") + (withTime ? `T${hour}:${minute}` : ""),
    );
    if (!withTime) setOpen(false);
  };
  const updateTime = (nextHour: string, nextMinute: string) => {
    if (selected)
      onValueChange(
        `${format(selected, "yyyy-MM-dd")}T${nextHour}:${nextMinute}`,
      );
  };
  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          disabled={disabled}
          className="fd-date-trigger"
          aria-label={label}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        >
          <span data-placeholder={!selected || undefined}>
            {selected
              ? new Intl.DateTimeFormat(language, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  ...(withTime
                    ? { hour: "2-digit", minute: "2-digit", hour12: false }
                    : {}),
                }).format(selected)
              : value || placeholder || t("Chọn ngày")}
          </span>
          <CalendarDays aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="fd-date-popover"
        align="start"
        collisionPadding={8}
        portalContainer={themeRoot}
        aria-label={t("Lịch · {{label}}", { label })}
      >
        <Calendar
          mode="single"
          required
          selected={selected}
          defaultMonth={selected}
          onSelect={(day) => {
            if (day) selectDate(day);
          }}
          locale={locale === "vi" ? vi : enUS}
          captionLayout="dropdown"
          startMonth={new Date(1900, 0)}
          endMonth={new Date(new Date().getFullYear() + 100, 11)}
          autoFocus
          labels={{
            labelNext: () => t("Tháng sau"),
            labelPrevious: () => t("Tháng trước"),
            labelMonthDropdown: () => t("Chọn tháng"),
            labelYearDropdown: () => t("Chọn năm"),
            labelNav: () => t("Điều hướng lịch"),
            labelDayButton: (day, modifiers) => {
              const date = new Intl.DateTimeFormat(language, {
                dateStyle: "full",
              }).format(day);
              return modifiers.selected
                ? t("{{date}} · đã chọn", { date })
                : date;
            },
          }}
          formatters={{
            formatMonthDropdown: (date) =>
              new Intl.DateTimeFormat(language, { month: "long" }).format(date),
          }}
        />
        {withTime && (
          <div className="fd-date-time">
            <Select
              label={t("Giờ")}
              value={hour}
              disabled={!selected}
              options={Array.from({ length: 24 }, (_, i) => ({
                value: String(i).padStart(2, "0"),
                label: String(i).padStart(2, "0"),
              }))}
              onValueChange={(next) => updateTime(next, minute)}
            />
            <Select
              label={t("Phút")}
              value={minute}
              disabled={!selected}
              options={Array.from({ length: 60 }, (_, i) => ({
                value: String(i).padStart(2, "0"),
                label: String(i).padStart(2, "0"),
              }))}
              onValueChange={(next) => updateTime(hour, next)}
            />
          </div>
        )}
        <div className="fd-date-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => selectDate(new Date())}
          >
            {t("Hôm nay")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!value}
            onClick={() => {
              onValueChange("");
              setOpen(false);
            }}
          >
            {t("Xóa ngày")}
          </Button>
          {withTime && (
            <Button type="button" onClick={() => setOpen(false)}>
              {t("Xong")}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
