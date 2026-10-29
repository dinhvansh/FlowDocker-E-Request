import { useId, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@flowdocker/i18n";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Trash2,
  Pencil,
} from "lucide-react";
import { Badge, Button, FieldGroup } from "@flowdocker/ui";
import { RuntimeFields, type FormRendererProps } from "./runtime";
import { defaultValues, prepareValues } from "./engine";
import {
  fieldTypeLabels,
  isContainer,
  flattenFields,
  type FormDefinition,
  type FormField,
  type PreviewValues,
} from "./schema";
import { InlineLabelEditor } from "./components/inline-label-editor";

export interface FormCanvasProps {
  providers?: FormRendererProps["providers"];
  definition: FormDefinition;
  selectedId?: string;
  readOnly?: boolean;
  onSelect(id: string): void;
  onInsert(field?: FormField): void;
  onMove(field: FormField, offset: number): void;
  onClone(field: FormField): void;
  onDelete(field: FormField): void;
  onPatch?(id: string, changes: Partial<FormField>): void;
}
function FieldOverlay({
  field,
  children,
  selected,
  ...props
}: Omit<FormCanvasProps, "definition" | "selectedId"> & {
  field: FormField;
  children: ReactNode;
  selected: boolean;
}) {
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const editActions = useRef<HTMLDivElement>(null);
  const { active } = useDndContext();
  const dragged = active?.data.current?.field as FormField | undefined;
  const validDrop =
    active &&
    active.id !== field.id &&
    (!dragged ||
      !flattenFields([dragged]).some((item) => item.id === field.id));
  const sortable = useSortable({
    id: field.id,
    disabled: props.readOnly,
    data: { field },
  });
  const containerDrop = useDroppable({
    id: `container:${field.id}`,
    disabled: !isContainer(field) || props.readOnly,
    data: { parentId: field.id },
  });
  return (
    <div
      ref={sortable.setNodeRef}
      data-canvas-field={field.id}
      data-selected={selected}
      data-drop-active={!!sortable.isOver && !!validDrop}
      data-dragging={sortable.isDragging || undefined}
      className="fd-canvas-field"
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      onClick={(event) => {
        if (
          (event.target as HTMLElement).closest("[data-canvas-field]") ===
          event.currentTarget
        ) {
          event.stopPropagation();
          props.onSelect(field.id);
        }
      }}
      onFocusCapture={(event) => {
        // Opening a popover selects on click. Selecting on pointer focus can
        // move its trigger before pointer-up when inline actions appear.
        if (
          (event.target as HTMLElement).closest('[data-slot="popover-trigger"]')
        )
          return;
        if (
          (event.target as HTMLElement).closest("[data-canvas-field]") ===
          event.currentTarget
        )
          props.onSelect(field.id);
      }}
      onDoubleClick={(event) => {
        const target = event.target as HTMLElement;
        if (
          props.onPatch &&
          !props.readOnly &&
          target.closest("[data-canvas-field]") === event.currentTarget &&
          target.closest('[data-slot="field-label"],legend')
        )
          setEditing(true);
      }}
    >
      {sortable.isOver && validDrop && (
        <div className="fd-canvas-drop-indicator">
          {isContainer(field)
            ? t("Thả vào nhóm này")
            : t("Chèn trước trường này")}
        </div>
      )}
      <div className="fd-canvas-field-bar">
        <button
          type="button"
          className="fd-drag-handle"
          disabled={props.readOnly}
          {...sortable.attributes}
          {...sortable.listeners}
          aria-label={t("Di chuyển trường {{key}}", { key: field.key })}
        >
          <GripVertical aria-hidden="true" />
        </button>
        <button
          type="button"
          className="fd-canvas-select"
          aria-pressed={selected}
          onClick={() => props.onSelect(field.id)}
          aria-label={t("Chọn trường {{label}}", {
            label: field.label[locale],
          })}
        >
          {t(fieldTypeLabels[field.type])}
        </button>
        {field.visibleWhen && <Badge>{t("Có điều kiện")}</Badge>}
        {selected && (
          <div className="fd-canvas-inline-actions" ref={editActions}>
            {props.onPatch && (
              <Button
                data-inline-label-edit
                disabled={props.readOnly}
                aria-label={t("Sửa nhãn trên canvas")}
                title={t("Sửa nhãn trên canvas")}
                onClick={() => setEditing(true)}
              >
                <Pencil />
              </Button>
            )}
            <Button
              disabled={props.readOnly}
              aria-label={t("Lên trên")}
              onClick={() => props.onMove(field, -1)}
            >
              <ArrowUp />
            </Button>
            <Button
              disabled={props.readOnly}
              aria-label={t("Xuống dưới")}
              onClick={() => props.onMove(field, 1)}
            >
              <ArrowDown />
            </Button>
            <Button
              disabled={props.readOnly}
              aria-label={t("Nhân bản trường")}
              onClick={() => props.onClone(field)}
            >
              <Copy />
            </Button>
            <Button
              disabled={props.readOnly}
              aria-label={t("Xóa trường")}
              onClick={() => props.onDelete(field)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
      {editing && props.onPatch && (
        <InlineLabelEditor
          key={`${field.id}-${locale}`}
          value={field.label[locale]}
          onFinish={(value, restoreFocus) => {
            if (value !== null && value !== field.label[locale])
              props.onPatch?.(field.id, {
                label: { ...field.label, [locale]: value },
              });
            setEditing(false);
            if (restoreFocus)
              requestAnimationFrame(() =>
                editActions.current
                  ?.querySelector<HTMLButtonElement>("[data-inline-label-edit]")
                  ?.focus(),
              );
          }}
        />
      )}
      <div className="fd-canvas-control">
        {children}
        {field.type === "hidden" && (
          <Badge>
            {field.label[locale]} · {t("Trường ẩn")}
          </Badge>
        )}
      </div>
      {isContainer(field) && active && validDrop && (
        <div
          ref={containerDrop.setNodeRef}
          className="fd-container-drop-zone"
          data-drop-active={containerDrop.isOver || undefined}
        >
          {containerDrop.isOver
            ? t("Thả vào nhóm này")
            : t("Kéo vào đây để thêm vào nhóm")}
        </div>
      )}
      {isContainer(field) && !field.children?.length && (
        <Button
          disabled={props.readOnly}
          onClick={() => {
            props.onSelect(field.id);
            props.onInsert(field);
          }}
        >
          {t("Thêm vào nhóm")}
        </Button>
      )}
      {selected && (
        <Button
          className="fd-canvas-insert"
          disabled={props.readOnly}
          onClick={() => props.onInsert(field)}
        >
          {t("Chèn trường bên dưới")}
        </Button>
      )}
    </div>
  );
}
/** Same field rendering path as FormRenderer; authoring reveals conditional fields. */
export function FormCanvas({ definition, ...props }: FormCanvasProps) {
  const { locale, t } = useI18n();
  const id = useId();
  const [values, setValues] = useState<PreviewValues>(() =>
    defaultValues(definition.fields),
  );
  const reveal = (fields: FormField[]): FormField[] =>
    fields.map((field) => ({
      ...field,
      visibleWhen: undefined,
      children: field.children ? reveal(field.children) : undefined,
    }));
  const prepared = prepareValues(
    { ...definition, fields: reveal(definition.fields) },
    values,
  );
  const drop = useDroppable({ id: "canvas-root" });
  return (
    <div
      ref={drop.setNodeRef}
      className="fd-live-form"
      data-drop-active={drop.isOver}
      aria-label={t("Canvas biểu mẫu trực tiếp")}
    >
      <header className="fd-live-form-header">
        <Badge>
          {t("Bản nháp")} ·{" "}
          {t("Phiên bản {{version}}", { version: definition.version })}
        </Badge>
        <h2>{definition.title[locale] || t("Biểu mẫu chưa đặt tên")}</h2>
        <p>
          {t("Chọn trường để chỉnh sửa. Dữ liệu trên canvas chỉ dùng để thử.")}
        </p>
      </header>
      <FieldGroup>
        <RuntimeFields
          fields={definition.fields}
          data={prepared}
          root={prepared}
          onChange={setValues}
          issues={[]}
          prefix=""
          idPrefix={id}
          revealFieldId={props.selectedId}
          readOnly={props.readOnly}
          providers={props.providers}
          onOptions={() => {}}
          design={{
            wrap: (field, control) => (
              <FieldOverlay
                {...props}
                field={field}
                selected={props.selectedId === field.id}
              >
                {control}
              </FieldOverlay>
            ),
          }}
        />
      </FieldGroup>
      <Button
        className="fd-canvas-add"
        disabled={props.readOnly}
        onClick={() => props.onInsert()}
      >
        {t("Chèn trường")}
      </Button>
    </div>
  );
}
