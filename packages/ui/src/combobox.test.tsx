import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { Combobox } from "./combobox";

describe("FlowDocker Combobox", () => {
  it("filters long choice lists and selects the visible option", () => {
    let value = "";
    const { rerender } = render(
      <I18nProvider>
        <Combobox
          label="Nhóm hàng"
          value={value}
          options={[
            { value: "office", label: "Văn phòng phẩm" },
            { value: "device", label: "Thiết bị" },
          ]}
          onValueChange={(next) => {
            value = next;
          }}
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("combobox", { name: "Nhóm hàng" }));
    fireEvent.change(screen.getByPlaceholderText("Tìm lựa chọn..."), {
      target: { value: "thiết" },
    });
    expect(screen.getByRole("option", { name: "Thiết bị" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Văn phòng phẩm" })).toBeNull();
    fireEvent.click(screen.getByRole("option", { name: "Thiết bị" }));
    rerender(
      <I18nProvider>
        <Combobox
          label="Nhóm hàng"
          value={value}
          options={[{ value: "device", label: "Thiết bị" }]}
          onValueChange={(next) => {
            value = next;
          }}
        />
      </I18nProvider>,
    );
    expect(
      screen.getByRole("combobox", { name: "Nhóm hàng" }).textContent,
    ).toContain("Thiết bị");
  });
});
