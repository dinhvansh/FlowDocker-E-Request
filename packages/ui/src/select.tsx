import * as SelectPrimitive from "@radix-ui/react-select";

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
};

/** FlowDocker-styled accessible select. The menu stays inside the app theme root. */
export function Select({
  label,
  value,
  options,
  onValueChange,
  disabled,
  placeholder = "Chọn giá trị",
}: SelectProps) {
  const themeRoot =
    typeof document === "undefined"
      ? undefined
      : (document.querySelector<HTMLElement>(".fd-app") ?? undefined);

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger className="fd-select-trigger" aria-label={label}>
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="fd-select-chevron" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
            <path
              d="m4 6 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={themeRoot}>
        <SelectPrimitive.Content
          className="fd-select-content"
          position="popper"
          sideOffset={5}
          collisionPadding={8}
        >
          <SelectPrimitive.Viewport className="fd-select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item
                className="fd-select-item"
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="fd-select-check">
                  ✓
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
