import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { CurrencyInput } from "./currency-input";

afterEach(() => {
  cleanup();
  localStorage.clear();
});
function Host() {
  const [value, setValue] = useState("1234567.80");
  const { setLocale } = useI18n();
  return (
    <>
      <CurrencyInput
        aria-label="Amount"
        value={value}
        onValueChange={setValue}
      />
      <output aria-label="Stored amount">{value}</output>
      <button onClick={() => setLocale("en")}>English</button>
    </>
  );
}
it("formats both locales while preserving exact decimal strings, zero and clearing", () => {
  render(
    <I18nProvider>
      <Host />
    </I18nProvider>,
  );
  const input = screen.getByRole("textbox", {
    name: "Amount",
  }) as HTMLInputElement;
  const stored = () => screen.getByLabelText("Stored amount").textContent;
  expect(input.value).toBe("1.234.567,80");
  fireEvent.change(input, { target: { value: "9.007.199.254.740.993,01" } });
  expect(stored()).toBe("9007199254740993.01");
  expect(input.value).toBe("9.007.199.254.740.993,01");
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(input.value).toBe("9,007,199,254,740,993.01");
  fireEvent.change(input, { target: { value: "-1,234.50" } });
  expect(stored()).toBe("-1234.50");
  fireEvent.change(input, { target: { value: "0" } });
  expect(stored()).toBe("0");
  fireEvent.change(input, { target: { value: "" } });
  expect(stored()).toBe("");
});
it("keeps the caret at an edited middle digit when grouping changes", () => {
  render(
    <I18nProvider>
      <Host />
    </I18nProvider>,
  );
  const input = screen.getByRole("textbox", {
    name: "Amount",
  }) as HTMLInputElement;
  input.focus();
  fireEvent.change(input, {
    target: { value: "12.934.567,80", selectionStart: 4 },
  });
  expect(input.value).toBe("12.934.567,80");
  expect(input.selectionStart).toBe(4);
  expect(screen.getByLabelText("Stored amount").textContent).toBe(
    "12934567.80",
  );
});
