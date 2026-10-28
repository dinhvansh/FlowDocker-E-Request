import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en } from "./en";
import { vi } from "./vi";

export type Locale = "vi" | "en";
export type MessageKey = keyof typeof en;
export type MessageParams = Record<string, string | number>;
export const localeStorageKey = "flowdocker.locale";
const intlLocales: Record<Locale, string> = { vi: "vi-VN", en: "en-US" };

/** Source-message keys preserve Vietnamese as the fallback. Never pass user records through t(). */
export function translate(
  locale: Locale,
  key: string,
  params: MessageParams = {},
): string {
  const message =
    locale === "en" && Object.hasOwn(en, key)
      ? en[key as MessageKey]
      : locale === "vi" && Object.hasOwn(vi, key)
        ? vi[key as keyof typeof vi]
        : key;
  return message.replace(/\{\{(\w+)\}\}/g, (token, name: string) =>
    params[name] === undefined ? token : String(params[name]),
  );
}

/** Adapter for the current source-string validation contracts; typed error codes can replace it later. */
export function translateValidation(locale: Locale, message: string): string {
  const patterns: [RegExp, MessageKey, string][] = [
    [/^Thiếu node (.+)\.$/, "Thiếu node {{kind}}.", "kind"],
    [/^Thiếu ánh xạ (.+)\.$/, "Thiếu ánh xạ {{field}}.", "field"],
    [
      /^Trường (.+) cần kiểu chuỗi, Active là boolean\.$/,
      "Trường {{field}} cần kiểu chuỗi, Active là boolean.",
      "field",
    ],
    [
      /^Mã trường (.+) không hợp lệ\.$/,
      "Mã trường {{field}} không hợp lệ.",
      "field",
    ],
    [/^Mã trường (.+) bị trùng\.$/, "Mã trường {{field}} bị trùng.", "field"],
    [
      /^Trường (.+) cần entity tham chiếu\.$/,
      "Trường {{field}} cần entity tham chiếu.",
      "field",
    ],
    [/^Thiếu module (.+)\.$/, "Thiếu module {{module}}.", "module"],
  ];
  const dryRun = message.match(/^Chưa thể xem dry run: (.+)$/);
  if (dryRun)
    return translate(locale, "Chưa thể xem dry run: {{error}}", {
      error: translateValidation(locale, dryRun[1]),
    });
  const connection = message.match(/^Chưa nối (.+) tới (.+)\.$/);
  if (connection)
    return translate(locale, "Chưa nối {{source}} tới {{target}}.", {
      source: translate(locale, connection[1]),
      target: translate(locale, connection[2]),
    });
  for (const [pattern, key, parameter] of patterns) {
    const match = message.match(pattern);
    if (match)
      return translate(locale, key, {
        [parameter]:
          parameter === "kind" || match[1] === "(chưa đặt tên)"
            ? translate(locale, match[1])
            : match[1],
      });
  }
  return translate(locale, message);
}

function readLocale(): Locale {
  try {
    return localStorage.getItem(localeStorageKey) === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
}
function makeValue(
  locale: Locale,
  setLocale: (locale: Locale) => void,
  storageWarning = false,
) {
  return {
    locale,
    setLocale,
    storageWarning,
    t: (key: string, params?: MessageParams) => translate(locale, key, params),
    validation: (message: string) => translateValidation(locale, message),
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(intlLocales[locale], options).format(value),
    date: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(intlLocales[locale], {
        timeZone: "Asia/Ho_Chi_Minh",
        ...options,
      }).format(value),
  };
}
const I18nContext = createContext(makeValue("vi", () => {}));
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(readLocale);
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(
    () =>
      makeValue(
        locale,
        (next) => {
          if (next !== "en" && next !== "vi") return;
          updateLocale(next);
          try {
            localStorage.setItem(localeStorageKey, next);
            setStorageWarning(false);
          } catch {
            setStorageWarning(true);
          }
        },
        storageWarning,
      ),
    [locale, storageWarning],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  return useContext(I18nContext);
}
