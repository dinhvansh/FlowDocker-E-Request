import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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

it("edits spacing directly in preview, undoes a gesture and persists metadata", () => {
  render(
    <I18nProvider>
      <FormsPage />
    </I18nProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: /Đề nghị mua sắm · mẫu/ }),
  );
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Xem thử biểu mẫu" }), {
    button: 0,
    ctrlKey: false,
  });
  fireEvent.click(screen.getByRole("button", { name: "Khoảng cách" }));
  const slider = screen.getByRole("slider", { name: "Giữa các hàng" });
  fireEvent.pointerDown(slider);
  fireEvent.change(slider, { target: { value: "8" } });
  fireEvent.change(slider, { target: { value: "10" } });
  fireEvent.pointerUp(slider);
  const preview = document.querySelector<HTMLElement>(".fd-form-preview")!;
  expect(preview.style.getPropertyValue("--fd-form-row-gap")).toBe("10px");
  fireEvent.click(screen.getByRole("button", { name: "Hoàn tác khoảng cách" }));
  expect(preview.hasAttribute("data-form-spacing")).toBe(false);
  fireEvent.change(slider, { target: { value: "9" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));
  expect(
    JSON.parse(localStorage.getItem(formDraftStorageKey)!)[0].spacing.rowGap,
  ).toBe(9);
});

it("syncs code edits to canvas and retains the last valid form on invalid JSON", async () => {
  render(
    <I18nProvider>
      <FormsPage />
    </I18nProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: /Đề nghị mua sắm · mẫu/ }),
  );
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Code Studio" }), {
    button: 0,
    ctrlKey: false,
  });
  // Code Studio is a lazy chunk; allow its actual cold import to finish on CI.
  const editor = await screen.findByRole(
    "textbox",
    {
      name: "Schema biểu mẫu · Code Studio",
    },
    { timeout: 10000 },
  );
  const view = EditorView.findFromDOM(editor.closest(".cm-editor")!)!;
  const edit = (value: string) =>
    act(() =>
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      }),
    );
  const schema = JSON.parse(view.state.doc.toString());
  schema.title.vi = "Code sync test";
  edit(JSON.stringify(schema));
  expect(
    screen.getByRole("heading", { name: "Code sync test", level: 1 }),
  ).toBeTruthy();
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Thiết kế trường" }), {
    button: 0,
    ctrlKey: false,
  });
  fireEvent.click(screen.getByRole("button", { name: "Tùy chọn biểu mẫu" }));
  fireEvent.click(screen.getByRole("button", { name: "Đổi tên biểu mẫu" }));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Tên biểu mẫu · tiếng Anh" }),
    { target: { value: "Visual rename" } },
  );
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Code Studio" }), {
    button: 0,
    ctrlKey: false,
  });
  expect(JSON.parse(view.state.doc.toString()).title.en).toBe("Visual rename");
  edit("{");
  expect(
    screen.getByRole("heading", { name: "Code sync test", level: 1 }),
  ).toBeTruthy();
  expect(view.state.doc.toString()).toBe("{");
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Thiết kế trường" }), {
    button: 0,
    ctrlKey: false,
  });
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Code Studio" }), {
    button: 0,
    ctrlKey: false,
  });
  await waitFor(() => expect(view.state.doc.toString()).toBe("{"));
});
