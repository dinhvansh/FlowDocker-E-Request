import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import {
  DataSourceEditor,
  type FormDataSource,
} from "./components/data-source-editor";
import { createField, isFormDefinition } from "./schema";
import { useChoices } from "./use-choices";
import type { DataProvider } from "./runtime";
afterEach(cleanup);
const source: FormDataSource = {
  id: "master.demo",
  kind: "record",
  label: { vi: "Mẫu", en: "Demo" },
  description: { vi: "Danh mục", en: "Catalog" },
  mapping: {
    fields: [
      { key: "code", label: { vi: "Mã", en: "Code" } },
      { key: "name", label: { vi: "Tên", en: "Name" } },
    ],
    defaultValueField: "code",
    defaultLabelField: "name",
  },
};
it("selects a catalog with explicit defaults and preserves options/default values", () => {
  const patch = vi.fn();
  render(
    <I18nProvider initialLocale="en">
      <DataSourceEditor
        field={createField("select", [])}
        sources={[source]}
        patch={patch}
      />
    </I18nProvider>,
  );
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Data source" }), {
    key: "ArrowDown",
  });
  fireEvent.click(screen.getByRole("option", { name: "Demo" }));
  expect(patch).toHaveBeenCalledWith({
    dataSource: {
      provider: "master.demo",
      valueField: "code",
      labelField: "name",
    },
  });
});
it("retains missing saved columns, changes a mapping without erasing its dependency and validates mapping types", () => {
  const patch = vi.fn();
  const field = {
    ...createField("select", []),
    dataSource: {
      provider: "master.demo",
      valueField: "gone",
      labelField: "name",
      dependsOn: "company",
    },
  };
  render(
    <I18nProvider initialLocale="en">
      <DataSourceEditor field={field} sources={[source]} patch={patch} />
    </I18nProvider>,
  );
  expect(
    screen.getByText(
      "The saved column is no longer available. Select another catalog column.",
    ),
  ).toBeTruthy();
  expect(patch).not.toHaveBeenCalled();
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Stored key column" }),
    { key: "ArrowDown" },
  );
  fireEvent.click(screen.getByRole("option", { name: "Code (code)" }));
  expect(patch).toHaveBeenCalledWith({
    dataSource: { ...field.dataSource, valueField: "code" },
  });
  const definition = {
    id: "demo",
    title: { vi: "Mẫu", en: "Demo" },
    version: 1,
    status: "DRAFT",
    fields: [field],
  };
  expect(isFormDefinition(definition)).toBe(true);
  expect(
    isFormDefinition({
      ...definition,
      fields: [{ ...field, dataSource: { provider: "legacy" } }],
    }),
  ).toBe(true);
  for (const valueField of [42, "", null])
    expect(
      isFormDefinition({
        ...definition,
        fields: [
          { ...field, dataSource: { provider: "master.demo", valueField } },
        ],
      }),
    ).toBe(false);
});
it("refetches and drops stale choices when mapping changes, forwarding mapping to injected providers", async () => {
  const provider: DataProvider = vi.fn(async ({ labelField }) => [
    {
      value: "ID",
      label: { vi: labelField ?? "legacy", en: labelField ?? "legacy" },
    },
  ]);
  const field = {
    ...createField("select", []),
    dataSource: {
      provider: "master.demo",
      valueField: "code",
      labelField: "name",
    },
  };
  const hook = renderHook(
    ({ current }) => useChoices(current, undefined, provider),
    { initialProps: { current: field } },
  );
  await waitFor(() =>
    expect(hook.result.current.options[0]?.label.en).toBe("name"),
  );
  hook.rerender({
    current: {
      ...field,
      dataSource: { ...field.dataSource, labelField: "code" },
    },
  });
  expect(hook.result.current.options).toEqual([]);
  await waitFor(() =>
    expect(hook.result.current.options[0]?.label.en).toBe("code"),
  );
  expect(provider).toHaveBeenLastCalledWith(
    expect.objectContaining({ valueField: "code", labelField: "code" }),
  );
});
