# @flowdocker/master-builder

Reusable MasterBuilder uses typed MasterEntity metadata and host callbacks. It has no storage or application routes.

Required props: entities, onSave(entity): Promise<void>. Optional loading/error control read states.

Optional deletion: onDelete(id): Promise<void> enables Delete entity and confirmation. getDeleteBlockers(entity): string[] returns host-localized dependency/policy reasons; any reason disables confirmation. Host must revalidate current dependencies/authorization in onDelete. Rejection keeps the dialog open and shows localized failure; pending disables repeat confirmation/cancel. Without onDelete, existing consumers are unchanged.

E-Request supplies browser-local synthetic policy/persistence; tests use an independent callback host. Production authorization, archive/audit and real second-host deletion integration remain pending. See docs/79-MASTER-ENTITY-DELETION.md for actual QA and limitations.

Field keys validate immediately (required, lowercase ASCII identifier, unique within entity). Invalid text stays local and never calls onSave; valid edits commit on blur/Enter, Escape restores the stored key. Failed commits remain editable for retry. Existing invalid keys are surfaced, not migrated. VI/EN errors use the shared Field accessible error association. See docs/80-LIVE-MASTER-FIELD-KEY-VALIDATION.md.

Record maintenance: optional `onSaveRecords(expectedEntity, records): Promise<void>` enables Add/Edit/Delete for valid LOCAL_CATALOG schemas. Without the adapter, records stay read-only. All schema fields are shown; the inspector is hidden in Records to give the table more space. Shared typed inputs validate required/type/date/reference and conventional id/code uniqueness; existing record IDs stay immutable and legacy properties are retained. Save errors keep the draft; deletion needs confirmation. An independent controlled callback test host exercises the package.

Hosts must re-read current data, enforce source ownership/authorization, reject stale expected snapshots, validate with exported `assertRecordChange`, and persist records without changing schema status/version. `SaveMasterRecords` and `MasterRecord` types are exported. E-Request currently uses strict browser-local storage only; production API authorization, archival/audit and historical submission dependencies remain pending. See docs/81-MASTER-RECORD-EDITING.md.
