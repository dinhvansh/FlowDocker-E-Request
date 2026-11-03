import { useMemo, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Notice,
  Tabs,
} from "@flowdocker/ui";
import { AdvancedProperties } from "./editors";
import { logicInventory, hasLogic } from "./logic-model";
import { updateFieldTree } from "./schema";
import { FormTestPreview } from "./test-preview";
import type { FormPreviewProps } from "./runtime";
import "./logic-studio.css";

export interface FormLogicStudioProps extends FormPreviewProps {
  onDefinitionChange(definition: FormPreviewProps["definition"]): void;
  selectedFieldId?: string;
  onSelectField?(id: string): void;
}
/** A form-wide view over the existing rule editor and real local runtime. */
export function FormLogicStudio({
  onDefinitionChange,
  selectedFieldId,
  onSelectField,
  ...props
}: FormLogicStudioProps) {
  const { t, locale } = useI18n();
  const [localSelection, setLocalSelection] = useState("");
  const [query, setQuery] = useState("");
  const [configured, setConfigured] = useState(false);
  const [view, setView] = useState<"rules" | "dependencies" | "scenarios">(
    "rules",
  );
  const nodes = useMemo(
    () => logicInventory(props.definition.fields),
    [props.definition.fields],
  );
  const selected =
    nodes.find(
      (node) => node.field.id === (selectedFieldId ?? localSelection),
    ) ?? nodes[0];
  const shown = nodes.filter(
    (node) =>
      (!configured || hasLogic(node.field)) &&
      `${node.field.label[locale]} ${node.path}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  const select = (id: string) => {
    setLocalSelection(id);
    onSelectField?.(id);
  };
  const link = (id: string, key: string) => (
    <Button key={key} variant="ghost" onClick={() => select(id)}>
      {nodes.find((node) => node.field.id === id)?.field.label[locale]}
      <code>{key}</code>
    </Button>
  );
  return (
    <section className="fd-logic-studio" aria-label={t("Logic Studio")}>
      <aside className="fd-logic-inventory">
        <Field label={t("Tìm trường và quy tắc")}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Field>
        <label className="fd-logic-filter">
          <Checkbox
            checked={configured}
            onCheckedChange={(value) => setConfigured(value === true)}
          />
          {t("Chỉ trường có logic")}
        </label>
        <div className="fd-logic-list">
          {shown.map((node) => (
            <Button
              key={node.field.id}
              variant="ghost"
              aria-pressed={selected?.field.id === node.field.id}
              onClick={() => select(node.field.id)}
            >
              <span>
                {node.field.label[locale]}
                <code>{node.path}</code>
              </span>
              {hasLogic(node.field) && (
                <Badge>{node.dependencies.length}</Badge>
              )}
            </Button>
          ))}
          {!shown.length && <p>{t("Không có kết quả phù hợp.")}</p>}
        </div>
      </aside>
      <div className="fd-logic-detail">
        <Tabs
          active={view}
          onChange={(value) => setView(value as typeof view)}
          tabs={[
            { id: "rules", label: t("Quy tắc") },
            { id: "dependencies", label: t("Phụ thuộc trường") },
            { id: "scenarios", label: t("Thử toàn biểu mẫu") },
          ]}
        />
        {props.readOnly && (
          <Notice tone="warning">
            {t("Mã chưa hợp lệ; hãy sửa mã để tiếp tục thiết kế và lưu.")}
          </Notice>
        )}
        {view === "scenarios" ? (
          <FormTestPreview {...props} />
        ) : selected ? (
          <>
            <h3>
              {selected.field.label[locale]} <code>{selected.path}</code>
            </h3>
            {view === "rules" ? (
              <fieldset disabled={props.readOnly} className="fd-logic-editor">
                <AdvancedProperties
                  key={selected.field.id}
                  section="logic"
                  field={selected.field}
                  fields={selected.references}
                  providers={props.providers}
                  sourceDefaults={props.values}
                  patch={(changes) => {
                    if (!props.readOnly)
                      onDefinitionChange({
                        ...props.definition,
                        fields: updateFieldTree(
                          props.definition.fields,
                          selected.field.id,
                          (field) => ({ ...field, ...changes }),
                        ),
                      });
                  }}
                />
              </fieldset>
            ) : (
              <div className="fd-logic-links">
                <h4>{t("Lấy dữ liệu từ")}</h4>
                {selected.dependencies.map((dependency) =>
                  dependency.fieldId ? (
                    link(dependency.fieldId, dependency.key)
                  ) : (
                    <Notice key={dependency.key} tone="warning">
                      {t("Không tìm thấy trường tham chiếu: {{key}}", {
                        key: dependency.key,
                      })}
                    </Notice>
                  ),
                )}
                {!selected.dependencies.length && (
                  <p>{t("Không có trường phụ thuộc.")}</p>
                )}
                <h4>{t("Được sử dụng bởi")}</h4>
                {nodes
                  .filter((node) =>
                    node.dependencies.some(
                      (dependency) => dependency.fieldId === selected.field.id,
                    ),
                  )
                  .map((node) => link(node.field.id, node.path))}
                <Notice>
                  {t(
                    "Phụ thuộc gồm điều kiện, công thức, so sánh và nguồn dữ liệu. Trong bảng lặp, tham chiếu dùng ngữ cảnh từng dòng.",
                  )}
                </Notice>
              </div>
            )}
          </>
        ) : (
          <Notice>{t("Thêm trường để thiết kế logic.")}</Notice>
        )}
      </div>
    </section>
  );
}
