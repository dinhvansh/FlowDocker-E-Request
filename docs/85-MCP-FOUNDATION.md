# Shared MCP foundation

## Scope and impact map

Owner decision: implement the shared foundation first; connect an actual MCP server later.

| Area | This slice |
| --- | --- |
| Schema/API | Versioned JSON tool descriptors, bounded inputs/results, host adapters |
| UI | No change to Forms, navigation or Code Studio |
| Temporal/Teams | No execution or decision tools |
| Storage/migration | No persistence, migration, publish or record mutation |
| Security | Host-bound tenant/app; fresh authorization on discovery and calls; explicit projected reads; deny by default |
| Tests | Two independent synthetic hosts, scope denial, invalid JSON, handler failure and projection |

`@flowdocker/mcp-foundation` is an internal transport-neutral tool layer, **not a running MCP server**. It does not implement MCP initialization, transport, authentication or production authorization. Future SDK transport should map `listTools` and `callTool` to MCP tools/list and tools/call, derive context from an authenticated session, and keep handlers behind actual service authorization/RLS.

## Module coverage

The common module catalog includes applications, forms, master, permissions, identity, organization, connections, data-flows, approvals, requests, tasks, finance, audit, notifications and storage. Each host explicitly registers available read/validation handlers. Unregistered capabilities remain unavailable; catalog membership never creates a callable tool or grants access.

Read providers must fetch **already authorized and projected configuration** for the supplied context and resource ID. Do not hand the registry complete records and expect automatic masking. Never expose credentials, employee records, payment data, file URLs or runtime values as configuration. Validation is diagnostic only: no save/apply/publish. Form Code Studio continues to edit the same original schema.

## Reusable component impact

Shared: tool contracts, registry, module catalog, authorization boundary and configuration adapter. Domain: providers, field projection, authoritative validators and service implementations. No E-Request imports in the package. Two synthetic consumers use the public API in `examples/hosts.ts`. This is not evidence of real server or database isolation.
