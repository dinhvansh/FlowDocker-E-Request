import { useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { OrganizationCanvas, type OrganizationPerson } from "../src";
import "@flowdocker/ui/styles.css";
const people: OrganizationPerson[] = [
  {
    id: "sample-root",
    name: "Alex Demo",
    title: "Platform lead",
    department: "Platform",
    managerId: "",
  },
  {
    id: "sample-designer",
    name: "Sam Demo",
    title: "Designer",
    department: "Design",
    managerId: "sample-root",
  },
  {
    id: "sample-engineer",
    name: "Jo Demo",
    title: "Engineer",
    department: "Engineering",
    managerId: "sample-root",
  },
];
function Example() {
  const { t } = useI18n();
  const [selected, setSelected] = useState("");
  return (
    <div className="fd-app" data-theme="light">
      <main style={{ width: "100%", padding: 20 }}>
        <h1>{t("Sơ đồ tổ chức")}</h1>
        <p>{t("Dữ liệu tổng hợp, không cần API hay credentials.")}</p>
        <OrganizationCanvas
          people={people}
          selectedId={selected}
          onSelect={setSelected}
        />
        <output>{selected}</output>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <Example />
  </I18nProvider>,
);
