import type { ReactNode } from "react";
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
  return (
    <div className="fd-flow-node" data-selected={selected}>
      <Handle type="target" position={Position.Left} />
      <span className="fd-flow-node-category">{data.category}</span>
      <strong>{data.label}</strong>
      {data.detail && <small>{data.detail}</small>}
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
  const compact = typeof window !== "undefined" && window.innerWidth <= 700;
  return (
    <div
      className="fd-flow-canvas"
      role="region"
      aria-label="Canvas sơ đồ đồng bộ dữ liệu"
    >
      <ReactFlow
        nodes={nodes}
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
