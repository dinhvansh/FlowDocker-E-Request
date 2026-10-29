import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useI18n } from "@flowdocker/i18n";
import { Button } from "./primitives";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Input } from "./components/ui/input";

export type ComboboxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ComboboxProps = {
  label: string;
  value: string;
  options: readonly ComboboxOption[];
  onValueChange(value: string): void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/** Searchable choice control for long or provider-backed field lists. */
export function Combobox({
  label,
  value,
  options,
  onValueChange,
  disabled,
  placeholder = "Chọn giá trị",
  searchPlaceholder = "Tìm lựa chọn...",
  emptyLabel = "Không tìm thấy lựa chọn",
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: ComboboxProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const themeRoot =
    typeof document === "undefined"
      ? undefined
      : (document.querySelector<HTMLElement>(".fd-app") ?? undefined);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? options.filter((option) =>
          option.label.toLocaleLowerCase().includes(normalized),
        )
      : options;
  }, [options, query]);
  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          disabled={disabled}
          className="fd-combobox-trigger"
          aria-label={label}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-expanded={open}
          role="combobox"
        >
          <span className={!selected ? "fd-combobox-placeholder" : undefined}>
            {selected?.label ?? t(placeholder)}
          </span>
          <ChevronsUpDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="fd-combobox-popover"
        align="start"
        sideOffset={5}
        collisionPadding={8}
        portalContainer={themeRoot}
        aria-label={label}
      >
        <label className="fd-combobox-search">
          <Search aria-hidden="true" />
          <span className="sr-only">{t(searchPlaceholder)}</span>
          <Input
            autoFocus
            value={query}
            placeholder={t(searchPlaceholder)}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="fd-combobox-options" role="listbox" aria-label={label}>
          {filtered.length ? (
            filtered.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                className="fd-combobox-option"
                key={option.value}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span>{option.label}</span>
                {option.value === value && <Check aria-hidden="true" />}
              </button>
            ))
          ) : (
            <p className="fd-combobox-empty">{t(emptyLabel)}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
