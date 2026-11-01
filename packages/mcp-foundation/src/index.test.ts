import { describe, expect, it, vi } from "vitest";
import {
  createMcpFoundation,
  isBoundedJson,
  type HostContext,
  type Json,
} from "./index";

const context: HostContext = {
  tenantId: "demo",
  appId: "flowdocker.e-request",
  actorId: "designer",
};
const create = (authorize = vi.fn(async () => true)) => {
  const readProjected = vi.fn(async () => ({
    id: "draft",
    title: "Projected only",
  }));
  const validate = vi.fn(async (configuration: Json, actor: HostContext) => {
    void configuration;
    void actor;
    return { valid: true, issues: [] };
  });
  return {
    readProjected,
    validate,
    authorize,
    host: createMcpFoundation({
      scope: context,
      authorize,
      adapters: [{ module: "forms", readProjected, validate }],
    }),
  };
};
describe("shared MCP foundation (not server authorization)", () => {
  it("lists only implemented authorized tools and exposes unavailable module slots", async () => {
    const { host } = create();
    expect((await host.listTools(context)).map((tool) => tool.name)).toEqual([
      "flowdocker_forms_read",
      "flowdocker_forms_validate",
    ]);
    expect(
      (await host.capabilities(context)).find(
        (module) => module.module === "approvals",
      )?.tools,
    ).toEqual([]);
    expect(
      (await host.listTools(context))[0].inputSchema.additionalProperties,
    ).toBe(false);
  });
  it("checks resource permission afresh on every call, including after discovery", async () => {
    const { host, authorize, readProjected } = create();
    await host.listTools(context);
    authorize.mockResolvedValue(false);
    expect(
      (await host.callTool(context, "flowdocker_forms_read", { id: "draft" }))
        .structuredContent,
    ).toMatchObject({ error: "FORBIDDEN" });
    expect(readProjected).not.toHaveBeenCalled();
    expect(authorize).toHaveBeenLastCalledWith(context, {
      module: "forms",
      action: "read_configuration",
      resourceId: "draft",
    });
  });
  it.each([
    { ...context, tenantId: "other" },
    { ...context, appId: "flowdocker.it-assets" },
    { ...context, actorId: "" },
  ])("denies wrong or missing host identity %j", async (actor) => {
    const { host, readProjected, authorize } = create();
    expect(await host.listTools(actor)).toEqual([]);
    expect(
      (await host.callTool(actor, "flowdocker_forms_read", { id: "draft" }))
        .isError,
    ).toBe(true);
    expect(readProjected).not.toHaveBeenCalled();
    expect(authorize).not.toHaveBeenCalled();
  });
  it("denies absent or failing authorization instead of trusting caller roles", async () => {
    const { host } = create(
      vi.fn(async () => {
        throw new Error("private policy detail");
      }),
    );
    expect(await host.listTools(context)).toEqual([]);
    expect(
      JSON.stringify(
        await host.callTool(context, "flowdocker_forms_read", { id: "draft" }),
      ),
    ).not.toContain("private");
    const absent = createMcpFoundation({
      scope: context,
      authorize: undefined as never,
      adapters: [
        {
          module: "forms",
          validate: async () => ({ valid: true, issues: [] }),
        },
      ],
    });
    expect(await absent.listTools(context)).toEqual([]);
  });
  it.each([
    {},
    { id: "draft", actorId: "admin" },
    { id: "../private" },
    { id: "x", tenantId: "other" },
    null,
    [],
    { id: 1 },
  ])("rejects invalid or spoofed read arguments %j", async (input) => {
    const { host, readProjected } = create();
    expect(
      (await host.callTool(context, "flowdocker_forms_read", input))
        .structuredContent,
    ).toMatchObject({ error: "INVALID_INPUT" });
    expect(readProjected).not.toHaveBeenCalled();
  });
  it("returns only the projected provider result and does not mutate configuration", async () => {
    const { host, validate } = create();
    const input = { configuration: { fields: [] } };
    expect(
      (await host.callTool(context, "flowdocker_forms_validate", input))
        .structuredContent,
    ).toMatchObject({ data: { valid: true, issues: [] } });
    expect(validate).toHaveBeenCalledWith(input.configuration, context);
    expect(validate.mock.calls[0][0]).not.toBe(input.configuration);
    expect(
      (await host.callTool(context, "flowdocker_forms_read", { id: "draft" }))
        .structuredContent,
    ).toMatchObject({ data: { id: "draft", title: "Projected only" } });
  });
  it("does not execute unknown tools, publish commands, SQL or URLs", async () => {
    const { host, readProjected, validate } = create();
    for (const tool of [
      "flowdocker_forms_publish",
      "sql",
      "https://example.com",
    ])
      expect(
        (await host.callTool(context, tool, {})).structuredContent,
      ).toMatchObject({ error: "UNAVAILABLE" });
    expect(readProjected).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
  });
  it("bounds inputs/results, catches provider errors and rejects malformed diagnostics", async () => {
    const broken = createMcpFoundation({
      scope: context,
      authorize: async () => true,
      adapters: [
        {
          module: "forms",
          readProjected: async () => {
            throw new Error("secret token");
          },
          validate: async () => ({ valid: true, issues: ["inconsistent"] }),
        },
      ],
    });
    expect(
      JSON.stringify(
        await broken.callTool(context, "flowdocker_forms_read", {
          id: "draft",
        }),
      ),
    ).not.toContain("secret token");
    expect(
      (
        await broken.callTool(context, "flowdocker_forms_validate", {
          configuration: {},
        })
      ).structuredContent,
    ).toMatchObject({ error: "INTERNAL_ERROR" });
    expect(
      (
        await broken.callTool(context, "flowdocker_forms_validate", {
          configuration: "x".repeat(1_000_001),
        })
      ).structuredContent,
    ).toMatchObject({ error: "INVALID_INPUT" });
    const large = createMcpFoundation({
      scope: context,
      authorize: async () => true,
      adapters: [
        { module: "forms", readProjected: async () => "x".repeat(1_000_001) },
      ],
    });
    expect(
      (await large.callTool(context, "flowdocker_forms_read", { id: "draft" }))
        .structuredContent,
    ).toMatchObject({ error: "RESULT_TOO_LARGE" });
  });
  it("rejects non-JSON objects, prototype keys, cycles, excessive depth and getters", () => {
    const cyclic: Json[] = [];
    cyclic.push(cyclic);
    let deep: Json = null;
    for (let i = 0; i < 40; i++) deep = [deep];
    const getter = vi.fn(() => "secret");
    for (const value of [
      cyclic,
      deep,
      new Date(),
      NaN,
      undefined,
      { fn: () => 1 },
      JSON.parse('{"__proto__":{}}'),
      Object.defineProperty({}, "private", { get: getter }),
    ])
      expect(isBoundedJson(value)).toBe(false);
    expect(getter).not.toHaveBeenCalled();
    expect(isBoundedJson({ values: [0, false, null, "ok"] })).toBe(true);
  });
  it("freezes registration and returns detached descriptors", async () => {
    const adapter = {
      module: "forms" as const,
      readProjected: async (): Promise<Json> => ({ id: "original" }),
    };
    const options = {
      scope: { ...context },
      authorize: async () => true,
      adapters: [adapter],
    };
    const host = createMcpFoundation(options);
    options.scope.tenantId = "other";
    adapter.readProjected = async () => ({ id: "replacement" });
    (await host.listTools(context))[0].name = "corrupt";
    expect((await host.listTools(context))[0].name).toBe(
      "flowdocker_forms_read",
    );
    expect(
      (await host.callTool(context, "flowdocker_forms_read", { id: "draft" }))
        .structuredContent,
    ).toMatchObject({ data: { id: "original" } });
    expect(() =>
      createMcpFoundation({
        ...options,
        scope: context,
        adapters: [adapter, adapter],
      }),
    ).toThrow("duplicate");
  });
});
