# @flowdocker/permission-builder

Private workspace package. Original FlowDocker presentation built from shared shadcn/Radix UI; browser-local prototype, not backend authorization.

## Public API

`PermissionBuilder({ roles, resources, onSave, loading?, error? })`: controlled roles and host-owned resource/action metadata. `onSave(role): Promise<void>` persists a draft through the host adapter. The current host stores synthetic drafts in localStorage.

Optional `ResourceAction.fields: PermissionField[]` registers the field protection view. Each field has a stable `key`, a translatable `label`, and a **synthetic-only** `sampleValue` (string/number/boolean). Existing role policy keys are preserved; missing/unknown rules simulate DENY. Resources without fields remain compatible and show no record preview.

```tsx
const resources: ResourceAction[] = [{
  resource: "demo.asset",
  label: "Asset",
  actions: ["READ", "EXPORT"],
  fields: [{ key: "asset.tag", label: "Asset tag", sampleValue: "SYNTHETIC-001" }],
}];
<PermissionBuilder roles={roles} resources={resources} onSave={saveDraft} />
```

`simulateFieldProjection(role, resource, action, fixture)` is exported by `@flowdocker/app-contracts`. It returns a simulated access decision plus field effects. DENY entries have no `value`; MASK entries return a constant bullet placeholder, independent of source length. READ/EXPORT must be registered and granted; EXPORT also requires READ. Actor/scope denial overrides field rules. Only configured fields are returned. Never supply real records to this browser simulator.

## Evidence and limits

Pure contract tests: `packages/app-contracts/src/field-projection.test.ts`. Isolated browser journey: `output/playwright/permissions-fields-qa.cjs` against the standard host, with state restored afterward. See docs/72 for screenshots and actual commands. This snippet documents a second domain shape; it is not evidence of a deployed second host. Backend authorization, field write rules, policy publication, server revisions, owner UX acceptance and platform-ready acceptance remain pending.
