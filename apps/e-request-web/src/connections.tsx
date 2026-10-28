import { useMemo, useState } from "react";
import {
  ArrowRight,
  Cable,
  CircleAlert,
  Plus,
  Search,
  Server,
} from "lucide-react";
import { Badge, Button, Input, Notice, Select } from "@flowdocker/ui";

export type ConnectionDraft = {
  id: string;
  name: string;
  kind: "SQL Server" | "Epicor REST" | "Microsoft Graph" | "HR REST";
  environment: "DEV" | "QA";
  owner: string;
  endpointLabel: string;
  status: "DRAFT";
};

const STORAGE_KEY = "flowdocker.pr2.connections";
const starter: ConnectionDraft[] = [
  {
    id: "demo-sql",
    name: "Epicor · môi trường mẫu",
    kind: "SQL Server",
    environment: "DEV",
    owner: "Integration Operator",
    endpointLabel: "Chưa cấu hình endpoint",
    status: "DRAFT",
  },
  {
    id: "demo-graph",
    name: "Entra · môi trường mẫu",
    kind: "Microsoft Graph",
    environment: "QA",
    owner: "Identity Operator",
    endpointLabel: "Chưa cấu hình endpoint",
    status: "DRAFT",
  },
];
function readDrafts(): ConnectionDraft[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    );
    return Array.isArray(value) &&
      value.every(
        (item) =>
          item && typeof item.id === "string" && item.status === "DRAFT",
      )
      ? (value as ConnectionDraft[])
      : starter;
  } catch {
    return starter;
  }
}
const kindOptions = [
  { value: "SQL Server", label: "SQL Server (đọc giới hạn)" },
  { value: "Epicor REST", label: "Epicor REST / BAQ" },
  { value: "Microsoft Graph", label: "Microsoft Graph" },
  { value: "HR REST", label: "HR REST API" },
];

export function ConnectionsPage({ onOpenFlows }: { onOpenFlows(): void }) {
  const [drafts, setDrafts] = useState<ConnectionDraft[]>(readDrafts);
  const [selectedId, setSelectedId] = useState(() => readDrafts()[0]?.id || "");
  const [query, setQuery] = useState("");
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<Omit<ConnectionDraft, "id" | "status">>({
    name: "",
    kind: "SQL Server",
    environment: "DEV",
    owner: "",
    endpointLabel: "",
  });
  const selected = drafts.find((item) => item.id === selectedId);
  const filtered = useMemo(
    () =>
      drafts.filter((item) =>
        `${item.name} ${item.kind} ${item.owner}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [drafts, query],
  );
  const save = () => {
    if (!form.name.trim() || !form.owner.trim()) {
      setNotice("Cần nhập tên kết nối và người phụ trách.");
      return;
    }
    const item: ConnectionDraft = {
      ...form,
      id: crypto.randomUUID(),
      name: form.name.trim(),
      owner: form.owner.trim(),
      endpointLabel: form.endpointLabel.trim() || "Chưa cấu hình endpoint",
      status: "DRAFT",
    };
    const next = [item, ...drafts];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDrafts(next);
    setSelectedId(item.id);
    setWizard(false);
    setStep(0);
    setNotice(
      "Đã lưu bản nháp trong trình duyệt. Chưa kết nối tới hệ thống bên ngoài.",
    );
  };
  return (
    <section className="fd-screen fd-pr2-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">DỮ LIỆU / CONNECTIONS</div>
          <h1>Connection Manager</h1>
          <p>
            Quản lý cấu hình kết nối tách biệt với nguồn dữ liệu và flow đồng
            bộ.
          </p>
        </div>
        <div className="fd-toolbar-actions">
          <Badge tone="warning">Frontend demo</Badge>
          <Button
            variant="primary"
            onClick={() => {
              setWizard(true);
              setStep(0);
              setNotice("");
            }}
          >
            <Plus size={16} /> Tạo kết nối
          </Button>
        </div>
      </div>
      <div className="fd-pr2-note">
        <CircleAlert size={18} />
        <span>
          Chưa có vault, backend hoặc kiểm tra kết nối thật. Không nhập mật
          khẩu, token hay endpoint nội bộ vào bản demo công khai.
        </span>
      </div>
      {notice && (
        <div className="fd-pr2-feedback" role="status">
          {notice}
        </div>
      )}
      {wizard ? (
        <div className="fd-connection-wizard">
          <div className="fd-wizard-steps" aria-label="Các bước tạo kết nối">
            {["1 · Loại", "2 · Cấu hình", "3 · Kiểm tra", "4 · Lưu nháp"].map(
              (label, index) => (
                <button
                  type="button"
                  key={label}
                  data-active={step === index}
                  onClick={() => setStep(index)}
                >
                  {label}
                </button>
              ),
            )}
          </div>
          <div className="fd-wizard-body">
            {step === 0 && (
              <>
                <h2>Chọn loại kết nối</h2>
                <p>
                  Chọn giao thức và môi trường. Mỗi kết nối có thể phục vụ nhiều
                  nguồn đã được phê duyệt.
                </p>
                <div className="fd-pr2-form-grid">
                  <label>
                    Tên kết nối
                    <Input
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                      placeholder="Ví dụ: Epicor QA"
                    />
                  </label>
                  <label>
                    Loại connector
                    <Select
                      label="Loại connector"
                      value={form.kind}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          kind: value as ConnectionDraft["kind"],
                        })
                      }
                      options={kindOptions}
                    />
                  </label>
                  <label>
                    Môi trường
                    <Select
                      label="Môi trường"
                      value={form.environment}
                      onValueChange={(value) =>
                        setForm({ ...form, environment: value as "DEV" | "QA" })
                      }
                      options={[
                        { value: "DEV", label: "DEV" },
                        { value: "QA", label: "QA" },
                      ]}
                    />
                  </label>
                  <label>
                    Người phụ trách
                    <Input
                      value={form.owner}
                      onChange={(event) =>
                        setForm({ ...form, owner: event.target.value })
                      }
                      placeholder="Nhóm hoặc vai trò vận hành"
                    />
                  </label>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <h2>Cấu hình an toàn</h2>
                <p>
                  Bản demo chỉ giữ mô tả hiển thị. Endpoint thực và secret phải
                  đi qua backend và vault trong giai đoạn triển khai.
                </p>
                <label className="fd-pr2-wide-label">
                  Nhãn endpoint (không phải địa chỉ thực)
                  <Input
                    value={form.endpointLabel}
                    onChange={(event) =>
                      setForm({ ...form, endpointLabel: event.target.value })
                    }
                    placeholder="Ví dụ: Máy chủ QA đã được duyệt"
                  />
                </label>
                <Notice tone="warning">
                  TLS, xác thực, quyền chỉ đọc và danh sách view/BAQ được phép
                  cần kiểm tra ở máy chủ. Bản demo không thu thập credential.
                </Notice>
              </>
            )}
            {step === 2 && (
              <>
                <h2>Kiểm tra kết nối</h2>
                <p>
                  Kiểm tra DNS, TLS, xác thực và quyền đọc giới hạn cần backend
                  và tài khoản dịch vụ đã được cấp phép.
                </p>
                <div className="fd-test-checks">
                  {["DNS / mạng", "TLS", "Xác thực", "Quyền đọc giới hạn"].map(
                    (item) => (
                      <div key={item}>
                        <CircleAlert size={16} />
                        <span>{item}</span>
                        <Badge tone="warning">Chưa chạy</Badge>
                      </div>
                    ),
                  )}
                </div>
                <Button disabled title="Chưa có dịch vụ kiểm tra kết nối thật">
                  Kiểm tra thật · cần backend
                </Button>
              </>
            )}
            {step === 3 && (
              <>
                <h2>Lưu bản nháp</h2>
                <p>
                  Chỉ lưu metadata demo trên trình duyệt. Không thể kích hoạt
                  trước khi test thật trên cấu hình hiện hành đạt và được duyệt.
                </p>
                <dl className="fd-pr2-summary">
                  <dt>Tên</dt>
                  <dd>{form.name || "Chưa nhập"}</dd>
                  <dt>Loại</dt>
                  <dd>{form.kind}</dd>
                  <dt>Môi trường</dt>
                  <dd>{form.environment}</dd>
                  <dt>Trạng thái</dt>
                  <dd>DRAFT · chưa kết nối</dd>
                </dl>
                <Button variant="primary" onClick={save}>
                  Lưu bản nháp
                </Button>{" "}
                <Button disabled title="Yêu cầu kiểm tra kết nối thật">
                  Kích hoạt
                </Button>
              </>
            )}
          </div>
          <div className="fd-wizard-footer">
            <Button variant="ghost" onClick={() => setWizard(false)}>
              Hủy
            </Button>
            <span />
            <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
              Quay lại
            </Button>
            <Button disabled={step === 3} onClick={() => setStep(step + 1)}>
              Tiếp theo <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="fd-connections-layout">
          <div className="fd-connection-list">
            <div className="fd-pr2-list-heading">
              <h2>Kết nối</h2>
              <Badge tone="neutral">{drafts.length} bản nháp</Badge>
            </div>
            <label className="fd-pr2-search">
              <Search size={16} />
              <span className="sr-only">Tìm kết nối</span>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên, loại, owner..."
              />
            </label>
            <div className="fd-pr2-list-items">
              {filtered.length === 0 ? (
                <p className="fd-pr2-empty">Không tìm thấy kết nối.</p>
              ) : (
                filtered.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    data-active={item.id === selectedId}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="fd-pr2-list-icon">
                      <Server size={18} />
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.kind} · {item.environment}
                      </small>
                    </span>
                    <Badge tone="warning">Nháp</Badge>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="fd-connection-detail">
            {selected ? (
              <>
                <div className="fd-pr2-detail-head">
                  <div>
                    <div className="fd-overline">CHI TIẾT KẾT NỐI</div>
                    <h2>{selected.name}</h2>
                    <p>
                      {selected.kind} · {selected.environment}
                    </p>
                  </div>
                  <Badge tone="warning">DRAFT</Badge>
                </div>
                <div className="fd-pr2-detail-grid">
                  <div>
                    <small>Người phụ trách</small>
                    <strong>{selected.owner}</strong>
                  </div>
                  <div>
                    <small>Endpoint</small>
                    <strong>{selected.endpointLabel}</strong>
                  </div>
                  <div>
                    <small>Lần kiểm tra cuối</small>
                    <strong>Chưa kiểm tra</strong>
                  </div>
                  <div>
                    <small>Được dùng bởi</small>
                    <strong>0 nguồn / 0 flow thật</strong>
                  </div>
                </div>
                <div className="fd-pr2-detail-actions">
                  <Button disabled title="Chưa có backend và vault">
                    Kiểm tra kết nối
                  </Button>
                  <Button disabled title="Cần test thật, phê duyệt và backend">
                    Kích hoạt
                  </Button>
                  <Button variant="ghost" onClick={onOpenFlows}>
                    <Cable size={16} /> Xem Flow Studio
                  </Button>
                </div>
                <Notice tone="warning">
                  Lưu bản nháp không đọc dữ liệu, tạo source hay bắt đầu đồng
                  bộ.
                </Notice>
              </>
            ) : (
              <p>Chọn một kết nối để xem chi tiết.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
