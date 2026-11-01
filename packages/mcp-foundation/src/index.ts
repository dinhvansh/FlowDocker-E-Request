/** Transport-neutral contracts. The host, never tool arguments, supplies identity. */
export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };
export const platformModules = [
  "applications",
  "forms",
  "master",
  "permissions",
  "identity",
  "organization",
  "connections",
  "data-flows",
  "approvals",
  "requests",
  "tasks",
  "finance",
  "audit",
  "notifications",
  "storage",
] as const;
export type PlatformModule = (typeof platformModules)[number];
export interface HostContext {
  readonly tenantId: string;
  readonly appId: string;
  readonly actorId: string;
}
export interface AccessRequest {
  readonly module: PlatformModule;
  readonly action: "read_configuration" | "validate_configuration";
  readonly resourceId?: string;
}
export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, Json>;
    required: string[];
    additionalProperties: false;
  };
  annotations: {
    readOnlyHint: true;
    destructiveHint: false;
    idempotentHint: true;
    openWorldHint: false;
  };
}
export type ErrorCode =
  | "INVALID_INPUT"
  | "FORBIDDEN"
  | "UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "RESULT_TOO_LARGE";
export type ToolResult =
  | {
      isError: false;
      content: [{ type: "text"; text: string }];
      structuredContent: { contractVersion: "1"; data: Json };
    }
  | {
      isError: true;
      content: [{ type: "text"; text: string }];
      structuredContent: { contractVersion: "1"; error: ErrorCode };
    };
export interface ConfigurationAdapter {
  module: PlatformModule;
  /** Must authorize rows AND project fields before returning any configuration. */
  readProjected?: (id: string, context: HostContext) => Promise<Json>;
  /** Pure diagnostics. Never writes or executes the submitted configuration. */
  validate?: (
    configuration: Json,
    context: HostContext,
  ) => Promise<{ valid: boolean; issues: string[] }>;
}
export interface FoundationOptions {
  scope: { tenantId: string; appId: string };
  /** Mandatory integration point; absent/throwing/non-true decisions deny access. */
  authorize: (context: HostContext, request: AccessRequest) => Promise<boolean>;
  adapters: readonly ConfigurationAdapter[];
}
const maxLength = 1_000_000;
const token = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;
const forbiddenKeys = new Set(["__proto__", "prototype", "constructor"]);

/** Bound traversal before serialization; reject non-JSON values, cycles and getters. */
export function isBoundedJson(value: unknown): value is Json {
  let budget = 20_000;
  const seen = new Set<object>();
  const visit = (item: unknown, depth: number): boolean => {
    if (--budget < 0 || depth > 32) return false;
    if (item === null || typeof item === "boolean") return true;
    if (typeof item === "string") return item.length <= maxLength;
    if (typeof item === "number") return Number.isFinite(item);
    if (typeof item !== "object" || seen.has(item)) return false;
    if (Object.getOwnPropertySymbols(item).length) return false;
    if (
      Array.isArray(item) &&
      (item.length > budget || Object.keys(item).length !== item.length)
    )
      return false;
    if (
      !Array.isArray(item) &&
      Object.getPrototypeOf(item) !== Object.prototype &&
      Object.getPrototypeOf(item) !== null
    )
      return false;
    seen.add(item);
    const properties = Object.getOwnPropertyDescriptors(item);
    const valid = Object.entries(properties).every(
      ([key, descriptor]) =>
        (Array.isArray(item) && key === "length") ||
        (!forbiddenKeys.has(key) &&
          descriptor.enumerable === true &&
          (!Array.isArray(item) || /^(0|[1-9][0-9]*)$/.test(key)) &&
          "value" in descriptor &&
          visit(descriptor.value, depth + 1)),
    );
    seen.delete(item);
    return valid;
  };
  try {
    return visit(value, 0) && JSON.stringify(value).length <= maxLength;
  } catch {
    return false;
  }
}
function failure(error: ErrorCode): ToolResult {
  // Never serialize exception messages, submitted configuration or identity.
  return {
    isError: true,
    content: [{ type: "text", text: error }],
    structuredContent: { contractVersion: "1", error },
  };
}
function success(data: unknown): ToolResult {
  if (!isBoundedJson(data)) return failure("RESULT_TOO_LARGE");
  const snapshot = JSON.parse(JSON.stringify(data)) as Json;
  return {
    isError: false,
    content: [{ type: "text", text: JSON.stringify(snapshot) }],
    structuredContent: { contractVersion: "1", data: snapshot },
  };
}

export function createMcpFoundation(options: FoundationOptions) {
  if (
    !token.test(options.scope.tenantId) ||
    !/^flowdocker\.[a-z][a-z0-9-]*$/.test(options.scope.appId)
  )
    throw new Error("Invalid host scope");
  const scope = Object.freeze({ ...options.scope });
  const authorize = options.authorize;
  const entries = new Map<
    string,
    {
      descriptor: ToolDescriptor;
      request: AccessRequest;
      adapter: ConfigurationAdapter;
    }
  >();
  const registered = new Set<PlatformModule>();
  for (const original of options.adapters) {
    const adapter = Object.freeze({ ...original });
    if (
      !platformModules.includes(adapter.module) ||
      registered.has(adapter.module)
    )
      throw new Error("Invalid or duplicate module adapter");
    registered.add(adapter.module);
    for (const action of [
      "read_configuration",
      "validate_configuration",
    ] as const) {
      if (
        !(action === "read_configuration"
          ? adapter.readProjected
          : adapter.validate)
      )
        continue;
      const read = action === "read_configuration";
      const name = `flowdocker_${adapter.module.replaceAll("-", "_")}_${read ? "read" : "validate"}`;
      entries.set(name, {
        adapter,
        request: { module: adapter.module, action },
        descriptor: {
          name,
          description: `${read ? "Read host-projected" : "Validate proposed"} ${adapter.module} configuration. ${read ? "No runtime records." : "Diagnostics only; does not save, publish or execute."}`,
          inputSchema: {
            type: "object",
            properties: read
              ? {
                  id: { type: "string", pattern: token.source, maxLength: 128 },
                }
              : { configuration: {} },
            required: [read ? "id" : "configuration"],
            additionalProperties: false,
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
          },
        },
      });
    }
  }
  const contextSnapshot = (context: HostContext): HostContext | undefined => {
    if (
      !context ||
      context.tenantId !== scope.tenantId ||
      context.appId !== scope.appId ||
      typeof context.actorId !== "string" ||
      !token.test(context.actorId)
    )
      return undefined;
    return Object.freeze({ ...scope, actorId: context.actorId });
  };
  const allowed = async (context: HostContext, request: AccessRequest) => {
    try {
      return (
        typeof authorize === "function" &&
        (await authorize(context, Object.freeze({ ...request }))) === true
      );
    } catch {
      return false;
    }
  };
  return {
    contractVersion: "1" as const,
    async listTools(context: HostContext): Promise<ToolDescriptor[]> {
      const trusted = contextSnapshot(context);
      if (!trusted) return [];
      const visible: ToolDescriptor[] = [];
      for (const { descriptor, request } of entries.values()) {
        if (await allowed(trusted, request))
          visible.push(
            JSON.parse(JSON.stringify(descriptor)) as ToolDescriptor,
          );
      }
      return visible;
    },
    async capabilities(context: HostContext) {
      const tools = await this.listTools(context);
      return platformModules.map((module) => ({
        module,
        tools: tools
          .filter((tool) =>
            tool.name.startsWith(`flowdocker_${module.replaceAll("-", "_")}_`),
          )
          .map((tool) => tool.name),
      }));
    },
    async callTool(
      context: HostContext,
      name: string,
      input: unknown,
    ): Promise<ToolResult> {
      const trusted = contextSnapshot(context);
      if (!trusted) return failure("FORBIDDEN");
      const entry = entries.get(name);
      if (!entry) return failure("UNAVAILABLE");
      if (
        !isBoundedJson(input) ||
        !input ||
        Array.isArray(input) ||
        typeof input !== "object"
      )
        return failure("INVALID_INPUT");
      const read = entry.request.action === "read_configuration";
      const key = read ? "id" : "configuration";
      if (
        Object.keys(input).length !== 1 ||
        !Object.hasOwn(input, key) ||
        (read && (typeof input.id !== "string" || !token.test(input.id)))
      )
        return failure("INVALID_INPUT");
      const args = JSON.parse(JSON.stringify(input)) as Record<string, Json>;
      const request = {
        ...entry.request,
        ...(read ? { resourceId: args.id as string } : {}),
      };
      if (!(await allowed(trusted, request))) return failure("FORBIDDEN");
      try {
        if (read && entry.adapter.readProjected)
          return success(
            await entry.adapter.readProjected(args.id as string, trusted),
          );
        if (entry.adapter.validate) {
          const result = await entry.adapter.validate(
            args.configuration,
            trusted,
          );
          if (
            typeof result.valid !== "boolean" ||
            !Array.isArray(result.issues) ||
            !result.issues.every((issue) => typeof issue === "string") ||
            result.valid !== (result.issues.length === 0)
          )
            return failure("INTERNAL_ERROR");
          return success({ valid: result.valid, issues: result.issues });
        }
        return failure("UNAVAILABLE");
      } catch {
        return failure("INTERNAL_ERROR");
      }
    },
  };
}
