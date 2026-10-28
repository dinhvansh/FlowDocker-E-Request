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

**FormDesigner**: definition, onChange, optional readOnly. Emits schema only. Host owns storage, version conflicts, publishing, approval and authentication.

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
