import type { MasterEntity } from "@flowdocker/app-contracts";
import { assertRecordChange } from "@flowdocker/master-builder";
import { withOrganizationSamples } from "./organization";
/** Strict browser-local write. Does not implement server authorization or archival. */
export function saveLocalMasterRecords(
  storage: Pick<Storage, "getItem" | "setItem">,
  fallback: MasterEntity[],
  expected: MasterEntity,
  records: MasterEntity["records"],
) {
  const key = "flowdocker.demo.entities.v1";
  const raw = storage.getItem(key);
  const parsed: unknown = raw === null ? fallback : JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        Array.isArray(e.fields) &&
        Array.isArray(e.records),
    ) ||
    new Set(parsed.map((e) => e.id)).size !== parsed.length
  )
    throw Error("Invalid master storage");
  const current = withOrganizationSamples(parsed);
  const entity = current.find((e) => e.id === expected.id);
  if (!entity || JSON.stringify(entity) !== JSON.stringify(expected))
    throw Error("Master data changed; reload before retrying");
  assertRecordChange(entity, records, current);
  storage.setItem(
    key,
    JSON.stringify(
      current.map((e) => (e.id === entity.id ? { ...e, records } : e)),
    ),
  );
}
