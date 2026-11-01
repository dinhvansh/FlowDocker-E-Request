/** Synthetic consumers only. No real identity, persistence or security service. */
import {
  createMcpFoundation,
  type HostContext,
  type Json,
} from "@flowdocker/mcp-foundation";
import {
  applicationConfigurationAdapter,
  formConfigurationAdapter,
} from "@flowdocker/mcp-foundation/adapters";

export function syntheticHost(
  appId: "flowdocker.e-request" | "flowdocker.it-assets",
) {
  const context: HostContext = {
    tenantId: `demo-${appId.split(".")[1]}`,
    appId,
    actorId: "synthetic-designer",
  };
  const form: Json = {
    id: "sample",
    title: { vi: "Mẫu thử", en: "Sample" },
    version: 1,
    status: "DRAFT",
    fields: [
      {
        id: "title",
        key: "title",
        type: "text",
        label: { vi: "Tên", en: "Title" },
        required: true,
        options: [],
      },
    ],
  };
  const app: Json = {
    appId,
    title: "Synthetic app",
    version: "0.1.0",
    status: "DRAFT",
    modules: ["identity", "permissions", "forms"],
  };
  const host = createMcpFoundation({
    scope: context,
    // Demo permission only. A server must verify current membership and service permissions.
    authorize: async (actor) => actor.actorId === context.actorId,
    adapters: [
      formConfigurationAdapter(async (id) => {
        if (id !== "sample") throw new Error("Not available");
        return form;
      }),
      applicationConfigurationAdapter(async (id) => {
        if (id !== appId) throw new Error("Not available");
        return app;
      }),
    ],
  });
  return { host, context, form, app };
}
