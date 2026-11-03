import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  FormPreview,
  validateFormDefinition,
  type FormDefinition,
} from "@flowdocker/form-builder";
import { Badge, Button, Field, Input, Modal, Notice } from "@flowdocker/ui";
import {
  captureFormVersion,
  compareFormVersions,
  formVersionsKey,
  readFormVersions,
  removeFormVersion,
  type FormDesignVersion,
} from "./form-versions";
import "./form-history.css";

function SnapshotComparison({
  before,
  after,
}: {
  before: unknown;
  after: unknown;
}) {
  const { t } = useI18n();
  return (
    <div className="fd-history-code">
      {[
        { label: t("Mốc đã lưu"), value: before },
        { label: t("Bản đang sửa"), value: after },
      ].map((item) => (
        <div key={item.label}>
          <h4>{item.label}</h4>
          <pre tabIndex={0} aria-label={item.label}>
            {JSON.stringify(item.value, null, 2) ?? "—"}
          </pre>
        </div>
      ))}
    </div>
  );
}

export function FormHistory({
  definition,
  disabled,
  onRestore,
  onClose,
}: {
  definition: FormDefinition;
  disabled?: boolean;
  onRestore(definition: FormDefinition): void;
  onClose(): void;
}) {
  const { t, locale } = useI18n();
  const [versions, setVersions] = useState<FormDesignVersion[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [label, setLabel] = useState("");
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState<"restore" | "delete" | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  useEffect(() => {
    const load = () => {
      try {
        setVersions(readFormVersions(localStorage));
        setUnreadable(false);
      } catch {
        setUnreadable(true);
        setFailed(true);
      }
    };
    load();
    const listener = (event: StorageEvent) => {
      if (event.key === formVersionsKey || event.key === null) {
        setConfirm(null);
        load();
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  const current = versions.filter((item) => item.formId === definition.id);
  const selected = current.find((item) => item.id === selectedId) ?? current[0];
  const diff = useMemo(
    () =>
      selected ? compareFormVersions(selected.definition, definition) : null,
    [selected, definition],
  );
  const invalid = disabled || validateFormDefinition(definition).length > 0;
  const mutate = (action: () => FormDesignVersion[]) => {
    try {
      setVersions(action());
      setFailed(false);
      setConfirm(null);
      return true;
    } catch {
      setFailed(true);
      setConfirm(null);
      return false;
    }
  };
  const canRestore =
    !!diff && (diff.settings.length > 0 || diff.fields.length > 0);
  const changeLabels = {
    added: t("Trường được thêm"),
    removed: t("Trường bị xóa"),
    changed: t("Trường thay đổi"),
  };
  return (
    <Modal
      title={t("Lịch sử thiết kế")}
      onClose={onClose}
      footer={<Button onClick={onClose}>{t("Đóng")}</Button>}
    >
      <div className="fd-form-history">
        <Notice>
          {t(
            "Mốc thiết kế chỉ lưu cấu hình trên trình duyệt này, không chứa dữ liệu nhập thử. Tối đa 20 mốc mỗi biểu mẫu và 100 mốc tổng cộng.",
          )}
        </Notice>
        {failed && (
          <Notice tone="danger">
            {t(
              "Không đọc hoặc lưu được mốc thiết kế. Dữ liệu đang có được giữ nguyên; kiểm tra bộ nhớ, giới hạn lưu trữ rồi thử lại.",
            )}
          </Notice>
        )}
        {saved && (
          <Notice tone="success">
            {t("Đã lưu mốc thiết kế trên trình duyệt này.")}
          </Notice>
        )}
        <div className="fd-history-capture">
          <Field label={t("Tên mốc thiết kế")}>
            <Input
              maxLength={80}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </Field>
          <Button
            disabled={
              !!invalid ||
              unreadable ||
              current.length >= 20 ||
              versions.length >= 100
            }
            onClick={() => {
              if (
                mutate(() =>
                  captureFormVersion(localStorage, definition, label),
                )
              ) {
                setSaved(true);
                setLabel("");
                setSelectedId("");
              }
            }}
          >
            {t("Lưu mốc hiện tại")}
          </Button>
        </div>
        {invalid && (
          <p>{t("Sửa lỗi cấu hình hoặc mã trước khi lưu mốc thiết kế.")}</p>
        )}
        <div className="fd-history-grid">
          <aside className="fd-history-list" aria-label={t("Các mốc đã lưu")}>
            {!current.length && (
              <p>
                {t(
                  "Chưa có mốc thiết kế. Lưu mốc trước khi thử những thay đổi lớn.",
                )}
              </p>
            )}
            {current.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                aria-pressed={selected?.id === item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setConfirm(null);
                  setSaved(false);
                }}
              >
                <strong>{item.label || t("Mốc không tên")}</strong>
                <time dateTime={item.createdAt}>
                  {new Intl.DateTimeFormat(
                    locale === "vi" ? "vi-VN" : "en-US",
                    { dateStyle: "short", timeStyle: "medium" },
                  ).format(new Date(item.createdAt))}
                </time>
              </Button>
            ))}
          </aside>
          {selected && diff && (
            <section
              className="fd-history-detail"
              aria-label={t("So sánh với bản đang sửa")}
            >
              <h3>{t("So sánh với bản đang sửa")}</h3>
              <p>{t("Đối chiếu cấu hình mốc đã lưu và bản đang sửa.")}</p>
              {!canRestore && (
                <Notice>{t("Bản đang sửa giống mốc này.")}</Notice>
              )}
              {!!diff.settings.length && (
                <details>
                  <summary>{t("Cấu hình biểu mẫu thay đổi")}</summary>
                  <code>{diff.settings.join(", ")}</code>
                  <SnapshotComparison
                    before={{ ...selected.definition, fields: undefined }}
                    after={{ ...definition, fields: undefined }}
                  />
                </details>
              )}
              {diff.fields.map((change) => (
                <details key={change.id}>
                  <summary>
                    <Badge>{changeLabels[change.kind]}</Badge>{" "}
                    {(change.after ?? change.before)!.label[locale]}{" "}
                    <code>{(change.after ?? change.before)!.key}</code>
                  </summary>
                  <code>{change.properties.join(", ")}</code>
                  <SnapshotComparison
                    before={change.before}
                    after={change.after}
                  />
                </details>
              ))}
              <details>
                <summary>{t("Xem mốc thiết kế")}</summary>
                <FormPreview
                  key={selected.id}
                  definition={selected.definition}
                  values={{}}
                  onChange={() => {}}
                  readOnly
                />
              </details>
              {confirm ? (
                <div className="fd-history-confirm">
                  <Notice tone="warning">
                    {confirm === "restore"
                      ? t(
                          "Khôi phục sẽ thay cấu hình đang sửa bằng mốc này, gồm cả mã gõ dở. Bạn có thể lưu mốc hiện tại trước. Bản nháp đã lưu chưa thay đổi cho đến khi bạn bấm Lưu bản nháp.",
                        )
                      : t(
                          "Xóa mốc này khỏi trình duyệt? Bản đang sửa và các mốc khác được giữ nguyên.",
                        )}
                  </Notice>
                  <Button onClick={() => setConfirm(null)}>{t("Hủy")}</Button>
                  <Button
                    variant={confirm === "delete" ? "danger" : "primary"}
                    disabled={unreadable}
                    onClick={() => {
                      if (confirm === "delete")
                        mutate(() =>
                          removeFormVersion(localStorage, selected.id),
                        );
                      else {
                        try {
                          const latest = readFormVersions(localStorage).find(
                            (item) =>
                              item.id === selected.id &&
                              item.formId === definition.id,
                          );
                          if (!latest) throw Error("missing-version");
                          onRestore(
                            JSON.parse(
                              JSON.stringify(latest.definition),
                            ) as FormDefinition,
                          );
                        } catch {
                          setFailed(true);
                          setConfirm(null);
                        }
                      }
                    }}
                  >
                    {confirm === "restore"
                      ? t("Xác nhận khôi phục")
                      : t("Xác nhận xóa mốc")}
                  </Button>
                </div>
              ) : (
                <div className="fd-toolbar-actions">
                  <Button
                    disabled={!canRestore || unreadable}
                    onClick={() => setConfirm("restore")}
                  >
                    {t("Khôi phục vào bản đang sửa")}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={unreadable}
                    onClick={() => setConfirm("delete")}
                  >
                    {t("Xóa mốc")}
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </Modal>
  );
}
