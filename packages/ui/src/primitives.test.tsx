import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable, Field, Modal, Tabs } from "./primitives";
import { Input } from "./components/ui/input";

describe("UI primitives", () => {
  it("connects hint and validation error to the labelled control", () => {
    render(
      <Field label="Sample field" hint="Allowed format" error="Fix value">
        <Input />
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Sample field" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const descriptions = input
      .getAttribute("aria-describedby")!
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(descriptions).toEqual(["Allowed format", "Fix value"]);
  });
  it("liên kết nhãn shadcn Field với input", () => {
    render(
      <Field label="Tên entity">
        <Input />
      </Field>,
    );
    expect(screen.getByRole("textbox", { name: "Tên entity" })).toBeTruthy();
  });
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
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });
});
