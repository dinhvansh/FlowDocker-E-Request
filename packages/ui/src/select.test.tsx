import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "./select";

describe("FlowDocker Select", () => {
  it("hiển thị giá trị có nhãn và không dùng native select", () => {
    const { container } = render(
      <div className="fd-app">
        <Select
          label="Kiểu dữ liệu"
          value="number"
          onValueChange={() => {}}
          options={[
            { value: "text", label: "Văn bản" },
            { value: "number", label: "Số" },
          ]}
        />
      </div>,
    );
    expect(
      screen.getByRole("combobox", { name: "Kiểu dữ liệu" }).textContent,
    ).toContain("Số");
    expect(container.querySelector("select")).toBeNull();
  });
});
