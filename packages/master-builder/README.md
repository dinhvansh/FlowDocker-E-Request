# @flowdocker/master-builder

Reusable MasterBuilder uses typed MasterEntity metadata and host callbacks. It has no storage or application routes.

Required props: entities, onSave(entity): Promise<void>. Optional loading/error control read states.

Optional deletion: onDelete(id): Promise<void> enables Delete entity and confirmation. getDeleteBlockers(entity): string[] returns host-localized dependency/policy reasons; any reason disables confirmation. Host must revalidate current dependencies/authorization in onDelete. Rejection keeps the dialog open and shows localized failure; pending disables repeat confirmation/cancel. Without onDelete, existing consumers are unchanged.

E-Request supplies browser-local synthetic policy/persistence; tests use an independent callback host. Production authorization, archive/audit and real second-host deletion integration remain pending. See docs/79-MASTER-ENTITY-DELETION.md for actual QA and limitations.
