import { useEffect, useState } from "react";
import type { FormField, FormValue } from "./schema";
import type { ChoiceOption, DataProvider } from "./runtime";
export function useChoices(
  field: FormField,
  dependency: FormValue | undefined,
  provider: DataProvider | undefined,
) {
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [remote, setRemote] = useState<{
    requestKey: string;
    options: ChoiceOption[];
    status: "loading" | "ready" | "error" | "missing";
  }>({ options: [], status: "loading", requestKey: "" });
  const dependencyKey = JSON.stringify(dependency);
  const staticOptions: ChoiceOption[] = field.options;
  const requestKey = `${query}:${dependencyKey ?? ""}:${field.dataSource?.provider ?? ""}:${reloadKey}`;
  useEffect(() => {
    if (!field.dataSource) return;
    if (!provider) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setRemote({ options: [], status: "loading", requestKey });
      provider({
        query,
        dependency:
          dependencyKey === undefined
            ? undefined
            : (JSON.parse(dependencyKey) as FormValue),
        signal: controller.signal,
      })
        .then((options) => {
          if (!controller.signal.aborted)
            setRemote({
              options: options
                .filter(
                  (option) =>
                    option &&
                    typeof option.value === "string" &&
                    option.value &&
                    option.value !== "__fd_clear__" &&
                    typeof option.label?.vi === "string" &&
                    typeof option.label?.en === "string",
                )
                .slice(0, 500),
              status: "ready",
              requestKey,
            });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setRemote({ options: [], status: "error", requestKey });
        });
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [field.dataSource, provider, query, dependencyKey, requestKey]);
  return {
    reload: () => setReloadKey((key) => key + 1),
    query,
    setQuery,
    options: field.dataSource
      ? provider
        ? remote.requestKey === requestKey
          ? remote.options
          : []
        : []
      : staticOptions,
    status: field.dataSource
      ? provider
        ? remote.requestKey === requestKey
          ? remote.status
          : "loading"
        : "missing"
      : "ready",
  };
}
