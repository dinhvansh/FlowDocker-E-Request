import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { useI18n } from "@flowdocker/i18n";
import { Input } from "./components/ui/input";

export type CurrencyInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "defaultValue"
> & {
  /** Canonical decimal string, without grouping; never converted through Number. */
  value: string;
  onValueChange(value: string): void;
};

function formatAmount(value: string, group: string, decimal: string) {
  if (!/^-?\d*(\.\d*)?$/.test(value)) return value;
  const [integer, fraction] = value.split(".");
  return (
    integer.replace(/\B(?=(\d{3})+(?!\d))/g, group) +
    (fraction === undefined ? "" : decimal + fraction)
  );
}

/** Localized money entry; stored values retain decimal precision and trailing zeroes. */
export function CurrencyInput({
  value,
  onValueChange,
  ...props
}: CurrencyInputProps) {
  const { locale } = useI18n();
  const group = locale === "vi" ? "." : ",";
  const decimal = locale === "vi" ? "," : ".";
  const ref = useRef<HTMLInputElement>(null);
  const selection = useRef<number | null>(null);
  const display = formatAmount(value, group, decimal);
  useLayoutEffect(() => {
    if (selection.current !== null && ref.current === document.activeElement) {
      ref.current?.setSelectionRange(selection.current, selection.current);
    }
    selection.current = null;
  });
  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(event) => {
        const input = event.currentTarget;
        const raw = input.value;
        const next = raw
          .replaceAll(group, "")
          .replaceAll(/\s/g, "")
          .replace(decimal, ".");
        if (!/^-?\d*(\.\d*)?$/.test(next)) {
          input.value = display;
          return;
        }
        const meaningful = raw
          .slice(0, input.selectionStart ?? raw.length)
          .replaceAll(group, "").length;
        const formatted = formatAmount(next, group, decimal);
        let cursor = 0;
        let count = 0;
        while (cursor < formatted.length && count < meaningful) {
          if (formatted[cursor] !== group) count++;
          cursor++;
        }
        selection.current = cursor;
        onValueChange(next);
      }}
    />
  );
}
