import { useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { Button, LanguagePicker } from "@flowdocker/ui";
import {
  FormDesigner,
  FormPreview,
  createShowcaseDefinition,
  type PreviewValues,
} from "../src";
import "@flowdocker/ui/styles.css";
const initial = createShowcaseDefinition();
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
        <FormDesigner
          definition={definition}
          onChange={(next) => {
            setDefinition(next);
            setValues({});
          }}
        />
        <FormPreview
          key={JSON.stringify(definition)}
          definition={definition}
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
