import { FormHistory } from "./form-history";
import { FormTemplateDialog } from "./form-template-dialog";
import {
  lazy,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type Ref,
} from "react";
import type { MasterEntity } from "@flowdocker/app-contracts";
import { peopleOptions } from "./organization";
import { FormCatalog } from "./form-catalog";
import { masterFormSources } from "./master-form-sources";
import {
  demoCurrentPersonId,
  demoProfile,
  demoFormRuntimeContext,
} from "./demo-profile";
import { useI18n } from "@flowdocker/i18n";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  MoreHorizontal,
  Plus,
  Save,
} from "lucide-react";
import {
  FormDesigner,
  FormLogicStudio,
  FormSchemaIssues,
  type FormIssue,
  FormPreview,
  FormSpacingEditor,
  FormTestPreview,
  type DataProvider,
  type FormDataSource,
  exportFormDefinition,
  validateFormDefinition,
  type FormDefinition,
  type FormSpacing,
  type PreviewValues,
} from "@flowdocker/form-builder";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FieldGroup,
  Input,
  Modal,
  Notice,
  Tabs,
  Textarea,
} from "@flowdocker/ui";
import {
  demoForms,
  formCatalog,
  formDraftStorageKey,
  readFormDrafts,
} from "./form-drafts";
import {
  formRecoveryKey,
  readFormRecovery,
  writeFormRecovery,
} from "./form-recovery";

const FormCodeStudio = lazy(
  () => import("@flowdocker/form-builder/code-studio"),
);
import {
  analyzeFormCode,
  reconcileFormCode,
} from "@flowdocker/form-builder/code-model";

const demoProviders: Record<string, DataProvider> = {
  "demo.companies": async () => [
    { value: "demo", label: { vi: "Công ty mẫu", en: "Demo company" } },
  ],
  "demo.departments": async ({ dependency }) =>
    dependency
      ? [{ value: "demo-it", label: { vi: "CNTT · mẫu", en: "IT · sample" } }]
      : [],
};
const formDataSources: readonly FormDataSource[] = [
  {
    id: "organization.people",
    kind: "person",
    label: { vi: "Người trong tổ chức", en: "Organization people" },
    description: {
      vi: "Người đang hoạt động từ Master Data nội bộ và tài khoản demo hiện tại. Chưa kết nối Microsoft 365 hay hệ thống nhân sự.",
      en: "Active people from local Master Data and the current demo account. Microsoft 365 and HR systems are not connected.",
    },
  },
  {
    id: "demo.companies",
    kind: "record",
    label: { vi: "Công ty · dữ liệu mẫu", en: "Companies · demo data" },
    description: {
      vi: "Một công ty minh họa, dùng để thử biểu mẫu.",
      en: "One synthetic company for trying the form.",
    },
  },
  {
    id: "demo.departments",
    kind: "record",
    label: { vi: "Phòng ban · dữ liệu mẫu", en: "Departments · demo data" },
    description: {
      vi: "Danh sách phòng ban minh họa. Điền mã trường công ty vào Phụ thuộc mã trường, rồi chọn công ty trong Xem thử.",
      en: "Synthetic departments. Set Depends on field key to the company field key, then select a company in Preview.",
    },
  },
];
function load() {
  try {
    return { forms: readFormDrafts(localStorage), failed: false };
  } catch {
    return { forms: [] as FormDefinition[], failed: true };
  }
}
export interface FormsPageHandle {
  openCatalog(): void;
  getDefinitions(): FormDefinition[];
}
export function FormsPage({
  ref,
  entities = [],
}: {
  ref?: Ref<FormsPageHandle>;
  entities?: MasterEntity[];
}) {
  const masters = useMemo(() => masterFormSources(entities), [entities]);
  const availableSources = useMemo(
    () => [...masters.sources, ...formDataSources],
    [masters],
  );
  const providers = useMemo(
    () => ({
      ...demoProviders,
      ...masters.providers,
      "organization.people": async () => [
        ...peopleOptions(entities).filter(
          (person) => person.value !== demoCurrentPersonId,
        ),
        {
          value: demoCurrentPersonId,
          label: { vi: demoProfile.name, en: demoProfile.name },
          description: {
            vi: "Tài khoản hiện tại · Demo",
            en: "Current account · Demo",
          },
        },
      ],
    }),
    [entities, masters],
  );
  const { t, locale } = useI18n();
  const [initial] = useState(load);
  const [initialRecovery] = useState(() => {
    try {
      return { entry: readFormRecovery(sessionStorage), failed: false };
    } catch {
      return { entry: null, failed: true };
    }
  });
  const [forms, setForms] = useState(initial.forms);
  const [draft, setDraft] = useState<FormDefinition | null>(
    initialRecovery.entry?.definition ?? null,
  );
  const [catalogOpen, setCatalogOpen] = useState(!initialRecovery.entry);
  const [recovered, setRecovered] = useState(!!initialRecovery.entry);
  const [recoveryError, setRecoveryError] = useState(initialRecovery.failed);
  const [discardRecoveryOpen, setDiscardRecoveryOpen] = useState(false);
  useImperativeHandle(
    ref,
    () => ({
      openCatalog: () => setCatalogOpen(true),
      getDefinitions: () =>
        draft
          ? [
              draft,
              ...formCatalog(forms).filter((form) => form.id !== draft.id),
            ]
          : formCatalog(forms),
    }),
    [draft, forms],
  );
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [titlesOpen, setTitlesOpen] = useState(false);
  const [jsonError, setJsonError] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [codeText, setCodeText] = useState(initialRecovery.entry?.source ?? "");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [revealField, setRevealField] = useState<{
    id: string;
    revision: number;
  }>();
  const [codeDirty, setCodeDirty] = useState(
    initialRecovery.entry?.codeDirty ?? false,
  );
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(
    initialRecovery.entry?.codeDirty ? "code" : "schema",
  );
  const [codeView, setCodeView] = useState("canvas");
  const [values, setValues] = useState<PreviewValues>({});
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [inspectionRequest, setInspectionRequest] = useState<{
    fieldId: string;
    revision: number;
  }>();
  const [template, setTemplate] = useState<FormDefinition | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [titleVi, setTitleVi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [pending, setPending] = useState<FormDefinition | "create" | null>(
    null,
  );
  const catalog = initial.failed ? forms : formCatalog(forms);
  const saved = catalog.find((form) => form.id === draft?.id);
  const codeInvalid =
    !!draft && codeDirty && !analyzeFormCode(codeText, draft.id).definition;
  const dirty =
    !!draft && (JSON.stringify(draft) !== JSON.stringify(saved) || codeDirty);
  useEffect(() => {
    if (!draft || !dirty) return;
    const persist = () => {
      try {
        writeFormRecovery(sessionStorage, {
          version: 1,
          definition: draft,
          source: codeText,
          codeDirty,
        });
        setRecoveryError(false);
      } catch {
        setRecoveryError(true);
      }
    };
    persist();
    window.addEventListener("pagehide", persist);
    return () => window.removeEventListener("pagehide", persist);
  }, [draft, dirty, codeText, codeDirty]);
  const clearRecovery = () => {
    try {
      sessionStorage.removeItem(formRecoveryKey);
      setRecoveryError(false);
    } catch {
      setRecoveryError(true);
    }
    setRecovered(false);
  };
  useEffect(() => {
    if (!dirty) return;
    const protectDraft = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectDraft);
    return () => window.removeEventListener("beforeunload", protectDraft);
  }, [dirty]);
  const issues = draft ? validateFormDefinition(draft) : [];
  const openIssue = (issue: FormIssue) => {
    if (!draft) return;
    setTab("schema");
    setShowIssues(true);
    if (issue.fieldId) {
      setSelectedFieldId(issue.fieldId);
      setInspectionRequest((previous) => ({
        fieldId: issue.fieldId!,
        revision: (previous?.revision ?? 0) + 1,
      }));
      setRevealField((previous) => ({
        id: issue.fieldId!,
        revision: (previous?.revision ?? 0) + 1,
      }));
    } else if (!draft.title.vi.trim() || !draft.title.en.trim()) {
      setTitlesOpen(true);
    }
  };
  useEffect(() => {
    if (!draft || tab !== "code" || codeDirty) return;
    setCodeText((current) => reconcileFormCode(current, draft));
  }, [draft, tab, codeDirty]);
  const [previewSpacingPast, setPreviewSpacingPast] = useState<
    (FormSpacing | undefined)[]
  >([]);
  const activate = (next: FormDefinition) => {
    clearRecovery();
    setPreviewSpacingPast([]);
    setCatalogOpen(false);
    setTitlesOpen(false);
    setActionsOpen(false);
    setDraft(next);
    setTab("schema");
    setCodeDirty(false);
    setCodeText("");
    setSelectedFieldId("");
    setRevealField(undefined);
    setInspectionRequest(undefined);
    setValues({});
    setShowIssues(false);
    setMessage("");
    setSaveError(false);
  };
  const request = (next: FormDefinition | "create") => {
    if (next !== "create" && next.id === draft?.id) {
      setCatalogOpen(false);
      return;
    }
    if (dirty) {
      setPending(next);
      return;
    }
    if (next === "create") setCreateOpen(true);
    else activate(next);
  };
  const update = (next: FormDefinition, fromCode = false) => {
    setDraft(next);
    if (!fromCode) {
      setCodeText((current) => reconcileFormCode(current, next));
      setCodeDirty(false);
    }
    setMessage("");
    setSaveError(false);
  };
  const save = () => {
    if (!draft || codeInvalid) return;
    setShowIssues(true);
    if (issues.length) return;
    const next = forms.some((form) => form.id === draft.id)
      ? forms.map((form) => (form.id === draft.id ? draft : form))
      : [...forms, draft];
    try {
      localStorage.setItem(formDraftStorageKey, JSON.stringify(next));
      setForms(next);
      setCodeDirty(false);
      clearRecovery();
      setTitlesOpen(false);
      setMessage("Đã lưu bản nháp biểu mẫu trên máy này.");
      setSaveError(false);
    } catch {
      setSaveError(true);
      setMessage("");
    }
  };
  const previewSpacingControls = draft && (
    <>
      <FormSpacingEditor
        value={draft.spacing}
        disabled={codeInvalid}
        onChange={(spacing, recordHistory) => {
          if (recordHistory)
            setPreviewSpacingPast((past) => [
              ...past.slice(-99),
              draft.spacing,
            ]);
          update({ ...draft, spacing });
        }}
      />
      <Button
        disabled={!previewSpacingPast.length}
        onClick={() => {
          update({
            ...draft,
            spacing: previewSpacingPast[previewSpacingPast.length - 1],
          });
          setPreviewSpacingPast((past) => past.slice(0, -1));
        }}
      >
        {t("Hoàn tác khoảng cách")}
      </Button>
    </>
  );

  return (
    <section
      className="fd-screen fd-forms-v2 fd-forms-focused"
      data-view={catalogOpen || !draft ? "catalog" : "designer"}
    >
      <div className="fd-page-toolbar" hidden={!catalogOpen && !!draft}>
        <div>
          <div className="fd-overline">{t("ỨNG DỤNG / BIỂU MẪU")}</div>
          <h1>{t("Biểu mẫu")}</h1>
          <p>{t("Chọn biểu mẫu để chỉnh sửa hoặc tạo biểu mẫu mới.")}</p>
        </div>
        <div className="fd-toolbar-actions">
          {draft && (
            <Button onClick={() => setCatalogOpen(false)}>
              {t("Tiếp tục chỉnh sửa")}
            </Button>
          )}
          <Badge tone="warning">{t("Chỉ lưu cục bộ")}</Badge>
          <Button
            variant="primary"
            disabled={initial.failed || forms.length >= 100}
            onClick={() => request("create")}
          >
            <Plus data-icon="inline-start" />
            {t("Tạo biểu mẫu")}
          </Button>
        </div>
      </div>
      {initial.failed && (
        <Notice tone="danger">
          {t(
            "Không đọc được bản nháp biểu mẫu. Dữ liệu lưu hiện tại được giữ nguyên; kiểm tra bộ nhớ trình duyệt rồi tải lại.",
          )}
        </Notice>
      )}
      {recoveryError && (
        <Notice tone="danger">
          {t(
            "Không dùng được bản khôi phục trong tab này. Hãy lưu bản nháp hợp lệ trước khi tải lại hoặc rời trang.",
          )}
        </Notice>
      )}
      <div className="fd-form-workbench" data-catalog={catalogOpen || !draft}>
        <FormCatalog
          forms={catalog}
          templates={demoForms}
          templateDisabled={initial.failed || forms.length >= 100}
          onUseTemplate={(form) => {
            if (!initial.failed && forms.length < 100) setTemplate(form);
          }}
          activeId={draft?.id}
          query={query}
          onQueryChange={setQuery}
          onOpen={request}
        />
        <div className="fd-form-editor" hidden={catalogOpen}>
          {draft ? (
            <>
              <div className="fd-section-heading fd-form-document-bar">
                <Button
                  aria-label={t("Danh sách biểu mẫu")}
                  title={t("Danh sách biểu mẫu")}
                  onClick={() => setCatalogOpen(true)}
                >
                  <ArrowLeft />
                </Button>
                <div className="fd-form-document-name">
                  <h1>{draft.title[locale] || t("Biểu mẫu chưa đặt tên")}</h1>
                  <span>
                    {t("Phiên bản {{version}}", { version: draft.version })} ·{" "}
                    {dirty ? t("Chưa lưu") : t("Bản nháp")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  aria-label={t("Kiểm tra cấu hình biểu mẫu")}
                  aria-expanded={showIssues}
                  aria-controls="fd-form-configuration-issues"
                  onClick={() => setShowIssues(!showIssues)}
                >
                  {issues.length ? (
                    <CircleAlert aria-hidden="true" />
                  ) : (
                    <CircleCheck aria-hidden="true" />
                  )}
                  <span aria-live="polite" aria-atomic="true">
                    {issues.length === 1
                      ? t("1 lỗi")
                      : issues.length
                        ? t("{{count}} lỗi", { count: issues.length })
                        : t("Kiểm tra")}
                  </span>
                </Button>
                <Button
                  variant="primary"
                  disabled={
                    !dirty || initial.failed || issues.length > 0 || codeInvalid
                  }
                  onClick={save}
                >
                  <Save data-icon="inline-start" />
                  {t("Lưu bản nháp")}
                </Button>
                <Button
                  aria-label={t("Tùy chọn biểu mẫu")}
                  title={t("Tùy chọn biểu mẫu")}
                  onClick={() => setActionsOpen(true)}
                >
                  <MoreHorizontal />
                </Button>
              </div>
              {message && <Notice tone="success">{t(message)}</Notice>}
              {recovered && (
                <Notice>
                  <p>
                    {t(
                      "Đã khôi phục phiên chỉnh sửa trong tab này. Mã gõ dở được giữ nguyên; bản đã lưu chưa thay đổi.",
                    )}
                  </p>
                  <Button onClick={() => setDiscardRecoveryOpen(true)}>
                    {t("Bỏ bản khôi phục")}
                  </Button>
                </Notice>
              )}
              {saveError && (
                <Notice tone="danger">
                  {t(
                    "Không lưu được biểu mẫu. Bản đang sửa vẫn còn; hãy thử lưu lại.",
                  )}
                </Notice>
              )}
              {showIssues && (
                <div id="fd-form-configuration-issues">
                  <FormSchemaIssues
                    issues={issues}
                    fields={draft.fields}
                    onEditIssue={openIssue}
                  />
                </div>
              )}
              <Tabs
                active={tab}
                onChange={(next) => {
                  setTab(next);
                  if (next === "json") {
                    try {
                      setJsonText(exportFormDefinition(draft));
                      setJsonError("");
                    } catch {
                      setJsonError("Cấu trúc biểu mẫu chưa hợp lệ.");
                      setJsonText(JSON.stringify(draft, null, 2));
                    }
                  }
                  if (next === "code" && draft) {
                    if (!codeDirty)
                      setCodeText((current) =>
                        reconcileFormCode(current, draft),
                      );
                    setJsonError("");
                  }
                }}
                tabs={[
                  { id: "schema", label: t("Thiết kế trường") },
                  { id: "preview", label: t("Xem thử biểu mẫu") },
                  { id: "logic", label: t("Điều kiện và tính toán") },
                  { id: "code", label: t("Code Studio") },
                  { id: "json", label: t("Schema JSON") },
                ]}
              />
              <div
                className="fd-hybrid-workspace"
                data-code={tab === "code"}
                hidden={!["schema", "code"].includes(tab)}
              >
                <div hidden={tab !== "code"} className="fd-code-pane">
                  {(tab === "code" || !!codeText) && (
                    <Suspense
                      fallback={
                        <Notice>{t("Đang mở trình soạn mã...")}</Notice>
                      }
                    >
                      <FormCodeStudio
                        value={codeText}
                        formId={draft.id}
                        providerIds={availableSources.map(
                          (source) => source.id,
                        )}
                        selectedFieldId={selectedFieldId}
                        revealField={revealField}
                        onSelectField={setSelectedFieldId}
                        onChange={(raw) => {
                          setCodeText(raw);
                          setCodeDirty(true);
                          const result = analyzeFormCode(raw, draft.id);
                          if (result.definition)
                            update(result.definition, true);
                        }}
                      />
                    </Suspense>
                  )}
                </div>
                <div className="fd-hybrid-designer">
                  {tab === "code" && (
                    <Tabs
                      active={codeView}
                      onChange={setCodeView}
                      tabs={[
                        { id: "canvas", label: t("Canvas") },
                        { id: "test", label: t("Thử dữ liệu") },
                      ]}
                    />
                  )}
                  <div hidden={tab === "code" && codeView !== "canvas"}>
                    {codeInvalid && (
                      <Notice tone="warning">
                        {t(
                          "Mã chưa hợp lệ; hãy sửa mã để tiếp tục thiết kế và lưu.",
                        )}
                      </Notice>
                    )}
                    <div hidden={!titlesOpen}>
                      <FieldGroup className="fd-form-titles">
                        <Field label={t("Tên biểu mẫu · tiếng Việt")}>
                          <Input
                            disabled={codeInvalid}
                            value={draft.title.vi}
                            onChange={(event) =>
                              update({
                                ...draft,
                                title: {
                                  ...draft.title,
                                  vi: event.target.value,
                                },
                              })
                            }
                          />
                        </Field>
                        <Field label={t("Tên biểu mẫu · tiếng Anh")}>
                          <Input
                            disabled={codeInvalid}
                            value={draft.title.en}
                            onChange={(event) =>
                              update({
                                ...draft,
                                title: {
                                  ...draft.title,
                                  en: event.target.value,
                                },
                              })
                            }
                          />
                        </Field>
                      </FieldGroup>
                    </div>
                    <FormDesigner
                      runtimeContext={demoFormRuntimeContext}
                      dataSources={availableSources}
                      providers={providers}
                      inspectorSection="basic"
                      key={draft.id}
                      definition={draft}
                      selectedFieldId={selectedFieldId}
                      inspectionRequest={inspectionRequest}
                      onSelectField={(id) => {
                        setSelectedFieldId(id);
                        setRevealField((previous) => ({
                          id,
                          revision: (previous?.revision ?? 0) + 1,
                        }));
                      }}
                      compact={tab === "code"}
                      readOnly={codeInvalid}
                      onChange={(next) => {
                        update(next);
                      }}
                    />
                  </div>
                  {tab === "code" && codeView === "test" && (
                    <FormTestPreview
                      definition={draft}
                      values={values}
                      onChange={setValues}
                      providers={providers}
                      runtimeContext={demoFormRuntimeContext}
                    />
                  )}
                </div>
              </div>
              {tab === "logic" && (
                <FormLogicStudio
                  definition={draft}
                  values={values}
                  onChange={setValues}
                  onDefinitionChange={update}
                  selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedFieldId}
                  providers={providers}
                  runtimeContext={demoFormRuntimeContext}
                  readOnly={codeInvalid}
                />
              )}
              {tab === "preview" && (
                <div className="fd-preview-workspace">
                  <div className="fd-toolbar-actions fd-preview-controls">
                    <Button
                      aria-pressed={previewDevice === "desktop"}
                      onClick={() => setPreviewDevice("desktop")}
                    >
                      {t("Máy tính")}
                    </Button>
                    <Button
                      aria-pressed={previewDevice === "mobile"}
                      onClick={() => setPreviewDevice("mobile")}
                    >
                      {t("Điện thoại")}
                    </Button>
                    {previewSpacingControls}
                  </div>
                  <div
                    className="fd-preview-paper"
                    data-device={previewDevice}
                    data-orientation={draft.orientation ?? "portrait"}
                  >
                    <div className="fd-toolbar-actions fd-preview-inline-controls">
                      {previewSpacingControls}
                    </div>
                    <FormPreview
                      runtimeContext={demoFormRuntimeContext}
                      key={draft.id}
                      definition={draft}
                      onEditSchemaIssue={openIssue}
                      providers={providers}
                      values={values}
                      onChange={setValues}
                    />
                  </div>
                </div>
              )}
              {tab === "json" && (
                <FieldGroup>
                  <Notice>
                    {t(
                      "Schema FlowDocker · chỉ xem. Dùng Nhập schema JSON trong chế độ thiết kế để thay cấu trúc.",
                    )}
                  </Notice>
                  {jsonError && <Notice tone="danger">{t(jsonError)}</Notice>}
                  <Field label={t("Nội dung schema JSON")}>
                    <Textarea rows={24} readOnly value={jsonText} />
                  </Field>
                </FieldGroup>
              )}
            </>
          ) : (
            <EmptyState
              title={t("Chưa có biểu mẫu")}
              detail={t("Tạo bản nháp rồi thêm trường để thiết kế biểu mẫu.")}
            />
          )}
        </div>
      </div>
      {template && (
        <FormTemplateDialog
          key={template.id}
          template={template}
          onClose={() => setTemplate(null)}
          onCreate={(next) => {
            setTemplate(null);
            request(next);
          }}
        />
      )}
      {historyOpen && draft && (
        <FormHistory
          key={draft.id}
          definition={draft}
          disabled={codeInvalid}
          onClose={() => setHistoryOpen(false)}
          onRestore={(next) => {
            clearRecovery();
            update(next);
            setCodeText(JSON.stringify(next, null, 2));
            setValues({});
            setSelectedFieldId("");
            setRevealField(undefined);
            setInspectionRequest(undefined);
            setHistoryOpen(false);
            setTab("schema");
          }}
        />
      )}
      {actionsOpen && (
        <Modal
          title={t("Tùy chọn biểu mẫu")}
          onClose={() => setActionsOpen(false)}
        >
          <p>{t("Bản nháp chỉ được lưu trên trình duyệt này.")}</p>
          <div className="fd-form-secondary-actions">
            {" "}
            <Button
              aria-expanded={titlesOpen}
              onClick={() => {
                setTitlesOpen(!titlesOpen);
                setActionsOpen(false);
              }}
            >
              {t("Đổi tên biểu mẫu")}
            </Button>
            <Button
              onClick={() => {
                setActionsOpen(false);
                setShowIssues(true);
                setMessage("");
              }}
            >
              {t("Kiểm tra")}
            </Button>
            <Button
              onClick={() => {
                setActionsOpen(false);
                setHistoryOpen(true);
              }}
            >
              {t("Lịch sử thiết kế")}
            </Button>
            <Button
              disabled
              title={t(
                "Cần backend và phiên bản bất biến để phát hành biểu mẫu",
              )}
            >
              {t("Phát hành · cần backend")}
            </Button>
          </div>
        </Modal>
      )}
      {createOpen && (
        <Modal
          title={t("Tạo biểu mẫu")}
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <Button onClick={() => setCreateOpen(false)}>{t("Hủy")}</Button>
              <Button
                variant="primary"
                disabled={!titleVi.trim() || !titleEn.trim()}
                onClick={() => {
                  activate({
                    id: crypto.randomUUID(),
                    title: { vi: titleVi.trim(), en: titleEn.trim() },
                    version: 1,
                    status: "DRAFT",
                    fields: [],
                  });
                  setCreateOpen(false);
                  setTitleVi("");
                  setTitleEn("");
                }}
              >
                {t("Tạo bản nháp")}
              </Button>
            </>
          }
        >
          <FieldGroup>
            <Field label={t("Tên biểu mẫu · tiếng Việt")}>
              <Input
                autoFocus
                value={titleVi}
                onChange={(event) => setTitleVi(event.target.value)}
              />
            </Field>
            <Field label={t("Tên biểu mẫu · tiếng Anh")}>
              <Input
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </Modal>
      )}
      {pending && (
        <Modal
          title={t("Bản nháp chưa lưu")}
          onClose={() => {
            setPending(null);
            setCatalogOpen(false);
          }}
          footer={
            <>
              <Button
                onClick={() => {
                  setPending(null);
                  setCatalogOpen(false);
                }}
              >
                {t("Tiếp tục chỉnh sửa")}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (pending === "create") setCreateOpen(true);
                  else activate(pending);
                  setPending(null);
                }}
              >
                {t("Bỏ thay đổi và tiếp tục")}
              </Button>
            </>
          }
        >
          <p>
            {t(
              "Thay đổi của biểu mẫu hiện tại chưa được lưu. Chuyển tiếp sẽ bỏ các thay đổi này.",
            )}
          </p>
        </Modal>
      )}
      {discardRecoveryOpen && (
        <Modal
          title={t("Bỏ bản khôi phục?")}
          onClose={() => setDiscardRecoveryOpen(false)}
          footer={
            <>
              <Button onClick={() => setDiscardRecoveryOpen(false)}>
                {t("Tiếp tục chỉnh sửa")}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  clearRecovery();
                  if (saved) activate(saved);
                  else {
                    setDraft(null);
                    setCatalogOpen(true);
                    setCodeDirty(false);
                    setCodeText("");
                  }
                  setDiscardRecoveryOpen(false);
                }}
              >
                {t("Bỏ bản khôi phục")}
              </Button>
            </>
          }
        >
          <p>
            {t(
              "Chỉ bỏ phần chỉnh sửa chưa lưu trong tab này. Biểu mẫu đã lưu được giữ nguyên.",
            )}
          </p>
        </Modal>
      )}
    </section>
  );
}
