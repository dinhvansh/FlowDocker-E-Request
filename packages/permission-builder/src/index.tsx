import { useI18n } from "@flowdocker/i18n";
import { useRef, useState } from "react";
import { Plus, Shield, FlaskConical, Check, LockKeyhole } from "lucide-react";
import {
  evaluateAccess,
  simulateFieldProjection,
  type Action,
  type Scope,
} from "@flowdocker/app-contracts";
import {
  usePermissionModel,
  actions,
  labels,
  scopes,
  type PermissionBuilderProps,
} from "./model";
export type { PermissionBuilderProps } from "./model";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FieldGroup,
  Input,
  Checkbox,
  Modal,
  Notice,
  SearchInput,
  Select,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@flowdocker/ui";
import "./styles.css";

export function PermissionBuilder({
  roles,
  resources,
  onSave,
  loading,
  error,
}: PermissionBuilderProps) {
  const { t } = useI18n();

  const {
    role,
    filtered,
    grantCount,
    query,
    setQuery,
    tab,
    setTab,
    modal,
    setModal,
    simulationOpen,
    setSimulationOpen,
    newName,
    setNewName,
    fixture,
    setFixture,
    testResource,
    setTestResource,
    testAction,
    setTestAction,
    decision,
    setDecision,
    message,
    setMessage,
    setSelectedId,
    patch,
    toggle,
    create: createDraft,
  } = usePermissionModel({ roles, resources, onSave, loading, error });
  const simulationTrigger = useRef<HTMLButtonElement>(null);
  const [fieldResourceId, setFieldResourceId] = useState("");
  const fieldResources = resources.filter(
    (resource) => resource.fields?.length,
  );
  const fieldResource =
    fieldResources.find((resource) => resource.resource === fieldResourceId) ??
    fieldResources[0];
  const simulatedResource = resources.find(
    (resource) => resource.resource === testResource,
  );
  const projection =
    decision &&
    role &&
    simulatedResource &&
    (testAction === "READ" || testAction === "EXPORT")
      ? simulateFieldProjection(role, simulatedResource, testAction, fixture)
      : null;
  const createTrigger = useRef<HTMLButtonElement>(null);
  const closeSimulation = () => {
    setSimulationOpen(false);
    requestAnimationFrame(() => simulationTrigger.current?.focus());
  };
  const closeCreate = () => {
    setModal(false);
    requestAnimationFrame(() => createTrigger.current?.focus());
  };
  const create = async () => {
    await createDraft();
    requestAnimationFrame(() => createTrigger.current?.focus());
  };
  return (
    <section className="fd-screen fd-permissions-v2">
      <div className="fd-permissions-heading">
        <div>
          <h1>{t("Phân quyền")}</h1>
          <p>{t("Quản lý những gì mỗi vai trò được xem và thực hiện.")}</p>
        </div>
        <div className="fd-toolbar-actions">
          <Button
            variant="primary"
            onClick={(event) => {
              createTrigger.current = event.currentTarget;
              setModal(true);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            {t("Tạo vai trò")}
          </Button>
        </div>
      </div>
      {error && <Notice tone="danger">{t(error)}</Notice>}
      <div className="fd-permissions-local-note">
        <LockKeyhole size={14} aria-hidden="true" />
        <span>
          {t(
            "Bản thử nghiệm · Chỉ lưu trong trình duyệt, chưa áp dụng quyền thật.",
          )}
        </span>
      </div>
      <div className="fd-permissions-workspace">
        <aside className="fd-permissions-roles" aria-label={t("Vai trò")}>
          <div className="fd-permissions-list-heading">
            <strong>{t("Vai trò")}</strong>
            <span>{roles.length}</span>
          </div>
          <div className="fd-permissions-search">
            <SearchInput
              label={t("Tìm vai trò...")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="fd-permissions-role-list">
            {loading ? (
              t("Đang tải...")
            ) : filtered.length ? (
              filtered.map((r) => (
                <button
                  key={r.id}
                  className="fd-permissions-role"
                  aria-pressed={role?.id === r.id}
                  onClick={() => {
                    setSelectedId(r.id);
                    setDecision(null);
                    setMessage("");
                  }}
                >
                  <Shield size={17} aria-hidden="true" />
                  <span>
                    <strong>{r.name}</strong>
                    <small>{t(scopes[r.scope])}</small>
                  </span>
                </button>
              ))
            ) : (
              <EmptyState title={t("Không tìm thấy vai trò")} />
            )}
          </div>
        </aside>
        <section
          className="fd-permissions-editor"
          aria-label={t("Cấu hình vai trò")}
        >
          {role ? (
            <>
              <div className="fd-permissions-role-heading">
                <div>
                  <div className="fd-permissions-title-line">
                    <h2>{role.name}</h2>
                    <Badge
                      tone={role.status === "PUBLISHED" ? "success" : "warning"}
                    >
                      {role.status === "PUBLISHED"
                        ? t("Đã phát hành")
                        : t("Bản nháp")}
                    </Badge>
                  </div>
                  <p>{role.description}</p>
                </div>
                <div className="fd-toolbar-actions">
                  <Button
                    onClick={(event) => {
                      simulationTrigger.current = event.currentTarget;
                      setSimulationOpen(true);
                    }}
                  >
                    <FlaskConical size={16} aria-hidden="true" />
                    {t("Mô phỏng truy cập")}
                  </Button>
                </div>
              </div>
              <div className="fd-permissions-status" role="status">
                <Check size={14} aria-hidden="true" />
                {message
                  ? t(message)
                  : t("Thay đổi tự lưu dưới dạng bản nháp trong trình duyệt.")}
              </div>
              <Tabs
                tabs={[
                  { id: "matrix", label: t("Quyền thao tác") },
                  { id: "fields", label: t("Bảo vệ trường") },
                  { id: "versions", label: t("Phiên bản") },
                ]}
                active={tab}
                onChange={setTab}
              />
              {tab === "matrix" && (
                <div className="fd-permissions-content">
                  <div className="fd-permissions-scope">
                    <div>
                      <h3>{t("Phạm vi dữ liệu")}</h3>
                      <p>
                        {t("Các quyền bên dưới áp dụng trong phạm vi này.")}
                      </p>
                    </div>
                    <Select
                      label={t("Phạm vi dữ liệu")}
                      value={role.scope}
                      options={(Object.keys(scopes) as Scope[]).map(
                        (scope) => ({ value: scope, label: t(scopes[scope]) }),
                      )}
                      onValueChange={(value) =>
                        patch({ scope: value as Scope })
                      }
                    />
                  </div>
                  <div className="fd-permissions-matrix-heading">
                    <h3>{t("Quyền thao tác")}</h3>
                    <span>
                      {t("{{count}} quyền đã chọn", { count: grantCount })}
                    </span>
                  </div>
                  <div
                    className="fd-permissions-matrix"
                    role="region"
                    aria-label={t("Quyền thao tác")}
                    tabIndex={0}
                  >
                    <Table>
                      <caption className="sr-only">
                        {t("Ma trận tài nguyên & hành động")}
                      </caption>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">{t("Tài nguyên")}</TableHead>
                          {actions.map((a) => (
                            <TableHead scope="col" key={a}>
                              {t(labels[a])}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resources.map((res) => (
                          <TableRow key={res.resource}>
                            <TableHead scope="row" title={res.resource}>
                              {t(res.label)}
                            </TableHead>
                            {actions.map((a) => (
                              <TableCell key={a}>
                                {res.actions.includes(a) ? (
                                  <label className="fd-permissions-check-target">
                                    <Checkbox
                                      aria-label={`${t(res.label)}: ${t(labels[a])}`}
                                      checked={(
                                        role.grants[res.resource] ?? []
                                      ).includes(a)}
                                      onCheckedChange={() =>
                                        toggle(res.resource, a)
                                      }
                                    />
                                  </label>
                                ) : (
                                  <span title={t("Không áp dụng")}>—</span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="fd-permissions-legend">
                    {t("Chưa chọn = từ chối · Dấu gạch ngang = không áp dụng.")}
                  </p>
                  <p className="fd-permissions-mobile-hint">
                    {t("Vuốt ngang bảng để xem đủ các hành động.")}
                  </p>
                </div>
              )}
              {tab === "fields" && (
                <div className="fd-permissions-content">
                  <h3>{t("Chính sách theo trường")}</h3>
                  <p>
                    {t(
                      "Chọn trường được xem, che giá trị hoặc ẩn. Chưa có quy tắc sẽ mặc định ẩn; quyền thao tác và phạm vi vẫn phải thỏa mãn.",
                    )}
                  </p>
                  {fieldResource ? (
                    <Field label={t("Tài nguyên chứa trường")}>
                      <Select
                        label={t("Tài nguyên chứa trường")}
                        value={fieldResource.resource}
                        onValueChange={setFieldResourceId}
                        options={fieldResources.map((resource) => ({
                          value: resource.resource,
                          label: t(resource.label),
                        }))}
                      />
                    </Field>
                  ) : (
                    <EmptyState title={t("Tài nguyên chưa khai báo trường")} />
                  )}
                  {fieldResource?.fields?.map((field) => (
                    <div className="fd-field-rule" key={field.key}>
                      <div>
                        <strong title={field.key}>{t(field.label)}</strong>
                        <small>{field.key}</small>
                      </div>
                      <Select
                        label={t("Quyền với {{field}}", {
                          field: t(field.label),
                        })}
                        value={role.fieldRules[field.key] ?? "DENY"}
                        onValueChange={(value) =>
                          patch({
                            fieldRules: {
                              ...role.fieldRules,
                              [field.key]: value as "READ" | "MASK" | "DENY",
                            },
                          })
                        }
                        options={[
                          { value: "DENY", label: t("Từ chối") },
                          { value: "MASK", label: t("Che giá trị") },
                          { value: "READ", label: t("Cho xem") },
                        ]}
                      />
                    </div>
                  ))}
                  <p className="fd-permissions-legend">
                    {t(
                      "Dùng Mô phỏng truy cập để xem dữ liệu mẫu sau khi áp dụng quy tắc.",
                    )}
                  </p>
                </div>
              )}
              {tab === "versions" && (
                <div className="fd-permissions-content">
                  <h3>{t("Phiên bản chính sách")}</h3>
                  <div className="fd-version-row">
                    <Badge tone="warning">{t("Draft")}</Badge>
                    <span>{t("Bản nháp hiện tại · trình duyệt này")}</span>
                  </div>
                  <div className="fd-version-row">
                    <Badge>
                      {t("v")}
                      {role.version}
                    </Badge>
                    <span>{t("Phiên bản mẫu · không có policy backend")}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState title={t("Chọn vai trò")} />
          )}
        </section>
      </div>
      {simulationOpen && (
        <Modal
          title={t("Mô phỏng truy cập")}
          onClose={closeSimulation}
          footer={<Button onClick={closeSimulation}>{t("Đóng")}</Button>}
        >
          <div className="fd-permissions-simulation">
            <p className="fd-muted">
              {t(
                "Dùng dữ liệu giả lập để giải thích quyết định. Kết quả không cấp quyền thật.",
              )}
            </p>
            <FieldGroup>
              <Field label={t("Tài nguyên")}>
                <Select
                  label={t("Tài nguyên")}
                  value={testResource}
                  onValueChange={(value) => {
                    setTestResource(value);
                    setTestAction(
                      resources.find((resource) => resource.resource === value)
                        ?.actions[0] ?? "READ",
                    );
                    setDecision(null);
                  }}
                  options={resources.map((resource) => ({
                    value: resource.resource,
                    label: t(resource.label),
                  }))}
                />
              </Field>
              <Field label={t("Hành động")}>
                <Select
                  label={t("Hành động")}
                  value={testAction}
                  onValueChange={(value) => {
                    setTestAction(value as Action);
                    setDecision(null);
                  }}
                  options={(
                    resources.find((r) => r.resource === testResource)
                      ?.actions ?? actions
                  ).map((action) => ({
                    value: action,
                    label: t(labels[action]),
                  }))}
                />
              </Field>
            </FieldGroup>
            <div className="fd-fixture-heading">{t("NGỮ CẢNH GIẢ LẬP")}</div>
            <fieldset className="fd-permissions-fixtures">
              <legend className="sr-only">{t("NGỮ CẢNH GIẢ LẬP")}</legend>
              {(
                [
                  ["actorActive", "Người dùng đang hoạt động"],
                  ["sameTenant", "Cùng tenant"],
                  ["sameCompany", "Cùng công ty"],
                  ["sameDepartment", "Cùng phòng ban"],
                  ["isOwner", "Chủ sở hữu bản ghi"],
                  ["assignedActiveTask", "Có tác vụ được giao"],
                ] as const
              ).map(([key, label]) => (
                <label className="fd-checkbox fd-fixture" key={key}>
                  <Checkbox
                    checked={fixture[key]}
                    onCheckedChange={(checked) => {
                      setFixture({ ...fixture, [key]: checked === true });
                      setDecision(null);
                    }}
                  />
                  {t(label)}
                </label>
              ))}
            </fieldset>
            <Button
              variant="primary"
              className="fd-full"
              disabled={!role}
              onClick={() =>
                role &&
                setDecision(
                  simulatedResource &&
                    (testAction === "READ" || testAction === "EXPORT")
                    ? simulateFieldProjection(
                        role,
                        simulatedResource,
                        testAction,
                        fixture,
                      ).decision
                    : evaluateAccess(role, testResource, testAction, fixture),
                )
              }
            >
              {t("Chạy mô phỏng")}
            </Button>
            {decision && (
              <div
                className={`fd-decision fd-decision-${decision.effect.toLowerCase()}`}
                role="status"
              >
                <div>
                  <strong>{t(decision.effect)}</strong>
                  <Badge tone="warning">{t("SIMULATED")}</Badge>
                </div>
                <ul>
                  {decision.reasons.map((r, i) => (
                    <li key={i}>{t(r)}</li>
                  ))}
                </ul>
                <small>
                  {t("Chưa kiểm tra quyền truy cập thực tế trên API.")}
                </small>
              </div>
            )}
            {projection && simulatedResource?.fields?.length ? (
              <section
                className="fd-permissions-projection"
                aria-label={t("Dữ liệu mẫu sau phân quyền")}
              >
                <h3>{t("Dữ liệu mẫu sau phân quyền")}</h3>
                <p className="fd-muted">
                  {t(
                    "Chỉ minh họa bằng dữ liệu tổng hợp. Trường bị ẩn không có giá trị trong kết quả.",
                  )}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t("Trường")}</TableHead>
                      <TableHead scope="col">{t("Quyền hiệu lực")}</TableHead>
                      <TableHead scope="col">{t("Giá trị trả về")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projection.fields.map((field) => (
                      <TableRow key={field.key}>
                        <TableHead scope="row">
                          {t(
                            simulatedResource.fields!.find(
                              (item) => item.key === field.key,
                            )!.label,
                          )}
                        </TableHead>
                        <TableCell>
                          {t(
                            field.effect === "READ"
                              ? "Cho xem"
                              : field.effect === "MASK"
                                ? "Che giá trị"
                                : "Từ chối",
                          )}
                        </TableCell>
                        <TableCell>
                          {field.effect === "DENY"
                            ? t("Không trả về")
                            : String(field.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            ) : (
              decision && (
                <p className="fd-muted">
                  {t(
                    "Chỉ xem dữ liệu trường khi mô phỏng Xem hoặc Xuất trên tài nguyên đã khai báo trường.",
                  )}
                </p>
              )
            )}
          </div>
        </Modal>
      )}
      {modal && (
        <Modal
          title={t("Tạo vai trò")}
          onClose={closeCreate}
          footer={
            <>
              <Button onClick={closeCreate}>{t("Hủy")}</Button>
              <Button
                variant="primary"
                disabled={!newName.trim()}
                onClick={create}
              >
                {t("Tạo bản nháp")}
              </Button>
            </>
          }
        >
          <Field label={t("Tên vai trò")}>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </Field>
          <Notice tone="warning">
            {t("Vai trò mới không có quyền mặc định.")}
          </Notice>
        </Modal>
      )}
    </section>
  );
}
