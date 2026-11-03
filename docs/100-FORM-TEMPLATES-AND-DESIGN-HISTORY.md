# Templates and browser-local design history

## Scope and UX stages

Research input: owner's workflow needs independent template copies and a recovery point before larger visual/code changes. Existing catalog opens editable examples; recovery stores only the unfinished current session. Design: keep the catalog, introduce a Template library tab, preview/name/create dialog, and Design history in the existing form options menu. Audit: no automatic overwrite, no silent pruning, bounded browser storage, meaningful failures, compact typography, keyboard controls, VI/EN and stacked mobile comparison. The implemented interactive prototype is converted into app-specific typed host components; owner visual acceptance remains pending.

## How to use

- Catalog → Template library → choose a template → set both names → Create an independent form. Use Save draft to persist it. The existing unsaved-draft confirmation protects the active form.
- Open a form → options (…) → Design history → optionally name a snapshot → Save current snapshot. This is an explicit design checkpoint, not an automatic version on every Save draft.
- Select a snapshot to compare settings and fields against the current draft. Expand differences for readable before/after configuration and inspect the read-only snapshot preview.
- Restore into current draft requires confirmation, including replacement of unfinished Code Studio source. Save draft remains a separate action. Restoration clears stale session recovery before the normal recovery mechanism records the restored draft.
- Delete snapshot requires confirmation and affects only that snapshot.

## Storage contract and failure behavior

`flowdocker.form-versions.v1` contains `{version:1, entries: FormDesignVersion[]}`. Each entry stores id, formId, createdAt, optional-in-practice empty label, and a cloned, semantically valid FormDefinition. It contains no runtime test values. Maximum 20 entries per form, 100 total, serialized payload at most 2,000,000 JavaScript string characters. Entries are never silently evicted. Quota/parse/validation/unsupported-shape failures preserve existing storage and current draft; valid snapshots must be deleted explicitly to free space. Browser data can be edited or cleared by its owner: these are not protected immutable publication revisions or audit evidence.

Writes re-read the latest stored history synchronously and storage events refresh the panel. Restore re-reads/revalidates the selected snapshot. LocalStorage does not offer a transactional multi-user write contract; server concurrency, identity/tenant authorization, durable revisions and migration remain NOT DONE. No backend, request data, Temporal, Teams or MCP server is introduced.

## Templates and comparison

Templates are the existing synthetic example definitions exposed through an explicit creation flow. Creating assigns a new form ID and new recursively allocated field IDs, preserves field keys and therefore calculation/rule/data bindings, and starts at draft version 1. It never writes or modifies the source template.

Comparison uses stable field IDs, normalized property ordering, field metadata, parent/order locations and form-level settings. It identifies added, removed and changed fields (including movement). This is a configuration comparison, not request-value diffing or an arbitrary code engine. Restoring restores the whole selected definition, not a partial merge.

## Reusable component impact / boundaries

FormCatalog, FormTemplateDialog and FormHistory are E-Request host components. `form-versions.ts` is the app's storage adapter and pure clone/diff helpers. Shared FlowDocker Modal, Tabs, Button, Field/Input/Notice/Badge and original FormPreview are reused. No duplicate renderer, workflow or permission engine, new dependency or package publication. Reusable Forms package remains 0.5.8 from the columns slice; no schema migration is introduced by history. The standalone package is not coupled to localStorage or E-Request storage keys.

## Verification

Evidence and actual commands/results are recorded in docs/99 and output/playwright/form-history-* after completion. Synthetic fixtures only. Production backend, publication, UAT, owner visual acceptance and cross-user concurrent storage guarantees remain NOT DONE.
