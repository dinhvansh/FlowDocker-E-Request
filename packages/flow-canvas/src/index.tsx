import type { ReactNode } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export type FlowNodeData = {
  label: string;
  category: string;
  detail?: string;
  labelKey?: string;
  detailKey?: string;
  icon?: ReactNode;
};
export type FlowNode = Node<FlowNodeData, "flowStep">;
function BaseNodeCard({
  data,
  selected,
}: {
  data: FlowNodeData;
  selected?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="fd-flow-node" data-selected={selected}>
      <Handle type="target" position={Position.Left} />
      <span className="fd-flow-node-category">{t(data.category)}</span>
      <strong>{data.labelKey ? t(data.labelKey) : data.label}</strong>
      {data.detail && (
        <small>{data.detailKey ? t(data.detailKey) : data.detail}</small>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { flowStep: BaseNodeCard };
export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}: {
  nodes: FlowNode[];
  edges: Edge[];
  onNodesChange(changes: NodeChange<FlowNode>[]): void;
  onEdgesChange(changes: EdgeChange<Edge>[]): void;
  onConnect(connection: Connection): void;
  onNodeClick(id: string): void;
}) {
  const { t } = useI18n();
  const compact = typeof window !== "undefined" && window.innerWidth <= 700;
  return (
    <div
      className="fd-flow-canvas"
      role="region"
      aria-label={t("Canvas sơ đồ đồng bộ dữ liệu")}
    >
      <ReactFlow
        nodes={nodes}
        ariaLabelConfig={{
          "controls.zoomIn.ariaLabel": t("Phóng to"),
          "controls.zoomOut.ariaLabel": t("Thu nhỏ"),
          "controls.fitView.ariaLabel": t("Vừa khung"),
          "controls.interactive.ariaLabel": t("Bật/tắt tương tác"),
          "controls.ariaLabel": t("Điều khiển sơ đồ"),
          "handle.ariaLabel": t("Cổng kết nối"),
          "minimap.ariaLabel": t("Bản đồ thu nhỏ"),
          "node.a11yDescription.default": t(
            "Nhấn Enter hoặc Space để chọn node. Dùng các phím mũi tên để di chuyển; Delete để xóa và Escape để hủy chọn.",
          ),
          "node.a11yDescription.keyboardDisabled": t(
            "Nhấn Enter hoặc Space để chọn node. Delete để xóa và Escape để hủy chọn.",
          ),
          "node.a11yDescription.ariaLiveMessage": ({ direction, x, y }) =>
            t(
              "Đã di chuyển node {{direction}}. Vị trí mới: x {{x}}, y {{y}}.",
              { direction: t(direction), x, y },
            ),
          "edge.a11yDescription.default": t(
            "Nhấn Enter hoặc Space để chọn cạnh; Delete để xóa và Escape để hủy chọn.",
          ),
        }}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        fitView={!compact}
        defaultViewport={compact ? { x: 20, y: 120, zoom: 0.8 } : undefined}
        minZoom={0.4}
        maxZoom={1.6}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#a0a0a0", strokeWidth: 2 },
        }}
        fitViewOptions={{ padding: 0.12 }}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={18} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
