# @flowdocker/mcp-foundation

Private workspace package, version 0.1.0. Transport-neutral **foundation**, not a running MCP server. No SDK/network listener/AI service or new UI is installed.

## Public API

- `createMcpFoundation({ scope, authorize, adapters })`: bind one tenant/app and implemented handlers.
- `listTools(context)`: detached JSON Schema tool descriptors for authorized capabilities only.
- `callTool(context, name, input)`: bounded JSON, fresh permission check, projected result or sanitized error.
- `capabilities(context)`: all platform module slots, with available authorized tool names; empty means unavailable to this caller.
- `formConfigurationAdapter` / `applicationConfigurationAdapter` from `/adapters`: reuse existing authoritative frontend draft validators. They never save or publish.
- `ConfigurationAdapter`: extension point for other modules; implement `readProjected` and/or pure `validate` only when available.

```ts
import { createMcpFoundation } from "@flowdocker/mcp-foundation";
import { formConfigurationAdapter } from "@flowdocker/mcp-foundation/adapters";

const tools = createMcpFoundation({
  scope: { tenantId: "demo", appId: "flowdocker.my-app" },
  authorize: async (context, request) => service.authorize(context, request),
  adapters: [
    formConfigurationAdapter((id, context) =>
      service.readAuthorizedProjectedForm(id, context),
    ),
  ],
});
// Context must come from a trusted host session, never AI/tool arguments.
const available = await tools.listTools(authenticatedContext);
const result = await tools.callTool(
  authenticatedContext,
  "flowdocker_forms_validate",
  { configuration: proposedForm },
);
```

`service` and `authenticatedContext` above are required host integrations, **not supplied authentication implementations**. Do not create an allow-all adapter around real browser storage. Existing visual permission simulation is not an authorization provider.

## Contracts and limits

Tool names: `flowdocker_<module>_read` (`{id}`) and `_validate` (`{configuration}`). Unknown input properties, spoofed context, unsafe IDs, prototype keys, cycles, non-JSON objects and over-limit input are rejected. Limits: 1,000,000 JSON characters, 20,000 visited values, depth 32. Providers may impose lower limits. Read-only MCP hints are documentation; real safety depends on pure handlers and authorized projections.

Result contract version `1`: MCP-compatible text content plus structured `{contractVersion,data}` or `{contractVersion,error}`. Errors: INVALID_INPUT, FORBIDDEN, UNAVAILABLE, INTERNAL_ERROR, RESULT_TOO_LARGE. Validation issues use stable codes and do not echo proposed values. Detailed form diagnostics remain in Form Code Studio.

Read authorization receives the resource ID; discovery and validation receive module-level actions. No wildcard/admin fallback, automatic field masking, record listing, raw SQL/HTTP/JS, credential access, arbitrary writes or approval commands. A service must still enforce tenant, actor, row/field policies and current state. Configuration itself may contain sensitive authored defaults: only expose host-projected schemas.

Adapters and scope are copied at registration; changing a handler requires a new host. Authorization is called for every operation, so revocation is not cached here. Host exceptions are sanitized. No tool persistence or mutation means no database migration/rollback required.

## Evidence and next step

`examples/hosts.ts` runs the same public contracts for synthetic E-Request and IT Assets. Unit tests exercise both actual module validators and all module extension slots. They demonstrate contract reuse, **not backend security or production E2E**.

Next: authenticated service adapters, authoritative projections and audit, then official MCP SDK transport. Browser UI and Form Code Studio remain unchanged. See `docs/85-MCP-FOUNDATION.md`.
