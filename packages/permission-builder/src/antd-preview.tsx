import { useI18n } from "@flowdocker/i18n";
import {
  evaluateAccess,
  type Action,
  type Scope,
  type ResourceAction,
} from "@flowdocker/app-contracts";
import {
  Alert,
  Button,
  Checkbox,
  ConfigProvider,
  Empty,
  Flex,
  Form,
  Input,
  Menu,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  theme,
  type TableColumnsType,
} from "antd";
import {
  PlusOutlined,
  SafetyOutlined,
  ExperimentOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import viVN from "antd/locale/vi_VN";
import enUS from "antd/locale/en_US";
import {
  actions,
  labels,
  scopes,
  usePermissionModel,
  type PermissionBuilderProps,
} from "./model";
import "./antd-preview.css";

export interface AntPermissionBuilderProps extends PermissionBuilderProps {
  theme?: "light" | "dark";
}

/** Opt-in presentation experiment. Policy state and commands are shared with the default view. */
export function AntPermissionBuilder({
  theme: mode = "light",
  ...props
}: AntPermissionBuilderProps) {
  const { locale } = useI18n();
  return (
    <ConfigProvider
      locale={locale === "vi" ? viVN : enUS}
      theme={{
        algorithm:
          mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontFamily: "Inter, system-ui, sans-serif",
          colorTextSecondary: mode === "dark" ? "#b5b5b5" : "#626262",
          colorTextPlaceholder: mode === "dark" ? "#a6a6a6" : "#767676",
          motion: !window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
        },
        components: { Menu: { itemHeight: 64 } },
      }}
    >
      <AntPermissionView {...props} />
    </ConfigProvider>
  );
}

function AntPermissionView(props: PermissionBuilderProps) {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const model = usePermissionModel(props);
  const { role } = model;
  const columns: TableColumnsType<ResourceAction> = [
    {
      title: t("Tài nguyên"),
      dataIndex: "label",
      key: "resource",
      width: 210,
      render: (label: string, row) => (
        <span title={row.resource}>{t(label)}</span>
      ),
    },
    ...actions.map((action) => ({
      title: t(labels[action]),
      key: action,
      align: "center" as const,
      width: 76,
      render: (_: unknown, resource: ResourceAction) =>
        resource.actions.includes(action) ? (
          <label className="fd-antd-check-target">
            <Checkbox
              aria-label={`${t(resource.label)}: ${t(labels[action])}`}
              checked={
                role?.grants[resource.resource]?.includes(action) ?? false
              }
              onChange={() => model.toggle(resource.resource, action)}
            />
          </label>
        ) : (
          <Typography.Text type="secondary" title={t("Không áp dụng")}>
            —
          </Typography.Text>
        ),
    })),
  ];
  const matrix = (
    <>
      <div className="fd-antd-scope">
        <div>
          <Typography.Text strong>{t("Phạm vi dữ liệu")}</Typography.Text>
          <p>
            <Typography.Text type="secondary">
              {t("Các quyền bên dưới áp dụng trong phạm vi này.")}
            </Typography.Text>
          </p>
        </div>
        <Select
          virtual={false}
          aria-label={t("Phạm vi dữ liệu")}
          value={role?.scope}
          className="fd-antd-scope-select"
          options={(Object.keys(scopes) as Scope[]).map((value) => ({
            value,
            label: t(scopes[value]),
          }))}
          onChange={(value) => model.patch({ scope: value })}
        />
      </div>
      <Flex
        justify="space-between"
        align="center"
        gap={12}
        className="fd-antd-matrix-heading"
      >
        <Typography.Text strong>{t("Quyền thao tác")}</Typography.Text>
        <Typography.Text type="secondary">
          {t("{{count}} quyền đã chọn", { count: model.grantCount })}
        </Typography.Text>
      </Flex>
      <Table<ResourceAction>
        aria-label={t("Ma trận tài nguyên & hành động")}
        rowKey="resource"
        columns={columns}
        dataSource={props.resources}
        pagination={false}
        size="middle"
        scroll={{ x: 666 }}
      />
      <p className="fd-antd-legend">
        <Typography.Text type="secondary">
          {t("Chưa chọn = từ chối · Dấu gạch ngang = không áp dụng.")}
        </Typography.Text>
      </p>
    </>
  );
  const fields = (
    <>
      <Typography.Title level={3} style={{ fontSize: token.fontSizeHeading5 }}>
        {t("Chính sách theo trường")}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {t(
          "Trường nhạy cảm phải được chiếu/mask tại API. Cấu hình dưới đây chỉ là ví dụ ở UI.",
        )}
      </Typography.Paragraph>
      <Form layout="vertical">
        {["vendor.bank_account", "request.amount", "employee.personal_id"].map(
          (field) => (
            <Form.Item key={field} label={field}>
              <Select
                virtual={false}
                aria-label={t("Quyền với {{field}}", { field })}
                value={role?.fieldRules[field] ?? "DENY"}
                onChange={(value) =>
                  model.patch({
                    fieldRules: { ...role?.fieldRules, [field]: value },
                  })
                }
                options={[
                  { value: "DENY", label: t("Từ chối") },
                  { value: "MASK", label: t("Che giá trị") },
                  { value: "READ", label: t("Cho xem") },
                ]}
              />
            </Form.Item>
          ),
        )}
      </Form>
    </>
  );
  return (
    <section
      className="fd-antd-page"
      style={{ background: token.colorBgLayout, color: token.colorText }}
    >
      <div className="fd-antd-page-heading">
        <div>
          <Space wrap>
            <Typography.Title
              level={1}
              style={{ margin: 0, fontSize: token.fontSizeHeading3 }}
            >
              {t("Phân quyền")}
            </Typography.Title>
            <Tag color="blue">{t("Ant Design · bản thử")}</Tag>
          </Space>
          <p>
            <Typography.Text type="secondary">
              {t("Quản lý những gì mỗi vai trò được xem và thực hiện.")}
            </Typography.Text>
          </p>
        </div>
        <Space wrap>
          <Button href="/#permissions">{t("Xem bản shadcn")}</Button>
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden="true" />}
            onClick={() => model.setModal(true)}
          >
            {t("Tạo vai trò")}
          </Button>
        </Space>
      </div>
      <Alert
        type="info"
        showIcon
        title={t(
          "Bản thử nghiệm · Chỉ lưu trong trình duyệt, chưa áp dụng quyền thật.",
        )}
      />
      {props.error && <Alert type="error" showIcon title={t(props.error)} />}
      <div
        className="fd-antd-workspace"
        style={{
          background: token.colorBgContainer,
          borderColor: token.colorBorderSecondary,
          borderRadius: token.borderRadiusLG,
        }}
      >
        <aside
          className="fd-antd-roles"
          aria-label={t("Vai trò")}
          style={{ borderColor: token.colorBorderSecondary }}
        >
          <Flex
            justify="space-between"
            align="center"
            className="fd-antd-list-heading"
          >
            <Typography.Text strong>{t("Vai trò")}</Typography.Text>
            <Typography.Text type="secondary">
              {props.roles.length}
            </Typography.Text>
          </Flex>
          <Input.Search
            aria-label={t("Tìm vai trò...")}
            placeholder={t("Tìm vai trò...")}
            value={model.query}
            onChange={(event) => model.setQuery(event.target.value)}
            allowClear
          />
          {model.filtered.length ? (
            <Menu
              selectedKeys={role ? [role.id] : []}
              items={model.filtered.map((item) => ({
                key: item.id,
                icon: <SafetyOutlined aria-hidden="true" />,
                label: (
                  <span className="fd-antd-role-label">
                    <span>{item.name}</span>
                    <Typography.Text type="secondary">
                      {t(scopes[item.scope])}
                    </Typography.Text>
                  </span>
                ),
              }))}
              onClick={({ key }) => {
                model.setSelectedId(key);
                model.setDecision(null);
                model.setMessage("");
              }}
              mode="inline"
              style={{ border: 0, marginTop: 12 }}
            />
          ) : (
            <Empty
              description={t(
                props.loading ? "Đang tải..." : "Không tìm thấy vai trò",
              )}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </aside>
        <div className="fd-antd-editor">
          {role ? (
            <>
              <Flex justify="space-between" align="start" gap={16} wrap>
                <div>
                  <Space wrap>
                    <Typography.Title
                      level={2}
                      style={{ margin: 0, fontSize: token.fontSizeHeading4 }}
                    >
                      {role.name}
                    </Typography.Title>
                    <Tag
                      color={
                        role.status === "PUBLISHED" ? "success" : "warning"
                      }
                    >
                      {t(
                        role.status === "PUBLISHED"
                          ? "Đã phát hành"
                          : "Bản nháp",
                      )}
                    </Tag>
                  </Space>
                  <p>
                    <Typography.Text type="secondary">
                      {role.description}
                    </Typography.Text>
                  </p>
                </div>
                <Button
                  icon={<ExperimentOutlined aria-hidden="true" />}
                  onClick={() => model.setSimulationOpen(true)}
                >
                  {t("Mô phỏng truy cập")}
                </Button>
              </Flex>
              <p role="status">
                <Typography.Text type="secondary">
                  <CheckOutlined aria-hidden="true" />{" "}
                  {t(
                    model.message ||
                      "Thay đổi tự lưu dưới dạng bản nháp trong trình duyệt.",
                  )}
                </Typography.Text>
              </p>
              <Tabs
                activeKey={model.tab}
                onChange={model.setTab}
                items={[
                  {
                    key: "matrix",
                    label: t("Quyền thao tác"),
                    children: matrix,
                  },
                  {
                    key: "fields",
                    label: t("Bảo vệ trường"),
                    children: fields,
                  },
                  {
                    key: "versions",
                    label: t("Phiên bản"),
                    children: (
                      <Space orientation="vertical">
                        <Typography.Title level={5}>
                          {t("Phiên bản chính sách")}
                        </Typography.Title>
                        <Space>
                          <Tag>{t("Bản nháp")}</Tag>
                          <span>
                            {t("Bản nháp hiện tại · trình duyệt này")}
                          </span>
                        </Space>
                        <Space>
                          <Tag>{role.version}</Tag>
                          <span>
                            {t("Phiên bản mẫu · không có policy backend")}
                          </span>
                        </Space>
                      </Space>
                    ),
                  },
                ]}
              />
            </>
          ) : (
            <Empty description={t("Chọn vai trò")} />
          )}
        </div>
      </div>
      <Modal
        centered
        closable={{ "aria-label": t("Đóng") }}
        styles={{
          body: { maxHeight: "calc(100dvh - 240px)", overflowY: "auto" },
        }}
        title={t("Tạo vai trò")}
        open={model.modal}
        onCancel={() => model.setModal(false)}
        onOk={model.create}
        okText={t("Tạo bản nháp")}
        cancelText={t("Hủy")}
        okButtonProps={{ disabled: !model.newName.trim() }}
      >
        <Form layout="vertical">
          <Form.Item label={t("Tên vai trò")} required>
            <Input
              aria-label={t("Tên vai trò")}
              autoFocus
              value={model.newName}
              onChange={(event) => model.setNewName(event.target.value)}
            />
          </Form.Item>
        </Form>
        <Alert
          type="warning"
          showIcon
          title={t("Vai trò mới không có quyền mặc định.")}
        />
      </Modal>
      <Modal
        centered
        closable={{ "aria-label": t("Đóng") }}
        styles={{
          body: { maxHeight: "calc(100dvh - 240px)", overflowY: "auto" },
        }}
        title={t("Mô phỏng truy cập")}
        open={model.simulationOpen}
        onCancel={() => model.setSimulationOpen(false)}
        footer={
          <Button onClick={() => model.setSimulationOpen(false)}>
            {t("Đóng")}
          </Button>
        }
      >
        <Typography.Paragraph type="secondary">
          {t(
            "Dùng dữ liệu giả lập để giải thích quyết định. Kết quả không cấp quyền thật.",
          )}
        </Typography.Paragraph>
        <Form layout="vertical">
          <Form.Item label={t("Tài nguyên")}>
            <Select
              virtual={false}
              aria-label={t("Tài nguyên")}
              value={model.testResource}
              options={props.resources.map((resource) => ({
                value: resource.resource,
                label: t(resource.label),
              }))}
              onChange={(value) => {
                model.setTestResource(value);
                model.setTestAction(
                  props.resources.find(
                    (resource) => resource.resource === value,
                  )?.actions[0] ?? "READ",
                );
                model.setDecision(null);
              }}
            />
          </Form.Item>
          <Form.Item label={t("Hành động")}>
            <Select
              virtual={false}
              aria-label={t("Hành động")}
              value={model.testAction}
              options={(
                props.resources.find(
                  (resource) => resource.resource === model.testResource,
                )?.actions ?? actions
              ).map((action) => ({ value: action, label: t(labels[action]) }))}
              onChange={(value: Action) => {
                model.setTestAction(value);
                model.setDecision(null);
              }}
            />
          </Form.Item>
          <fieldset className="fd-antd-fixtures">
            <legend>{t("NGỮ CẢNH GIẢ LẬP")}</legend>
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
              <Checkbox
                key={key}
                checked={model.fixture[key]}
                onChange={(event) => {
                  model.setFixture({
                    ...model.fixture,
                    [key]: event.target.checked,
                  });
                  model.setDecision(null);
                }}
              >
                {t(label)}
              </Checkbox>
            ))}
          </fieldset>
        </Form>
        <Button
          type="primary"
          block
          disabled={!role}
          onClick={() =>
            role &&
            model.setDecision(
              evaluateAccess(
                role,
                model.testResource,
                model.testAction,
                model.fixture,
              ),
            )
          }
        >
          {t("Chạy mô phỏng")}
        </Button>
        {model.decision && (
          <div className="fd-antd-result" role="status">
            <Alert
              type={model.decision.effect === "ALLOW" ? "success" : "error"}
              showIcon
              title={
                <Space>
                  <span>{t(model.decision.effect)}</span>
                  <Tag>{t("MÔ PHỎNG")}</Tag>
                </Space>
              }
              description={
                <>
                  <ul>
                    {model.decision.reasons.map((reason) => (
                      <li key={reason}>{t(reason)}</li>
                    ))}
                  </ul>
                  <span>
                    {t("Chưa kiểm tra quyền truy cập thực tế trên API.")}
                  </span>
                </>
              }
            />
          </div>
        )}
      </Modal>
    </section>
  );
}
