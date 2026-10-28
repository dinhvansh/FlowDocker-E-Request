# @flowdocker/form-builder

Private workspace package, version 0.1.0. Original FlowDocker schema editor and preview built on existing `@flowdocker/ui` shadcn/Radix wrappers and `@flowdocker/i18n`. Not a Form.io adapter or production form engine.

## Public API

- `FormDefinition`: stable id, bilingual title, integer version, DRAFT status, ordered fields.
- `FormField`: stable id/key, bilingual label, type, required, bilingual select choices.
- `FormDesigner({ definition, onChange })`: controlled field editor; callback receives a new definition. No storage, network, app IDs or business-service imports.
- `FormPreview({ definition, values, onChange })`: controlled transient values; local validation only, no submission callback. Remount when changing the schema to reset its validation state.
- `validateFormDefinition` / `validatePreview`: pure issue arrays with translatable messages and parameters. Browser convenience, never a backend validation/ACL substitute.
- `isFormDefinition`: runtime shape guard for local definitions; incomplete schemas can be inspected and repaired, then validated before saving.

Supported fields: text, textarea, finite number, ISO date, checkbox and single select. Required checkbox means checked. No currency accounting, attachments, identities, lookups, expressions or conditional rules.

## Isolated example

Run `npm run examples:forms` and open the URL printed by Vite. The example imports only public package APIs and shows schema editing/preview, synthetic data, both languages and theme switching. The E-Request host uses `apps/e-request-web/src/forms.tsx`; two synthetic intake definitions exercise the same package, not independent live apps.

Storage adapter, save/discard behavior, schema-change preview reset and publication controls belong to the host. Production API/security tests, immutable server versions, Form.io POC, Storybook and independent second-app portability are NOT DONE.
