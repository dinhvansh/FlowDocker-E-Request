import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { FormRenderer } from "./runtime";
import {
  createField,
  exportFormDefinition,
  importFormDefinition,
  isFormDefinition,
  type FormDefinition,
  type FormField,
} from "./schema";
import { prepareValues, submissionValues, validatePreview } from "./engine";

afterEach(cleanup);
const person = (key: string, patch: Partial<FormField> = {}): FormField => ({
  ...createField("person", []),
  id: key,
  key: key.toLowerCase(),
  label: { vi: key, en: key },
  defaultValueSource: "currentUser",
  required: true,
  ...patch,
});
const form = (fields: FormField[]): FormDefinition => ({
  id: "current-user-test",
  version: 1,
  status: "DRAFT",
  schemaVersion: 2,
  title: { vi: "Mẫu", en: "Sample" },
  fields,
});
const context = { currentUserId: "person-current" };

it("resolves defaults without overwriting saved or explicitly cleared values", () => {
  const definition = form([person("requester")]);
  expect(prepareValues(definition, {}, {}, context)).toEqual({
    requester: "person-current",
  });
  for (const value of ["person-original", "", null])
    expect(
      prepareValues(definition, { requester: value }, {}, context),
    ).toEqual({ requester: value });
  expect(prepareValues(definition, {})).toEqual({});
  expect(
    prepareValues(
      definition,
      {},
      { requester: { read: "deny", write: false } },
      context,
    ),
  ).toEqual({});
});

it("resolves nested, repeated and multi-person defaults and validates/submits stable IDs", () => {
  const definition = form([
    {
      ...createField("container", []),
      key: "details",
      children: [person("requester")],
    },
    {
      ...createField("repeat", []),
      key: "rows",
      minRows: 1,
      children: [person("owner", { multiple: true })],
    },
  ]);
  const expected = {
    details: { requester: "person-current" },
    rows: [{ owner: ["person-current"] }],
  };
  expect(prepareValues(definition, {}, {}, context)).toEqual(expected);
  expect(
    prepareValues(definition, { details: {}, rows: [{}] }, {}, context),
  ).toEqual(expected);
  const options = {
    "details.requester": ["person-current"],
    "rows.0.owner": ["person-current"],
  };
  expect(validatePreview(definition, {}, {}, options, context)).toEqual([]);
  expect(validatePreview(definition, {}, {}, options).length).toBeGreaterThan(
    0,
  );
  expect(submissionValues(definition, {}, {}, context)).toEqual(expected);
});

it("roundtrips the original schema and rejects invalid default sources or a competing literal default", () => {
  const definition = form([person("requester")]);
  expect(importFormDefinition(exportFormDefinition(definition))).toEqual(
    definition,
  );
  expect(isFormDefinition(form([person("requester", { type: "text" })]))).toBe(
    false,
  );
  expect(
    isFormDefinition(form([person("requester", { defaultValue: "someone" })])),
  ).toBe(false);
  expect(
    isFormDefinition({
      ...definition,
      fields: [{ ...definition.fields[0], defaultValueSource: "arbitrary" }],
    }),
  ).toBe(false);
});

it("renders the current account read-only and submits its resolved default without editing", async () => {
  const onSubmit = vi.fn();
  const definition = form([person("Requester", { readOnly: true })]);
  render(
    <I18nProvider initialLocale="en">
      <FormRenderer
        definition={definition}
        values={{}}
        onChange={() => {}}
        onSubmit={onSubmit}
        runtimeContext={context}
        providers={{
          "organization.people": async () => [
            {
              value: "person-current",
              label: { vi: "Người mẫu", en: "Sample person" },
            },
          ],
        }}
      />
    </I18nProvider>,
  );
  await screen.findByText("Sample person");
  await act(async () => {});
  const picker = screen.getByRole("combobox", {
    name: "Requester (required)",
  }) as HTMLButtonElement;
  expect(picker.disabled).toBe(true);
  fireEvent.submit(
    screen.getByRole("button", { name: "Submit form" }).closest("form")!,
  );
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({ requester: "person-current" }),
  );
});

it("explains missing host identity and blocks a required person without guessing", async () => {
  const onSubmit = vi.fn();
  render(
    <I18nProvider initialLocale="en">
      <FormRenderer
        definition={form([person("Requester")])}
        values={{}}
        onChange={() => {}}
        onSubmit={onSubmit}
      />
    </I18nProvider>,
  );
  expect(screen.getByText(/The current creator is unavailable/)).toBeTruthy();
  fireEvent.submit(
    screen.getByRole("button", { name: "Submit form" }).closest("form")!,
  );
  expect(onSubmit).not.toHaveBeenCalled();
  await screen.findByText(/Fix .* errors in the sample values/);
});
