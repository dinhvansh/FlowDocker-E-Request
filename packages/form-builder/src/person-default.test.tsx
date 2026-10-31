import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { PersonDefaultEditor } from "./components/person-default-editor";
import { createField, type FormField } from "./schema";
import type { ChoiceOption, DataProvider } from "./runtime";

afterEach(cleanup);
const options: ChoiceOption[] = [
  {
    value: "person-a",
    label: { vi: "An mẫu", en: "Sample An" },
    description: { vi: "an@example.test", en: "an@example.test" },
  },
  { value: "person-b", label: { vi: "Bình mẫu", en: "Sample Binh" } },
];
function Host({ multiple = false }: { multiple?: boolean }) {
  const [field, setField] = useState<FormField>({
    ...createField("person", []),
    dataSource: undefined,
    options,
    multiple,
  });
  return (
    <I18nProvider initialLocale="en">
      <PersonDefaultEditor
        field={field}
        patch={(change) => setField((current) => ({ ...current, ...change }))}
      />
      <output aria-label="saved default">
        {JSON.stringify(field.defaultValue ?? null)}
      </output>
    </I18nProvider>
  );
}

it("selects a named person and stores only the stable ID; clear removes the default", () => {
  render(<Host />);
  fireEvent.click(screen.getByRole("combobox", { name: "Default person" }));
  fireEvent.click(screen.getByRole("option", { name: /^Sample An/ }));
  expect(screen.getByLabelText("saved default").textContent).toBe('"person-a"');
  expect(
    screen.getByRole("combobox", { name: "Default person" }).textContent,
  ).toContain("Sample An");
  fireEvent.click(screen.getByRole("combobox", { name: "Default person" }));
  fireEvent.click(screen.getByRole("option", { name: "Clear selection" }));
  expect(screen.getByLabelText("saved default").textContent).toBe("null");
});

it("supports choosing several default people", () => {
  render(<Host multiple />);
  fireEvent.click(screen.getByRole("combobox", { name: "Default person" }));
  fireEvent.click(screen.getByRole("option", { name: /^Sample An/ }));
  fireEvent.click(screen.getByRole("option", { name: "Sample Binh" }));
  expect(screen.getByLabelText("saved default").textContent).toBe(
    '["person-a","person-b"]',
  );
});

it("shows errors and retries the injected provider, passing dependency and AbortSignal", async () => {
  const provider = vi
    .fn<DataProvider>()
    .mockRejectedValueOnce(Error("offline"))
    .mockResolvedValue(options);
  const patch = vi.fn();
  render(
    <I18nProvider initialLocale="en">
      <PersonDefaultEditor
        field={createField("person", [])}
        providers={{ "organization.people": provider }}
        dependency="company-a"
        patch={patch}
      />
    </I18nProvider>,
  );
  await screen.findByText("Choices could not be loaded. Please search again.");
  fireEvent.click(screen.getByRole("button", { name: "Reload list" }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("combobox", {
          name: "Default person",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  expect(provider).toHaveBeenLastCalledWith({
    query: "",
    dependency: "company-a",
    signal: expect.any(AbortSignal),
  });
  expect(patch).not.toHaveBeenCalled();
});

it("preserves unavailable saved IDs until the user clears them", () => {
  const patch = vi.fn();
  render(
    <I18nProvider initialLocale="en">
      <PersonDefaultEditor
        field={{ ...createField("person", []), defaultValue: "old-id" }}
        patch={patch}
      />
    </I18nProvider>,
  );
  expect(
    screen.getByText("The choice provider has not been configured."),
  ).toBeTruthy();
  expect(patch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Clear default" }));
  expect(patch).toHaveBeenCalledWith({ defaultValue: undefined });
});

it("does not replace current source options with a stale provider response", async () => {
  let finish: ((options: ChoiceOption[]) => void) | undefined;
  const oldProvider = vi.fn<DataProvider>(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const newProvider = vi.fn<DataProvider>().mockResolvedValue(options);
  const field = createField("person", []);
  const view = render(
    <I18nProvider initialLocale="en">
      <PersonDefaultEditor
        field={field}
        providers={{ "organization.people": oldProvider }}
        patch={() => {}}
      />
    </I18nProvider>,
  );
  await waitFor(() => expect(oldProvider).toHaveBeenCalled());
  view.rerender(
    <I18nProvider initialLocale="en">
      <PersonDefaultEditor
        field={{ ...field, dataSource: { provider: "new" } }}
        providers={{ new: newProvider }}
        patch={() => {}}
      />
    </I18nProvider>,
  );
  finish?.([{ value: "stale", label: { vi: "Cũ", en: "Stale person" } }]);
  await waitFor(() =>
    expect(
      (
        screen.getByRole("combobox", {
          name: "Default person",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("combobox", { name: "Default person" }));
  expect(screen.getByRole("option", { name: "Sample Binh" })).toBeTruthy();
  expect(screen.queryByRole("option", { name: "Stale person" })).toBeNull();
});
