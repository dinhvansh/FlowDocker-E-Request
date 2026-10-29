# FlowDocker Forms 0.2.0

Original React form designer and renderer, extracted from E-Request. Vietnamese/English, shadcn/Radix, light/dark. Workspace source: @flowdocker/form-builder; portable package: @flowdocker/forms. No Form.io source is bundled. Not a drop-in Form.io schema adapter.

## Install and use

Requires React/React DOM 19 (tested 19.2.0). Install: `npm install ./flowdocker-forms-0.2.0.tgz`.

```tsx
import {useState} from "react";
import {FormsProvider, FormsLanguagePicker, FormDesigner, FormRenderer,
  createShowcaseDefinition, type PreviewValues} from "@flowdocker/forms";
import "@flowdocker/forms/styles.css";

export function MyForms() {
  const [schema, setSchema] = useState(createShowcaseDefinition);
  const [values, setValues] = useState<PreviewValues>({});
  return <FormsProvider initialLocale="vi" theme="light">
    <FormsLanguagePicker />
    <FormDesigner definition={schema} onChange={next => {
      setSchema(next); setValues({});
    }} />
    <FormRenderer key={schema.id} definition={schema} values={values}
      onChange={setValues} onSubmit={data => console.log(data)} />
  </FormsProvider>;
}
```

Replace console.log with your host save adapter. Remount the renderer when changing the form identity/schema to reset internal validation, wizard and provider state. Use FormPreview for validation-only previews.

## Controls

33 types: text, textarea, email, url, phone, password, number, currency, date, datetime, time, checkbox, select, radio, multiselect, checkboxes, tags, file, signature, hidden, content, section, columns, tabs, repeat, keyvalue, survey, address, day, container, table, alert and button.

- Searchable palette, drag placement/order, keyboard drag and move buttons, parent selection, clone/delete, undo/redo, schema import/export.
- Typed all/any visibility/required/disabled conditions; cross-field/date comparison. No script execution.
- Decimal add/subtract/multiply/divide/sum/average/count/min/max, row aggregates, cycle rejection.
- Required/format/length/range/row uniqueness validation, inline errors/summary, pending/error submission states.
- File constraints and asynchronous upload/remove callbacks, pointer signature and typed name alternative. A signature is a UI acknowledgement, not a cryptographic signature.
- Responsive columns, sections, tabs and wizard steps; Vietnamese/English and theme switching.

## Public host contracts

**FormDesigner**: definition, onChange, optional readOnly, providers and inspectorSection (`basic` or `logic`). Emits schema only. Host owns storage, version conflicts, publishing, approval and authentication. The UX V2 designer uses a grouped toolbox, shared runtime field controls on a live canvas, nested selection, insertion points, an optional structural outline and contextual properties. Toolbox/inspector collapse; inspector width can be adjusted on desktop. Mobile switches panes using tabs. Clicking or pressing Enter adds fields; separate handles support drag.

**FormCanvas**: definition, selectedId, readOnly, providers, onSelect, onInsert, onMove, onClone, onDelete; optional additive `onPatch(id, changes)` enables inline labels. Enter/blur commits one change; Escape cancels. Authoring component used inside FormDesigner; supply dnd-kit DndContext/SortableContext when embedding it separately. It reveals conditional fields for editing and renders one structural sample row for repeat fields. Sample inputs are local component state and never saved into the schema. Use FormPreview to exercise real visibility, row editing, validation and submission filtering. This is an authoring surface, not an authorization boundary.

**FieldInspector / FieldInspectorProps / InspectorSection**: exported contextual property panel. Host supplies selected field, references, containers, current category, errors, panel width and typed change/move/clone/delete callbacks. Host owns schema history and persistence; inspector has no network or application routes. FormDesigner is the integrated example; `packages/form-builder/examples` runs without E-Request and includes synthetic payment providers.

The shared UI package also exports `Combobox` / `ComboboxProps` for searchable choice lists. Form runtime select fields and the designer's parent-container picker use it; it preserves the option values and only changes presentation and filtering.

**Repeat presentation**: simple rows of up to six leaf controls render as a real table, with accessible control labels and stacked mobile rows. Complex/nested controls retain the existing stacked layout. Runtime owns row values through the existing engine; min/max guards and row calculations remain unchanged. Internal `RepeatField` and `InlineLabelEditor` are implementation components, not stable public APIs.

**createPaymentDefinition**: synthetic payment scenario with conditional advance reason, provider identifiers, expense rows and decimal aggregate. Register `demo.companies` / `demo.departments` using the host's providers map; no live service, upload or ERP integration is implied. `createShowcaseDefinition` remains available.

**FormRenderer**: definition, values, onChange; optional onSubmit, onInvalid, readOnly, access, providers, onUpload, onRemoveFile, renderers. Validation precedes submit. Rejected submission preserves values. Pending uploads block submission. Reset aborts upload controls. Read-only guards raw submit events as well as buttons.

**FormsProvider**: optional controlled locale/onLocaleChange, initialLocale, theme. Does not mutate document language or persist locale. useFormsLocale exposes local locale choice. Workspace consumers use @flowdocker/i18n and @flowdocker/ui.

**providers**: map registered IDs to `(context: {query, dependency, signal}) => Promise<ChoiceOption[]>`. ChoiceOption is `{value, label: {vi,en}}`. Debounce 200ms; stale requests aborted/ignored; at most 500 choices. Server must authorize access. Reserved value __fd_clear__ is rejected.

**onUpload**: `(file, {field, signal}) => Promise<{id, reference}>`, reference is an opaque server-owned ID. onRemoveFile(reference) removes it. No upload adapter means unavailable, never fake persistence. Server must revalidate file contents/limits/ownership, enforce access, and clean orphaned uploads. No endpoint/credentials are embedded.

**renderers**: registered React controls receive field, value, onChange, disabled, id and aria props. Host registers code; schemas only refer to an ID.

**access**: presentation map keyed by field key or repeat path (rows.0.cost); read allow/mask/deny, write boolean. Browser rules and output filtering are not security enforcement. Server independently validates schemas, formulas, tenant scope, field access and submitted values. Never send unauthorized raw data to the browser.

## Schema and migration

FormDefinition preserves id, bilingual title, positive version, DRAFT status, fields; adds schemaVersion 2 and optional display form/wizard. V1 drafts remain readable, exports use v2. Public helpers: importFormDefinition/exportFormDefinition/isFormDefinition/validateFormDefinition/defaultValues/prepareValues/validatePreview/submissionValues.

Visual layouts share object scope. Repeat introduces row objects; container introduces a nested object. Address is manually entered structured data; day stores year/month/day. Table lays out child controls in 1–3 columns. Button supports submit/reset only. Keys are stable lowercase identifiers. Rules reference keys; aggregates may reference rows.amount. Calculations produce decimal strings. Files are metadata records; signatures store point strokes or typed name. Outputs omit unknown, conditionally hidden, disabled or denied values. Hidden field type can carry a registered default value.

Limits: 1MB import, 300 fields, 5 nested schema levels, 50 static choices, 100 repeat rows, 20 conditions/formula operands, precision 0–8. Controlled external values have depth/node/size budgets. No executable JS/HTML, arbitrary data-loading URLs or SQL.

## Extraction and verification

Run npm run build:forms, then npm pack in dist/forms-library. Outputs include ES module JS, CSS, rolled declarations, dependency inventory and license texts. Runtime dependencies bundled; React/React DOM peers. No private workspace imports remain.

Independent consumer: examples/forms-consumer. Copy tarball beside package.json, npm install, npm run build, npm run dev. Imports only the packed product. Node 20.19+ or 22.12+ for Vite. npm run examples:forms runs the source workspace example; E-Request is the other host. See docs/56 for actual evidence.

## Ownership and limits

Original work is reserved for the owner; see OWNERSHIP.md. No public license grant is assumed. Preserve THIRD_PARTY_NOTICES.md, dependency-inventory.json and licenses/ when redistributing. Upstream parts retain their own licenses. private:true prevents accidental npm publication. Customer commercial license terms, pricing and support obligations are not defined by this package.

UI toolkit only: no Form.io server/hosted submissions, backend ACL, workflow execution, production file storage, CAPTCHA/geocoding integration, rich HTML editor, embedded external forms or server PDF. No verified percentage of complete Form.io equivalence. CSS includes Tailwind preflight/global font rules; verify host styles when embedding. Formal WCAG certification, external customer UAT and stable 1.0 API remain pending.

Repeat settings: `FieldInspector` optionally accepts `onSelectField(id)` and `onAddColumn(type)` for a contextual repeating-table editor. The host owns schema history and selection. Simple leaf columns stay in a horizontally scrollable table on desktop regardless of column count; phone layouts stack rows and complex nested field layouts retain the existing card presentation. No schema migration.

Form orientation: optional `FormDefinition.orientation` accepts `portrait` (default) or `landscape`. The designer selector persists this display metadata; canvas/preview expand up to 760px/1120px within available space. Mobile remains responsive. Import/export preserve orientation and reject unknown enum values. Old strict parsers must update before loading definitions containing the new property; no migration for existing definitions. This is screen presentation, not a PDF generation feature.

Automatic repeat entry: optional `FormField.autoRows: boolean` defaults off. Enable it in repeating-table settings to show a virtual trailing entry row while below maxRows. It is excluded from controlled values and validation until meaningful data is entered; numeric zero is data. Partly filled real rows retain normal required validation. Empty real rows are removed on moving focus to another control outside the row (popup interactions and null blur targets are excluded), preserving minRows. Add row focuses the last entry in automatic mode and appends a real row in manual mode. Read-only/design behavior is unchanged. Import/export accepts the new optional boolean; older strict consumers must update their library.

Currency controls now display localized grouping while keeping canonical decimal strings in values: VI `1.234.567,89`, EN `1,234,567.89`. Enter/paste using the current locale separators. Calculations, min/max/integer and required validation continue to use the canonical value. Currency controls expose textbox semantics with inputMode=decimal; plain number controls retain spinbuttons. This applies to repeating-table cells and disabled calculated totals as well.
