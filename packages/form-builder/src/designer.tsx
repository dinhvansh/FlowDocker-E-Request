import { useRef, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  GripVertical,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  FieldGroup,
  Input,
  Modal,
  Notice,
  SearchInput,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
} from "@flowdocker/ui";
import {
  choiceTypes,
  containerTypes,
  createField,
  duplicateField,
  exportFormDefinition,
  fieldTypeLabels,
  flattenFields,
  formFieldTypes,
  importFormDefinition,
  isContainer,
  updateFieldTree,
  validateFormDefinition,
  type FormDefinition,
  type FormField,
  type FormFieldType,
} from "./schema";
import { AdvancedProperties, OptionsEditor } from "./editors";
export interface FormDesignerProps {
  definition: FormDefinition;
  onChange(definition: FormDefinition): void;
  readOnly?: boolean;
}
function outline(
  fields: FormField[],
  parent = "",
  depth = 0,
): { field: FormField; parent: string; depth: number }[] {
  return fields.flatMap((field) => [
    { field, parent, depth },
    ...outline(field.children ?? [], field.id, depth + 1),
  ]);
}
export function moveField(
  fields: FormField[],
  id: string,
  parentId: string,
  index?: number,
): FormField[] {
  const selected = flattenFields(fields).find((field) => field.id === id);
  if (
    !selected ||
    (parentId &&
      (!flattenFields(fields).some(
        (field) => field.id === parentId && isContainer(field),
      ) ||
        flattenFields([selected]).some((field) => field.id === parentId)))
  )
    return fields;
  let next = updateFieldTree(fields, id, () => null);
  const insert = (items: FormField[]) => {
    const output = [...items];
    output.splice(index ?? output.length, 0, selected);
    return output;
  };
  if (!parentId) next = insert(next);
  else
    next = updateFieldTree(next, parentId, (field) => ({
      ...field,
      children: insert(field.children ?? []),
    }));
  return next;
}
function PaletteItem({
  type,
  onAdd,
  disabled,
}: {
  type: FormFieldType;
  onAdd(): void;
  disabled: boolean;
}) {
  const { t } = useI18n();
  const drag = useDraggable({ id: `palette:${type}`, disabled });
  return (
    <div ref={drag.setNodeRef}>
      <Button
        type="button"
        disabled={disabled}
        onClick={onAdd}
        {...drag.listeners}
        {...drag.attributes}
        aria-label={t("Thêm {{type}}", { type: t(fieldTypeLabels[type]) })}
      >
        <span>
          <Plus aria-hidden="true" size={13} />
        </span>
        {t(fieldTypeLabels[type])}
      </Button>
    </div>
  );
}
function OutlineRow({
  field,
  depth,
  selected,
  onSelect,
  disabled,
}: {
  field: FormField;
  depth: number;
  selected: boolean;
  onSelect(): void;
  disabled: boolean;
}) {
  const { t, locale } = useI18n();
  const sortable = useSortable({ id: field.id, disabled });
  return (
    <TableRow
      ref={sortable.setNodeRef}
      className={selected ? "selected" : ""}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          ["Enter", " "].includes(event.key)
        ) {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <TableCell>
        <button
          type="button"
          disabled={disabled}
          className="fd-drag-handle"
          {...sortable.attributes}
          {...sortable.listeners}
          aria-label={t("Di chuyển trường {{key}}", { key: field.key })}
        >
          <GripVertical aria-hidden="true" size={16} />
        </button>
      </TableCell>
      <TableCell style={{ paddingLeft: 8 + depth * 14 }}>
        <strong>{field.label[locale] || field.key}</strong>
        <small className="fd-form-key">{field.key}</small>
      </TableCell>
      <TableCell>{t(fieldTypeLabels[field.type])}</TableCell>
      <TableCell>
        {field.required ? (
          <Badge tone="warning">{t("Bắt buộc")}</Badge>
        ) : (
          t("Tùy chọn")
        )}
      </TableCell>
    </TableRow>
  );
}
export function FormDesigner({
  definition,
  onChange,
  readOnly = false,
}: FormDesignerProps) {
  const { t, locale } = useI18n();
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState("basic");
  const [past, setPast] = useState<FormDefinition[]>([]);
  const [future, setFuture] = useState<FormDefinition[]>([]);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const rows = outline(definition.fields);
  const field =
    rows.find((row) => row.field.id === selectedId)?.field ?? rows[0]?.field;
  const parent = rows.find((row) => row.field.id === field?.id)?.parent ?? "";
  const [destination, setDestination] = useState("");
  const siblings = parent
    ? (flattenFields(definition.fields).find((item) => item.id === parent)
        ?.children ?? [])
    : definition.fields;
  const fieldIndex = siblings.findIndex((item) => item.id === field?.id);
  const commit = (next: FormDefinition) => {
    if (readOnly) return;
    setPast((items) => [...items.slice(-99), definition]);
    setFuture([]);
    onChange({ ...next, schemaVersion: 2 });
  };
  const patch = (changes: Partial<FormField>) =>
    field &&
    commit({
      ...definition,
      fields: updateFieldTree(definition.fields, field.id, (item) => ({
        ...item,
        ...changes,
      })),
    });
  const add = (type: FormFieldType, target = destination) => {
    if (!rows.some((row) => row.field.id === target && isContainer(row.field)))
      target = "";
    const next = createField(type, definition.fields);
    const fields = target
      ? updateFieldTree(definition.fields, target, (item) => ({
          ...item,
          children: [...(item.children ?? []), next],
        }))
      : [...definition.fields, next];
    commit({ ...definition, fields });
    setSelectedId(next.id);
  };
  const move = (offset: number) =>
    field &&
    commit({
      ...definition,
      fields: moveField(
        definition.fields,
        field.id,
        parent,
        fieldIndex + offset,
      ),
    });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const issues = validateFormDefinition(definition);
  const containers = rows.filter((row) => isContainer(row.field));
  const references = flattenFields(definition.fields).filter(
    (item) => item.id !== field?.id && !isContainer(item),
  );
  return (
    <div className="fd-form-product">
      <div className="fd-form-product-toolbar">
        <Button
          disabled={readOnly || !past.length}
          onClick={() => {
            setFuture([definition, ...future]);
            onChange(past[past.length - 1]);
            setPast(past.slice(0, -1));
            setHistoryRevision((value) => value + 1);
          }}
        >
          <Undo2 data-icon="inline-start" />
          {t("Hoàn tác")}
        </Button>
        <Button
          disabled={readOnly || !future.length}
          onClick={() => {
            setPast([...past, definition]);
            onChange(future[0]);
            setFuture(future.slice(1));
            setHistoryRevision((value) => value + 1);
          }}
        >
          <Redo2 data-icon="inline-start" />
          {t("Làm lại")}
        </Button>
        <Button
          onClick={() => {
            try {
              const blob = new Blob([exportFormDefinition(definition)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `${definition.id}.json`;
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setError("");
            } catch {
              setError("Cấu trúc biểu mẫu chưa hợp lệ.");
            }
          }}
        >
          <Download data-icon="inline-start" />
          {t("Xuất schema JSON")}
        </Button>
        <Button
          disabled={readOnly}
          onClick={() => {
            setImportOpen(true);
            setJson("");
            setError("");
          }}
        >
          <Upload data-icon="inline-start" />
          {t("Nhập schema JSON")}
        </Button>
        <Select
          label={t("Kiểu biểu mẫu")}
          disabled={readOnly}
          value={definition.display ?? "form"}
          options={[
            { value: "form", label: t("Một trang") },
            { value: "wizard", label: t("Nhiều bước") },
          ]}
          onValueChange={(display) =>
            commit({ ...definition, display: display as "form" | "wizard" })
          }
        />
      </div>
      {error && !importOpen && <Notice tone="danger">{t(error)}</Notice>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{
          screenReaderInstructions: {
            draggable: t(
              "Nhấn Space để kéo, phím mũi tên để di chuyển, Escape để hủy.",
            ),
          },
          announcements: {
            onDragStart: () => t("Đang di chuyển trường."),
            onDragOver: () => t("Đã chọn vị trí thả."),
            onDragEnd: () => t("Đã kết thúc di chuyển."),
            onDragCancel: () => t("Đã hủy di chuyển."),
          },
        }}
        onDragEnd={({ active, over }) => {
          if (!over || readOnly) return;
          if (String(active.id).startsWith("palette:")) {
            const target = rows.find((row) => row.field.id === over.id);
            add(
              String(active.id).slice(8) as FormFieldType,
              target && isContainer(target.field)
                ? target.field.id
                : (target?.parent ?? ""),
            );
            return;
          }
          const target = rows.find((row) => row.field.id === over.id);
          if (!target || active.id === over.id) return;
          const targetSiblings = target.parent
            ? (flattenFields(definition.fields).find(
                (item) => item.id === target.parent,
              )?.children ?? [])
            : definition.fields;
          commit({
            ...definition,
            fields: moveField(
              definition.fields,
              String(active.id),
              target.parent,
              targetSiblings.findIndex((item) => item.id === over.id),
            ),
          });
        }}
      >
        <div className="fd-form-builder-grid">
          <aside className="fd-form-palette" aria-label={t("Thư viện trường")}>
            <h2>{t("Thư viện trường")}</h2>
            <SearchInput
              label={t("Tìm kiểu trường...")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Field label={t("Thêm vào nhóm")}>
              <Select
                label={t("Thêm vào nhóm")}
                value={
                  containers.some((row) => row.field.id === destination)
                    ? destination
                    : "__root__"
                }
                options={[
                  { value: "__root__", label: t("Cấp ngoài cùng") },
                  ...containers.map((row) => ({
                    value: row.field.id,
                    label: row.field.label[locale],
                  })),
                ]}
                onValueChange={(value) =>
                  setDestination(value === "__root__" ? "" : value)
                }
              />
            </Field>
            <div className="fd-form-palette-items">
              {formFieldTypes
                .filter((type) =>
                  `${type} ${t(fieldTypeLabels[type])}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((type) => (
                  <PaletteItem
                    key={type}
                    type={type}
                    disabled={readOnly || rows.length >= 300}
                    onAdd={() => add(type)}
                  />
                ))}
            </div>
          </aside>
          <section
            className="fd-form-schema"
            aria-label={t("Cấu trúc biểu mẫu")}
          >
            <div className="fd-section-heading">
              <h2>{t("Cấu trúc biểu mẫu")}</h2>
              <Button
                disabled={readOnly || rows.length >= 300}
                onClick={() => add("text")}
              >
                <Plus data-icon="inline-start" />
                {t("Thêm trường")}
              </Button>
            </div>
            {rows.length ? (
              <SortableContext
                items={rows.map((row) => row.field.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="fd-table-scroll">
                  <Table className="fd-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <span className="sr-only">{t("Sắp xếp")}</span>
                        </TableHead>
                        <TableHead>{t("Nhãn trường")}</TableHead>
                        <TableHead>{t("Kiểu dữ liệu")}</TableHead>
                        <TableHead>{t("Bắt buộc")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <OutlineRow
                          key={row.field.id}
                          {...row}
                          selected={field?.id === row.field.id}
                          onSelect={() => setSelectedId(row.field.id)}
                          disabled={readOnly}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SortableContext>
            ) : (
              <EmptyState
                title={t("Chưa có trường. Thêm trường để bắt đầu.")}
              />
            )}
          </section>
          <aside
            className="fd-form-properties"
            aria-label={t("Thuộc tính trường")}
          >
            {field ? (
              <>
                <h2>{t("Thuộc tính trường")}</h2>
                <Tabs
                  active={properties}
                  onChange={setProperties}
                  tabs={[
                    { id: "basic", label: t("Cơ bản") },
                    { id: "advanced", label: t("Nâng cao") },
                  ]}
                />
                <fieldset
                  disabled={readOnly}
                  className="fd-form-property-fieldset"
                >
                  {properties === "basic" ? (
                    <FieldGroup>
                      <Field
                        label={t("Mã trường")}
                        hint={t(
                          "Chữ thường, số và gạch dưới; mã không đổi theo ngôn ngữ.",
                        )}
                      >
                        <Input
                          value={field.key}
                          onChange={(event) =>
                            patch({ key: event.target.value })
                          }
                        />
                      </Field>
                      <Field label={t("Nhãn tiếng Việt")}>
                        <Input
                          value={field.label.vi}
                          onChange={(event) =>
                            patch({
                              label: { ...field.label, vi: event.target.value },
                            })
                          }
                        />
                      </Field>
                      <Field label={t("Nhãn tiếng Anh")}>
                        <Input
                          value={field.label.en}
                          onChange={(event) =>
                            patch({
                              label: { ...field.label, en: event.target.value },
                            })
                          }
                        />
                      </Field>
                      <Field label={t("Kiểu dữ liệu")}>
                        <Select
                          label={t("Kiểu dữ liệu")}
                          value={field.type}
                          options={formFieldTypes.map((type) => ({
                            value: type,
                            label: t(fieldTypeLabels[type]),
                          }))}
                          onValueChange={(type) =>
                            patch({
                              type: type as FormFieldType,
                              children: containerTypes.includes(
                                type as FormFieldType,
                              )
                                ? (field.children ?? [])
                                : undefined,
                            })
                          }
                        />
                      </Field>
                      <Field label={t("Bắt buộc")}>
                        <Checkbox
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            patch({ required: checked === true })
                          }
                        />
                      </Field>
                      <Field label={t("Đặt trong nhóm")}>
                        <Select
                          label={t("Đặt trong nhóm")}
                          value={parent || "__root__"}
                          options={[
                            { value: "__root__", label: t("Cấp ngoài cùng") },
                            ...containers
                              .filter(
                                (row) =>
                                  !flattenFields([field]).some(
                                    (item) => item.id === row.field.id,
                                  ),
                              )
                              .map((row) => ({
                                value: row.field.id,
                                label: row.field.label[locale],
                              })),
                          ]}
                          onValueChange={(parentId) =>
                            commit({
                              ...definition,
                              fields: moveField(
                                definition.fields,
                                field.id,
                                parentId === "__root__" ? "" : parentId,
                              ),
                            })
                          }
                        />
                      </Field>
                      {choiceTypes.includes(field.type) && (
                        <OptionsEditor
                          key={`${field.id}-${historyRevision}`}
                          field={field}
                          onChange={(options) => patch({ options })}
                        />
                      )}
                    </FieldGroup>
                  ) : (
                    <AdvancedProperties
                      key={field.id}
                      field={field}
                      fields={references}
                      patch={patch}
                    />
                  )}
                </fieldset>
                <div className="fd-form-order">
                  <Button
                    disabled={readOnly || fieldIndex <= 0}
                    onClick={() => move(-1)}
                  >
                    <ArrowUp data-icon="inline-start" />
                    {t("Lên trên")}
                  </Button>
                  <Button
                    disabled={readOnly || fieldIndex >= siblings.length - 1}
                    onClick={() => move(1)}
                  >
                    <ArrowDown data-icon="inline-start" />
                    {t("Xuống dưới")}
                  </Button>
                  <Button
                    disabled={
                      readOnly ||
                      rows.length + flattenFields([field]).length > 300
                    }
                    onClick={() => {
                      const copy = duplicateField(field, definition.fields);
                      const fields = updateFieldTree(
                        definition.fields,
                        field.id,
                        (item) => item,
                      );
                      const next = parent
                        ? updateFieldTree(fields, parent, (item) => ({
                            ...item,
                            children: [...(item.children ?? []), copy],
                          }))
                        : [...fields, copy];
                      commit({ ...definition, fields: next });
                      setSelectedId(copy.id);
                    }}
                  >
                    <Copy data-icon="inline-start" />
                    {t("Nhân bản trường")}
                  </Button>
                </div>
                <Button
                  variant="danger"
                  disabled={readOnly}
                  onClick={() => {
                    commit({
                      ...definition,
                      fields: updateFieldTree(
                        definition.fields,
                        field.id,
                        () => null,
                      ),
                    });
                    setSelectedId("");
                  }}
                >
                  <Trash2 data-icon="inline-start" />
                  {t("Xóa trường")}
                </Button>
                {issues
                  .filter((issue) => issue.fieldId === field.id)
                  .map((issue, index) => (
                    <Notice key={index} tone="danger">
                      {t(issue.message, issue.params)}
                    </Notice>
                  ))}
              </>
            ) : (
              <EmptyState title={t("Chọn hoặc thêm một trường")} />
            )}
          </aside>
        </div>
      </DndContext>
      {importOpen && (
        <Modal
          title={t("Nhập schema JSON")}
          onClose={() => setImportOpen(false)}
          footer={
            <>
              <Button onClick={() => setImportOpen(false)}>{t("Hủy")}</Button>
              <Button
                variant="primary"
                onClick={() => {
                  try {
                    const imported = importFormDefinition(json);
                    commit({ ...imported, id: definition.id });
                    setImportOpen(false);
                    setSelectedId("");
                    setError("");
                  } catch {
                    setError(
                      "Schema không hợp lệ hoặc có thuộc tính không được hỗ trợ.",
                    );
                  }
                }}
              >
                {t("Thay cấu trúc bằng schema")}
              </Button>
            </>
          }
        >
          <p>
            {t(
              "Nhập schema FlowDocker, không nhận JavaScript hoặc HTML thực thi. Có thể hoàn tác sau khi nhập.",
            )}
          </p>
          <Input
            type="file"
            ref={fileRef}
            accept="application/json,.json"
            aria-label={t("Chọn tệp schema JSON")}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 1000000) {
                setError("Schema vượt quá 1 MB.");
                return;
              }
              setJson(await file.text());
            }}
          />
          <Field label={t("Nội dung schema JSON")}>
            <Textarea
              rows={12}
              value={json}
              onChange={(event) => setJson(event.target.value)}
            />
          </Field>
          {error && <Notice tone="danger">{t(error)}</Notice>}
        </Modal>
      )}
    </div>
  );
}
