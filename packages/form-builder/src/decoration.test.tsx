import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { FormBandView } from "./components/form-band";
import { FormDecorationEditor } from "./components/form-decoration-editor";
import {
  defaultDecoration,
  safeBandImage,
  validFormDecoration,
  prepareBandImage,
  type FormDecoration,
} from "./decoration";
import {
  exportFormDefinition,
  importFormDefinition,
  isFormDefinition,
  type FormDefinition,
} from "./schema";
import {
  analyzeFormCode,
  codeCompletions,
  reconcileFormCode,
} from "./code-model";
import { formAuthoringSchema } from "./code-assistance";
const form: FormDefinition = {
  id: "decoration",
  title: { vi: "Mẫu thử", en: "Sample" },
  version: 1,
  status: "DRAFT",
  schemaVersion: 2,
  fields: [
    {
      id: "name",
      key: "name",
      type: "text",
      label: { vi: "Tên", en: "Name" },
      required: false,
      options: [],
    },
  ],
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("form header/footer contracts and UI", () => {
  it("preserves old definitions and round-trips presentation through code and import/export", () => {
    expect(isFormDefinition(form)).toBe(true);
    const decorated = { ...form, decoration: defaultDecoration() };
    expect(importFormDefinition(exportFormDefinition(decorated))).toEqual(
      decorated,
    );
    const source = reconcileFormCode(JSON.stringify(form, null, 2), decorated);
    expect(analyzeFormCode(source, form.id).definition).toEqual(decorated);
    expect(formAuthoringSchema.properties.decoration).toBeTruthy();
    const keyPrompt = '{"decoration":{"header":{"cells":[{"al';
    const kindPrompt = '{"decoration":{"header":{"cells":[{"kind":"';
    expect(codeCompletions(keyPrompt, keyPrompt.length)).toContain("align");
    expect(codeCompletions(kindPrompt, kindPrompt.length)).toContain("image");
  });
  it("rejects unsafe images, unbounded values and unknown executable styling", () => {
    for (const image of [
      "javascript:alert(1)",
      "https://example.com/logo.png",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "data:image/png;base64," + "A".repeat(140000),
    ])
      expect(safeBandImage(image)).toBe(false);
    const bad = defaultDecoration();
    bad.header.cells[0].image = "https://example.com/logo.png";
    expect(isFormDefinition({ ...form, decoration: bad })).toBe(false);
    expect(
      validFormDecoration({ ...defaultDecoration(), html: "<script>" }),
    ).toBe(false);
    const width = defaultDecoration();
    width.header.cells[0].imageWidth = 321;
    expect(validFormDecoration(width)).toBe(false);
    const columns = defaultDecoration();
    columns.header.cells = [];
    expect(validFormDecoration(columns)).toBe(false);
    const long = defaultDecoration();
    long.footer.cells[0].text.vi = "x".repeat(4001);
    expect(validFormDecoration(long)).toBe(false);
  });
  it("renders bilingual title/text, hidden bands and retained column slots without HTML injection", () => {
    const d = defaultDecoration();
    d.footer.enabled = true;
    d.footer.cells[0].text = { vi: "<b>Chữ ký</b>", en: "<b>Signature</b>" };
    d.footer.cells[0].align = "right";
    const result = render(
      <I18nProvider locale="en">
        <FormBandView title={form.title} decoration={d} placement="footer" />
      </I18nProvider>,
    );
    expect(screen.getByText("<b>Signature</b>")).toBeTruthy();
    expect(result.container.querySelector("b")).toBeNull();
    expect(result.container.querySelector('[data-align="right"]')).toBeTruthy();
    d.footer.enabled = false;
    result.rerender(
      <I18nProvider locale="en">
        <FormBandView title={form.title} decoration={d} placement="footer" />
      </I18nProvider>,
    );
    expect(result.container.querySelector(".fd-form-band")).toBeNull();
    result.rerender(
      <I18nProvider>
        <FormBandView title={form.title} placement="header" />
      </I18nProvider>,
    );
    expect(screen.queryByRole("heading", { name: "Mẫu thử" })).toBeNull();
    result.rerender(
      <I18nProvider>
        <FormBandView
          title={form.title}
          decoration={defaultDecoration()}
          placement="header"
          renderTitle={() => <h2>{form.title.vi}</h2>}
        />
      </I18nProvider>,
    );
    expect(screen.queryByRole("heading", { name: "Mẫu thử" })).toBeNull();
    expect(result.container.querySelector(".fd-form-band")).toBeNull();
  });
  it("edits live using the signature preset and keeps read-only controls disabled", () => {
    const changed = vi.fn();
    function Host() {
      const [value, setValue] = useState<FormDecoration>();
      return (
        <I18nProvider>
          <FormDecorationEditor
            title={form.title}
            value={value}
            onChange={(v) => {
              changed(v);
              setValue(v);
            }}
          />
        </I18nProvider>
      );
    }
    render(<Host />);
    fireEvent.click(
      screen.getByRole("button", { name: "Đầu trang / Chân trang" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Mẫu khu vực chữ ký" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Nội dung · tiếng Việt" }),
      { target: { value: "Người kiểm soát" } },
    );
    const d = changed.mock.lastCall![0] as FormDecoration;
    expect(d.footer.columns).toBe(3);
    expect(d.footer.cells[0].text.vi).toBe("Người kiểm soát");
    expect(d.footer.cells[1].text.en).toContain("Reviewer");
    cleanup();
    render(
      <I18nProvider>
        <FormDecorationEditor title={form.title} disabled onChange={changed} />
      </I18nProvider>,
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Đầu trang / Chân trang",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  it("resizes raster uploads locally and releases the decoded bitmap", async () => {
    const close = vi.fn(),
      drawImage = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 1280, height: 640, close }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/webp;base64,AAAA",
    );
    expect(
      await prepareBandImage(
        new File(["raster"], "logo.png", { type: "image/png" }),
      ),
    ).toBe("data:image/webp;base64,AAAA");
    expect(drawImage.mock.calls[0].slice(1)).toEqual([0, 0, 640, 320]);
    expect(close).toHaveBeenCalledOnce();
    await expect(
      prepareBandImage(
        new File(["<svg/>"], "bad.svg", { type: "image/svg+xml" }),
      ),
    ).rejects.toThrow();
  });
  it("does not apply an image after its editing session unmounts", async () => {
    const close = vi.fn(),
      changed = vi.fn();
    let release: (value: {
      width: number;
      height: number;
      close: () => void;
    }) => void = () => {};
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(
        () =>
          new Promise((resolve) => {
            release = resolve;
          }),
      ),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/webp;base64,AAAA",
    );
    function Host() {
      const [value, setValue] = useState<FormDecoration>();
      return (
        <I18nProvider>
          <FormDecorationEditor
            title={form.title}
            value={value}
            onChange={(v) => {
              changed(v);
              setValue(v);
            }}
          />
        </I18nProvider>
      );
    }
    const mounted = render(<Host />);
    fireEvent.click(
      screen.getByRole("button", { name: "Đầu trang / Chân trang" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Mẫu logo và tiêu đề" }),
    );
    changed.mockClear();
    fireEvent.change(screen.getByLabelText("Tải ảnh / Logo"), {
      target: {
        files: [new File(["raster"], "logo.png", { type: "image/png" })],
      },
    });
    mounted.unmount();
    await act(async () => {
      release({ width: 100, height: 50, close });
    });
    expect(changed).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });
});
