import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import type { MasterEntity } from "@flowdocker/app-contracts";
import { MasterBuilder } from "./index";
import { MasterRecords } from "./master-records";
export const entity: MasterEntity = {
  id: "qa_catalog",
  key: "qa_catalog",
  name: "Synthetic catalog",
  kind: "LOCAL_CATALOG",
  status: "PUBLISHED",
  version: 3,
  scope: "TENANT",
  sourceOwner: "Demo",
  businessOwner: "Demo",
  fields: [
    {
      id: "code",
      key: "code",
      label: "Code",
      type: "text",
      required: true,
      classification: "PUBLIC",
    },
    {
      id: "name",
      key: "name",
      label: "Name",
      type: "text",
      required: true,
      classification: "PUBLIC",
    },
    {
      id: "amount",
      key: "amount",
      label: "Amount",
      type: "number",
      required: false,
      classification: "PUBLIC",
    },
  ],
  records: [
    { code: "A", name: "Alpha", amount: 1, legacy: "kept" },
    { code: "B", name: "Beta", amount: 2 },
  ],
};
afterEach(cleanup);
function Host({
  save = async () => {},
}: {
  save?: (e: MasterEntity, r: MasterEntity["records"]) => Promise<void>;
}) {
  const [value, setValue] = useState(entity);
  return (
    <I18nProvider initialLocale="en">
      <MasterRecords
        entity={value}
        entities={[value]}
        onSave={async (e, r) => {
          await save(e, r);
          setValue({ ...value, records: r });
        }}
      />
    </I18nProvider>
  );
}
it("edits all schema fields, validates immediately, keeps decimal typing and preserves legacy properties", async () => {
  const save = vi.fn();
  render(<Host save={save} />);
  fireEvent.click(screen.getByRole("button", { name: "Edit record A" }));
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.change(dialog.getByRole("textbox", { name: "Name (required)" }), {
    target: { value: "" },
  });
  expect(dialog.getByText("This field is required.")).toBeTruthy();
  fireEvent.click(dialog.getByRole("button", { name: "Save record" }));
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(dialog.getByRole("textbox", { name: "Name (required)" }), {
    target: { value: "Updated" },
  });
  const amount = dialog.getByRole("textbox", {
    name: "Amount",
  }) as HTMLInputElement;
  fireEvent.change(amount, { target: { value: "1." } });
  expect(amount.value).toBe("1.");
  fireEvent.change(amount, { target: { value: "1.25" } });
  fireEvent.click(dialog.getByRole("button", { name: "Save record" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(save).toHaveBeenCalledWith(entity, [
    { code: "A", name: "Updated", amount: 1.25, legacy: "kept" },
    entity.records[1],
  ]);
  expect(screen.getByText("Updated")).toBeTruthy();
});
it("cancels edits, creates a record and requires confirmation to delete", async () => {
  const save = vi.fn();
  render(<Host save={save} />);
  fireEvent.click(screen.getByRole("button", { name: "Edit record A" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Add record" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Code (required)" }), {
    target: { value: "A" },
  });
  expect(screen.getByText("This record key already exists.")).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox", { name: "Code (required)" }), {
    target: { value: "C" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Name (required)" }), {
    target: { value: "Gamma" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save record" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Delete record C" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("Gamma")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Delete record C" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm record deletion" }),
  );
  await waitFor(() => expect(screen.queryByText("Gamma")).toBeNull());
  expect(save).toHaveBeenCalledTimes(2);
});
it("retains failed input for retry and disables repeat writes while pending", async () => {
  let resolve!: () => void;
  const save = vi
    .fn()
    .mockRejectedValueOnce(Error("storage"))
    .mockImplementationOnce(
      () => new Promise<void>((done) => (resolve = done)),
    );
  render(<Host save={save} />);
  fireEvent.click(screen.getByRole("button", { name: "Edit record A" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Name (required)" }), {
    target: { value: "Retry" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save record" }));
  await screen.findByRole("alert");
  expect(
    (
      screen.getByRole("textbox", {
        name: "Name (required)",
      }) as HTMLInputElement
    ).value,
  ).toBe("Retry");
  fireEvent.click(screen.getByRole("button", { name: "Save record" }));
  expect(
    (screen.getByRole("button", { name: "Saving..." }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  resolve();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(save).toHaveBeenCalledTimes(2);
});
it("keeps external sources and hosts without adapter read-only", () => {
  const { unmount } = render(
    <I18nProvider initialLocale="en">
      <MasterRecords
        entity={{ ...entity, kind: "EXTERNAL_MIRROR" }}
        entities={[]}
        onSave={vi.fn()}
      />
    </I18nProvider>,
  );
  expect(screen.queryByRole("button", { name: "Add record" })).toBeNull();
  expect(
    screen.getByText("Source-managed data is read-only here."),
  ).toBeTruthy();
  unmount();
  render(
    <I18nProvider initialLocale="en">
      <MasterBuilder entities={[entity]} onSave={vi.fn()} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Records (2)" }));
  expect(screen.queryByRole("button", { name: "Edit record A" })).toBeNull();
});
