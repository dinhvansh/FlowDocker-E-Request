import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import {
  DataSourceEditor,
  type FormDataSource,
} from "./components/data-source-editor";
import { createField } from "./schema";

afterEach(cleanup);
it("limits people sources while preserving an incompatible saved source until explicitly changed", () => {
  const patch = vi.fn();
  const field = {
    ...createField("person", []),
    dataSource: { provider: "departments" },
  };
  render(
    <I18nProvider initialLocale="en">
      <DataSourceEditor
        field={field}
        sources={[
          { ...sources[0], kind: "person" },
          {
            ...sources[0],
            id: "departments",
            kind: "record",
            label: { vi: "Phòng ban", en: "Departments" },
          },
          {
            ...sources[0],
            id: "companies",
            kind: "record",
            label: { vi: "Công ty", en: "Companies" },
          },
        ]}
        patch={patch}
      />
    </I18nProvider>,
  );
  expect(patch).not.toHaveBeenCalled();
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Data source" }), {
    key: "ArrowDown",
  });
  expect(screen.queryByRole("option", { name: "Departments" })).toBeNull();
  expect(screen.queryByRole("option", { name: "Companies" })).toBeNull();
  fireEvent.click(screen.getByRole("option", { name: "Example people" }));
  expect(patch).toHaveBeenCalledWith({
    dataSource: { provider: "example.people" },
  });
});
const sources: FormDataSource[] = [
  {
    id: "example.people",
    label: { vi: "Người minh họa", en: "Example people" },
    description: {
      vi: "Danh sách nội bộ minh họa.",
      en: "Example internal directory.",
    },
  },
];

it("preserves an unavailable saved source and its dependency without patching on mount", () => {
  const patch = vi.fn();
  const field = {
    ...createField("select", []),
    dataSource: { provider: "legacy.source", dependsOn: "company" },
  };
  render(
    <I18nProvider initialLocale="en">
      <DataSourceEditor field={field} sources={sources} patch={patch} />
    </I18nProvider>,
  );
  expect(
    screen.getByRole("combobox", { name: "Data source" }).textContent,
  ).toContain("Unavailable source: legacy.source");
  expect(screen.getByText(/Source legacy.source is unavailable/)).toBeTruthy();
  expect(patch).not.toHaveBeenCalled();
  expect(field.dataSource.dependsOn).toBe("company");
});

it("selects a registered source by its name and clears the old source dependency", () => {
  const patch = vi.fn();
  const field = {
    ...createField("select", []),
    dataSource: { provider: "legacy.source", dependsOn: "company" },
  };
  render(
    <I18nProvider initialLocale="en">
      <DataSourceEditor field={field} sources={sources} patch={patch} />
    </I18nProvider>,
  );
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Data source" }), {
    key: "ArrowDown",
  });
  fireEvent.click(screen.getByRole("option", { name: "Example people" }));
  expect(patch).toHaveBeenCalledWith({
    dataSource: { provider: "example.people" },
  });
});

it("returns to manual choices without deleting saved options or defaults", () => {
  const patch = vi.fn();
  const field = {
    ...createField("select", []),
    dataSource: { provider: "example.people" },
    defaultValue: "one",
    options: [{ value: "one", label: { vi: "Một", en: "One" } }],
  };
  render(
    <I18nProvider initialLocale="vi">
      <DataSourceEditor field={field} sources={sources} patch={patch} />
    </I18nProvider>,
  );
  expect(screen.getByText("Danh sách nội bộ minh họa.")).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Nguồn dữ liệu" }), {
    key: "ArrowDown",
  });
  fireEvent.click(screen.getByRole("option", { name: "Danh sách nhập tay" }));
  expect(patch).toHaveBeenCalledWith({ dataSource: undefined });
  expect(field.options).toHaveLength(1);
  expect(field.defaultValue).toBe("one");
});
