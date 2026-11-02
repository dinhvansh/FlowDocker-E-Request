import { describe, expect, it } from "vitest";
import { demoForms } from "./form-drafts";
import {
  formRecoveryKey,
  readFormRecovery,
  writeFormRecovery,
  type FormRecovery,
} from "./form-recovery";

const entry: FormRecovery = {
  version: 1,
  definition: demoForms[0],
  source: "{",
  codeDirty: true,
};
describe("tab-local form recovery boundary", () => {
  it("retains exact invalid or empty code with the last valid canvas", () => {
    for (const source of ["{", "", "  {\n  broken"]) {
      let raw = "";
      writeFormRecovery(
        {
          setItem: (key, value) => {
            expect(key).toBe(formRecoveryKey);
            raw = value;
          },
        },
        { ...entry, source },
      );
      expect(readFormRecovery({ getItem: () => raw })).toEqual({
        ...entry,
        source,
      });
    }
  });
  it("uses the analyzed definition when recovered code is valid", () => {
    const changed = {
      ...demoForms[0],
      title: { vi: "Khôi phục", en: "Recovered" },
    };
    const restored = readFormRecovery({
      getItem: () =>
        JSON.stringify({ ...entry, source: JSON.stringify(changed) }),
    });
    expect(restored?.definition.title.en).toBe("Recovered");
  });
  it("rejects malformed, incompatible and oversized recovery", () => {
    for (const raw of [
      "{",
      "null",
      JSON.stringify({ ...entry, version: 2 }),
      JSON.stringify({ ...entry, definition: {} }),
      " ".repeat(2_000_001),
    ])
      expect(() => readFormRecovery({ getItem: () => raw })).toThrow();
    expect(readFormRecovery({ getItem: () => null })).toBeNull();
    expect(() =>
      writeFormRecovery(
        { setItem: () => {} },
        { ...entry, source: "x".repeat(1_000_001) },
      ),
    ).toThrow();
  });
  it("propagates denied or full storage to the host without claiming success", () => {
    expect(() =>
      readFormRecovery({
        getItem: () => {
          throw new Error("denied");
        },
      }),
    ).toThrow("denied");
    expect(() =>
      writeFormRecovery(
        {
          setItem: () => {
            throw new Error("full");
          },
        },
        entry,
      ),
    ).toThrow("full");
  });
});
