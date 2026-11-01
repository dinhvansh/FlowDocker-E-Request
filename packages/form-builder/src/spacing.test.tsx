import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { FormSpacingEditor } from "./components/form-spacing-editor";
import { compactSpacing, standardSpacing, spacingStyle } from "./spacing";
import { analyzeFormCode, codeCompletions } from "./code-model";
import {
  isFormDefinition,
  importFormDefinition,
  exportFormDefinition,
  type FormDefinition,
  type FormSpacing,
} from "./schema";
import { FormRenderer } from "./runtime";

const form: FormDefinition = {
  id: "spacing",
  title: { vi: "Mẫu", en: "Sample" },
  version: 1,
  status: "DRAFT",
  schemaVersion: 2,
  fields: [
    {
      id: "name",
      key: "name",
      type: "text",
      required: false,
      options: [],
      label: { vi: "Tên", en: "Name" },
    },
  ],
};
afterEach(cleanup);
describe("per-form spacing metadata and controls", () => {
  it("preserves existing forms and round-trips authored spacing through the actual code model", () => {
    expect(isFormDefinition(form)).toBe(true);
    expect(spacingStyle()).toBeUndefined();
    const authored = { ...form, spacing: { ...compactSpacing, columnGap: 23 } };
    expect(importFormDefinition(exportFormDefinition(authored))).toEqual(
      authored,
    );
    expect(
      analyzeFormCode(JSON.stringify(authored), form.id).definition?.spacing,
    ).toEqual(authored.spacing);
    expect(codeCompletions('{"spacing":{"ro', 15)).toContain("rowGap");
  });
  it.each([
    { ...standardSpacing, rowGap: -1 },
    { ...standardSpacing, columnGap: 65 },
    { ...standardSpacing, sectionGap: 65 },
    { ...standardSpacing, sectionPadding: 41 },
    { ...standardSpacing, rowGap: 1.5 },
    { rowGap: 8 },
    { ...standardSpacing, injectedStyle: "position:fixed" },
    { ...standardSpacing, rowGap: "8" },
  ])(
    "rejects invalid spacing rather than injecting arbitrary styles: %j",
    (spacing) => {
      expect(isFormDefinition({ ...form, spacing })).toBe(false);
      expect(
        analyzeFormCode(JSON.stringify({ ...form, spacing }), form.id)
          .definition,
      ).toBeUndefined();
    },
  );
  it("accepts zero and boundary values and scopes renderer CSS variables to one form", () => {
    const spacing = {
      rowGap: 0,
      columnGap: 64,
      sectionGap: 0,
      sectionPadding: 40,
    };
    expect(isFormDefinition({ ...form, spacing })).toBe(true);
    const { container } = render(
      <I18nProvider initialLocale="en" persistenceKey={null}>
        <FormRenderer
          definition={{ ...form, spacing }}
          values={{}}
          onChange={() => {}}
        />
        <FormRenderer definition={form} values={{}} onChange={() => {}} />
      </I18nProvider>,
    );
    const previews =
      container.querySelectorAll<HTMLElement>(".fd-form-preview");
    expect(previews[0].style.getPropertyValue("--fd-form-row-gap")).toBe("0px");
    expect(previews[0].style.getPropertyValue("--fd-form-column-gap")).toBe(
      "64px",
    );
    expect(previews[1].hasAttribute("style")).toBe(false);
  });
  it("groups live pointer changes into one history entry and starts a new keyboard gesture", () => {
    const change = vi.fn();
    function Host() {
      const [value, setValue] = useState<FormSpacing>({ ...standardSpacing });
      return (
        <FormSpacingEditor
          value={value}
          onChange={(next, history) => {
            change(next, history);
            setValue(next);
          }}
        />
      );
    }
    render(
      <I18nProvider initialLocale="en" persistenceKey={null}>
        <Host />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Spacing" }));
    const slider = screen.getByRole("slider", { name: "Between rows" });
    fireEvent.pointerDown(slider);
    fireEvent.change(slider, { target: { value: "8" } });
    fireEvent.change(slider, { target: { value: "10" } });
    fireEvent.pointerUp(slider);
    expect(change.mock.calls.map((call) => call[1])).toEqual([true, false]);
    expect(screen.getByText("10 px")).toBeTruthy();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.change(slider, { target: { value: "11" } });
    fireEvent.keyUp(slider, { key: "ArrowRight" });
    expect(change.mock.calls.at(-1)?.[1]).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Reset spacing" }));
    expect(change).toHaveBeenLastCalledWith(standardSpacing, true);
  });
  it("keeps all editing controls disabled for read-only forms", () => {
    const change = vi.fn();
    render(
      <I18nProvider initialLocale="en" persistenceKey={null}>
        <FormSpacingEditor disabled onChange={change} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Spacing" }));
    const sliders = screen.getAllByRole("slider");
    expect(
      sliders.every((slider) => (slider as HTMLInputElement).disabled),
    ).toBe(true);
    fireEvent.change(sliders[0], { target: { value: "8" } });
    expect(change).not.toHaveBeenCalled();
  });
});
