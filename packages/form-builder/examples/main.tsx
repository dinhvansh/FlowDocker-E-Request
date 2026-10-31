import { lazy, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { Button, LanguagePicker } from "@flowdocker/ui";
import {
  FormDesigner,
  FormTestPreview,
  createShowcaseDefinition,
  createPaymentDefinition,
  type DataProvider,
  type PreviewValues,
} from "../src";
import "@flowdocker/ui/styles.css";
const runtimeContext = {
  currentUserId: "example-current-person",
  currentUser: {
    name: "Example user",
    email: "example@example.com",
    employeeCode: "SAMPLE-001",
    department: "Demo IT",
    position: "Demo specialist",
  },
};
const FormCodeStudio = lazy(() => import("../src/code-studio"));
import { analyzeFormCode, reconcileFormCode } from "../src/code-model";
const initial = createShowcaseDefinition();
const providers: Record<string, DataProvider> = {
  "organization.people": async () => [
    {
      value: "example-current-person",
      label: { vi: "Người dùng ví dụ", en: "Example user" },
    },
  ],
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
  const [codeOpen, setCodeOpen] = useState(false);
  const [source, setSource] = useState(JSON.stringify(initial, null, 2));
  const [selected, setSelected] = useState("");
  const [reveal, setReveal] = useState<{ id: string; revision: number }>();
  const invalid = !analyzeFormCode(source, definition.id).definition;
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
            const next = createPaymentDefinition();
            setDefinition(next);
            setSource(JSON.stringify(next, null, 2));
            setValues({});
          }}
        >
          {t("Mở mẫu thanh toán")}
        </Button>
        <Button aria-pressed={codeOpen} onClick={() => setCodeOpen(!codeOpen)}>
          {t("Code Studio")}
        </Button>
        <div className="fd-hybrid-workspace" data-code={codeOpen}>
          <div hidden={!codeOpen}>
            {codeOpen && (
              <Suspense fallback={null}>
                <FormCodeStudio
                  value={source}
                  formId={definition.id}
                  selectedFieldId={selected}
                  revealField={reveal}
                  onSelectField={setSelected}
                  providerIds={Object.keys(providers)}
                  onChange={(raw) => {
                    setSource(raw);
                    const result = analyzeFormCode(raw, definition.id);
                    if (result.definition) setDefinition(result.definition);
                  }}
                />
              </Suspense>
            )}
          </div>
          <FormDesigner
            compact={codeOpen}
            readOnly={invalid}
            selectedFieldId={selected}
            onSelectField={(id) => {
              setSelected(id);
              setReveal((previous) => ({
                id,
                revision: (previous?.revision ?? 0) + 1,
              }));
            }}
            runtimeContext={runtimeContext}
            key={definition.id}
            providers={providers}
            dataSources={[
              {
                id: "organization.people",
                label: { vi: "Người dùng ví dụ", en: "Example users" },
                description: {
                  vi: "Tài khoản giả lập trong ví dụ độc lập.",
                  en: "Synthetic account in the standalone example.",
                },
              },
              {
                id: "demo.companies",
                label: { vi: "Công ty mẫu", en: "Sample companies" },
                description: {
                  vi: "Danh sách công ty minh họa trong ví dụ độc lập.",
                  en: "Synthetic companies in the standalone example.",
                },
              },
              {
                id: "demo.departments",
                label: { vi: "Phòng ban mẫu", en: "Sample departments" },
                description: {
                  vi: "Chọn công ty trước; đặt mã trường công ty trong Phụ thuộc mã trường.",
                  en: "Select a company first; set its field key in Depends on field key.",
                },
              },
            ]}
            definition={definition}
            onChange={(next) => {
              setDefinition(next);
              setSource((current) => reconcileFormCode(current, next));
            }}
          />
        </div>
        <FormTestPreview
          runtimeContext={runtimeContext}
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
