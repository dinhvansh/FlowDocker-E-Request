import type { ReactNode, ButtonHTMLAttributes } from "react";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { LanguagePicker, Button } from "@flowdocker/ui";
import "@flowdocker/ui/styles.css";
export * from "./index";
export interface FormsProviderProps {
  children: ReactNode;
  theme?: "light" | "dark";
  locale?: "vi" | "en";
  onLocaleChange?(locale: "vi" | "en"): void;
  initialLocale?: "vi" | "en";
}
/** Isolated provider: no local storage or document-language mutation in embedded hosts. */
export function FormsProvider({
  children,
  theme = "light",
  locale,
  initialLocale = "vi",
  onLocaleChange,
}: FormsProviderProps) {
  return (
    <I18nProvider
      locale={locale}
      initialLocale={initialLocale}
      onLocaleChange={onLocaleChange}
      persistenceKey={null}
      manageDocumentLanguage={false}
    >
      <FormsRoot theme={theme}>{children}</FormsRoot>
    </I18nProvider>
  );
}
function FormsRoot({
  theme,
  children,
}: {
  theme: "light" | "dark";
  children: ReactNode;
}) {
  const { locale } = useI18n();
  return (
    <div className="fd-app fd-forms-root" data-theme={theme} lang={locale}>
      {children}
    </div>
  );
}
export function FormsLanguagePicker() {
  return <LanguagePicker />;
}
export type FormsButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};
export function FormsButton(props: FormsButtonProps) {
  return <Button {...props} />;
}
export function useFormsLocale(): {
  locale: "vi" | "en";
  setLocale(locale: "vi" | "en"): void;
} {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
