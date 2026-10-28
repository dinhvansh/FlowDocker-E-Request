import { useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { Button, LanguagePicker } from "@flowdocker/ui";
import {
  FormDesigner,
  FormPreview,
  createShowcaseDefinition,
  createPaymentDefinition,
  type DataProvider,
  type PreviewValues,
} from "../src";
import "@flowdocker/ui/styles.css";
const initial = createShowcaseDefinition();
const providers: Record<string, DataProvider> = {
  "demo.companies": async () => [
    { value: "sample", label: { vi: "Công ty mẫu", en: "Sample company" } },
  ],
  "demo.departments": async ({ dependency }) =>
    dependency
      ? [{ value: "sample-it", label: { vi: "CNTT · mẫu", en: "IT · sample" } }]
      : [],
};
function Example() {
  const { t } = useI18n();
  const [definition, setDefinition] = useState(initial);
  const [values, setValues] = useState<PreviewValues>({});
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return (
    <div className="fd-app" data-theme={theme}>
      <main className="fd-screen">
        <LanguagePicker />
        <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? t("Bật giao diện tối") : t("Bật giao diện sáng")}
        </Button>
        <h1>{t("Thiết kế biểu mẫu")}</h1>
        <Button
          onClick={() => {
            setDefinition(createPaymentDefinition());
            setValues({});
          }}
        >
          {t("Mở mẫu thanh toán")}
        </Button>
        <FormDesigner
          key={definition.id}
          providers={providers}
          definition={definition}
          onChange={(next) => {
            setDefinition(next);
            setValues({});
          }}
        />
        <FormPreview
          key={JSON.stringify(definition)}
          definition={definition}
          providers={providers}
          values={values}
          onChange={setValues}
        />
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <Example />
  </I18nProvider>,
);
