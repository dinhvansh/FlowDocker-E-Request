import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { FormPreview } from "./runtime";
import { FormTestPreview, parseTestValues } from "./test-preview";
import { createField, type FormDefinition, type PreviewValues } from "./schema";
const definition: FormDefinition = {
  id: "test",
  title: { vi: "Test", en: "Test" },
  version: 1,
  status: "DRAFT",
  fields: [
    {
      ...createField("number", []),
      id: "amount",
      key: "amount",
      required: true,
    },
    {
      ...createField("number", []),
      id: "total",
      key: "total",
      calculation: {
        operator: "multiply",
        fields: ["amount"],
        expression: "amount * 2",
      },
    },
  ],
};
afterEach(cleanup);
it("tests valid inputs using actual engine and retains last valid values on malformed input", () => {
  function Host() {
    const [values, setValues] = useState<PreviewValues>({ amount: 3 });
    return (
      <I18nProvider>
        <FormTestPreview
          definition={definition}
          values={values}
          onChange={setValues}
        />
      </I18nProvider>
    );
  }
  render(<Host />);
  fireEvent.click(screen.getByText("Dữ liệu thử và kết quả tính toán"));
  const output = screen.getByRole("textbox", {
    name: "Kết quả sau mặc định và tính toán",
  }) as HTMLTextAreaElement;
  expect(JSON.parse(output.value).total).toBe("6.00");
  const input = screen.getByRole("textbox", { name: "Dữ liệu đầu vào JSON" });
  fireEvent.change(input, { target: { value: '{"amount":7}' } });
  expect(JSON.parse(output.value).total).toBe("14.00");
  fireEvent.change(input, { target: { value: "{" } });
  expect(JSON.parse(output.value).total).toBe("14.00");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại JSON" }));
  expect(input.getAttribute("aria-invalid")).not.toBe("true");
});
it("rejects arrays, prototype keys and oversized test values", () => {
  expect(parseTestValues("[]")).toBeUndefined();
  expect(parseTestValues('{"__proto__":{"x":1}}')).toBeUndefined();
  expect(parseTestValues(" ".repeat(1000001))).toBeUndefined();
});

it("shows actionable schema errors and recovers preview after a definition is repaired", () => {
  const edit = vi.fn();
  const invalid = {
    ...definition,
    fields: [{ ...definition.fields[0], key: "bad key" }],
  };
  const result = render(
    <I18nProvider>
      <FormPreview
        definition={invalid}
        values={{}}
        onChange={() => {}}
        onEditSchemaIssue={edit}
      />
    </I18nProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: /Mã trường bad key không hợp lệ hoặc được dành riêng\./,
    }),
  );
  expect(edit).toHaveBeenCalledWith(
    expect.objectContaining({ fieldId: "amount" }),
  );
  result.rerender(
    <I18nProvider>
      <FormPreview definition={definition} values={{}} onChange={() => {}} />
    </I18nProvider>,
  );
  expect(
    screen.queryByText("Sửa lỗi cấu trúc trước khi xem thử biểu mẫu."),
  ).toBeNull();
});
