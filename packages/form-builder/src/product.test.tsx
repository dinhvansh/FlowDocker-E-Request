import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { FormRenderer, type FormRendererProps } from "./runtime";
import { createShowcaseDefinition } from "./showcase";
import {
  createField,
  duplicateField,
  exportFormDefinition,
  importFormDefinition,
  isFormDefinition,
  validateFormDefinition,
  type FormDefinition,
  type FormField,
  type PreviewValues,
} from "./schema";
import {
  calculate,
  defaultValues,
  prepareValues,
  submissionValues,
  validatePreview,
} from "./engine";
import { FormDesigner, moveField } from "./designer";
const field = (
  key: string,
  type: FormField["type"] = "text",
  patch: Partial<FormField> = {},
): FormField => ({
  id: key,
  key,
  type,
  label: { vi: key, en: key },
  required: false,
  options: [],
  ...patch,
});
const definition = (
  fields: FormField[],
  patch: Partial<FormDefinition> = {},
): FormDefinition => ({
  id: "test",
  title: { vi: "Mẫu", en: "Sample" },
  version: 1,
  status: "DRAFT",
  fields,
  ...patch,
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("FlowDocker Forms typed engine", () => {
  it("preserves container namespaces, table layouts, address and split dates", () => {
    const form = definition([
      field("person", "container", {
        children: [
          field("name", "text", { required: true }),
          field("amount", "number"),
        ],
      }),
      field("copy", "number", {
        calculation: { operator: "add", fields: ["person.amount"] },
      }),
      field("table", "table", {
        columns: 2,
        children: [field("city"), field("street")],
      }),
      field("address", "address", { required: true }),
      field("born", "day"),
    ]);
    const values = {
      person: { name: "Synthetic", amount: "2.35", extra: "drop" },
      city: "City",
      street: "Street",
      address: { street: "Road", city: "City", country: "VN" },
      born: { year: "2024", month: "2", day: "29" },
    };
    expect(validatePreview(form, values)).toEqual([]);
    expect(prepareValues(form, values).copy).toBe("2.35");
    expect(submissionValues(form, values).person).toEqual({
      name: "Synthetic",
      amount: "2.35",
    });
    expect(
      validatePreview(form, {
        ...values,
        person: {},
        born: { year: "2025", month: "2", day: "29" },
      }).map((issue) => issue.path),
    ).toEqual(expect.arrayContaining(["person.name", "born"]));
    expect(
      validatePreview(form, { ...values, person: "bad" }).some(
        (issue) => issue.path === "person",
      ),
    ).toBe(true);
    expect(
      validatePreview(
        definition([
          field("rows", "repeat", { minRows: 1, children: [field("item")] }),
        ]),
        { rows: [] },
      ).some((issue) => issue.path === "rows"),
    ).toBe(true);
  });
  it("rejects extreme decimals, forged file metadata and malformed signature points", () => {
    expect(
      validatePreview(definition([field("amount", "number")]), {
        amount: "1e99999999",
      }),
    ).toHaveLength(1);
    expect(
      validatePreview(definition([field("file", "file")]), {
        file: [
          {
            name: "a.pdf",
            size: 1,
            type: "application/pdf",
            status: "uploaded",
          },
        ],
      }),
    ).toHaveLength(1);
    expect(
      validatePreview(definition([field("signature", "signature")]), {
        signature: { strokes: [[null, null]] },
      }),
    ).toHaveLength(1);
  });
  it("rejects cycles across repeat aggregates and bounds external values", () => {
    const form = definition([
      field("total", "number", {
        calculation: { operator: "sum", fields: ["rows.amount"] },
      }),
      field("rows", "repeat", {
        children: [
          field("amount", "number", {
            calculation: { operator: "add", fields: ["total"] },
          }),
        ],
      }),
    ]);
    expect(
      validateFormDefinition(form).some(
        (issue) => issue.message === "Phép tính có vòng tham chiếu.",
      ),
    ).toBe(true);
    const input: PreviewValues = {};
    input.loop = input;
    expect(
      validatePreview(definition([field("name")]), input).length,
    ).toBeGreaterThan(0);
    expect(prepareValues(definition([field("name")]), input)).toEqual({});
  });
  it("uses row-specific options and access rules", () => {
    const form = definition([
      field("rows", "repeat", {
        children: [
          field("choice", "select", { dataSource: { provider: "choices" } }),
        ],
      }),
    ]);
    const values = { rows: [{ choice: "a" }, { choice: "b" }] };
    expect(
      validatePreview(
        form,
        values,
        {},
        { "rows.0.choice": ["a"], "rows.1.choice": ["b"] },
      ),
    ).toEqual([]);
    expect(
      validatePreview(
        form,
        values,
        {},
        { "rows.0.choice": ["b"], "rows.1.choice": ["b"] },
      ).some((issue) => issue.path === "rows.0.choice"),
    ).toBe(true);
    expect(
      submissionValues(form, values, {
        "rows.0.choice": { read: "deny", write: false },
      }),
    ).toEqual({ rows: [{}, { choice: "b" }] });
  });
  it("calculates decimal row values and aggregates without binary float errors", () => {
    const form = definition([
      field("total", "currency", {
        calculation: {
          operator: "sum",
          fields: ["lines.amount"],
          precision: 2,
        },
      }),
      field("lines", "repeat", {
        children: [
          field("quantity", "number"),
          field("price", "currency"),
          field("amount", "currency", {
            calculation: {
              operator: "multiply",
              fields: ["quantity", "price"],
              precision: 2,
            },
          }),
        ],
      }),
    ]);
    expect(validateFormDefinition(form)).toEqual([]);
    const values = prepareValues(form, {
      lines: [
        { quantity: "1", price: "0.1" },
        { quantity: "1", price: "0.2" },
      ],
    });
    expect(values.total).toBe("0.30");
    expect(validatePreview(form, values)).toEqual([]);
  });

  it("evaluates safe advanced calculation expressions with field and function suggestions", () => {
    const amount = field("amount", "currency");
    const rate = field("exchange_rate", "number");
    const total = field("total", "currency", {
      calculation: {
        operator: "multiply",
        fields: ["amount", "exchange_rate"],
        expression: "amount * exchange_rate",
        precision: 2,
      },
    });
    expect(calculate(total, { amount: "125.50", exchange_rate: "1.2" })).toBe(
      "150.60",
    );
    expect(
      calculate(
        {
          ...total,
          calculation: {
            ...total.calculation!,
            expression: "ROUND(SUM(amount, exchange_rate), 1)",
          },
        },
        { amount: "125.50", exchange_rate: "1.2" },
      ),
    ).toBe("126.70");
    expect(validateFormDefinition(definition([amount, rate, total]))).toEqual(
      [],
    );
  });
  it("rejects division by zero and calculation cycles", () => {
    const form = definition([
      field("a", "number"),
      field("b", "number", {
        calculation: { operator: "divide", fields: ["a", "zero"] },
      }),
      field("zero", "number"),
    ]);
    expect(
      validatePreview(form, { a: "1", zero: "0" }).some(
        (issue) => issue.fieldId === "b",
      ),
    ).toBe(true);
    form.fields[0].calculation = { operator: "add", fields: ["b"] };
    expect(
      validateFormDefinition(form).some((issue) =>
        issue.message.includes("vòng"),
      ),
    ).toBe(true);
  });
  it("clears hidden nested values, excludes masked/disabled/unknown output, respects conditional required", () => {
    const form = definition([
      field("switch", "checkbox"),
      field("container", "section", {
        children: [
          field("detail", "text", {
            required: true,
            visibleWhen: {
              mode: "all",
              conditions: [{ field: "switch", operator: "eq", value: true }],
            },
          }),
        ],
      }),
      field("secret"),
      field("disabled", "text", { disabled: true }),
    ]);
    const input = {
      switch: false,
      detail: "stale",
      secret: "private",
      disabled: "skip",
      unknown: "skip",
    };
    expect(prepareValues(form, input).detail).toBeUndefined();
    expect(
      submissionValues(form, input, { secret: { read: "mask", write: false } }),
    ).toEqual({ switch: false });
    expect(
      validatePreview(form, { switch: true }).some(
        (issue) => issue.fieldId === "detail",
      ),
    ).toBe(true);
  });
  it("validates nested rows, duplicate row keys, date comparison and formats", () => {
    const form = definition([
      field("start", "date"),
      field("end", "date", { compare: { field: "start", operator: "gte" } }),
      field("email", "email"),
      field("url", "url"),
      field("lines", "repeat", {
        minRows: 1,
        maxRows: 2,
        uniqueBy: "code",
        children: [
          field("code", "text", { required: true }),
          field("qty", "number", { min: 1, integer: true }),
        ],
      }),
    ]);
    const issues = validatePreview(form, {
      start: "2026-02-01",
      end: "2026-01-01",
      email: "broken",
      url: "javascript:alert(1)",
      lines: [
        { code: "A", qty: "1.5" },
        { code: "A", qty: "0" },
      ],
    });
    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([
        "end",
        "email",
        "url",
        "lines",
        "lines.0.qty",
        "lines.1.qty",
      ]),
    );
    expect(
      validatePreview(form, { lines: [null] }).some(
        (issue) => issue.path === "lines",
      ),
    ).toBe(true);
  });
  it("migrates and roundtrips v1 drafts, rejects executable/oversized/deep imports", () => {
    const form = definition([field("name")]);
    expect(importFormDefinition(exportFormDefinition(form)).schemaVersion).toBe(
      2,
    );
    expect(importFormDefinition(JSON.stringify(form)).fields[0].key).toBe(
      "name",
    );
    expect(() =>
      importFormDefinition(
        JSON.stringify({
          ...form,
          fields: [{ ...form.fields[0], customJavaScript: "alert(1)" }],
        }),
      ),
    ).toThrow();
    expect(isFormDefinition({ ...form, display: "arbitrary" })).toBe(false);
    expect(() => importFormDefinition("x".repeat(1000001))).toThrow();
  });
  it("duplicates trees with new IDs/keys and rewrites internal calculations", () => {
    const group = field("group", "section", {
      children: [
        field("a", "number"),
        field("b", "number", {
          calculation: { operator: "add", fields: ["a"] },
        }),
      ],
    });
    const copy = duplicateField(group, [group]);
    expect(copy.children?.[1].calculation?.fields).toEqual([
      copy.children?.[0].key,
    ]);
    expect(copy.children?.[0].id).not.toBe("a");
    expect(validateFormDefinition(definition([group, copy]))).toEqual([]);
    expect(moveField([group, copy], group.id, group.children![0].id)).toEqual([
      group,
      copy,
    ]);
  });
  it("has a valid standalone showcase schema and isolated defaults", () => {
    const form = createShowcaseDefinition();
    expect(validateFormDefinition(form)).toEqual([]);
    expect(isFormDefinition(form)).toBe(true);
    const defaults = defaultValues(form.fields);
    expect(Array.isArray(defaults.lines)).toBe(true);
    expect(createField("radio", []).options).toHaveLength(1);
  });
});
function Host({
  definition: form,
  initial = {},
  ...props
}: Omit<FormRendererProps, "values" | "onChange"> & {
  initial?: PreviewValues;
}) {
  const [values, setValues] = useState(initial);
  return (
    <I18nProvider>
      <FormRenderer
        {...props}
        definition={form}
        values={values}
        onChange={setValues}
      />
    </I18nProvider>
  );
}
describe("FlowDocker Forms interactive contracts", () => {
  it("renders structured fields and executes a schema-defined reset button", async () => {
    const submit = vi.fn();
    render(
      <Host
        definition={definition([
          field("contact", "container", {
            children: [field("name", "text", { required: true })],
          }),
          field("table", "table", {
            columns: 2,
            children: [
              field("address", "address", { required: true }),
              field("date_parts", "day"),
            ],
          }),
          field("notice", "alert", { tone: "info" }),
          field("restart", "button", { buttonAction: "reset" }),
        ])}
        onSubmit={submit}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "name (bắt buộc)" }), {
      target: { value: "Synthetic" },
    });
    for (const label of ["Đường và số nhà", "Thành phố", "Quốc gia"])
      fireEvent.change(screen.getByRole("textbox", { name: label }), {
        target: { value: "Synthetic" },
      });
    for (const [label, value] of [
      ["Ngày trong tháng", "29"],
      ["Tháng", "2"],
      ["Năm", "2024"],
    ])
      fireEvent.change(screen.getByRole("spinbutton", { name: label }), {
        target: { value },
      });
    fireEvent.click(screen.getByRole("button", { name: "Gửi biểu mẫu" }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0][0].contact).toEqual({ name: "Synthetic" });
    expect(submit.mock.calls[0][0]).not.toHaveProperty("restart");
    fireEvent.click(screen.getByRole("button", { name: "restart" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "name (bắt buộc)",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
  });
  it("cancels stale provider requests when dependency changes", async () => {
    const requests: {
      signal: AbortSignal;
      resolve: (
        options: { value: string; label: { vi: string; en: string } }[],
      ) => void;
    }[] = [];
    const provider = vi.fn(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise<{ value: string; label: { vi: string; en: string } }[]>(
          (resolve) => requests.push({ signal, resolve }),
        ),
    );
    const schema = definition([
      field("region"),
      field("choice", "select", {
        dataSource: { provider: "places", dependsOn: "region" },
      }),
    ]);
    render(<Host definition={schema} providers={{ places: provider }} />);
    await waitFor(() => expect(requests).toHaveLength(1));
    fireEvent.change(screen.getByRole("textbox", { name: "region" }), {
      target: { value: "new" },
    });
    expect(requests[0].signal.aborted).toBe(true);
    await waitFor(() => expect(requests).toHaveLength(2));
    await act(async () =>
      requests[0].resolve([{ value: "old", label: { vi: "Cũ", en: "Old" } }]),
    );
    expect(
      (screen.getByRole("combobox", { name: "choice" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await act(async () =>
      requests[1].resolve([{ value: "new", label: { vi: "Mới", en: "New" } }]),
    );
    await waitFor(() =>
      expect(
        (screen.getByRole("combobox", { name: "choice" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );
    expect(provider.mock.calls.length).toBe(2);
  });
  it("guards raw submit events during pending requests and readonly mode", async () => {
    let finish: (() => void) | undefined;
    const submit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const rendered = render(
      <Host definition={definition([field("name")])} onSubmit={submit} />,
    );
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(submit).toHaveBeenCalledOnce();
    await act(async () => finish!());
    rendered.unmount();
    render(
      <Host
        definition={definition([field("name")])}
        readOnly
        onSubmit={submit}
      />,
    );
    fireEvent.submit(document.querySelector("form")!);
    expect(submit).toHaveBeenCalledOnce();
  });
  it("only calls submit after validation and retains values after rejected submission", async () => {
    const submit = vi.fn().mockRejectedValue(new Error("network"));
    render(
      <Host
        definition={definition([field("name", "text", { required: true })])}
        onSubmit={submit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Gửi biểu mẫu" }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "name (bắt buộc)" }), {
      target: { value: "sample" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi biểu mẫu" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Không gửi được biểu mẫu. Dữ liệu vẫn còn; hãy thử lại.",
        ),
      ).toBeTruthy(),
    );
    expect(submit).toHaveBeenCalledWith({ name: "sample" });
    expect(
      (
        screen.getByRole("textbox", {
          name: "name (bắt buộc)",
        }) as HTMLInputElement
      ).value,
    ).toBe("sample");
  });
  it("validates wizard current step, preserves values and submits all steps", async () => {
    const submit = vi.fn();
    render(
      <Host
        definition={definition(
          [
            field("first", "section", {
              children: [field("name", "text", { required: true })],
            }),
            field("second", "section", {
              children: [field("email", "email", { required: true })],
            }),
          ],
          { display: "wizard" },
        )}
        onSubmit={submit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bước tiếp" }));
    expect(
      screen.queryByRole("textbox", { name: "email (bắt buộc)" }),
    ).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "name (bắt buộc)" }), {
      target: { value: "Test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bước tiếp" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "email (bắt buộc)" }),
      { target: { value: "test@example.test" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Gửi biểu mẫu" }));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        name: "Test",
        email: "test@example.test",
      }),
    );
  });
  it("blocks submission during upload and accepts an injected upload result", async () => {
    let resolve:
      ((value: { id: string; reference: string }) => void) | undefined;
    const upload = vi.fn(
      () =>
        new Promise<{ id: string; reference: string }>((done) => {
          resolve = done;
        }),
    );
    const submit = vi.fn();
    render(
      <Host
        definition={definition([
          field("file", "file", { accept: ".pdf", maxFiles: 1 }),
          field("note"),
        ])}
        onUpload={upload}
        onSubmit={submit}
      />,
    );
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, {
      target: {
        files: [new File(["test"], "sample.pdf", { type: "application/pdf" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi biểu mẫu" }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "note" }), {
      target: { value: "typed while uploading" },
    });
    await act(async () =>
      resolve!({ id: "test", reference: "opaque-upload-ref" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Gửi biểu mẫu" }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0][0].note).toBe("typed while uploading");
  });
  it("provides an accessible typed signature and enforces readonly mode", async () => {
    const submit = vi.fn();
    const rendered = render(
      <Host
        definition={definition([
          field("sign", "signature", { required: true }),
        ])}
        onSubmit={submit}
      />,
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Nhập tên thay cho vẽ chữ ký" }),
      { target: { value: "Synthetic signer" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Gửi biểu mẫu" }));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        sign: { typed: "Synthetic signer" },
      }),
    );
    rendered.unmount();
    render(
      <Host definition={definition([field("a")])} readOnly onSubmit={submit} />,
    );
    expect(
      (screen.getByRole("textbox", { name: "a" }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Gửi biểu mẫu",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  it("supports builder undo and redo after adding a typed field", () => {
    function Builder() {
      const [form, setForm] = useState(definition([field("name")]));
      return (
        <I18nProvider>
          <FormDesigner definition={form} onChange={setForm} />
        </I18nProvider>
      );
    }
    render(<Builder />);
    fireEvent.click(screen.getByRole("button", { name: /^Thêm Email$/ }));
    expect(screen.getByRole("textbox", { name: "Mã trường" })).toHaveProperty(
      "value",
      "email_1",
    );
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(screen.getByRole("textbox", { name: "Mã trường" })).toHaveProperty(
      "value",
      "name",
    );
    fireEvent.click(screen.getByRole("button", { name: "Làm lại" }));
    expect(screen.getByRole("textbox", { name: "Mã trường" })).toHaveProperty(
      "value",
      "email_1",
    );
  });
});
