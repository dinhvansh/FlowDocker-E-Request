import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { FormDesigner } from "./designer";
import { FormPreview } from "./runtime";
import { createPaymentDefinition } from "./payment-example";
import type { FormDefinition } from "./schema";
beforeEach(() =>
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  ),
);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function Host() {
  const [definition, setDefinition] = useState<FormDefinition>(
    createPaymentDefinition(),
  );
  return (
    <I18nProvider>
      <FormDesigner definition={definition} onChange={setDefinition} />
      <output data-testid="schema">{JSON.stringify(definition)}</output>
    </I18nProvider>
  );
}
describe("live authoring canvas", () => {
  it("adds content blocks from the toolbox with undo and no separate band controls", () => {
    function BlockHost() {
      const [definition, setDefinition] = useState<FormDefinition>({
        id: "blocks",
        title: { vi: "Mẫu thử", en: "Sample" },
        version: 1,
        status: "DRAFT",
        fields: [],
      });
      return (
        <I18nProvider>
          <FormDesigner definition={definition} onChange={setDefinition} />
          <output data-testid="block-schema">
            {JSON.stringify(definition)}
          </output>
        </I18nProvider>
      );
    }
    render(<BlockHost />);
    fireEvent.click(
      screen.getByRole("button", { name: "Sửa tiêu đề biểu mẫu" }),
    );
    const titleInput = screen.getByRole("textbox", {
      name: "Tên biểu mẫu trên canvas",
    });
    fireEvent.change(titleInput, { target: { value: "Tên mới" } });
    fireEvent.keyDown(titleInput, { key: "Enter" });
    expect(
      JSON.parse(screen.getByTestId("block-schema").textContent!).title,
    ).toEqual({ vi: "Tên mới", en: "Sample" });
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(
      JSON.parse(screen.getByTestId("block-schema").textContent!).title.vi,
    ).toBe("Mẫu thử");
    fireEvent.click(screen.getByRole("button", { name: "Làm lại" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Sửa tiêu đề biểu mẫu" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Tên biểu mẫu trên canvas" }),
      { target: { value: "Hủy tên này" } },
    );
    fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Tên biểu mẫu trên canvas" }),
      { key: "Escape" },
    );
    expect(
      JSON.parse(screen.getByTestId("block-schema").textContent!).title.vi,
    ).toBe("Tên mới");
    expect(
      screen.queryByRole("button", { name: "Đầu trang / Chân trang" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thêm Hình ảnh" }));
    const snapshot = () =>
      JSON.parse(screen.getByTestId("block-schema").textContent!);
    expect(snapshot().fields[0].type).toBe("image");
    expect(screen.getByLabelText("Tải ảnh / Logo")).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Bắt buộc" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(snapshot().fields).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Làm lại" }));
    expect(snapshot().fields[0].type).toBe("image");
    fireEvent.click(
      screen.getByRole("button", { name: "Thêm Nhãn / Văn bản" }),
    );
    expect(snapshot().fields[1].type).toBe("content");
    expect(screen.getByRole("combobox", { name: "Căn nội dung" })).toBeTruthy();
  }, 60000);
  it("opens configured field groups directly from indicators without mutating the schema", () => {
    render(<Host />);
    const original = screen.getByTestId("schema").textContent;
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mở cấu hình Điều kiện cho Lý do tạm ứng",
      }),
    );
    expect(
      screen.getByRole("combobox", { name: "Nhóm thuộc tính" }).textContent,
    ).toContain("Điều kiện và tính toán");
    expect(
      screen.getAllByRole("combobox", { name: "Giá trị so sánh" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("schema").textContent).toBe(original);
  });
  it("reveals conditional controls and nested row fields without changing runtime visibility", () => {
    const { unmount } = render(<Host />);
    expect(screen.getByRole("textbox", { name: "Lý do tạm ứng" })).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Nội dung (bắt buộc)" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Chọn trường Chi phí" }),
    );
    expect(screen.getByRole("textbox", { name: "Mã trường" })).toHaveProperty(
      "value",
      "amount",
    );
    unmount();
    render(
      <I18nProvider>
        <FormPreview
          definition={createPaymentDefinition()}
          values={{ payment_type: "invoice" }}
          onChange={() => {}}
        />
      </I18nProvider>,
    );
    expect(screen.queryByRole("textbox", { name: "Lý do tạm ứng" })).toBeNull();
  });
  it("inserts at a selected sibling position, edits labels and preserves schema through undo", () => {
    render(<Host />);
    fireEvent.click(
      screen.getByRole("button", { name: "Chọn trường Nhà cung cấp" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Chèn trường bên dưới" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Thêm Email" }));
    const schema = () => JSON.parse(screen.getByTestId("schema").textContent!);
    expect(
      schema().fields[0].children.map((field: { type: string }) => field.type),
    ).toEqual(["text", "select", "select", "text", "email", "date", "date"]);
    fireEvent.change(screen.getByRole("textbox", { name: "Nhãn tiếng Việt" }), {
      target: { value: "Email người nhận" },
    });
    expect(
      screen.getByRole("textbox", { name: "Email người nhận" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(schema().fields[0].children).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Làm lại" }));
    expect(schema().fields[0].children).toHaveLength(7);
  }, 60000);

  it("rejects destructive conversion of a populated layout and keeps its children", () => {
    render(<Host />);
    fireEvent.click(
      screen.getByRole("button", { name: "Chọn trường Thông tin thanh toán" }),
    );
    fireEvent.click(screen.getByRole("combobox", { name: "Kiểu dữ liệu" }));
    fireEvent.click(screen.getByRole("option", { name: "Văn bản ngắn" }));
    expect(
      screen.getByText(
        "Di chuyển hoặc xóa các trường con trước khi đổi sang kiểu đơn.",
      ),
    ).toBeTruthy();
    expect(
      JSON.parse(screen.getByTestId("schema").textContent!).fields[0].children,
    ).toHaveLength(6);
  });
  it("moves and clones nested fields from the inline toolbar", () => {
    const { container } = render(<Host />);
    fireEvent.click(
      screen.getByRole("button", { name: "Chọn trường Nhà cung cấp" }),
    );
    const overlay = container.querySelector(
      '[data-canvas-field="payment-vendor"]',
    )! as HTMLElement;
    fireEvent.click(within(overlay).getByRole("button", { name: "Lên trên" }));
    let fields = JSON.parse(screen.getByTestId("schema").textContent!).fields[0]
      .children;
    expect(fields[2].key).toBe("vendor");
    fireEvent.click(
      within(overlay).getByRole("button", { name: "Nhân bản trường" }),
    );
    fields = JSON.parse(screen.getByTestId("schema").textContent!).fields[0]
      .children;
    expect(fields).toHaveLength(7);
    expect(fields[6].key).not.toBe("vendor");
  });
  it("commits a focused inline label as one undo step and cancels with Escape", () => {
    render(<Host />);
    fireEvent.click(
      screen.getByRole("button", { name: "Chọn trường Nhà cung cấp" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Sửa nhãn trên canvas" }),
    );
    const input = screen.getByRole("textbox", { name: "Nhãn trên canvas" });
    fireEvent.change(input, { target: { value: "Đơn vị cung cấp" } });
    expect(document.activeElement).toBe(input);
    expect(
      JSON.parse(screen.getByTestId("schema").textContent!).fields[0]
        .children[3].label.vi,
    ).toBe("Nhà cung cấp");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      screen.getByRole("textbox", { name: "Đơn vị cung cấp (bắt buộc)" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(
      screen.getByRole("textbox", { name: "Nhà cung cấp (bắt buộc)" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Sửa nhãn trên canvas" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Nhãn trên canvas" }),
      { target: { value: "Không lưu nhãn này" } },
    );
    fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Nhãn trên canvas" }),
      { key: "Escape" },
    );
    expect(
      JSON.parse(screen.getByTestId("schema").textContent!).fields[0]
        .children[3].label.vi,
    ).toBe("Nhà cung cấp");
  }, 60000);
});
