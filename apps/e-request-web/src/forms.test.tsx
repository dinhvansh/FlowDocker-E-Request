import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { createRef } from "react";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { FormsPage, type FormsPageHandle } from "./forms";
import { demoForms, formDraftStorageKey } from "./form-drafts";
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
  it("returns to the catalog through navigation without losing unsaved edits", () => {
    const ref = createRef<FormsPageHandle>();
    render(
      <I18nProvider>
        <FormsPage ref={ref} />
      </I18nProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Đề nghị mua sắm · mẫu/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tùy chọn biểu mẫu" }));
    fireEvent.click(screen.getByRole("button", { name: "Đổi tên biểu mẫu" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Tên biểu mẫu · tiếng Việt" }),
      { target: { value: "Bản đang sửa" } },
    );
    act(() => ref.current!.openCatalog());
    expect(screen.queryByRole("tab", { name: "Thiết kế trường" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Tên biểu mẫu · tiếng Việt",
        }) as HTMLInputElement
      ).value,
    ).toBe("Bản đang sửa");
  });
  it("keeps edits through language switching, confirms discard and persists saved schema", () => {
    render(
      <I18nProvider>
        <Host />
      </I18nProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Đề nghị mua sắm · mẫu/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tùy chọn biểu mẫu" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Form catalog" }));
    fireEvent.click(
      screen.getByRole("button", { name: /IT equipment intake/ }),
    );
    expect(screen.getByRole("dialog", { name: "Unsaved draft" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue editing" }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(
      JSON.parse(localStorage.getItem(formDraftStorageKey)!)[0].title.vi,
    ).toBe("Nháp đang sửa");
    expect(
      screen.queryByRole("textbox", { name: "Form name · Vietnamese" }),
    ).toBeNull();
  }, 15000);

  it("retains current edits and reports storage failure without reporting saved", () => {
    render(
      <I18nProvider>
        <FormsPage />
      </I18nProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Đề nghị mua sắm · mẫu/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tùy chọn biểu mẫu" }));
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
  it("starts in the catalog, lists templates with saved forms and preserves saved edits", () => {
    const edited = {
      ...demoForms[0],
      title: { vi: "Mẫu đã chỉnh", en: "Edited sample" },
    };
    const stored = JSON.stringify([edited]);
    localStorage.setItem(formDraftStorageKey, stored);
    const view = render(
      <I18nProvider>
        <FormsPage />
      </I18nProvider>,
    );
    expect(screen.queryByRole("tab", { name: "Thiết kế trường" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Mở mẫu chi phí theo PDF" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Đề nghị mua sắm · mẫu/ }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Đề nghị thanh toán · mẫu chi phí VND/,
      }),
    );
    expect(screen.getByRole("tab", { name: "Thiết kế trường" })).toBeTruthy();
    expect(localStorage.getItem(formDraftStorageKey)).toBe(stored);
    fireEvent.click(screen.getByRole("button", { name: "Danh sách biểu mẫu" }));
    fireEvent.click(screen.getByRole("button", { name: /Mẫu đã chỉnh/ }));
    expect(
      screen.getByRole("heading", { name: "Mẫu đã chỉnh", level: 1 }),
    ).toBeTruthy();
    view.unmount();
    render(
      <I18nProvider>
        <FormsPage />
      </I18nProvider>,
    );
    expect(screen.queryByRole("tab", { name: "Thiết kế trường" })).toBeNull();
    expect(screen.getByRole("button", { name: /Mẫu đã chỉnh/ })).toBeTruthy();
  });
});
