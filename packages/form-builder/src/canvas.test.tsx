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
  });
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
});
