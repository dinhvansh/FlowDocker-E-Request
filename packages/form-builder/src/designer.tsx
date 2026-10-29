import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragMoveEvent,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Download,
  GripVertical,
  Redo2,
  Undo2,
  Upload,
  PanelLeft,
  PanelRight,
  Settings2,
  AlignJustify,
  CalendarDays,
  CalendarClock,
  CheckSquare,
  CircleAlert,
  CircleDollarSign,
  CircleDot,
  ClipboardList,
  Columns3,
  EyeOff,
  Hash,
  KeyRound,
  LayoutPanelTop,
  Link,
  List,
  ListChecks,
  ListTree,
  LockKeyhole,
  Mail,
  MapPin,
  PanelsTopLeft,
  Paperclip,
  PenLine,
  Phone,
  SquareMousePointer,
  Table2,
  TableProperties,
  Tags,
  Text,
  Type,
  Clock3,
  Box,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Combobox,
  EmptyState,
  Field,
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
import {
  FieldInspector,
  type InspectorSection,
} from "./components/field-inspector";
import type { FormRendererProps } from "./runtime";
import { FormCanvas } from "./canvas";
import type { FormDataSource } from "./components/data-source-editor";
export interface FormDesignerProps {
  runtimeContext?: FormRendererProps["runtimeContext"];
  providers?: FormRendererProps["providers"];
  dataSources?: readonly FormDataSource[];
  definition: FormDefinition;
  onChange(definition: FormDefinition): void;
  readOnly?: boolean;
  inspectorSection?: "basic" | "logic";
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
  const drag = useDraggable({
    id: `palette:${type}`,
    disabled,
    data: { paletteType: type },
  });
  return (
    <div
      ref={drag.setNodeRef}
      className="fd-toolbox-item"
      data-dragging={drag.isDragging || undefined}
    >
      <button
        type="button"
        className="fd-toolbox-drag"
        disabled={disabled}
        {...drag.listeners}
        {...drag.attributes}
        aria-label={t("Kéo {{type}} vào canvas", {
          type: t(fieldTypeLabels[type]),
        })}
      >
        <GripVertical aria-hidden="true" />
      </button>
      <Button
        {...drag.listeners}
        {...drag.attributes}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!drag.isDragging) onAdd();
        }}
        title={t("Kéo vào mẫu hoặc bấm để thêm")}
        aria-label={t("Thêm {{type}}", { type: t(fieldTypeLabels[type]) })}
      >
        <FieldTypeIcon type={type} />
        {t(fieldTypeLabels[type])}
      </Button>
    </div>
  );
}
/** Pointer release outside the canvas must never insert into the nearest field. */
const formDropCollision: CollisionDetection = (args) => {
  if (!args.pointerCoordinates) return closestCenter(args);
  return pointerWithin(args).sort((a, b) => {
    const first = args.droppableRects.get(a.id);
    const second = args.droppableRects.get(b.id);
    return (
      (first ? first.width * first.height : Infinity) -
      (second ? second.width * second.height : Infinity)
    );
  });
};
function paletteDropAfter({
  active,
  over,
  activatorEvent,
  delta,
}: DragMoveEvent) {
  return (
    String(active.id).startsWith("palette:") &&
    !!over &&
    "clientY" in activatorEvent &&
    typeof activatorEvent.clientY === "number" &&
    activatorEvent.clientY + delta.y > over.rect.top + over.rect.height / 2
  );
}
const fieldTypeIcons: Partial<Record<FormFieldType, LucideIcon>> = {
  person: Users,
  text: Type,
  textarea: AlignJustify,
  email: Mail,
  url: Link,
  phone: Phone,
  password: LockKeyhole,
  number: Hash,
  currency: CircleDollarSign,
  date: CalendarDays,
  datetime: CalendarClock,
  time: Clock3,
  checkbox: CheckSquare,
  select: List,
  radio: CircleDot,
  multiselect: ListChecks,
  checkboxes: CheckSquare,
  tags: Tags,
  file: Paperclip,
  signature: PenLine,
  hidden: EyeOff,
  content: Text,
  section: LayoutPanelTop,
  columns: Columns3,
  tabs: PanelsTopLeft,
  repeat: Table2,
  keyvalue: KeyRound,
  survey: ClipboardList,
  address: MapPin,
  day: CalendarClock,
  container: Box,
  table: TableProperties,
  alert: CircleAlert,
  button: SquareMousePointer,
};
function FieldTypeIcon({ type }: { type: FormFieldType }) {
  const Icon = fieldTypeIcons[type] ?? Type;
  return <Icon className="fd-field-type-icon" aria-hidden="true" />;
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
  return (
    <TableRow
      className={selected ? "selected" : ""}
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
          onClick={onSelect}
          aria-label={t("Chọn trường {{label}}", {
            label: field.label[locale],
          })}
        >
          <GripVertical aria-hidden="true" size={16} />
        </button>
      </TableCell>
      <TableCell style={{ paddingLeft: 8 + depth * 14 }}>
        <strong>{field.label[locale] || field.key}</strong>
        <small className="fd-form-key">{field.key}</small>
      </TableCell>
      <TableCell>
        <span className="fd-field-type-label">
          <FieldTypeIcon type={field.type} />
          {t(fieldTypeLabels[field.type])}
        </span>
      </TableCell>
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
  inspectorSection,
  providers,
  dataSources = [],
  runtimeContext,
}: FormDesignerProps) {
  const { t, locale } = useI18n();
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState<InspectorSection>("basic");
  useEffect(() => {
    if (inspectorSection) setProperties(inspectorSection);
  }, [inspectorSection]);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [pane, setPane] = useState("canvas");
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorWidth, setInspectorWidth] = useState(300);
  const [device, setDevice] = useState("desktop");
  const [insertAt, setInsertAt] = useState<{
    parent: string;
    index: number;
  } | null>(null);
  const [past, setPast] = useState<FormDefinition[]>([]);
  const [future, setFuture] = useState<FormDefinition[]>([]);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [activeDrag, setActiveDrag] = useState<{
    type: FormFieldType;
    label: string;
  } | null>(null);
  const [dropAfter, setDropAfter] = useState(false);
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
  const add = (
    type: FormFieldType,
    target = insertAt?.parent ?? destination,
    position = insertAt?.index,
  ) => {
    if (!rows.some((row) => row.field.id === target && isContainer(row.field)))
      target = "";
    const next = createField(type, definition.fields);
    const fields = target
      ? updateFieldTree(definition.fields, target, (item) => ({
          ...item,
          children: [
            ...(item.children ?? []).slice(
              0,
              position ?? item.children?.length ?? 0,
            ),
            next,
            ...(item.children ?? []).slice(
              position ?? item.children?.length ?? 0,
            ),
          ],
        }))
      : [
          ...definition.fields.slice(0, position ?? definition.fields.length),
          next,
          ...definition.fields.slice(position ?? definition.fields.length),
        ];
    commit({ ...definition, fields });
    setSelectedId(next.id);
    setPane("canvas");
    setInsertAt(null);
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
  const moveSelected = (item: FormField, offset: number) => {
    const row = rows.find((row) => row.field.id === item.id);
    const list = row?.parent
      ? (rows.find((entry) => entry.field.id === row.parent)?.field.children ??
        [])
      : definition.fields;
    const index = list.findIndex((entry) => entry.id === item.id);
    if (index + offset < 0 || index + offset >= list.length) return;
    commit({
      ...definition,
      fields: moveField(
        definition.fields,
        item.id,
        row?.parent ?? "",
        index + offset,
      ),
    });
  };
  const cloneSelected = (item: FormField) => {
    if (rows.length + flattenFields([item]).length > 300) return;
    const copy = duplicateField(item, definition.fields);
    const row = rows.find((row) => row.field.id === item.id);
    const fields = row?.parent
      ? updateFieldTree(definition.fields, row.parent, (parent) => ({
          ...parent,
          children: [...(parent.children ?? []), copy],
        }))
      : [...definition.fields, copy];
    commit({ ...definition, fields });
    setSelectedId(copy.id);
  };
  const deleteSelected = (item: FormField) => {
    commit({
      ...definition,
      fields: updateFieldTree(definition.fields, item.id, () => null),
    });
    setSelectedId("");
  };
  const insert = (item?: FormField) => {
    const row = rows.find((row) => row.field.id === item?.id);
    const parentId = item && isContainer(item) ? item.id : (row?.parent ?? "");
    const list = parentId
      ? (rows.find((entry) => entry.field.id === parentId)?.field.children ??
        [])
      : definition.fields;
    const index =
      item && !isContainer(item)
        ? list.findIndex((entry) => entry.id === item.id) + 1
        : list.length;
    setInsertAt({ parent: parentId, index });
    setDestination(parentId);
    setToolboxOpen(true);
    setPane("toolbox");
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLInputElement>(".fd-form-palette input")
        ?.focus(),
    );
  };
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const issues = validateFormDefinition(definition);
  const containers = rows.filter((row) => isContainer(row.field));
  const fieldTree = field ? flattenFields([field]) : [];
  const availableContainers = containers.filter(
    (row) => !fieldTree.some((item) => item.id === row.field.id),
  );
  const references = flattenFields(definition.fields).filter(
    (item) => item.id !== field?.id && !isContainer(item),
  );
  return (
    <div
      style={{ "--fd-inspector-width": `${inspectorWidth}px` } as CSSProperties}
      className="fd-form-product fd-designer-v2"
      data-pane={pane}
      data-toolbox={toolboxOpen}
      data-inspector={inspectorOpen}
    >
      <div className="fd-form-product-toolbar">
        <div className="fd-designer-pane-controls">
          <Button
            aria-label={t("Thư viện trường")}
            title={t("Thư viện trường")}
            aria-expanded={toolboxOpen}
            onClick={() => {
              setToolboxOpen(!toolboxOpen);
              setPane("toolbox");
            }}
          >
            <PanelLeft />
          </Button>
          <Button
            aria-label={t("Thuộc tính trường")}
            title={t("Thuộc tính trường")}
            aria-expanded={inspectorOpen}
            onClick={() => {
              setInspectorOpen(!inspectorOpen);
              setPane("properties");
            }}
          >
            <PanelRight />
          </Button>
        </div>
        <Button
          aria-label={t("Hoàn tác")}
          title={t("Hoàn tác")}
          disabled={readOnly || !past.length}
          onClick={() => {
            setFuture([definition, ...future]);
            onChange(past[past.length - 1]);
            setPast(past.slice(0, -1));
            setHistoryRevision((value) => value + 1);
          }}
        >
          <Undo2 data-icon="inline-start" />
        </Button>
        <Button
          aria-label={t("Làm lại")}
          title={t("Làm lại")}
          disabled={readOnly || !future.length}
          onClick={() => {
            setPast([...past, definition]);
            onChange(future[0]);
            setFuture(future.slice(1));
            setHistoryRevision((value) => value + 1);
          }}
        >
          <Redo2 data-icon="inline-start" />
        </Button>
        <Select
          label={t("Hướng biểu mẫu")}
          disabled={readOnly}
          value={definition.orientation ?? "portrait"}
          options={[
            { value: "portrait", label: t("Khổ dọc") },
            { value: "landscape", label: t("Khổ ngang") },
          ]}
          onValueChange={(orientation) =>
            commit({
              ...definition,
              orientation: orientation as "portrait" | "landscape",
            })
          }
        />
        <details className="fd-designer-tools">
          <summary>
            <Settings2 aria-hidden="true" />
            {t("Công cụ")}
          </summary>
          <div className="fd-designer-tools-content">
            <Select
              label={t("Độ rộng canvas")}
              value={device}
              options={[
                { value: "desktop", label: t("Máy tính") },
                { value: "mobile", label: t("Điện thoại") },
              ]}
              onValueChange={setDevice}
            />{" "}
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
        </details>
      </div>
      {error && !importOpen && <Notice tone="danger">{t(error)}</Notice>}
      <div className="fd-designer-mobile-tabs">
        <Tabs
          active={pane}
          onChange={(next) => {
            setPane(next);
            if (next === "toolbox") setToolboxOpen(true);
            if (next === "properties") setInspectorOpen(true);
          }}
          tabs={[
            { id: "toolbox", label: t("Thư viện trường") },
            { id: "canvas", label: t("Canvas") },
            { id: "properties", label: t("Thuộc tính trường") },
          ]}
        />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={formDropCollision}
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
        onDragStart={({ active }) => {
          setDropAfter(false);
          const data = active.data.current as
            { paletteType?: FormFieldType; field?: FormField } | undefined;
          const dragged = data?.field;
          const type = data?.paletteType ?? dragged?.type;
          if (type)
            setActiveDrag({
              type,
              label: dragged?.label[locale] ?? t(fieldTypeLabels[type]),
            });
        }}
        onDragCancel={() => setActiveDrag(null)}
        onDragMove={(event) => setDropAfter(paletteDropAfter(event))}
        onDragEnd={(event) => {
          const { active, over } = event;
          setActiveDrag(null);
          if (!over || readOnly) return;
          const overId = String(over.id);
          if (overId.startsWith("container:")) {
            const parentId = overId.slice("container:".length);
            const list =
              rows.find((row) => row.field.id === parentId)?.field.children ??
              [];
            if (String(active.id).startsWith("palette:")) {
              add(
                String(active.id).slice(8) as FormFieldType,
                parentId,
                list.length,
              );
            } else {
              commit({
                ...definition,
                fields: moveField(
                  definition.fields,
                  String(active.id),
                  parentId,
                  list.length,
                ),
              });
            }
            return;
          }
          if (String(active.id).startsWith("palette:")) {
            const target = rows.find((row) => row.field.id === over.id);
            const parentId =
              target && isContainer(target.field)
                ? target.field.id
                : (target?.parent ?? "");
            const list = parentId
              ? (rows.find((row) => row.field.id === parentId)?.field
                  .children ?? [])
              : definition.fields;
            add(
              String(active.id).slice(8) as FormFieldType,
              parentId,
              target && !isContainer(target.field)
                ? list.findIndex((item) => item.id === target.field.id) +
                    (paletteDropAfter(event) ? 1 : 0)
                : list.length,
            );
            return;
          }
          const target = rows.find((row) => row.field.id === over.id);
          if (!target || active.id === over.id) return;
          const dropParent = isContainer(target.field)
            ? target.field.id
            : target.parent;
          const targetSiblings = dropParent
            ? (rows.find((item) => item.field.id === dropParent)?.field
                .children ?? [])
            : definition.fields;
          commit({
            ...definition,
            fields: moveField(
              definition.fields,
              String(active.id),
              dropParent,
              isContainer(target.field)
                ? targetSiblings.length
                : targetSiblings.findIndex((item) => item.id === over.id),
            ),
          });
        }}
      >
        <div className="fd-form-builder-grid">
          <aside className="fd-form-palette" aria-label={t("Thư viện trường")}>
            <div className="fd-section-heading">
              <h2>{t("Thư viện trường")}</h2>
              <Badge>{formFieldTypes.length}</Badge>
            </div>
            <Button
              aria-pressed={outlineOpen}
              aria-label={
                outlineOpen ? t("Ẩn danh sách trường") : t("Danh sách trường")
              }
              title={
                outlineOpen ? t("Ẩn danh sách trường") : t("Danh sách trường")
              }
              onClick={() => setOutlineOpen((open) => !open)}
            >
              <ListTree data-icon="inline-start" />
              {outlineOpen ? t("Ẩn danh sách trường") : t("Danh sách trường")}
            </Button>
            <SearchInput
              label={t("Tìm kiểu trường...")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Field label={t("Thêm vào nhóm")}>
              <Combobox
                label={t("Thêm vào nhóm")}
                value={
                  availableContainers.some(
                    (row) => row.field.id === destination,
                  )
                    ? destination
                    : "__root__"
                }
                options={[
                  { value: "__root__", label: t("Không thuộc nhóm") },
                  ...availableContainers.map((row) => ({
                    value: row.field.id,
                    label: row.field.label[locale],
                  })),
                ]}
                onValueChange={(value) => {
                  setDestination(value === "__root__" ? "" : value);
                  setInsertAt(null);
                }}
              />
            </Field>
            {insertAt && (
              <Notice>
                {t("Đang chọn trường để chèn tại vị trí {{position}}", {
                  position: insertAt.index + 1,
                })}
              </Notice>
            )}
            {[
              {
                label: "Thường dùng",
                types: [
                  "person",
                  "text",
                  "textarea",
                  "number",
                  "select",
                  "checkbox",
                  "date",
                ],
              },
              {
                label: "Văn bản và liên hệ",
                types: [
                  "email",
                  "url",
                  "phone",
                  "password",
                  "address",
                  "hidden",
                ],
              },
              {
                label: "Lựa chọn",
                types: ["radio", "multiselect", "checkboxes", "tags", "survey"],
              },
              {
                label: "Ngày giờ và tiền",
                types: ["currency", "datetime", "time", "day"],
              },
              {
                label: "Bố cục và nhóm",
                types: [
                  "section",
                  "columns",
                  "tabs",
                  "repeat",
                  "container",
                  "table",
                  "content",
                  "alert",
                ],
              },
              {
                label: "Nâng cao",
                types: ["file", "signature", "keyvalue", "button"],
              },
            ].map((group) => {
              const types = group.types.filter((type) =>
                `${type} ${t(fieldTypeLabels[type as FormFieldType])}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              );
              return types.length ? (
                <details key={group.label} open className="fd-toolbox-group">
                  <summary>{t(group.label)}</summary>
                  <div className="fd-form-palette-items">
                    {types.map((type) => (
                      <PaletteItem
                        key={type}
                        type={type as FormFieldType}
                        disabled={readOnly || rows.length >= 300}
                        onAdd={() => add(type as FormFieldType)}
                      />
                    ))}
                  </div>
                </details>
              ) : null;
            })}
            {!formFieldTypes.some((type) =>
              `${type} ${t(fieldTypeLabels[type])}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && <EmptyState title={t("Không tìm thấy kiểu trường")} />}
          </aside>
          <section
            className="fd-form-schema fd-canvas-workspace"
            aria-label={t("Cấu trúc biểu mẫu")}
          >
            {outlineOpen &&
              (rows.length ? (
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
              ))}
            <SortableContext
              items={rows.map((row) => row.field.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className="fd-canvas-paper"
                data-device={device}
                data-orientation={definition.orientation ?? "portrait"}
              >
                <FormCanvas
                  runtimeContext={runtimeContext}
                  dropAfter={dropAfter}
                  definition={definition}
                  providers={providers}
                  selectedId={field?.id}
                  readOnly={readOnly}
                  onSelect={setSelectedId}
                  onPatch={(id, changes) =>
                    commit({
                      ...definition,
                      fields: updateFieldTree(
                        definition.fields,
                        id,
                        (item) => ({ ...item, ...changes }),
                      ),
                    })
                  }
                  onInsert={insert}
                  onMove={moveSelected}
                  onClone={cloneSelected}
                  onDelete={deleteSelected}
                />
              </div>
            </SortableContext>
          </section>
          <aside
            className="fd-form-properties"
            aria-label={t("Thuộc tính trường")}
          >
            {field ? (
              <FieldInspector
                dataSources={Object.keys(providers ?? {}).map(
                  (id) =>
                    dataSources.find((source) => source.id === id) ?? {
                      id,
                      label: { vi: id, en: id },
                      description: {
                        vi: "Nguồn dữ liệu do ứng dụng cung cấp.",
                        en: "Data source supplied by the application.",
                      },
                    },
                )}
                field={field}
                section={properties}
                onSectionChange={setProperties}
                patch={patch}
                references={references}
                containers={containers.map((row) => row.field)}
                parent={parent}
                onParentChange={(parentId) =>
                  commit({
                    ...definition,
                    fields: moveField(definition.fields, field.id, parentId),
                  })
                }
                onMove={move}
                onClone={() => cloneSelected(field)}
                onDelete={() => deleteSelected(field)}
                onError={setError}
                canMoveUp={fieldIndex > 0}
                canMoveDown={fieldIndex < siblings.length - 1}
                canClone={rows.length + flattenFields([field]).length <= 300}
                readOnly={readOnly}
                issues={issues}
                historyRevision={historyRevision}
                width={inspectorWidth}
                onWidthChange={setInspectorWidth}
                onSelectField={setSelectedId}
                onAddColumn={
                  rows.length < 300
                    ? (type) => {
                        add(type, field.id);
                        setSelectedId(field.id);
                        setPane("properties");
                      }
                    : undefined
                }
              />
            ) : (
              <EmptyState title={t("Chọn hoặc thêm một trường")} />
            )}
          </aside>
        </div>
        <DragOverlay
          dropAnimation={{
            duration: 180,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {activeDrag ? (
            <div className="fd-dnd-preview" aria-hidden="true">
              <FieldTypeIcon type={activeDrag.type} />
              <span>{activeDrag.label}</span>
              <small>{t("Thả vào bố cục")}</small>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {importOpen && (
        <Modal
          title={t("Nhập schema JSON")}
          onClose={() => {
            setImportOpen(false);
            setError("");
          }}
          footer={
            <>
              <Button
                onClick={() => {
                  setImportOpen(false);
                  setError("");
                }}
              >
                {t("Hủy")}
              </Button>
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
