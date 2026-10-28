import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import {
  I18nProvider,
  localeStorageKey,
  translate,
  translateValidation,
  useI18n,
} from ".";
import { en } from "./en";
import { vi as vietnamese } from "./vi";

function Example() {
  const { locale, setLocale, t, number, date, storageWarning } = useI18n();
  const [draft, setDraft] = useState("");
  return (
    <>
      <button onClick={() => setLocale(locale === "vi" ? "en" : "vi")}>
        {t("Kiểm tra")}
      </button>
      <input
        aria-label="draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <span>{number(1234.5)}</span>
      <span>
        {date(new Date("2026-10-28T18:00:00Z"), {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </span>
      {storageWarning && <p>Session only</p>}
    </>
  );
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.lang = "vi";
});
describe("bilingual foundation", () => {
  it("has matching parameters and nonempty translations for both languages", () => {
    expect(Object.keys(vietnamese).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(en[key].trim().length).toBeGreaterThan(0);
      expect(vietnamese[key].trim().length).toBeGreaterThan(0);
      expect(en[key].match(/\{\{\w+\}\}/g)?.sort() ?? []).toEqual(
        vietnamese[key].match(/\{\{\w+\}\}/g)?.sort() ?? [],
      );
      expect(/[À-ỹĐđ]/u.test(en[key])).toBe(false);
    }
    expect(translate("vi", "Source")).toBe("Nguồn");
    expect(translate("vi", "INTERNAL")).toBe("Nội bộ");
  });
  it("localizes dynamic flow errors without translating technical mapping keys", () => {
    expect(
      translateValidation(
        "en",
        "Chưa thể xem dry run: Thiếu ánh xạ vendor_code.",
      ),
    ).toBe("Dry run unavailable: Missing mapping: vendor_code.");
    expect(translateValidation("vi", "Chưa nối Source tới Validate.")).toBe(
      "Chưa nối Nguồn tới Kiểm tra.",
    );
    expect(
      translateValidation(
        "en",
        "Trường company cần kiểu chuỗi, Active là boolean.",
      ),
    ).toBe("Field company requires a string; Active is boolean.");
  });
  it("interpolates without interpreting HTML and falls back for unknown messages", () => {
    expect(translate("en", "Bản ghi ({{count}})", { count: 3 })).toBe(
      "Records (3)",
    );
    expect(translate("en", "unknown.message")).toBe("unknown.message");
    expect(translateValidation("en", "Mã trường asset_id bị trùng.")).toBe(
      "Duplicate field key: asset_id.",
    );
    expect(translate("vi", "Bản nháp")).toBe("Bản nháp");
    expect(Object.values(en).every((value) => value.trim().length > 0)).toBe(
      true,
    );
  });
  it("switches language without clearing edits and restores the selection on remount", () => {
    const view = render(
      <I18nProvider>
        <Example />
      </I18nProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "draft" }), {
      target: { value: "Tên dữ liệu của tôi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra" }));
    expect(screen.getByRole("button", { name: "Validate" })).toBeTruthy();
    expect(
      (screen.getByRole("textbox", { name: "draft" }) as HTMLInputElement)
        .value,
    ).toBe("Tên dữ liệu của tôi");
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(localeStorageKey)).toBe("en");
    expect(screen.getByText("1,234.5")).toBeTruthy();
    expect(screen.getByText("10/29/2026")).toBeTruthy();
    view.unmount();
    render(
      <I18nProvider>
        <Example />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: "Validate" })).toBeTruthy();
  });
  it("ignores unsupported saved languages", () => {
    localStorage.setItem(localeStorageKey, "fr");
    render(
      <I18nProvider>
        <Example />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: "Kiểm tra" })).toBeTruthy();
  });
  it("keeps switching usable when browser storage is denied", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    render(
      <I18nProvider>
        <Example />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra" }));
    expect(screen.getByRole("button", { name: "Validate" })).toBeTruthy();
    expect(screen.getByText("Session only")).toBeTruthy();
  });
});
