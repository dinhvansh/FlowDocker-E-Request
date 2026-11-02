import {
  Select as ShadSelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onValueChange(value: string): void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
};

/** FlowDocker Select built from the shadcn/ui Radix source. */
export function Select({
  label,
  value,
  options,
  onValueChange,
  disabled,
  placeholder = "Chọn giá trị",
  id,
  "aria-invalid": ariaInvalid,
}: SelectProps) {
  const themeRoot =
    typeof document === "undefined"
      ? undefined
      : (document.querySelector<HTMLElement>(".fd-app") ?? undefined);

  return (
    <ShadSelect value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className="w-full"
        aria-label={label}
        aria-invalid={ariaInvalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={5}
        collisionPadding={8}
        portalContainer={themeRoot}
      >
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </ShadSelect>
  );
}
