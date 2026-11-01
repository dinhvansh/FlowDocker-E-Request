import { describe, expect, it } from "vitest";
import { syntheticHost } from "../examples/hosts";
import { createMcpFoundation, platformModules, type Json } from "./index";
import {
  applicationConfigurationAdapter,
  formConfigurationAdapter,
} from "./adapters";

describe("existing module validators through shared tool contracts", () => {
  it.each(["flowdocker.e-request", "flowdocker.it-assets"] as const)(
    "supports an independent %s host with no domain imports",
    async (appId) => {
      const { host, context, form, app } = syntheticHost(appId);
      expect(await host.listTools(context)).toHaveLength(4);
      expect(
        (
          await host.callTool(context, "flowdocker_forms_read", {
            id: "sample",
          })
        ).structuredContent,
      ).toMatchObject({ data: form });
      expect(
        (
          await host.callTool(context, "flowdocker_forms_validate", {
            configuration: form,
          })
        ).structuredContent,
      ).toMatchObject({ data: { valid: true, issues: [] } });
      expect(
        (
          await host.callTool(context, "flowdocker_applications_validate", {
            configuration: app,
          })
        ).structuredContent,
      ).toMatchObject({ data: { valid: true } });
      const snapshot = JSON.stringify(form);
      expect(
        (
          await host.callTool(context, "flowdocker_forms_validate", {
            configuration: {
              ...(form as object),
              fields: [
                {
                  id: "x",
                  key: "INVALID KEY",
                  type: "text",
                  required: false,
                  options: [],
                  label: { vi: "X", en: "X" },
                },
              ],
            },
          })
        ).structuredContent,
      ).toMatchObject({ data: { valid: false } });
      expect(JSON.stringify(form)).toBe(snapshot);
    },
  );
  it("does not share identity or module configuration between hosts", async () => {
    const request = syntheticHost("flowdocker.e-request");
    const assets = syntheticHost("flowdocker.it-assets");
    expect(
      (
        await request.host.callTool(assets.context, "flowdocker_forms_read", {
          id: "sample",
        })
      ).structuredContent,
    ).toMatchObject({ error: "FORBIDDEN" });
    expect(
      (
        await assets.host.callTool(request.context, "flowdocker_forms_read", {
          id: "sample",
        })
      ).structuredContent,
    ).toMatchObject({ error: "FORBIDDEN" });
  });
  it("requires explicit read providers; validation-only adapters cannot disclose browser data", async () => {
    const { context } = syntheticHost("flowdocker.e-request");
    const host = createMcpFoundation({
      scope: context,
      authorize: async () => true,
      adapters: [formConfigurationAdapter(), applicationConfigurationAdapter()],
    });
    expect((await host.listTools(context)).map((tool) => tool.name)).toEqual([
      "flowdocker_forms_validate",
      "flowdocker_applications_validate",
    ]);
    expect(
      (await host.callTool(context, "flowdocker_forms_read", { id: "sample" }))
        .structuredContent,
    ).toMatchObject({ error: "UNAVAILABLE" });
    for (const configuration of [null, {}, { id: "x", eval: "arbitrary JS" }])
      expect(
        (
          await host.callTool(context, "flowdocker_forms_validate", {
            configuration,
          })
        ).structuredContent,
      ).toMatchObject({ data: { valid: false } });
    expect(
      (
        await host.callTool(context, "flowdocker_applications_validate", {
          configuration: { appId: "invalid" },
        })
      ).structuredContent,
    ).toMatchObject({ data: { valid: false } });
  });
  it("registers any platform module using the same interface, without pretending handlers exist", async () => {
    const { context } = syntheticHost("flowdocker.e-request");
    const host = createMcpFoundation({
      scope: context,
      authorize: async () => true,
      adapters: platformModules.map((module) => ({
        module,
        readProjected: async (): Promise<Json> => ({
          kind: "synthetic_configuration",
          module,
        }),
      })),
    });
    expect(await host.listTools(context)).toHaveLength(platformModules.length);
    for (const module of platformModules)
      expect(
        (
          await host.callTool(
            context,
            `flowdocker_${module.replaceAll("-", "_")}_read`,
            { id: "sample" },
          )
        ).structuredContent,
      ).toMatchObject({ data: { module } });
  });
});
