import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { createField, type FormDefinition } from "@flowdocker/form-builder";
import { FormHistory } from "./form-history";
import {
  captureFormVersion,
  formVersionsKey,
  readFormVersions,
} from "./form-versions";
afterEach(() => {
  cleanup();
  localStorage.removeItem(formVersionsKey);
});
it("compares and restores only after confirmation, without saving the draft", () => {
  const original: FormDefinition = {
    id: "qa",
    title: { vi: "Test", en: "Test" },
    version: 1,
    status: "DRAFT",
    fields: [{ ...createField("text", []), id: "name", key: "name" }],
  };
  captureFormVersion(localStorage, original, "Baseline");
  const restore = vi.fn();
  render(
    <I18nProvider locale="en">
      <FormHistory
        definition={{
          ...original,
          fields: [{ ...original.fields[0], required: true }],
        }}
        onRestore={restore}
        onClose={vi.fn()}
      />
    </I18nProvider>,
  );
  expect(screen.getByText("Changed field")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Restore into current draft" }),
  );
  expect(restore).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm restore" }));
  expect(restore).toHaveBeenCalledWith(original);
  expect(readFormVersions(localStorage)).toHaveLength(1);
});
it("does not overwrite unreadable history", () => {
  localStorage.setItem(formVersionsKey, "broken");
  render(
    <I18nProvider locale="en">
      <FormHistory
        definition={{
          id: "qa",
          title: { vi: "Test", en: "Test" },
          version: 1,
          status: "DRAFT",
          fields: [createField("text", [])],
        }}
        onRestore={vi.fn()}
        onClose={vi.fn()}
      />
    </I18nProvider>,
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Save current snapshot",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(localStorage.getItem(formVersionsKey)).toBe("broken");
});
