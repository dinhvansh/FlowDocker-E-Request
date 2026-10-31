import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  organizationCardWidth,
  organizationLayout,
  type OrganizationPerson,
} from "./organization-layout";
import "@xyflow/react/dist/style.css";

type PersonNode = Node<
  OrganizationPerson & {
    depth: number;
    childCount: number;
    collapsed: boolean;
    selected: boolean;
    toggle(): void;
    select(): void;
  },
  "organizationPerson"
>;
function PersonCard({ data }: NodeProps<PersonNode>) {
  const { t } = useI18n();
  const initials = data.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <div
      className="fd-org-node"
      data-level={Math.min(data.depth, 3)}
      data-selected={data.selected}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <button
        type="button"
        className="fd-org-card nodrag nopan"
        onClick={data.select}
        aria-pressed={data.selected}
        aria-label={t("Xem thông tin {{name}}", { name: data.name })}
      >
        <span className="fd-org-portrait" aria-hidden="true">
          {initials}
        </span>
        <span className="fd-org-card-copy">
          <strong>{data.name}</strong>
          <span>{data.title}</span>
          <small>{data.department}</small>
        </span>
      </button>
      {data.childCount > 0 && (
        <button
          type="button"
          className="fd-org-branch nodrag nopan"
          onClick={data.toggle}
          aria-expanded={!data.collapsed}
          aria-label={t(
            data.collapsed
              ? "Mở nhánh của {{name}}"
              : "Thu gọn nhánh của {{name}}",
            { name: data.name },
          )}
        >
          <span aria-hidden="true">{data.collapsed ? "+" : "−"}</span>
          <span>{data.childCount}</span>
        </button>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
const nodeTypes = { organizationPerson: PersonCard };
export interface OrganizationCanvasProps {
  people: readonly OrganizationPerson[];
  selectedId?: string;
  onSelect(id: string): void;
}
function Chart({ people, selectedId, onSelect }: OrganizationCanvasProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const positions = useMemo(
    () => organizationLayout(people, collapsed),
    [people, collapsed],
  );
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refit = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void fitView({
          padding: 0.18,
          minZoom: window.innerWidth < 700 ? 0.65 : 0.35,
          maxZoom: 1,
        });
      }, 80);
    };
    const observer = new ResizeObserver(refit);
    if (containerRef.current) observer.observe(containerRef.current);
    refit();
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [positions, fitView]);
  const nodes: PersonNode[] = positions.map((position) => {
    const person = people.find((item) => item.id === position.id)!;
    return {
      id: person.id,
      type: "organizationPerson",
      position: { x: position.x, y: position.y },
      width: organizationCardWidth,
      height: 100,
      data: {
        ...person,
        depth: position.depth,
        childCount: position.childCount,
        collapsed: collapsed.has(person.id),
        selected: selectedId === person.id,
        select: () => onSelect(person.id),
        toggle: () =>
          setCollapsed((previous) => {
            const next = new Set(previous);
            if (next.has(person.id)) next.delete(person.id);
            else next.add(person.id);
            return next;
          }),
      },
    };
  });
  const edges = positions
    .filter((position) => position.parentId)
    .map((position) => ({
      id: `${position.parentId}:${position.id}`,
      source: position.parentId!,
      target: position.id,
      type: "smoothstep",
      focusable: false,
      selectable: false,
    }));
  return (
    <div
      ref={containerRef}
      className="fd-organization-canvas"
      role="region"
      aria-label={t("Sơ đồ tổ chức tương tác")}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        deleteKeyCode={null}
        zoomOnScroll={false}
        minZoom={0.25}
        maxZoom={1.6}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        ariaLabelConfig={{
          "controls.zoomIn.ariaLabel": t("Phóng to"),
          "controls.zoomOut.ariaLabel": t("Thu nhỏ"),
          "controls.fitView.ariaLabel": t("Vừa khung"),
          "controls.ariaLabel": t("Điều khiển sơ đồ"),
        }}
      >
        <Background gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
      <span className="fd-org-canvas-hint">
        {t("Kéo nền để di chuyển · dùng nút + / − để phóng to, thu nhỏ")}
      </span>
    </div>
  );
}
/** Read-only organizational visualization, independent from workflow/sync graph execution. */
export function OrganizationCanvas(props: OrganizationCanvasProps) {
  return (
    <ReactFlowProvider>
      <Chart {...props} />
    </ReactFlowProvider>
  );
}
