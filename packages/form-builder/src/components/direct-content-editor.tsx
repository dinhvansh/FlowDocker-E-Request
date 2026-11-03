import { useRef, useState, type PointerEvent } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Pencil,
  Image,
  RotateCcw,
  Scaling,
} from "lucide-react";
import { useI18n } from "@flowdocker/i18n";
import { Button, Input, Modal } from "@flowdocker/ui";
import type { FormField } from "../schema";
import {
  contentPosition,
  contentPresentation,
  movedContent,
  resizedContent,
} from "../content-position";
import { ContentBlock } from "./content-block";
import { ContentBlockEditor } from "./content-block-editor";
import { InlineLabelEditor } from "./inline-label-editor";
import "./direct-content-editor.css";

export interface ContentDesign {
  selectedId?: string;
  disabled?: boolean;
  onSelect(id: string): void;
  onPatch(
    id: string,
    changes: Partial<FormField>,
    recordHistory?: boolean,
  ): void;
}
export interface DirectContentEditorProps {
  field: FormField;
  design: ContentDesign;
}
export function DirectContentEditor({
  field,
  design,
}: DirectContentEditorProps) {
  const { t, locale } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    mode: "move" | "resize";
    x: number;
    y: number;
    available: number;
    field: FormField;
    renderedWidth?: number;
    started: boolean;
    pointerId: number;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState(false);
  const selected = design.selectedId === field.id;
  const p = contentPresentation(field);
  const patch = (presentation: FormField["presentation"], history = true) => {
    if (!design.disabled) design.onPatch(field.id, { presentation }, history);
  };
  const cancel = () => {
    const current = gesture.current;
    if (current?.started) patch(current.field.presentation, false);
    gesture.current = null;
  };
  const start = (event: PointerEvent, mode: "move" | "resize") => {
    if (design.disabled || event.button !== 0 || editing) return;
    event.stopPropagation();
    design.onSelect(field.id);
    const object =
      root.current?.querySelector<HTMLElement>(".fd-content-object");
    const block = root.current?.querySelector<HTMLElement>(".fd-content-block");
    if (!object || !block) return;
    event.preventDefault();
    root.current!.focus({ preventScroll: true });
    root.current!.setPointerCapture(event.pointerId);
    gesture.current = {
      mode,
      x: event.clientX,
      y: event.clientY,
      available: Math.max(
        0,
        block.clientWidth - object.getBoundingClientRect().width,
      ),
      field,
      renderedWidth:
        field.type === "image"
          ? Math.round(
              object.querySelector("img")?.getBoundingClientRect().width ??
                p.imageWidth ??
                240,
            )
          : undefined,
      started: false,
      pointerId: event.pointerId,
    };
  };
  const size =
    field.type === "image"
      ? (p.imageWidth ?? 240)
      : (p.fontSize ??
        (p.size === "title" ? 18 : p.size === "subtitle" ? 14 : 12));
  const alignments = [
    { value: "left", label: t("Căn trái"), Icon: AlignLeft },
    { value: "center", label: t("Căn giữa"), Icon: AlignCenter },
    { value: "right", label: t("Căn phải"), Icon: AlignRight },
  ] as const;
  const resizeHandle =
    selected && !design.disabled ? (
      <button
        type="button"
        className="fd-content-size-handle"
        role="slider"
        aria-label={
          field.type === "image"
            ? t("Kéo đổi kích thước ảnh")
            : t("Kéo đổi cỡ chữ")
        }
        aria-valuemin={field.type === "image" ? 32 : 12}
        aria-valuemax={field.type === "image" ? 640 : 48}
        aria-valuenow={size}
        onPointerDown={(event) => start(event, "resize")}
        onKeyDown={(event) => {
          if (
            !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
              event.key,
            )
          )
            return;
          event.preventDefault();
          event.stopPropagation();
          const direction = ["ArrowLeft", "ArrowDown"].includes(event.key)
            ? -1
            : 1;
          patch(
            resizedContent(
              field,
              direction *
                (event.shiftKey ? 10 : 1) *
                (field.type === "image" ? 1 : 6),
            ),
          );
        }}
      >
        <Scaling aria-hidden="true" />
      </button>
    ) : undefined;
  return (
    <div
      ref={root}
      className="fd-direct-content"
      data-selected={selected}
      data-editing={editing}
      tabIndex={design.disabled ? -1 : 0}
      role="group"
      aria-label={t("Chọn và chỉnh {{label}}", { label: field.label[locale] })}
      onFocus={(event) => {
        if (event.target === event.currentTarget && !design.disabled)
          design.onSelect(field.id);
      }}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button,input,textarea"))
          return;
        if ((event.target as HTMLElement).closest(".fd-content-object"))
          start(event, "move");
      }}
      onPointerMove={(event) => {
        const current = gesture.current;
        if (!current) return;
        const dx = event.clientX - current.x,
          dy = event.clientY - current.y;
        if (!current.started) {
          if (Math.abs(dx) + Math.abs(dy) < 3) return;
          current.started = true;
          patch(current.field.presentation, true);
        }
        patch(
          current.mode === "move"
            ? movedContent(
                contentPresentation(current.field),
                dx,
                dy,
                current.available,
              )
            : resizedContent(
                current.renderedWidth === undefined
                  ? current.field
                  : {
                      ...current.field,
                      presentation: {
                        ...contentPresentation(current.field),
                        imageWidth: current.renderedWidth,
                      },
                    },
                dx,
              ),
          false,
        );
      }}
      onPointerUp={(event) => {
        gesture.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape" && gesture.current) {
          event.preventDefault();
          event.stopPropagation();
          cancel();
        }
      }}
      onDoubleClick={(event) => {
        if (
          field.type === "content" &&
          !design.disabled &&
          (event.target as HTMLElement).closest(".fd-content-object")
        ) {
          event.stopPropagation();
          design.onSelect(field.id);
          setEditing(true);
        }
      }}
    >
      {selected && (
        <div
          className="fd-content-inline-toolbar"
          role="toolbar"
          aria-label={t("Chỉnh nội dung trực tiếp")}
        >
          <Button
            disabled={design.disabled}
            aria-label={t("Di chuyển nội dung")}
            title={t("Kéo để di chuyển; phím mũi tên để chỉnh vị trí")}
            onPointerDown={(event) => start(event, "move")}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  event.key,
                )
              )
                return;
              event.preventDefault();
              event.stopPropagation();
              const step = event.shiftKey ? 10 : 1;
              patch(
                movedContent(
                  p,
                  event.key === "ArrowLeft"
                    ? -step
                    : event.key === "ArrowRight"
                      ? step
                      : 0,
                  event.key === "ArrowUp"
                    ? -step
                    : event.key === "ArrowDown"
                      ? step
                      : 0,
                  100,
                  false,
                ),
              );
            }}
          >
            <Move aria-hidden="true" />
          </Button>
          {alignments.map(({ value, label, Icon }) => (
            <Button
              key={value}
              disabled={design.disabled}
              aria-label={label}
              title={label}
              aria-pressed={
                contentPosition(p) ===
                (value === "left" ? 0 : value === "center" ? 50 : 100)
              }
              onClick={() =>
                patch({ ...p, align: value, horizontalPosition: undefined })
              }
            >
              <Icon aria-hidden="true" />
            </Button>
          ))}
          <Button
            disabled={design.disabled}
            onClick={() =>
              field.type === "content" ? setEditing(true) : setSettings(true)
            }
          >
            {field.type === "content" ? (
              <Pencil aria-hidden="true" />
            ) : (
              <Image aria-hidden="true" />
            )}
            {field.type === "content" ? t("Sửa chữ") : t("Đổi ảnh")}
          </Button>
          <Input
            type="number"
            aria-label={
              field.type === "image"
                ? t("Chiều rộng ảnh (px)")
                : t("Cỡ chữ (px)")
            }
            min={field.type === "image" ? 32 : 12}
            max={field.type === "image" ? 640 : 48}
            value={size}
            disabled={design.disabled}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (
                !Number.isInteger(next) ||
                next < (field.type === "image" ? 32 : 12) ||
                next > (field.type === "image" ? 640 : 48)
              )
                return;
              patch({
                ...p,
                ...(field.type === "image"
                  ? { imageWidth: next }
                  : { fontSize: next }),
              });
            }}
          />
          <Button
            disabled={design.disabled}
            aria-label={t("Đặt lại vị trí")}
            title={t("Đặt lại vị trí")}
            onClick={() =>
              patch({
                ...p,
                horizontalPosition: undefined,
                spaceAbove: undefined,
              })
            }
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        </div>
      )}
      {selected && editing ? (
        <InlineLabelEditor
          key={`${field.id}-${locale}`}
          value={field.label[locale]}
          label={t("Nội dung trên mẫu")}
          onFinish={(value, restoreFocus) => {
            if (
              value !== null &&
              !design.disabled &&
              value !== field.label[locale]
            )
              design.onPatch(field.id, {
                label: { ...field.label, [locale]: value },
              });
            setEditing(false);
            if (restoreFocus) root.current?.focus({ preventScroll: true });
          }}
        />
      ) : (
        <ContentBlock field={field} controls={resizeHandle} />
      )}
      {selected && (
        <p className="fd-content-drag-help">
          {t("Kéo nội dung trong ô bố cục; kéo góc để đổi cỡ. Esc để hủy kéo.")}
        </p>
      )}
      {settings && (
        <Modal
          title={t("Ảnh và nội dung")}
          onClose={() => setSettings(false)}
          footer={
            <Button onClick={() => setSettings(false)}>{t("Đóng")}</Button>
          }
        >
          <ContentBlockEditor
            field={field}
            disabled={design.disabled}
            onChange={(changes) => {
              if (!design.disabled) design.onPatch(field.id, changes);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
