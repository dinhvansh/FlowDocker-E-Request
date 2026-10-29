import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { FormRenderer } from "../runtime";
import { type FormDefinition, type PreviewValues } from "../schema";

afterEach(cleanup);
const form: FormDefinition = {
  id: "repeat-ui",
  version: 1,
  status: "DRAFT",
  schemaVersion: 2,
  title: { vi: "Chi phí", en: "Expenses" },
  fields: [
    {
      id: "note",
      key: "note",
      type: "text",
      label: { vi: "Ghi chú", en: "Note" },
      required: false,
      options: [],
    },
    {
      id: "rows",
      key: "lines",
      type: "repeat",
      label: { vi: "Dòng chi phí", en: "Expense rows" },
      required: false,
      options: [],
      minRows: 1,
      maxRows: 3,
      children: [
        {
          id: "expense",
          key: "expense",
          type: "currency",
          label: { vi: "Chi phí dòng", en: "Expense" },
          required: true,
          options: [],
          min: 0,
          currency: "USD",
        },
      ],
    },
    {
      id: "total",
      key: "total",
      type: "currency",
      label: { vi: "Tổng cộng", en: "Total" },
      required: false,
      options: [],
      calculation: { operator: "sum", fields: ["lines.expense"], precision: 2 },
    },
  ],
};
function Host() {
  const [values, setValues] = useState<PreviewValues>({
    note: "Keep this note",
    lines: [{ expense: "0.30" }],
  });
  return (
    <I18nProvider>
      <FormRenderer definition={form} values={values} onChange={setValues} />
      <output data-testid="values">{JSON.stringify(values)}</output>
    </I18nProvider>
  );
}
it("edits actual repeat-table cells, calculates decimals and retains sibling values when removing a row", () => {
  render(<Host />);
  expect(screen.getByRole("table", { name: "Dòng chi phí" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Thêm dòng" }));
  fireEvent.change(
    screen.getAllByRole("spinbutton", { name: "Chi phí dòng (bắt buộc)" })[1],
    { target: { value: "0.20" } },
  );
  expect(
    (screen.getByRole("spinbutton", { name: "Tổng cộng" }) as HTMLInputElement)
      .value,
  ).toBe("0.50");
  fireEvent.click(screen.getByRole("button", { name: "Xóa dòng 1" }));
  expect(
    (screen.getByRole("spinbutton", { name: "Tổng cộng" }) as HTMLInputElement)
      .value,
  ).toBe("0.20");
  expect(JSON.parse(screen.getByTestId("values").textContent!).note).toBe(
    "Keep this note",
  );
  expect(
    screen.getByRole("button", { name: "Xóa dòng 1" }).hasAttribute("disabled"),
  ).toBe(true);
});

it("keeps seven simple columns in a real table with accessible required headers", () => {
  const table = form.fields[1];
  const wide: FormDefinition = {
    ...form,
    fields: [
      {
        ...table,
        children: Array.from({ length: 7 }, (_, index) => ({
          ...table.children![0],
          id: `column_${index}`,
          key: `column_${index}`,
          label: { vi: `Cột ${index + 1}`, en: `Column ${index + 1}` },
        })),
      },
    ],
  };
  render(
    <I18nProvider>
      <FormRenderer
        definition={wide}
        values={{ lines: [{}] }}
        onChange={() => {}}
      />
    </I18nProvider>,
  );
  expect(screen.getByRole("table", { name: "Dòng chi phí" })).toBeTruthy();
  expect(screen.getAllByRole("columnheader")).toHaveLength(9);
  expect(screen.getAllByRole("spinbutton")).toHaveLength(7);
  expect(screen.getByRole("region", { name: "Dòng chi phí" }).className).toBe(
    "fd-repeat-table-scroll",
  );
});
