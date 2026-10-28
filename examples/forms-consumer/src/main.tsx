import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  FormsProvider,
  FormsButton,
  FormsLanguagePicker,
  useFormsLocale,
  FormDesigner,
  FormRenderer,
  createShowcaseDefinition,
  type PreviewValues,
} from "@flowdocker/forms";
import "@flowdocker/forms/styles.css";
function Demo() {
  const { locale } = useFormsLocale();
  const tr = (vi: string, en: string) => (locale === "vi" ? vi : en);
  const [schema, setSchema] = useState(createShowcaseDefinition);
  const [values, setValues] = useState<PreviewValues>({});
  const [mode, setMode] = useState("runtime");
  const [submitted, setSubmitted] = useState<PreviewValues | null>(null);
  return (
    <main style={{ maxWidth: 1240, margin: "auto" }}>
      <header className="fd-page-toolbar">
        <div>
          <h1>FlowDocker Forms</h1>
          <p>
            {tr(
              "Ứng dụng độc lập · Dữ liệu tổng hợp · Không gửi lên máy chủ",
              "Independent app · Synthetic data · No server submission",
            )}
          </p>
        </div>
        <FormsLanguagePicker />
      </header>
      <nav className="fd-form-order" aria-label={tr("Chế độ", "Mode")}>
        <FormsButton onClick={() => setMode("runtime")}>
          {tr("Điền biểu mẫu", "Fill form")}
        </FormsButton>
        <FormsButton onClick={() => setMode("designer")}>
          {tr("Thiết kế biểu mẫu", "Design form")}
        </FormsButton>
      </nav>
      {mode === "designer" ? (
        <FormDesigner
          definition={schema}
          onChange={(next) => {
            setSchema(next);
            setValues({});
            setSubmitted(null);
          }}
        />
      ) : (
        <FormRenderer
          key={schema.id}
          definition={schema}
          values={values}
          onChange={setValues}
          onSubmit={(data) => setSubmitted(data)}
        />
      )}
      {submitted && (
        <section aria-live="polite">
          <h2>{tr("Dữ liệu kết quả tại máy", "Local result")}</h2>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return (
    <FormsProvider theme={theme}>
      <FormsButton
        aria-label="Light / Dark"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        ☀ / ☾
      </FormsButton>
      <Demo />
    </FormsProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
