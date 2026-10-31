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
import { ArrowLeft, MoreHorizontal, Plus, Save } from "lucide-react";
import {
  FormDesigner,
  FormPreview,
  FormTestPreview,
  type DataProvider,
  type FormDataSource,
  exportFormDefinition,
  validateFormDefinition,
  type FormDefinition,
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
  formCatalog,
  formDraftStorageKey,
  readFormDrafts,
} from "./form-drafts";

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
  const [forms, setForms] = useState(initial.forms);
  const [draft, setDraft] = useState<FormDefinition | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(true);
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
  const [codeText, setCodeText] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [revealField, setRevealField] = useState<{
    id: string;
    revision: number;
  }>();
  const [codeDirty, setCodeDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("schema");
  const [codeView, setCodeView] = useState("canvas");
  const [values, setValues] = useState<PreviewValues>({});
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
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
    !!draft && (JSON.stringify(draft) !== JSON.stringify(saved) || codeInvalid);
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
  useEffect(() => {
    if (!draft || tab !== "code" || codeDirty) return;
    setCodeText((current) => reconcileFormCode(current, draft));
  }, [draft, tab, codeDirty]);
  const activate = (next: FormDefinition) => {
    setCatalogOpen(false);
    setTitlesOpen(false);
    setActionsOpen(false);
    setDraft(next);
    setTab("schema");
    setCodeDirty(false);
    setCodeText("");
    setSelectedFieldId("");
    setRevealField(undefined);
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
      setTitlesOpen(false);
      setMessage("Đã lưu bản nháp biểu mẫu trên máy này.");
      setSaveError(false);
    } catch {
      setSaveError(true);
      setMessage("");
    }
  };
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
      <div className="fd-form-workbench" data-catalog={catalogOpen || !draft}>
        <FormCatalog
          forms={catalog}
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
              {saveError && (
                <Notice tone="danger">
                  {t(
                    "Không lưu được biểu mẫu. Bản đang sửa vẫn còn; hãy thử lưu lại.",
                  )}
                </Notice>
              )}
              {showIssues && issues.length > 0 && (
                <Notice tone="danger">
                  <ul>
                    {issues.map((issue, index) => (
                      <li key={index}>{t(issue.message, issue.params)}</li>
                    ))}
                  </ul>
                </Notice>
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
                hidden={!["schema", "logic", "code"].includes(tab)}
              >
                <div hidden={tab !== "code"} className="fd-code-pane">
                  {!!codeText && (
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
                      inspectorSection={tab === "logic" ? "logic" : "basic"}
                      key={draft.id}
                      definition={draft}
                      selectedFieldId={selectedFieldId}
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
              {tab === "preview" && (
                <div className="fd-preview-workspace">
                  <div className="fd-toolbar-actions">
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
                  </div>
                  <div
                    className="fd-preview-paper"
                    data-device={previewDevice}
                    data-orientation={draft.orientation ?? "portrait"}
                  >
                    <FormPreview
                      runtimeContext={demoFormRuntimeContext}
                      key={draft.id}
                      definition={draft}
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
                setMessage(
                  issues.length
                    ? ""
                    : "Cấu trúc biểu mẫu hợp lệ trên trình duyệt.",
                );
              }}
            >
              {t("Kiểm tra")}
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
    </section>
  );
}
