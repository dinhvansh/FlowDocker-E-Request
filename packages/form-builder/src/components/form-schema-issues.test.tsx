import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { FormSchemaIssues } from "./form-schema-issues";
import { createField, type FormIssue } from "../schema";
afterEach(cleanup);
it("labels nested issues, routes callbacks without mutation and clears live", () => {
  const child = {
    ...createField("text", []),
    id: "child",
    key: "invalid key",
    label: { vi: "Nhãn con", en: "Child label" },
  };
  const fields = [{ ...createField("columns", []), children: [child] }];
  const issue: FormIssue = {
    fieldId: child.id,
    message: "Mã trường {{key}} không hợp lệ hoặc được dành riêng.",
    params: { key: child.key },
  };
  const edit = vi.fn();
  const before = JSON.stringify(fields);
  const result = render(
    <I18nProvider>
      <FormSchemaIssues issues={[issue]} fields={fields} onEditIssue={edit} />
    </I18nProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: /Nhãn con · invalid key/ }),
  );
  expect(edit).toHaveBeenCalledWith(issue);
  expect(JSON.stringify(fields)).toBe(before);
  result.rerender(
    <I18nProvider locale="en">
      <FormSchemaIssues issues={[issue]} fields={fields} />
    </I18nProvider>,
  );
  expect(screen.getByText("Child label · invalid key")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
  result.rerender(
    <I18nProvider locale="en">
      <FormSchemaIssues issues={[]} fields={fields} />
    </I18nProvider>,
  );
  expect(screen.getByRole("status").textContent).toContain(
    "Configuration is valid",
  );
});
it("keeps form-level and unresolved-field diagnostics visible", () => {
  render(
    <I18nProvider>
      <FormSchemaIssues
        fields={[]}
        issues={[
          { message: "Cần tên biểu mẫu bằng cả tiếng Việt và tiếng Anh." },
          { fieldId: "missing", message: "Biểu mẫu cần từ 1 đến 300 trường." },
        ]}
      />
    </I18nProvider>,
  );
  expect(
    screen.getByText("Cần tên biểu mẫu bằng cả tiếng Việt và tiếng Anh."),
  ).toBeTruthy();
  expect(screen.getAllByText("Biểu mẫu")).toHaveLength(2);
});
