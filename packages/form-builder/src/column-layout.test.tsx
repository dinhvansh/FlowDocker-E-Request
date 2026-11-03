import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { columnPercentages, columnStyle, resizeColumns } from "./column-layout";
import { ColumnLayoutEditor } from "./components/column-layout-editor";
import { createField, isFormDefinition, type FormDefinition } from "./schema";
import { analyzeFormCode, reconcileFormCode } from "./code-model";
afterEach(cleanup);
const columns = {
  ...createField("columns", []),
  columns: 2 as const,
  columnRatios: [1, 2],
  children: [createField("text", [])],
};
const form: FormDefinition = {
  id: "qa",
  title: { vi: "Test", en: "Test" },
  version: 1,
  status: "DRAFT",
  fields: [columns],
};
it("validates bounded ratios and preserves them in both code directions", () => {
  expect(isFormDefinition(form)).toBe(true);
  for (const bad of [[0, 1], [1], [1, 2, 3], [1.5, 2], [Infinity, 1]])
    expect(
      isFormDefinition({
        ...form,
        fields: [{ ...columns, columnRatios: bad }],
      }),
    ).toBe(false);
  expect(
    isFormDefinition({ ...form, fields: [{ ...columns, type: "text" }] }),
  ).toBe(false);
  const source = reconcileFormCode(JSON.stringify(form), {
    ...form,
    fields: [{ ...columns, columnRatios: [3, 1] }],
  });
  expect(
    analyzeFormCode(source, form.id).definition?.fields[0].columnRatios,
  ).toEqual([3, 1]);
});
it("keeps resizing bounded and prevents nested layouts inheriting parent ratios", () => {
  expect(columnPercentages(columns)).toEqual([33, 67]);
  expect(
    columnPercentages({ columns: 3, columnRatios: [100, 100, 1] }).every(
      (v) => v >= 1,
    ),
  ).toBe(true);
  expect(resizeColumns([33, 33, 34], 0, 100)).toEqual([65, 1, 34]);
  expect(resizeColumns([33, 33, 34], 1, 20)).toEqual([33, 1, 66]);
  expect(columnStyle({ ...columns, columnRatios: undefined })).toEqual({
    "--fd-column-template": "minmax(0, 1fr) minmax(0, 1fr)",
  });
});
it("supports keyboard resizing and presets without drag", () => {
  const change = vi.fn();
  render(
    <I18nProvider locale="en">
      <ColumnLayoutEditor field={columns} onChange={change} />
    </I18nProvider>,
  );
  fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });
  expect(change).toHaveBeenLastCalledWith([34, 66], true);
  fireEvent.click(screen.getByRole("button", { name: "Ratio 3:1" }));
  expect(change).toHaveBeenLastCalledWith([3, 1], true);
});
