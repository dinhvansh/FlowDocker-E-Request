import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { DirectContentEditor } from "./components/direct-content-editor";
import { movedContent, resizedContent } from "./content-position";
import {
  createField,
  exportFormDefinition,
  importFormDefinition,
  isFormDefinition,
  type FormDefinition,
  type FormField,
} from "./schema";
import { analyzeFormCode, codeCompletions } from "./code-model";
import { FormPreview } from "./runtime";
import { submissionValues } from "./engine";
afterEach(cleanup);
const heading = () => ({
  ...createField("content", []),
  id: "heading",
  key: "heading",
  label: { vi: "Tiêu đề", en: "Heading" },
  presentation: { align: "left" as const, size: "title" as const, bold: true },
});
it("round-trips bounded direct positioning through schema/code without adding submission data", () => {
  const field = {
    ...heading(),
    presentation: {
      ...heading().presentation,
      horizontalPosition: 37,
      spaceAbove: 22,
      fontSize: 26,
    },
  };
  const form: FormDefinition = {
    schemaVersion: 2,
    id: "qa",
    title: { vi: "Test", en: "Test" },
    version: 1,
    status: "DRAFT",
    fields: [field],
  };
  expect(importFormDefinition(exportFormDefinition(form))).toEqual(form);
  expect(analyzeFormCode(JSON.stringify(form), form.id).definition).toEqual(
    form,
  );
  for (const [key, value] of [
    ["horizontalPosition", 101],
    ["spaceAbove", -1],
    ["fontSize", 49],
    ["fontSize", 12.5],
    ["spaceAbove", "12"],
  ])
    expect(
      isFormDefinition({
        ...form,
        fields: [
          { ...field, presentation: { ...field.presentation, [key]: value } },
        ],
      }),
    ).toBe(false);
  const source = '{"fields":[{"presentation":{"';
  expect(codeCompletions(source, source.length)).toContain(
    "horizontalPosition",
  );
  expect(submissionValues(form, { heading: "injected" })).toEqual({});
});
it("snaps pointer moves, keeps keyboard precise and bounds sizes", () => {
  const p = heading().presentation;
  expect(movedContent(p, 49, 200, 100)).toMatchObject({
    horizontalPosition: 50,
    spaceAbove: 160,
  });
  expect(movedContent(p, 1, 1, 100, false)).toMatchObject({
    horizontalPosition: 1,
    spaceAbove: 1,
  });
  expect(movedContent(p, -500, -20, 0)).toMatchObject({
    horizontalPosition: 0,
    spaceAbove: 0,
  });
  expect(resizedContent(heading(), 600).fontSize).toBe(48);
  expect(
    resizedContent({ ...heading(), type: "image" }, -1000).imageWidth,
  ).toBe(32);
});
it("edits text in the current locale and supports alignment and keyboard resize", () => {
  function Host() {
    const [field, setField] = useState<FormField>(heading());
    return (
      <DirectContentEditor
        field={field}
        design={{
          selectedId: field.id,
          onSelect: () => {},
          onPatch: (_id, changes) =>
            setField((current) => ({ ...current, ...changes })),
        }}
      />
    );
  }
  render(
    <I18nProvider locale="en">
      <Host />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Align center" }));
  expect(
    screen
      .getByRole("button", { name: "Align center" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.keyDown(screen.getByRole("button", { name: "Move content" }), {
    key: "ArrowRight",
  });
  expect(
    document.querySelector(".fd-content-object")?.getAttribute("style"),
  ).toContain("51%");
  fireEvent.keyDown(
    screen.getByRole("slider", { name: "Drag to resize text" }),
    { key: "ArrowRight" },
  );
  expect(
    (
      screen.getByRole("spinbutton", {
        name: "Font size (px)",
      }) as HTMLInputElement
    ).value,
  ).toBe("19");
  fireEvent.click(screen.getByRole("button", { name: "Edit text" }));
  const input = screen.getByRole("textbox", { name: "Text on the form" });
  fireEvent.change(input, { target: { value: "New title" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(screen.getByRole("heading", { name: "New title" })).toBeTruthy();
});
it("preserves runtime visibility/access and renders no authoring controls by default", () => {
  const form: FormDefinition = {
    schemaVersion: 2,
    id: "qa",
    title: { vi: "Test", en: "Test" },
    version: 1,
    status: "DRAFT",
    fields: [heading()],
  };
  const patch = vi.fn();
  const result = render(
    <I18nProvider locale="en">
      <FormPreview definition={form} values={{}} onChange={() => {}} />
    </I18nProvider>,
  );
  expect(screen.queryByRole("toolbar")).toBeNull();
  result.rerender(
    <I18nProvider locale="en">
      <FormPreview
        definition={form}
        values={{}}
        onChange={() => {}}
        access={{ heading: { read: "deny", write: false } }}
        contentDesign={{
          selectedId: "heading",
          onSelect: vi.fn(),
          onPatch: patch,
        }}
      />
    </I18nProvider>,
  );
  expect(screen.queryByRole("heading", { name: "Heading" })).toBeNull();
  expect(screen.queryByRole("toolbar")).toBeNull();
  expect(patch).not.toHaveBeenCalled();
});
it("disables configuration mutations when the host locks editing", () => {
  const field = heading(),
    patch = vi.fn();
  render(
    <I18nProvider locale="en">
      <DirectContentEditor
        field={field}
        design={{
          selectedId: field.id,
          disabled: true,
          onSelect: vi.fn(),
          onPatch: patch,
        }}
      />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Align right" }));
  fireEvent.keyDown(screen.getByRole("button", { name: "Move content" }), {
    key: "ArrowRight",
  });
  expect(patch).not.toHaveBeenCalled();
});

it("records one checkpoint for an unselected pointer drag and restores it on Escape", () => {
  const patch = vi.fn();
  function Host() {
    const [field, setField] = useState<FormField>(heading());
    const [selectedId, select] = useState("");
    return (
      <DirectContentEditor
        field={field}
        design={{
          selectedId,
          onSelect: select,
          onPatch: (id, changes, record = true) => {
            patch(id, changes, record);
            setField((current) => ({ ...current, ...changes }));
          },
        }}
      />
    );
  }
  const { container } = render(
    <I18nProvider locale="en">
      <Host />
    </I18nProvider>,
  );
  const root = container.querySelector<HTMLElement>(".fd-direct-content")!;
  root.setPointerCapture = vi.fn();
  root.hasPointerCapture = () => false;
  const block = container.querySelector<HTMLElement>(".fd-content-block")!;
  Object.defineProperty(block, "clientWidth", { value: 300 });
  const object = container.querySelector<HTMLElement>(".fd-content-object")!;
  vi.spyOn(object, "getBoundingClientRect").mockReturnValue({
    width: 100,
  } as DOMRect);
  const pointer = (target: HTMLElement, type: string, x: number, y: number) =>
    fireEvent(
      target,
      new MouseEvent(type, {
        bubbles: true,
        button: 0,
        clientX: x,
        clientY: y,
      }),
    );
  pointer(object, "pointerdown", 0, 0);
  pointer(root, "pointermove", 20, 10);
  pointer(root, "pointermove", 60, 30);
  expect(patch.mock.calls.filter((call) => call[2] === true)).toHaveLength(1);
  expect(object.style.left).toBe("30%");
  expect(block.style.paddingTop).toBe("30px");
  fireEvent.keyDown(root, { key: "Escape" });
  expect(object.style.left).toBe("0%");
  expect(block.style.paddingTop).toBe("");
});
