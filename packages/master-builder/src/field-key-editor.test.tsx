import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import {
  masterFieldKeyError,
  type MasterField,
} from "@flowdocker/app-contracts";
import { FieldKeyEditor } from "./field-key-editor";
afterEach(cleanup);
const field: MasterField = {
  id: "name",
  key: "currency_name",
  label: "Name",
  type: "text",
  required: false,
  classification: "PUBLIC",
};
const fields = [field, { ...field, id: "code", key: "currency_code" }];
const mount = (onCommit = vi.fn(), locale: "vi" | "en" = "en") => {
  render(
    <I18nProvider initialLocale={locale}>
      <FieldKeyEditor field={field} fields={fields} onCommit={onCommit} />
    </I18nProvider>,
  );
  return screen.getByRole("textbox") as HTMLInputElement;
};
it("rejects invalid identifiers and duplicates while allowing the current stable ID", () => {
  for (const key of ["", "currency name", "Currency", "tên", "1name", "a-b"])
    expect(masterFieldKeyError(key, fields, field.id)).toBeTruthy();
  for (const key of ["currency_name", "a1", "new_key"])
    expect(masterFieldKeyError(key, fields, field.id)).toBeUndefined();
  expect(masterFieldKeyError("currency_code", fields, field.id)).toContain(
    "tồn tại",
  );
});
it("reports format, required and duplicate errors immediately, without saving on blur or Enter", () => {
  const save = vi.fn();
  const input = mount(save);
  for (const key of ["currency name", "", "currency_code"]) {
    fireEvent.change(input, { target: { value: key } });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    fireEvent.blur(input);
    fireEvent.keyDown(input, { key: "Enter" });
  }
  expect(
    screen.getByText("This field key already exists in the catalog."),
  ).toBeTruthy();
  expect(save).not.toHaveBeenCalled();
});
it("commits a corrected key once and Escape restores the saved key", async () => {
  const save = vi.fn();
  const input = mount(save);
  fireEvent.change(input, { target: { value: "currency label" } });
  fireEvent.keyDown(input, { key: "Escape" });
  expect(input.value).toBe(field.key);
  fireEvent.change(input, { target: { value: "currency_label" } });
  expect(input.getAttribute("aria-invalid")).not.toBe("true");
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() => expect(input.disabled).toBe(false));
  fireEvent.blur(input);
  expect(save).toHaveBeenCalledExactlyOnceWith("currency_label");
});
it("keeps failed text editable and supports retry on blur", async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(Error("storage"))
    .mockResolvedValue(undefined);
  const input = mount(save, "vi");
  fireEvent.change(input, { target: { value: "currency_label" } });
  fireEvent.blur(input);
  await screen.findByText(
    "Không lưu được mã trường. Kiểm tra kết nối lưu trữ và thử lại.",
  );
  expect(input.value).toBe("currency_label");
  fireEvent.blur(input);
  await waitFor(() =>
    expect(input.getAttribute("aria-invalid")).not.toBe("true"),
  );
  expect(save).toHaveBeenCalledTimes(2);
});
