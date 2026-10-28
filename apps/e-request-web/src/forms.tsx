import { useEffect, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { FilePenLine, Plus, Save } from "lucide-react";
import {
  FormDesigner,
  FormPreview,
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
  SearchInput,
  Tabs,
} from "@flowdocker/ui";
import { formDraftStorageKey, readFormDrafts } from "./form-drafts";

function load() {
  try {
    return { forms: readFormDrafts(localStorage), failed: false };
  } catch {
    return { forms: [] as FormDefinition[], failed: true };
  }
}
export function FormsPage() {
  const { t, locale } = useI18n();
  const [initial] = useState(load);
  const [forms, setForms] = useState(initial.forms);
  const [draft, setDraft] = useState<FormDefinition | null>(
    initial.forms[0] ?? null,
  );
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("schema");
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
  const saved = forms.find((form) => form.id === draft?.id);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
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
  const activate = (next: FormDefinition) => {
    setDraft(next);
    setTab("schema");
    setValues({});
    setShowIssues(false);
    setMessage("");
    setSaveError(false);
  };
  const request = (next: FormDefinition | "create") => {
    if (next !== "create" && next.id === draft?.id) return;
    if (dirty) {
      setPending(next);
      return;
    }
    if (next === "create") setCreateOpen(true);
    else activate(next);
  };
  const update = (next: FormDefinition) => {
    setDraft(next);
    setValues({});
    setMessage("");
    setSaveError(false);
  };
  const save = () => {
    if (!draft) return;
    setShowIssues(true);
    if (issues.length) return;
    const next = forms.some((form) => form.id === draft.id)
      ? forms.map((form) => (form.id === draft.id ? draft : form))
      : [...forms, draft];
    try {
      localStorage.setItem(formDraftStorageKey, JSON.stringify(next));
      setForms(next);
      setMessage("Đã lưu bản nháp biểu mẫu trên máy này.");
      setSaveError(false);
    } catch {
      setSaveError(true);
      setMessage("");
    }
  };
  return (
    <section className="fd-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">{t("ỨNG DỤNG / BIỂU MẪU")}</div>
          <h1>{t("Thiết kế biểu mẫu")}</h1>
          <p>{t("Thiết kế trường, kiểm tra và xem thử bản nháp song ngữ")}</p>
        </div>
        <div className="fd-toolbar-actions">
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
      <div className="fd-form-workbench">
        <aside className="fd-form-catalog" aria-label={t("Danh sách biểu mẫu")}>
          <SearchInput
            label={t("Tìm biểu mẫu...")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {forms
            .filter((form) =>
              `${form.title.vi} ${form.title.en}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((form) => (
              <button
                key={form.id}
                className="fd-form-catalog-item"
                aria-pressed={draft?.id === form.id}
                onClick={() => request(form)}
              >
                <FilePenLine aria-hidden="true" size={18} />
                <span>
                  <strong>{form.title[locale]}</strong>
                  <small>
                    {t("{{count}} trường · nháp v{{version}}", {
                      count: form.fields.length,
                      version: form.version,
                    })}
                  </small>
                </span>
              </button>
            ))}
          {!forms.some((form) =>
            `${form.title.vi} ${form.title.en}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ) && <EmptyState title={t("Không tìm thấy biểu mẫu")} />}
        </aside>
        <div className="fd-form-editor">
          {draft ? (
            <>
              <div className="fd-section-heading">
                <div>
                  <h2>{draft.title[locale] || t("Biểu mẫu chưa đặt tên")}</h2>
                  <Badge tone={dirty ? "warning" : "neutral"}>
                    {dirty ? t("Chưa lưu") : t("Bản nháp")}
                  </Badge>
                </div>
                <div className="fd-toolbar-actions">
                  <Button
                    onClick={() => {
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
                    variant="primary"
                    disabled={!dirty || initial.failed}
                    onClick={save}
                  >
                    <Save data-icon="inline-start" />
                    {t("Lưu bản nháp")}
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
                  setValues({});
                }}
                tabs={[
                  { id: "schema", label: t("Thiết kế trường") },
                  { id: "preview", label: t("Xem thử biểu mẫu") },
                ]}
              />
              {tab === "schema" ? (
                <>
                  <FieldGroup className="fd-form-titles">
                    <Field label={t("Tên biểu mẫu · tiếng Việt")}>
                      <Input
                        value={draft.title.vi}
                        onChange={(event) =>
                          update({
                            ...draft,
                            title: { ...draft.title, vi: event.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label={t("Tên biểu mẫu · tiếng Anh")}>
                      <Input
                        value={draft.title.en}
                        onChange={(event) =>
                          update({
                            ...draft,
                            title: { ...draft.title, en: event.target.value },
                          })
                        }
                      />
                    </Field>
                  </FieldGroup>
                  <FormDesigner
                    key={draft.id}
                    definition={draft}
                    onChange={update}
                  />
                </>
              ) : (
                <FormPreview
                  key={draft.id}
                  definition={draft}
                  values={values}
                  onChange={setValues}
                />
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
          onClose={() => setPending(null)}
          footer={
            <>
              <Button onClick={() => setPending(null)}>
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
