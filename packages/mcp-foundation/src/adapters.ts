import { isAppDraft } from "@flowdocker/app-contracts";
import { analyzeFormCode } from "@flowdocker/form-builder/code-model";
import type { ConfigurationAdapter } from "./index";

/** Reuses the same schema/logic validator as live Form Code Studio. No engine fork. */
export function formConfigurationAdapter(
  readProjected?: ConfigurationAdapter["readProjected"],
): ConfigurationAdapter {
  return {
    module: "forms",
    readProjected,
    async validate(configuration) {
      if (
        !configuration ||
        typeof configuration !== "object" ||
        Array.isArray(configuration) ||
        typeof configuration.id !== "string"
      ) {
        return { valid: false, issues: ["FORM_CONFIGURATION_INVALID"] };
      }
      const analysis = analyzeFormCode(
        JSON.stringify(configuration),
        configuration.id,
      );
      // Do not echo proposed values into tool output. The editor can show detailed diagnostics.
      return {
        valid: !!analysis.definition,
        issues: analysis.problems.map(() => "FORM_CONFIGURATION_INVALID"),
      };
    },
  };
}

/** Validates only app drafts, never registers or enables an application's runtime. */
export function applicationConfigurationAdapter(
  readProjected?: ConfigurationAdapter["readProjected"],
): ConfigurationAdapter {
  return {
    module: "applications",
    readProjected,
    async validate(configuration) {
      const valid = isAppDraft(configuration);
      return {
        valid,
        issues: valid ? [] : ["APPLICATION_CONFIGURATION_INVALID"],
      };
    },
  };
}
