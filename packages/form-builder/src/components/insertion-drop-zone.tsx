import { useDndContext, useDroppable } from "@dnd-kit/core";
import { useI18n } from "@flowdocker/i18n";
import { flattenFields, type FormField } from "../schema";
import type { FormInsertionTarget } from "../insertion";

export function InsertionDropZone({
  target,
  disabled,
}: {
  target: FormInsertionTarget;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const { active } = useDndContext();
  const dragged = active?.data.current?.field as FormField | undefined;
  const invalid =
    !!target.fieldId &&
    !!dragged &&
    flattenFields([dragged]).some((field) => field.id === target.fieldId);
  const enabled = !!active && !disabled && !invalid;
  const drop = useDroppable({
    id: `insert:${target.fieldId ?? "root"}:${target.edge}`,
    disabled: !enabled,
    data: { insertion: target },
  });
  return (
    <div
      ref={drop.setNodeRef}
      className="fd-insertion-zone"
      data-edge={target.edge}
      data-enabled={enabled}
      data-over={drop.isOver && enabled}
    >
      {enabled && (
        <span>
          {t(
            target.edge === "start"
              ? "Thả vào đầu biểu mẫu"
              : target.edge === "end"
                ? "Thả vào cuối biểu mẫu"
                : target.edge === "before"
                  ? "Chèn trước trường này"
                  : "Chèn sau trường này",
          )}
        </span>
      )}
    </div>
  );
}
