import { describe, expect, it } from "vitest";
import { isAppDraft, validateAppDraft, type AppDraft } from "./app-draft";
const valid: AppDraft = {
  appId: "flowdocker.it-assets",
  title: "IT Assets",
  version: "0.1.0",
  modules: ["identity", "permissions", "master"],
  status: "DRAFT",
};
describe("application draft boundaries", () => {
  it("accepts a synthetic independent app without adding backend actions", () => {
    expect(validateAppDraft(valid)).toEqual([]);
    expect(isAppDraft(valid)).toBe(true);
  });
  it("rejects duplicate IDs and unavailable dependency combinations", () => {
    expect(validateAppDraft(valid, [valid.appId])).toContain(
      "App ID đã tồn tại.",
    );
    expect(
      validateAppDraft({
        ...valid,
        modules: ["identity", "permissions", "flows"],
      }).join(" "),
    ).toContain("Flow Studio cần");
  });
  it("rejects malformed persisted data, unknown modules and missing mandatory modules", () => {
    for (const value of [
      null,
      {},
      { ...valid, modules: null },
      { ...valid, modules: ["root-access"] },
      { ...valid, version: "latest" },
      { ...valid, status: "PUBLISHED" },
      { ...valid, modules: [] },
    ])
      expect(isAppDraft(value)).toBe(false);
  });
});
