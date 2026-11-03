import { useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, useI18n } from "@flowdocker/i18n";
import { Button, LanguagePicker } from "@flowdocker/ui";
import {
  createField,
  FormDesigner,
  FormPreview,
  updateFieldTree,
  type FormDefinition,
} from "../src";
import "@flowdocker/ui/styles.css";

// Synthetic local asset; no company logo or external image request.
const logo = document.createElement("canvas");
logo.width = 240;
logo.height = 80;
const context = logo.getContext("2d")!;
context.fillStyle = "#eeeeee";
context.fillRect(0, 0, 240, 80);
context.fillStyle = "#222222";
context.font = "bold 36px sans-serif";
context.fillText("DEMO", 24, 54);
const initial: FormDefinition = {
  schemaVersion: 2,
  id: "direct-content-example",
  title: { vi: "DEMO", en: "DEMO" },
  status: "DRAFT",
  version: 1,
  fields: [
    {
      ...createField("columns", []),
      id: "header",
      key: "header",
      type: "columns",
      label: { vi: "DEMO", en: "DEMO" },
      columns: 2,
      hideLabel: true,
      children: [
        {
          ...createField("image", []),
          id: "logo",
          key: "logo",
          type: "image",
          label: { vi: "Logo mẫu", en: "Sample logo" },
          presentation: {
            align: "left",
            size: "body",
            bold: false,
            image: logo.toDataURL(),
            imageWidth: 180,
          },
        },
        {
          ...createField("content", []),
          id: "heading",
          key: "heading",
          type: "content",
          label: { vi: "ĐỀ NGHỊ THANH TOÁN", en: "PAYMENT REQUEST" },
          presentation: { align: "right", size: "title", bold: true },
        },
      ],
    },
    {
      ...createField("text", []),
      id: "name",
      key: "name",
      type: "text",
      label: { vi: "Nội dung mẫu", en: "Sample content" },
    },
  ],
};
function Example() {
  const { t } = useI18n();
  const [definition, setDefinition] = useState(initial);
  const [selected, setSelected] = useState("");
  const [edit, setEdit] = useState(false);
  const [theme, setTheme] = useState("light");
  const [past, setPast] = useState<FormDefinition[]>([]);
  return (
    <div className="fd-app fd-forms-root" data-theme={theme}>
      <main className="fd-screen">
        <LanguagePicker />
        <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? t("Bật giao diện tối") : t("Bật giao diện sáng")}
        </Button>
        <FormDesigner
          definition={definition}
          selectedFieldId={selected}
          onSelectField={setSelected}
          onChange={setDefinition}
        />
        <Button aria-pressed={edit} onClick={() => setEdit(!edit)}>
          {edit ? t("Xong chỉnh nội dung") : t("Chỉnh logo / tiêu đề")}
        </Button>
        <Button
          disabled={!past.length}
          onClick={() => {
            setDefinition(past[past.length - 1]);
            setPast(past.slice(0, -1));
          }}
        >
          {t("Hoàn tác nội dung")}
        </Button>
        <FormPreview
          definition={definition}
          values={{}}
          onChange={() => {}}
          contentDesign={
            edit
              ? {
                  selectedId: selected,
                  onSelect: setSelected,
                  onPatch: (id, changes, record = true) => {
                    if (record)
                      setPast((current) => [...current.slice(-99), definition]);
                    setDefinition({
                      ...definition,
                      fields: updateFieldTree(
                        definition.fields,
                        id,
                        (field) => ({ ...field, ...changes }),
                      ),
                    });
                  },
                }
              : undefined
          }
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
