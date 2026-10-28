import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { FormsPage } from "./forms";
import { formDraftStorageKey } from "./form-drafts";
function Host() {
  const { setLocale } = useI18n();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <FormsPage />
    </>
  );
}
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("Form Studio host journeys", () => {
  it("keeps edits through language switching, confirms discard and persists saved schema", () => {
    render(
      <I18nProvider>
        <Host />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Đổi tên biểu mẫu" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Tên biểu mẫu · tiếng Việt" }),
      { target: { value: "Nháp đang sửa" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Form name · Vietnamese",
        }) as HTMLInputElement
      ).value,
    ).toBe("Nháp đang sửa");
    fireEvent.click(
      screen.getByRole("button", { name: /IT equipment intake/ }),
    );
    expect(screen.getByRole("dialog", { name: "Unsaved draft" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue editing" }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(
      JSON.parse(localStorage.getItem(formDraftStorageKey)!)[0].title.vi,
    ).toBe("Nháp đang sửa");
  }, 15000);

  it("retains current edits and reports storage failure without reporting saved", () => {
    render(
      <I18nProvider>
        <FormsPage />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Đổi tên biểu mẫu" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Tên biểu mẫu · tiếng Việt" }),
      { target: { value: "Còn ở đây" } },
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));
    expect(
      screen.getByText(
        "Không lưu được biểu mẫu. Bản đang sửa vẫn còn; hãy thử lưu lại.",
      ),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("textbox", {
          name: "Tên biểu mẫu · tiếng Việt",
        }) as HTMLInputElement
      ).value,
    ).toBe("Còn ở đây");
    expect(localStorage.getItem(formDraftStorageKey)).toBeNull();
  });
});
