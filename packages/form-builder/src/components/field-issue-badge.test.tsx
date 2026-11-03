import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { FieldIssueBadge } from "./field-issue-badge";
import { createField } from "../schema";
afterEach(cleanup);
it("is absent for a valid field and navigates without bubbling or changing data", () => {
  const field = {
    ...createField("text", []),
    label: { vi: "Trường thử", en: "Test field" },
  };
  const navigate = vi.fn(),
    parent = vi.fn(),
    before = JSON.stringify(field);
  const result = render(
    <I18nProvider>
      <div onClick={parent}>
        <FieldIssueBadge field={field} count={1} onNavigate={navigate} />
      </div>
    </I18nProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Mở 1 lỗi cấu hình của Trường thử" }),
  );
  expect(navigate).toHaveBeenCalledOnce();
  expect(parent).not.toHaveBeenCalled();
  expect(JSON.stringify(field)).toBe(before);
  result.rerender(
    <I18nProvider locale="en">
      <FieldIssueBadge field={field} count={2} />
    </I18nProvider>,
  );
  expect(screen.getByText("2 errors")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
  result.rerender(
    <I18nProvider>
      <FieldIssueBadge field={field} count={0} />
    </I18nProvider>,
  );
  expect(result.container.textContent).toBe("");
});
