import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@flowdocker/i18n";
import { AdvancedProperties, RuleEditor } from "./editors";
import { createField, type FormField, type FormRule } from "./schema";
import { evaluateRule } from "./engine";
import type { DataProvider } from "./runtime";
import { ConditionValueEditor } from "./components/condition-value-editor";

beforeEach(() =>
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  ),
);
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
});
const options = [
  { value: "bank-code", label: { vi: "Chuyển khoản", en: "Bank transfer" } },
];

function Host({
  source,
  provider,
}: {
  source: FormField;
  provider?: DataProvider;
}) {
  const [rule, setRule] = useState<FormRule | undefined>({
    mode: "all",
    conditions: [{ field: source.key, operator: "eq" }],
  });
  return (
    <I18nProvider>
      <RuleEditor
        label="Test"
        fields={[
          source,
          { ...createField("checkbox", []), key: "flag" },
          { ...createField("multiselect", []), key: "many", options },
        ]}
        rule={rule}
        onChange={setRule}
        providers={provider ? { catalog: provider } : undefined}
      />
      <output data-testid="rule">{JSON.stringify(rule)}</output>
      <output data-testid="result">
        {String(
          evaluateRule(rule, {
            [source.key]: "bank-code",
            many: ["bank-code"],
          }),
        )}
      </output>
    </I18nProvider>
  );
}
const saved = () =>
  JSON.parse(screen.getByTestId("rule").textContent!) as FormRule;
async function choose(label: string, option: string | RegExp) {
  fireEvent.click(screen.getByRole("combobox", { name: label }));
  fireEvent.click(await screen.findByRole("option", { name: option }));
}

it("stores the static option ID and runs the condition; source changes clear the operand", async () => {
  const source = { ...createField("select", []), key: "payment", options };
  render(<Host source={source} />);
  await choose("Giá trị so sánh", "Chuyển khoản");
  expect(saved().conditions[0].value).toBe("bank-code");
  expect(screen.getByTestId("result").textContent).toBe("true");
  await choose("Trường điều kiện", /flag/);
  expect(saved().conditions[0]).toEqual({ field: "flag", operator: "eq" });
  expect(
    screen.getByRole("combobox", { name: "Giá trị so sánh" }).textContent,
  ).toContain("Chọn giá trị");
  await choose("Giá trị so sánh", "Không");
  expect(saved().conditions[0].value).toBe(false);
  await choose("Trường điều kiện", /many/);
  expect(saved().conditions[0]).toEqual({
    field: "many",
    operator: "contains",
  });
  await choose("Giá trị so sánh", "Chuyển khoản");
  expect(screen.getByTestId("result").textContent).toBe("true");
});

it("uses the source provider, dependency and mapped stable values inside AdvancedProperties", async () => {
  const provider = vi.fn<DataProvider>().mockResolvedValue(options);
  const source = {
    ...createField("person", []),
    key: "requester",
    dataSource: {
      provider: "catalog",
      dependsOn: "org.department",
      valueField: "id",
      labelField: "name",
    },
  };
  const patch = vi.fn();
  render(
    <I18nProvider>
      <AdvancedProperties
        section="logic"
        field={{
          ...createField("text", []),
          visibleWhen: {
            mode: "all",
            conditions: [{ field: "requester", operator: "eq" }],
          },
        }}
        fields={[source]}
        providers={{ catalog: provider }}
        sourceDefaults={{ org: { department: "IT" } }}
        patch={patch}
      />
    </I18nProvider>,
  );
  expect(
    screen.getByRole("combobox", { name: "Giá trị so sánh" }),
  ).toHaveProperty("disabled", true);
  await waitFor(() =>
    expect(
      screen.getByRole("combobox", { name: "Giá trị so sánh" }),
    ).toHaveProperty("disabled", false),
  );
  expect(provider.mock.calls[0][0]).toMatchObject({
    dependency: "IT",
    valueField: "id",
    labelField: "name",
  });
  await choose("Giá trị so sánh", "Chuyển khoản");
  expect(patch).toHaveBeenCalledWith({
    visibleWhen: {
      mode: "all",
      conditions: [{ field: "requester", operator: "eq", value: "bank-code" }],
    },
  });
});

it("does not fall back to stale static options without the configured provider; retries errors", async () => {
  const source = {
    ...createField("select", []),
    options,
    dataSource: { provider: "catalog" },
  };
  const { unmount } = render(<Host source={source} />);
  expect(screen.getByText("Chưa cấu hình nguồn lựa chọn.")).toBeTruthy();
  expect(
    screen.getByRole("combobox", { name: "Giá trị so sánh" }),
  ).toHaveProperty("disabled", true);
  unmount();
  const provider = vi
    .fn<DataProvider>()
    .mockRejectedValueOnce(new Error("private detail"))
    .mockResolvedValueOnce(options);
  render(<Host source={source} provider={provider} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Tải lại danh sách" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("combobox", { name: "Giá trị so sánh" }),
    ).toHaveProperty("disabled", false),
  );
  await choose("Giá trị so sánh", "Chuyển khoản");
  expect(saved().conditions[0].value).toBe("bank-code");
  expect(screen.queryByText("private detail")).toBeNull();
});

it.each([
  ["number", "12.5", 12.5, "number"],
  ["currency", "12.5", "12.5", "number"],
  ["date", "2026-11-05", "2026-11-05", "date"],
  ["datetime", "2026-11-05T09:30", "2026-11-05T09:30", "datetime-local"],
  ["time", "09:30", "09:30", "time"],
] as const)(
  "uses the runtime value type for %s",
  (type, input, expected, inputType) => {
    const onChange = vi.fn();
    function TypedHost() {
      const [value, setValue] =
        useState<FormRule["conditions"][number]["value"]>();
      return (
        <I18nProvider>
          <ConditionValueEditor
            source={createField(type, [])}
            condition={{ field: "test", operator: "eq", value }}
            onChange={(next) => {
              setValue(next);
              onChange(next);
            }}
          />
        </I18nProvider>
      );
    }
    render(<TypedHost />);
    const control = screen.getByLabelText("Giá trị so sánh");
    expect(control.getAttribute("type")).toBe(inputType);
    fireEvent.change(control, { target: { value: input } });
    expect(onChange).toHaveBeenLastCalledWith(expected);
    fireEvent.change(control, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  },
);

it("keeps unavailable saved IDs explicit without silently replacing them", async () => {
  const onChange = vi.fn();
  render(
    <I18nProvider>
      <ConditionValueEditor
        source={{ ...createField("select", []), options }}
        condition={{ field: "test", operator: "eq", value: "removed-id" }}
        onChange={onChange}
      />
    </I18nProvider>,
  );
  expect(
    screen.getByText(
      "Giá trị so sánh đã lưu không còn trong danh sách. Hãy chọn lại.",
    ),
  ).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
  await choose("Giá trị so sánh", "Bỏ lựa chọn");
  expect(onChange).toHaveBeenCalledWith(undefined);
});
