import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import type { MasterEntity } from "@flowdocker/app-contracts";
import { MasterBuilder } from "./index";
afterEach(cleanup);
const entity: MasterEntity = {
  id: "sample",
  key: "sample",
  name: "Synthetic catalog",
  kind: "LOCAL_CATALOG",
  status: "DRAFT",
  version: 1,
  scope: "TENANT",
  sourceOwner: "Demo",
  businessOwner: "Demo",
  fields: [],
  records: [],
};
const mount = (onDelete?: (id: string) => Promise<void>, blockers?: string[]) =>
  render(
    <I18nProvider initialLocale="en">
      <MasterBuilder
        entities={[entity]}
        onSave={async () => {}}
        onDelete={onDelete}
        getDeleteBlockers={() => blockers ?? []}
      />
    </I18nProvider>,
  );
it("retains existing host behavior without a deletion adapter", () => {
  mount();
  expect(screen.queryByRole("button", { name: "Delete entity" })).toBeNull();
});
it("cancels without deleting and confirms the selected stable ID once", async () => {
  let resolve!: () => void;
  const remove = vi.fn(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  mount(remove);
  fireEvent.click(screen.getByRole("button", { name: "Delete entity" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Delete entity" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm entity deletion" }),
  );
  expect(
    (screen.getByRole("button", { name: "Deleting..." }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(remove).toHaveBeenCalledExactlyOnceWith("sample");
  resolve();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
it("shows blockers, and retains the dialog after a failed deletion", async () => {
  const remove = vi.fn().mockRejectedValue(Error("storage"));
  mount(remove, ["Dependency example"]);
  fireEvent.click(screen.getByRole("button", { name: "Delete entity" }));
  expect(screen.getByText("Dependency example")).toBeTruthy();
  expect(
    (
      screen.getByRole("button", {
        name: "Confirm entity deletion",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  cleanup();
  mount(remove);
  fireEvent.click(screen.getByRole("button", { name: "Delete entity" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm entity deletion" }),
  );
  await screen.findByText(/Could not delete the entity/);
  expect(screen.getByRole("dialog")).toBeTruthy();
});
