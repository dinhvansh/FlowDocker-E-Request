import { useI18n, type Locale } from "@flowdocker/i18n";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

const languages: { value: Locale; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

function Flag({ locale }: { locale: Locale }) {
  return (
    <svg
      className="fd-language-flag size-6"
      viewBox="0 0 60 40"
      aria-hidden="true"
      focusable="false"
    >
      {locale === "vi" ? (
        <>
          <path fill="#da251d" d="M0 0h60v40H0z" />
          <path
            fill="#ffdf00"
            d="m30 8 2.82 8.3h8.76l-7.08 5.16 2.7 8.34L30 24.64l-7.2 5.16 2.7-8.34-7.08-5.16h8.76z"
          />
        </>
      ) : (
        <>
          <path fill="#012169" d="M0 0h60v40H0z" />
          <path stroke="#fff" strokeWidth="9" d="m0 0 60 40M60 0 0 40" />
          <path stroke="#c8102e" strokeWidth="3" d="m0 0 60 40M60 0 0 40" />
          <path stroke="#fff" strokeWidth="13" d="M30 0v40M0 20h60" />
          <path stroke="#c8102e" strokeWidth="7" d="M30 0v40M0 20h60" />
        </>
      )}
    </svg>
  );
}

/** Compact flag + locale code, with native language names in the menu. */
export function LanguagePicker() {
  const { t, locale, setLocale } = useI18n();
  const selected = languages.find((language) => language.value === locale)!;
  const label = t("Ngôn ngữ");
  const themeRoot =
    typeof document === "undefined"
      ? undefined
      : (document.querySelector<HTMLElement>(".fd-app") ?? undefined);
  return (
    <Select
      value={locale}
      onValueChange={(value) => setLocale(value === "en" ? "en" : "vi")}
    >
      <SelectTrigger
        className="fd-language-trigger"
        aria-label={`${label}: ${selected.label}`}
        title={selected.label}
      >
        <SelectValue>
          <span className="fd-language-selected" key={locale}>
            <Flag locale={locale} />
            <span className="fd-language-code">{locale.toUpperCase()}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className="fd-language-menu"
        position="popper"
        sideOffset={6}
        align="end"
        portalContainer={themeRoot}
      >
        <SelectGroup>
          {languages.map((language) => (
            <SelectItem
              className="fd-language-option"
              key={language.value}
              value={language.value}
              textValue={language.label}
              aria-label={language.label}
            >
              <Flag locale={language.value} />
              <span>{language.label}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
