import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { I18nProvider } from "@flowdocker/i18n";
import { FormLogicStudio } from "./logic-studio";
import { createField } from "./schema";
afterEach(cleanup);
it("navigates dependencies, filters and prevents read-only design mutations", async () => {
  const user = userEvent.setup();
  const qty = {
    ...createField("number", []),
    id: "qty",
    key: "qty",
    label: { vi: "Số lượng", en: "Quantity" },
  };
  const total = {
    ...createField("number", []),
    id: "total",
    key: "total",
    label: { vi: "Tổng", en: "Total" },
    calculation: { operator: "sum" as const, fields: ["qty"] },
  };
  const change = vi.fn();
  render(
    <I18nProvider locale="en">
      <FormLogicStudio
        definition={{
          id: "test",
          title: { vi: "Test", en: "Test" },
          version: 1,
          status: "DRAFT",
          fields: [qty, total],
        }}
        values={{}}
        onChange={vi.fn()}
        onDefinitionChange={change}
        readOnly
      />
    </I18nProvider>,
  );
  await user.click(screen.getByRole("tab", { name: "Field dependencies" }));
  await user.click(screen.getAllByRole("button", { name: /Total total/ })[0]);
  expect(screen.getByText("Reads from")).toBeTruthy();
  await user.click(screen.getAllByRole("button", { name: /Quantity qty/ })[0]);
  await user.click(screen.getByRole("tab", { name: "Rules" }));
  expect(
    document.querySelector(".fd-logic-editor")?.hasAttribute("disabled"),
  ).toBe(true);
  expect(change).not.toHaveBeenCalled();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Find fields and rules" }),
    { target: { value: "missing" } },
  );
  expect(screen.getByText("No matching results.")).toBeTruthy();
});
