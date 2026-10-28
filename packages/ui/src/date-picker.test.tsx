import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { DatePicker } from "./date-picker";

afterEach(() => {
  cleanup();
  localStorage.clear();
});
function Host({ withTime = false }: { withTime?: boolean }) {
  const [value, setValue] = useState(
    withTime ? "2028-02-28T14:35" : "2028-02-28",
  );
  const { setLocale } = useI18n();
  return (
    <div className="fd-app">
      <button onClick={() => setLocale("en")}>English</button>
      <DatePicker
        label="Appointment"
        value={value}
        onValueChange={setValue}
        withTime={withTime}
      />
      <output aria-label="Stored value">{value}</output>
    </div>
  );
}
describe("shared date picker", () => {
  it("selects a leap day as a local ISO date, changes presentation language and clears", () => {
    render(
      <I18nProvider>
        <Host />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Appointment" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(
          new Date(2028, 1, 29),
        ),
      }),
    );
    expect(screen.getByLabelText("Stored value").textContent).toBe(
      "2028-02-29",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Appointment" }));
    fireEvent.click(screen.getByRole("button", { name: /29 tháng 2, 2028/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByLabelText("Stored value").textContent).toBe(
      "2028-02-29",
    );
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(
      screen.getByRole("button", { name: "Appointment" }).textContent,
    ).toContain("02/29/2028");
    fireEvent.click(screen.getByRole("button", { name: "Appointment" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear date" }));
    expect(screen.getByLabelText("Stored value").textContent).toBe("");
  });
  it("preserves the local clock time when the date changes", () => {
    render(
      <I18nProvider>
        <Host withTime />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Appointment" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(
          new Date(2028, 1, 29),
        ),
      }),
    );
    expect(screen.getByLabelText("Stored value").textContent).toBe(
      "2028-02-29T14:35",
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Xong" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("keeps a disabled field closed and exposes its invalid state", () => {
    render(
      <I18nProvider>
        <DatePicker
          label="Locked date"
          value="2028-02-29"
          onValueChange={() => {
            throw new Error("Read-only change");
          }}
          disabled
          aria-invalid
        />
      </I18nProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Locked date" });
    expect(trigger.hasAttribute("disabled")).toBe(true);
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    fireEvent.click(trigger);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
