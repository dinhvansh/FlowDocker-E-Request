import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { PeoplePicker } from "./people-picker";
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it("searches descriptions, keeps selected names while filtering and toggles stable IDs", () => {
  const changed = vi.fn();
  function Host() {
    const [values, setValues] = useState<string[]>([]);
    return (
      <I18nProvider>
        <PeoplePicker
          label="people"
          multiple
          value={values}
          options={[
            {
              value: "a",
              label: "An Demo",
              description: "an@example.test · IT",
            },
            {
              value: "b",
              label: "Bình Demo",
              description: "binh@example.test · Finance",
            },
          ]}
          onChange={(next) => {
            changed(next);
            setValues(next);
          }}
        />
      </I18nProvider>
    );
  }
  render(<Host />);
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: /An Demo/ }));
  expect(changed).toHaveBeenLastCalledWith(["a"]);
  fireEvent.change(
    screen.getByPlaceholderText("Tìm tên, email hoặc phòng ban..."),
    { target: { value: "Finance" } },
  );
  expect(screen.queryByRole("option", { name: /An Demo/ })).toBeNull();
  expect(screen.getByRole("combobox").textContent).toContain("An Demo");
  fireEvent.click(screen.getByRole("option", { name: /Bình Demo/ }));
  expect(changed).toHaveBeenLastCalledWith(["a", "b"]);
  fireEvent.click(screen.getByRole("option", { name: /Bình Demo/ }));
  expect(changed).toHaveBeenLastCalledWith(["a"]);
});
