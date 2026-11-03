import { ColumnLayoutEditor } from "./components/column-layout-editor";
import { FieldIssueBadge } from "./components/field-issue-badge";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@flowdocker/i18n";
import { spacingStyle } from "./spacing";
import { FormBandView } from "./components/form-band";
import { EditableFormTitle } from "./components/editable-form-title";
import { InsertionDropZone } from "./components/insertion-drop-zone";
import { FormDecorationEditor } from "./components/form-decoration-editor";
import type { FormDecoration } from "./decoration";
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
  validateFormDefinition,
  isContainer,
  flattenFields,
  type FormDefinition,
  type FormField,
  type BilingualText,
  type PreviewValues,
} from "./schema";
import { InlineLabelEditor } from "./components/inline-label-editor";
import { FieldConfigurationBadges } from "./components/field-configuration-badges";
import type { ConfigurationSection } from "./field-configuration";

export interface FormCanvasProps {
  runtimeContext?: FormRendererProps["runtimeContext"];
  dropAfter?: boolean;
  providers?: FormRendererProps["providers"];
  definition: FormDefinition;
  selectedId?: string;
  readOnly?: boolean;
  onSelect(id: string): void;
  onInsert(field?: FormField): void;
  onMove(field: FormField, offset: number): void;
  onClone(field: FormField): void;
  onDelete(field: FormField): void;
  onPatch?(
    id: string,
    changes: Partial<FormField>,
    recordHistory?: boolean,
  ): void;
  onInspect?(id: string, section: ConfigurationSection): void;
  onDecorationChange?(decoration: FormDecoration): void;
  onTitleChange?(title: BilingualText): void;
  onIssue?(id: string): void;
}
function FieldOverlay({
  field,
  children,
  selected,
  issueCount,
  ...props
}: Omit<FormCanvasProps, "definition" | "selectedId"> & {
  field: FormField;
  children: ReactNode;
  selected: boolean;
  issueCount: number;
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
      data-spacing-section={field.type === "section" || undefined}
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
        // Popovers and configuration links select on click. Pointer focus
        // must not move their trigger before pointer-up adds inline actions.
        if (
          (event.target as HTMLElement).closest(
            '[data-slot="popover-trigger"], .fd-field-configuration-link',
          )
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
      <InsertionDropZone
        target={{ fieldId: field.id, edge: "before" }}
        disabled={props.readOnly}
      />
      <InsertionDropZone
        target={{ fieldId: field.id, edge: "after" }}
        disabled={props.readOnly}
      />
      {sortable.isOver && validDrop && (
        <div
          className="fd-canvas-drop-indicator"
          data-placement={
            !isContainer(field) && props.dropAfter ? "after" : "before"
          }
        >
          {isContainer(field)
            ? t("Thả vào nhóm này")
            : t(
                props.dropAfter
                  ? "Chèn sau trường này"
                  : "Chèn trước trường này",
              )}
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
        <FieldIssueBadge
          field={field}
          count={issueCount}
          onNavigate={() =>
            props.onIssue ? props.onIssue(field.id) : props.onSelect(field.id)
          }
        />
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
      <FieldConfigurationBadges
        field={field}
        onNavigate={
          props.onInspect
            ? (section) => props.onInspect?.(field.id, section)
            : undefined
        }
      />
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
      {selected && field.type === "columns" && props.onPatch && (
        <ColumnLayoutEditor
          field={field}
          disabled={props.readOnly}
          onChange={(columnRatios, recordHistory) =>
            props.onPatch?.(field.id, { columnRatios }, recordHistory)
          }
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
  const issueCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const issue of validateFormDefinition(definition))
      if (issue.fieldId)
        counts.set(issue.fieldId, (counts.get(issue.fieldId) ?? 0) + 1);
    return counts;
  }, [definition]);
  const { t, locale } = useI18n();
  const id = useId();
  const [values, setValues] = useState<PreviewValues>(() =>
    defaultValues(definition.fields, undefined, props.runtimeContext),
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
    {},
    props.runtimeContext,
  );
  const drop = useDroppable({ id: "canvas-root", disabled: props.readOnly });
  return (
    <div
      ref={drop.setNodeRef}
      className="fd-live-form"
      data-form-spacing={definition.spacing ? "custom" : undefined}
      style={spacingStyle(definition.spacing)}
      data-drop-active={drop.isOver}
      aria-label={t("Canvas biểu mẫu trực tiếp")}
    >
      <InsertionDropZone target={{ edge: "start" }} disabled={props.readOnly} />
      {props.onDecorationChange && (
        <div className="fd-canvas-band-actions">
          <FormDecorationEditor
            value={definition.decoration}
            title={definition.title}
            disabled={props.readOnly}
            entry="header"
            onChange={props.onDecorationChange}
          />
        </div>
      )}
      <FormBandView
        decoration={definition.decoration}
        placement="header"
        title={definition.title}
        renderTitle={
          props.onTitleChange
            ? () => (
                <EditableFormTitle
                  key={locale}
                  title={definition.title}
                  disabled={props.readOnly}
                  onChange={props.onTitleChange!}
                />
              )
            : undefined
        }
      />
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
          runtimeContext={props.runtimeContext}
          onOptions={() => {}}
          design={{
            wrap: (field, control) => (
              <FieldOverlay
                {...props}
                field={field}
                issueCount={issueCounts.get(field.id) ?? 0}
                selected={props.selectedId === field.id}
              >
                {control}
              </FieldOverlay>
            ),
          }}
        />
      </FieldGroup>
      <InsertionDropZone target={{ edge: "end" }} disabled={props.readOnly} />
      {props.onDecorationChange && (
        <div className="fd-canvas-band-actions">
          <FormDecorationEditor
            value={definition.decoration}
            title={definition.title}
            disabled={props.readOnly}
            entry="footer"
            onChange={props.onDecorationChange}
          />
        </div>
      )}
      <FormBandView
        decoration={definition.decoration}
        placement="footer"
        title={definition.title}
        renderTitle={
          props.onTitleChange
            ? () => (
                <EditableFormTitle
                  key={locale}
                  title={definition.title}
                  disabled={props.readOnly}
                  onChange={props.onTitleChange!}
                />
              )
            : undefined
        }
      />
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
