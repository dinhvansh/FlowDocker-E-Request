import { useI18n } from "@flowdocker/i18n";
import { useCallback, useMemo, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import {
  CircleAlert,
  Database,
  GitBranch,
  Plus,
  Save,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { FlowCanvas, type FlowNode } from "@flowdocker/flow-canvas";
import { Badge, Button, Notice, Select } from "@flowdocker/ui";
import { validateGraph, type StepKind } from "./flow-validation";

const STORAGE_KEY = "flowdocker.pr2.flow-draft";
const initialNodes: FlowNode[] = [
  {
    id: "source",
    type: "flowStep",
    position: { x: 30, y: 75 },
    data: {
      label: "Nguồn mẫu",
      labelKey: "Nguồn mẫu",
      category: "Source",
      detail: "2 bản ghi tổng hợp",
      detailKey: "2 bản ghi tổng hợp",
    },
  },
  {
    id: "staging",
    type: "flowStep",
    position: { x: 265, y: 75 },
    data: {
      label: "RAW / Staging",
      labelKey: "RAW / Staging",
      category: "RAW / Staging",
      detail: "Ranh giới lưu bền",
      detailKey: "Ranh giới lưu bền",
    },
  },
  {
    id: "mapper",
    type: "flowStep",
    position: { x: 500, y: 75 },
    data: {
      label: "Ánh xạ trường",
      labelKey: "Ánh xạ trường",
      category: "Field Mapper",
      detail: "Vendor → master",
      detailKey: "Vendor → master",
    },
  },
  {
    id: "validate",
    type: "flowStep",
    position: { x: 265, y: 270 },
    data: {
      label: "Kiểm tra",
      labelKey: "Kiểm tra",
      category: "Validate",
      detail: "Khóa và company",
      detailKey: "Khóa và company",
    },
  },
  {
    id: "upsert",
    type: "flowStep",
    position: { x: 500, y: 270 },
    data: {
      label: "Master Upsert",
      labelKey: "Master Upsert",
      category: "Master Upsert",
      detail: "Chưa chạy thật",
      detailKey: "Chưa chạy thật",
    },
  },
];
const initialEdges: Edge[] = [
  { id: "e1", source: "source", target: "staging" },
  { id: "e2", source: "staging", target: "mapper" },
  { id: "e3", source: "mapper", target: "validate" },
  { id: "e4", source: "validate", target: "upsert" },
];
type SavedGraph = {
  nodes: FlowNode[];
  edges: Edge[];
  mapping: Record<string, string>;
};
function loadGraph(): SavedGraph {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    );
    if (
      value &&
      typeof value === "object" &&
      "nodes" in value &&
      "edges" in value &&
      "mapping" in value &&
      Array.isArray(value.nodes) &&
      Array.isArray(value.edges)
    )
      return {
        ...(value as SavedGraph),
        nodes: (value as SavedGraph).nodes.map((node) => {
          const starter = initialNodes.find((item) => item.id === node.id);
          return starter
            ? {
                ...node,
                data: {
                  ...node.data,
                  labelKey:
                    node.data.label === starter.data.label
                      ? starter.data.labelKey
                      : node.data.labelKey,
                  detailKey:
                    node.data.detail === starter.data.detail
                      ? starter.data.detailKey
                      : node.data.detailKey,
                },
              }
            : node;
        }),
      };
  } catch {
    /* Use the synthetic starter graph. */
  }
  return {
    nodes: initialNodes,
    edges: initialEdges,
    mapping: { code: "VendorNum", name: "Name", company: "Company" },
  };
}
const sourceFields = [
  { value: "VendorNum", label: "VendorNum · mã" },
  { value: "Name", label: "Name · tên" },
  { value: "Company", label: "Company · công ty" },
  { value: "Active", label: "Active · trạng thái" },
];
const targetFields = [
  { key: "code", label: "vendor_code", required: true },
  { key: "name", label: "display_name", required: true },
  { key: "company", label: "company_ref", required: true },
  { key: "active", label: "is_active", required: false },
];
const sampleRows = [
  {
    VendorNum: "V-001",
    Name: "Nhà cung cấp mẫu A",
    Company: "DEMO",
    Active: true,
  },
  {
    VendorNum: "V-002",
    Name: "Nhà cung cấp mẫu B",
    Company: "DEMO",
    Active: true,
  },
];

export function FlowStudioPage({
  onOpenConnections,
}: {
  onOpenConnections(): void;
}) {
  const { t, validation } = useI18n();

  const [initial] = useState(loadGraph);
  const [nodes, setNodes] = useState<FlowNode[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [mapping, setMapping] = useState(initial.mapping);
  const [selectedId, setSelectedId] = useState("source");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const selected = nodes.find((node) => node.id === selectedId);
  const errors = useMemo(
    () => validateGraph(nodes, edges, mapping),
    [nodes, edges, mapping],
  );
  const previewRows = sampleRows.map((row) => ({
    vendor_code: row[mapping.code as keyof typeof row],
    display_name: row[mapping.name as keyof typeof row],
    company_ref: row[mapping.company as keyof typeof row],
    ...(mapping.active
      ? { is_active: row[mapping.active as keyof typeof row] }
      : {}),
  }));
  const onNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
    if (
      changes.some((change) =>
        ["position", "remove", "add", "replace"].includes(change.type),
      )
    ) {
      setDirty(true);
      setPreview(false);
    }
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
    if (changes.some((change) => change.type !== "select")) {
      setDirty(true);
      setPreview(false);
    }
  }, []);
  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) => addEdge({ ...connection, animated: false }, current));
    setDirty(true);
    setPreview(false);
  }, []);
  const addNode = (kind: StepKind) => {
    const id = crypto.randomUUID();
    setNodes((current) => [
      ...current,
      {
        id,
        type: "flowStep",
        position: {
          x: 250 + current.length * 35,
          y: 270 + current.length * 15,
        },
        data: {
          label: kind,
          category: kind,
          detail: "Bước demo mới",
          detailKey: "Bước demo mới",
          labelKey: kind,
        },
      },
    ]);
    setSelectedId(id);
    setDirty(true);
    setPreview(false);
  };
  const save = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nodes, edges, mapping }),
    );
    setDirty(false);
    setStatus(
      "Đã lưu bản nháp flow trong trình duyệt. Chưa publish hoặc chạy đồng bộ.",
    );
  };
  const dryRun = () => {
    setPreview(false);
    if (errors.length) {
      setStatus(`Chưa thể xem dry run: ${errors[0]}`);
      return;
    }
    setPreview(true);
    setStatus(
      "Dry run mô phỏng trên 2 bản ghi tổng hợp. Không đọc nguồn ngoài, không ghi master hoặc checkpoint.",
    );
  };
  return (
    <section className="fd-screen fd-pr2-screen fd-flow-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">{t("DỮ LIỆU / FLOW STUDIO")}</div>
          <h1>{t("Master Data Flow Studio")}</h1>
          <p>
            {t("Thiết kế đường đi Source → RAW → Map → Validate → Master.")}
          </p>
        </div>
        <div className="fd-toolbar-actions">
          <Badge tone="warning">{t("Bản nháp demo")}</Badge>
          <Button onClick={save}>
            <Save size={16} />
            {t("Lưu nháp")}
            {dirty ? " *" : ""}
          </Button>
          <Button variant="primary" onClick={dryRun}>
            {t("Dry run mẫu")}
          </Button>
          <Button
            disabled
            title={t("Cần compiler, backend, authorization và kiểm thử thật")}
          >
            {t("Publish")}
          </Button>
        </div>
      </div>
      <div className="fd-pr2-note">
        <CircleAlert size={18} />
        <span>
          {t(
            "Canvas và dry run chỉ dùng dữ liệu tổng hợp trong trình duyệt. Chưa có connector, staging, worker, master upsert hay checkpoint thật.",
          )}
        </span>
      </div>
      {status && (
        <div className="fd-pr2-feedback" role="status">
          {validation(status)}
        </div>
      )}
      <div className="fd-flow-workbench">
        <aside className="fd-flow-palette">
          <h2>{t("Thư viện node")}</h2>
          <p>{t("Nhấn để thêm; kéo node trên canvas và nối bằng cổng.")}</p>
          {(
            [
              "Source",
              "RAW / Staging",
              "Filter",
              "Field Mapper",
              "Validate",
              "Master Upsert",
            ] as StepKind[]
          ).map((kind) => (
            <button type="button" key={kind} onClick={() => addNode(kind)}>
              <Plus size={15} />
              {t(kind)}
            </button>
          ))}
          <div className="fd-flow-palette-foot">
            <Button variant="ghost" onClick={onOpenConnections}>
              <Database size={16} />
              {t("Xem kết nối")}
            </Button>
            <small>
              {t("Source thật cần kết nối ACTIVE đã được kiểm tra.")}
            </small>
          </div>
        </aside>
        <div className="fd-flow-center">
          <div className="fd-flow-canvas-head">
            <span>
              <Waypoints size={16} />
              {t("Flow mẫu · Vendor")}
            </span>
            <Badge tone={errors.length ? "warning" : "success"}>
              {errors.length
                ? t("{{count}} vấn đề", { count: errors.length })
                : t("Cấu trúc hợp lệ")}
            </Badge>
          </div>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={setSelectedId}
          />
          <div className="fd-flow-validation">
            <strong>
              <ShieldCheck size={16} />
              {t("Kiểm tra cấu trúc")}
            </strong>
            {errors.length ? (
              <ul>
                {errors.map((error) => (
                  <li key={error}>{validation(error)}</li>
                ))}
              </ul>
            ) : (
              <p>
                {t(
                  "Đủ node chính, không có vòng lặp và Upsert nhận từ Validate. Chưa chứng minh thực thi thật.",
                )}
              </p>
            )}
          </div>
        </div>
        <aside className="fd-flow-inspector">
          <h2>{t("Inspector")}</h2>
          {selected ? (
            <>
              <span className="fd-overline">{t("NODE ĐANG CHỌN")}</span>
              <h3>
                {selected.data.labelKey
                  ? t(selected.data.labelKey)
                  : selected.data.label}
              </h3>
              <p>
                {t(selected.data.category)} ·{" "}
                {selected.data.detailKey
                  ? t(selected.data.detailKey)
                  : selected.data.detail}
              </p>
              <dl>
                <dt>{t("Node ID")}</dt>
                <dd>{selected.id.slice(0, 12)}</dd>
                <dt>{t("Trạng thái")}</dt>
                <dd>{t("Chưa chạy thật")}</dd>
              </dl>
              {selected.data.category === "Field Mapper" && (
                <div className="fd-flow-mapping">
                  <h3>{t("Ánh xạ trường")}</h3>
                  {targetFields.map((target) => (
                    <label key={target.key}>
                      {target.label}
                      {target.required && " *"}
                      <Select
                        label={t("Nguồn cho {{field}}", {
                          field: target.label,
                        })}
                        value={mapping[target.key] || "none"}
                        onValueChange={(value) => {
                          setMapping({
                            ...mapping,
                            [target.key]: value === "none" ? "" : value,
                          });
                          setDirty(true);
                          setPreview(false);
                        }}
                        options={[
                          { value: "none", label: t("Chưa ánh xạ") },
                          ...sourceFields.map((option) => ({
                            ...option,
                            label: t(option.label),
                          })),
                        ]}
                      />
                    </label>
                  ))}
                </div>
              )}
              {selected.data.category !== "Source" && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNodes(nodes.filter((node) => node.id !== selected.id));
                    setEdges(
                      edges.filter(
                        (edge) =>
                          edge.source !== selected.id &&
                          edge.target !== selected.id,
                      ),
                    );
                    setSelectedId("");
                    setDirty(true);
                  }}
                >
                  {t("Xóa node")}
                </Button>
              )}
            </>
          ) : (
            <p>{t("Chọn node để xem cấu hình.")}</p>
          )}
        </aside>
      </div>
      <div className="fd-flow-preview">
        <div>
          <GitBranch size={18} />
          <strong>{t("Data Inspector · dry run mẫu")}</strong>
          <Badge tone="info">{t("Không ghi dữ liệu")}</Badge>
        </div>
        {preview ? (
          <div className="fd-flow-preview-grid">
            <div>
              <h3>{t("Input đã che dữ liệu")}</h3>
              <pre>{JSON.stringify(sampleRows, null, 2)}</pre>
            </div>
            <div>
              <h3>{t("Output dự kiến")}</h3>
              <pre>{JSON.stringify(previewRows, null, 2)}</pre>
            </div>
            <div>
              <h3>{t("Kết quả")}</h3>
              <p>{t("2 bản ghi mẫu · 0 lỗi mẫu")}</p>
              <p>
                {t(
                  "Ánh xạ trên mẫu hiện tại; chưa tra cứu company, kiểm tra dữ liệu hoặc ghi master thật.",
                )}
              </p>
            </div>
          </div>
        ) : (
          <p>
            {t(
              "Chạy dry run mẫu để xem bố cục input/output. Để thử node thật cần nguồn đã duyệt và backend.",
            )}
          </p>
        )}
      </div>
      <Notice tone="warning">
        {t(
          "Graph chỉ lưu localStorage. Không dùng bản nháp này để quyết định quyền hay đồng bộ dữ liệu thật.",
        )}
      </Notice>
    </section>
  );
}
