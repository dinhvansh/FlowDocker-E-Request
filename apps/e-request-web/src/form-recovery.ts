import {
  isFormDefinition,
  type FormDefinition,
} from "@flowdocker/form-builder";
import { analyzeFormCode } from "@flowdocker/form-builder/code-model";

export const formRecoveryKey = "flowdocker.form-recovery.v1";
const maxRecoveryLength = 2_000_000;

/** One active editing session per browser tab; never contains runtime inputs. */
export interface FormRecovery {
  version: 1;
  definition: FormDefinition;
  source: string;
  codeDirty: boolean;
}

export function readFormRecovery(
  storage: Pick<Storage, "getItem">,
): FormRecovery | null {
  const raw = storage.getItem(formRecoveryKey);
  if (raw === null) return null;
  if (raw.length > maxRecoveryLength) throw new Error("Recovery too large");
  const value = JSON.parse(raw) as Partial<FormRecovery> | null;
  if (
    !value ||
    value.version !== 1 ||
    typeof value.source !== "string" ||
    value.source.length > 1_000_000 ||
    typeof value.codeDirty !== "boolean" ||
    !isFormDefinition(value.definition)
  )
    throw new Error("Invalid form recovery");
  const definition = value.codeDirty
    ? (analyzeFormCode(value.source, value.definition.id).definition ??
      value.definition)
    : value.definition;
  return {
    version: 1,
    definition,
    source: value.source,
    codeDirty: value.codeDirty,
  };
}

export function writeFormRecovery(
  storage: Pick<Storage, "setItem">,
  value: FormRecovery,
) {
  const raw = JSON.stringify(value);
  if (raw.length > maxRecoveryLength || value.source.length > 1_000_000)
    throw new Error("Recovery too large");
  storage.setItem(formRecoveryKey, raw);
}
