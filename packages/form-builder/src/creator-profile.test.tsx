import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { useState } from "react";
import {
  createField,
  isFormDefinition,
  exportFormDefinition,
  importFormDefinition,
  type FormDefinition,
  type FormField,
} from "./schema";
import {
  defaultValues,
  prepareValues,
  submissionValues,
  validatePreview,
} from "./engine";
import { FormRenderer } from "./runtime";
import { CreatorDefaultEditor } from "./components/creator-default-editor";

afterEach(cleanup);
const context = {
  currentUserId: "demo-person",
  currentUser: {
    name: "Synthetic creator",
    email: "creator@example.com",
    employeeCode: "DEMO-TEST",
    department: "Demo IT",
    position: "Demo analyst",
    managerId: "demo-manager",
    managerName: "Synthetic manager",
  },
};
const fields: FormField[] = Object.keys(context.currentUser).map(
  (key, index) => ({
    ...createField(
      key === "managerId" ? "person" : key === "email" ? "email" : "text",
      [],
    ),
    id: `profile_${index}`,
    key: key.toLowerCase(),
    label: { vi: key, en: key },
    defaultValueSource: `currentUser.${key}` as FormField["defaultValueSource"],
  }),
);
const form = (list = fields): FormDefinition => ({
  id: "creator-profile",
  title: { vi: "Mẫu", en: "Sample" },
  version: 1,
  status: "DRAFT",
  fields: list,
});

it("resolves all allowlisted attributes, nested/repeated defaults and stable manager IDs", () => {
  const expected = Object.fromEntries(
    Object.entries(context.currentUser).map(([k, v]) => [k.toLowerCase(), v]),
  );
  expect(defaultValues(fields, undefined, context)).toEqual(expected);
  const definition = form([
    { ...createField("container", []), key: "details", children: fields },
    {
      ...createField("repeat", []),
      key: "rows",
      minRows: 1,
      children: [{ ...fields[5], id: "repeat_manager", multiple: true }],
    },
  ]);
  const values = { details: expected, rows: [{ managerid: ["demo-manager"] }] };
  expect(prepareValues(definition, {}, {}, context)).toEqual(values);
  expect(submissionValues(definition, {}, {}, context)).toEqual(values);
  expect(importFormDefinition(exportFormDefinition(definition))).toEqual({
    ...definition,
    schemaVersion: 2,
  });
});

it("preserves saved and cleared values, omits missing manager, and applies access and validation", () => {
  const definition = form([
    { ...fields[0], required: true },
    { ...fields[5], required: true },
  ]);
  for (const name of ["Stored name", "", null])
    expect(prepareValues(definition, { name }, {}, context).name).toBe(name);
  const missing = {
    currentUserId: context.currentUserId,
    currentUser: { name: context.currentUser.name },
  };
  expect(prepareValues(definition, {}, {}, missing)).toEqual({
    name: "Synthetic creator",
  });
  expect(
    validatePreview(definition, {}, {}, {}, missing).some(
      (i) => i.fieldId === fields[5].id,
    ),
  ).toBe(true);
  expect(
    prepareValues(
      form([fields[0]]),
      {},
      { name: { read: "deny", write: false } },
      context,
    ),
  ).toEqual({});
  expect(exportFormDefinition(definition)).not.toContain("creator@example.com");
  const snapshot = submissionValues(form([fields[0]]), {}, {}, context);
  expect(
    prepareValues(
      form([fields[0]]),
      snapshot,
      {},
      { ...context, currentUser: { name: "New name" } },
    ),
  ).toEqual(snapshot);
});

it("rejects arbitrary paths, mismatched field types and competing literal defaults", () => {
  for (const patch of [
    { defaultValueSource: "currentUser.password" },
    { type: "number" },
    { defaultValue: "literal" },
  ])
    expect(
      isFormDefinition(form([{ ...fields[0], ...patch } as FormField])),
    ).toBe(false);
  expect(isFormDefinition(form([{ ...fields[0], type: "email" }]))).toBe(false);
  expect(isFormDefinition(form([{ ...fields[0], type: "person" }]))).toBe(
    false,
  );
});

it("selects creator attributes and toggles editing without keeping a conflicting fixed default", () => {
  const patch = vi.fn();
  render(
    <I18nProvider initialLocale="en">
      <CreatorDefaultEditor
        field={{
          ...fields[0],
          defaultValueSource: undefined,
          defaultValue: "Old",
        }}
        patch={patch}
      />
    </I18nProvider>,
  );
  fireEvent.click(
    screen.getByRole("combobox", { name: "Default value source" }),
  );
  fireEvent.click(screen.getByRole("option", { name: "Creator department" }));
  expect(patch).toHaveBeenCalledWith({
    defaultValueSource: "currentUser.department",
    defaultValue: undefined,
  });
  cleanup();
  render(
    <I18nProvider initialLocale="en">
      <CreatorDefaultEditor field={fields[0]} patch={patch} />
    </I18nProvider>,
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Allow editing value" }),
  );
  expect(patch).toHaveBeenLastCalledWith({ readOnly: true });
});

it("renders locked defaults, lets editable defaults change, resets and blocks missing required profile data", async () => {
  const submit = vi.fn();
  const definition = form([
    { ...fields[0], readOnly: true },
    { ...fields[1], required: true },
  ]);
  function Host() {
    const [values, setValues] = useState({});
    return (
      <FormRenderer
        definition={definition}
        runtimeContext={context}
        values={values}
        onChange={setValues}
        onSubmit={submit}
      />
    );
  }
  render(
    <I18nProvider initialLocale="en">
      <Host />
    </I18nProvider>,
  );
  expect(
    (screen.getByRole("textbox", { name: "name" }) as HTMLInputElement)
      .disabled,
  ).toBe(true);
  fireEvent.change(screen.getByRole("textbox", { name: "email (required)" }), {
    target: { value: "changed@example.com" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Submit form" }).closest("form")!,
  );
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith({
      name: "Synthetic creator",
      email: "changed@example.com",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Clear sample values" }));
  expect(
    (
      screen.getByRole("textbox", {
        name: "email (required)",
      }) as HTMLInputElement
    ).value,
  ).toBe("creator@example.com");
  cleanup();
  submit.mockClear();
  render(
    <I18nProvider initialLocale="en">
      <FormRenderer
        definition={form([{ ...fields[1], required: true }])}
        values={{}}
        onChange={() => {}}
        onSubmit={submit}
      />
    </I18nProvider>,
  );
  expect(
    screen.getByText(/The selected creator information is unavailable/),
  ).toBeTruthy();
  fireEvent.submit(
    screen.getByRole("button", { name: "Submit form" }).closest("form")!,
  );
  expect(submit).not.toHaveBeenCalled();
});
