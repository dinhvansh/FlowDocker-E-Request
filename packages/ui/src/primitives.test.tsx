import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable, Modal, Tabs } from "./primitives";

describe("UI primitives", () => {
  it("bảng cho phép chọn dòng bằng bàn phím", () => {
    const select = vi.fn();
    render(
      <DataTable
        rows={[{ id: "1", name: "Catalog" }]}
        rowKey={(r) => r.id}
        onRowClick={select}
        columns={[{ key: "name", heading: "Tên", render: (r) => r.name }]}
      />,
    );
    fireEvent.keyDown(screen.getByText("Catalog").closest("tr")!, {
      key: "Enter",
    });
    expect(select).toHaveBeenCalledOnce();
  });
  it("tab thể hiện lựa chọn", () => {
    render(
      <Tabs
        tabs={[
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ]}
        active="a"
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("tab", { name: "A" }).getAttribute("aria-selected"),
    ).toBe("true");
  });
  it("dialog đóng bằng Escape", () => {
    const close = vi.fn();
    render(
      <Modal title="Tạo entity" onClose={close}>
        Form
      </Modal>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });
});
