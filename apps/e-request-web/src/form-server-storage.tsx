import { useMemo, useState, useId } from "react";
import "./form-server-storage.css";
import { useI18n } from "@flowdocker/i18n";
import {
  Button,
  Field,
  FieldGroup,
  Input,
  Modal,
  Notice,
} from "@flowdocker/ui";
import type { FormDefinition } from "@flowdocker/form-builder";
import {
  createHttpFormRepository,
  FormStorageError,
  type FormSummary,
  type PublishedForm,
} from "@flowdocker/form-builder/http-storage";

export function FormServerStorage({
  definition,
  canSave,
  onOpen,
}: {
  definition: FormDefinition | null;
  canSave: boolean;
  onOpen(definition: FormDefinition): void;
}) {
  const { t, locale } = useI18n();
  const controlId = useId();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [rows, setRows] = useState<FormSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState("");
  const [canPublish, setCanPublish] = useState(false);
  const [published, setPublished] = useState<PublishedForm | null>(null);
  const [binding, setBinding] = useState<{
    localId: string;
    remoteId: string;
    version: number;
    snapshot: string;
  } | null>(null);
  const repository = useMemo(
    () =>
      createHttpFormRepository({
        baseUrl: "",
        appId: "e-request",
        getAccessToken: () => token,
      }),
    [token],
  );
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      await action();
    } catch (error) {
      setFailed(true);
      if (error instanceof FormStorageError && error.status === 401) {
        setToken("");
        setCanPublish(false);
        setPublished(null);
        setBinding(null);
        setRows([]);
        setCursor(null);
        setMessage("Phiên đăng nhập đã hết. Bản đang sửa vẫn được giữ lại.");
      } else if (error instanceof FormStorageError && error.status === 409) {
        setConflict(true);
        setMessage(
          "Bản máy chủ đã thay đổi. Hãy mở bản mới nhất hoặc lưu thành bản sao mới; bản đang sửa vẫn được giữ lại.",
        );
      } else if (error instanceof FormStorageError && error.status === 403) {
        setCanPublish(false);
        setMessage(
          "Tài khoản không có quyền thực hiện thao tác này trên máy chủ.",
        );
      } else if (error instanceof FormStorageError && error.status === 422)
        setMessage(
          "Cấu hình biểu mẫu chưa hợp lệ để xuất bản. Kiểm tra lại các trường và quy tắc.",
        );
      else
        setMessage(
          "Không hoàn tất được thao tác. Kiểm tra kết nối hoặc tài khoản rồi thử lại. Bản đang sửa vẫn được giữ lại.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function refresh(after?: string) {
    const page = await repository.list(after);
    setCanPublish(await repository.publicationPermission());
    setRows((current) => (after ? [...current, ...page.items] : page.items));
    setCursor(page.nextCursor);
    setDeleting("");
  }
  async function save(copy: boolean) {
    if (!definition || !canSave) return;
    const current =
      !copy && binding?.localId === definition.id ? binding : null;
    const saved = await repository.save({
      id: current?.remoteId ?? crypto.randomUUID(),
      version: current?.version ?? 0,
      definition: structuredClone(definition),
    });
    setBinding({
      localId: definition.id,
      remoteId: saved.id,
      version: saved.version,
      snapshot: JSON.stringify(definition),
    });
    setPublished(null);
    setConflict(false);
    await refresh();
    setMessage("Đã lưu bản nháp trên máy chủ. Bản cục bộ không bị thay đổi.");
  }
  const synced =
    !!definition &&
    binding?.localId === definition.id &&
    binding.snapshot === JSON.stringify(definition);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("Lưu trên máy chủ")}</Button>
      {open && (
        <Modal
          title={t("Biểu mẫu trên máy chủ")}
          onClose={() => {
            if (!busy) setOpen(false);
          }}
          footer={
            <Button disabled={busy} onClick={() => setOpen(false)}>
              {t("Đóng")}
            </Button>
          }
        >
          <FieldGroup className="fd-server-storage-fields">
            <Notice>
              {t(
                "Lưu trên máy chủ là bản riêng. Các mẫu đã lưu trên máy này vẫn được giữ nguyên.",
              )}
            </Notice>
            {message && (
              <Notice tone={failed ? "danger" : "success"}>{t(message)}</Notice>
            )}
            {busy && <p role="status">{t("Đang xử lý…")}</p>}
            {!token ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    const response = await fetch("/api/v1/session/login", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        login: login.trim().toLowerCase(),
                        password,
                      }),
                      cache: "no-store",
                      redirect: "error",
                      signal: AbortSignal.timeout(15000),
                    });
                    if (!response.ok) throw new Error("Login failed");
                    const data = (await response.json()) as {
                      accessToken?: unknown;
                    };
                    if (
                      typeof data.accessToken !== "string" ||
                      !/^[a-f0-9]{64}$/.test(data.accessToken)
                    )
                      throw new Error("Invalid session");
                    const next = createHttpFormRepository({
                      baseUrl: "",
                      appId: "e-request",
                      getAccessToken: () => data.accessToken as string,
                    });
                    const page = await next.list();
                    const permission = await next.publicationPermission();
                    setToken(data.accessToken);
                    setPassword("");
                    setBinding(null);
                    setPublished(null);
                    setCanPublish(permission);
                    setConflict(false);
                    setRows(page.items);
                    setCursor(page.nextCursor);
                  });
                }}
              >
                <FieldGroup>
                  <Notice>
                    {t(
                      "Dùng tài khoản thử nghiệm cục bộ. Microsoft 365 chưa được kết nối. Tải lại trang sẽ cần đăng nhập lại.",
                    )}
                  </Notice>
                  <Field label={t("Tên đăng nhập máy chủ")}>
                    <Input
                      id={`${controlId}-login`}
                      autoComplete="username"
                      value={login}
                      onChange={(event) => setLogin(event.target.value)}
                      disabled={busy}
                      required
                      maxLength={80}
                    />
                  </Field>
                  <Field label={t("Mật khẩu máy chủ")}>
                    <Input
                      id={`${controlId}-password`}
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={busy}
                      required
                      maxLength={256}
                    />
                  </Field>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={busy || !login.trim() || !password}
                  >
                    {t("Đăng nhập máy chủ")}
                  </Button>
                </FieldGroup>
              </form>
            ) : (
              <>
                <div className="fd-toolbar-actions">
                  <Button
                    disabled={busy || !definition || !canSave || conflict}
                    variant="primary"
                    onClick={() => void run(() => save(false))}
                  >
                    {binding?.localId === definition?.id
                      ? t("Cập nhật bản máy chủ")
                      : t("Lưu mẫu đang mở lên máy chủ")}
                  </Button>
                  <Button
                    disabled={
                      busy || !canSave || !canPublish || !synced || conflict
                    }
                    onClick={() =>
                      void run(async () => {
                        if (!binding || !synced) return;
                        const permission =
                          await repository.publicationPermission();
                        setCanPublish(permission);
                        if (!permission)
                          throw new FormStorageError("FORBIDDEN", 403);
                        const result = await repository.publish(
                          binding.remoteId,
                          binding.version,
                        );
                        setPublished(result);
                        setMessage(
                          "Đã xuất bản phiên bản cố định trên máy chủ. Các lần chỉnh sửa sau không thay đổi phiên bản này.",
                        );
                      })
                    }
                  >
                    {t("Xuất bản trên máy chủ")}
                  </Button>
                  {binding && (
                    <Button
                      disabled={busy || !definition || !canSave}
                      onClick={() => void run(() => save(true))}
                    >
                      {t("Lưu thành bản sao mới")}
                    </Button>
                  )}
                  <Button
                    disabled={busy}
                    onClick={() => void run(() => refresh())}
                  >
                    {t("Làm mới danh sách máy chủ")}
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const response = await fetch("/api/v1/session/logout", {
                          method: "POST",
                          headers: { authorization: `Bearer ${token}` },
                          signal: AbortSignal.timeout(15000),
                        });
                        if (!response.ok) throw new Error("Logout failed");
                        setToken("");
                        setCanPublish(false);
                        setPublished(null);
                        setPassword("");
                        setBinding(null);
                        setRows([]);
                        setCursor(null);
                        setConflict(false);
                      })
                    }
                  >
                    {t("Đăng xuất máy chủ")}
                  </Button>
                </div>
                {!canPublish ? (
                  <Notice>
                    {t("Tài khoản chưa được cấp quyền xuất bản biểu mẫu.")}
                  </Notice>
                ) : !synced ? (
                  <Notice>
                    {t("Lưu bản đang sửa lên máy chủ trước khi xuất bản.")}
                  </Notice>
                ) : null}
                {published && (
                  <Notice>
                    {t("Phiên bản xuất bản {{version}} · Mã {{id}}", {
                      version: published.version,
                      id: published.id,
                    })}
                  </Notice>
                )}
                {!canSave && definition && (
                  <Notice>
                    {t(
                      "Sửa lỗi cấu hình và hoàn tất phần mã đang nhập trước khi lưu lên máy chủ.",
                    )}
                  </Notice>
                )}
                {!rows.length && <p>{t("Chưa có biểu mẫu trên máy chủ.")}</p>}
                <ul className="fd-server-form-list">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <div>
                        <strong>{row.title[locale]}</strong>
                        <span>
                          {t("Phiên bản {{version}}", { version: row.version })}
                        </span>
                      </div>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const stored = await repository.read(row.id);
                            const next = {
                              ...stored.definition,
                              id: crypto.randomUUID(),
                            };
                            setBinding({
                              localId: next.id,
                              remoteId: stored.id,
                              version: stored.version,
                              snapshot: JSON.stringify(next),
                            });
                            setPublished(null);
                            setConflict(false);
                            setOpen(false);
                            onOpen(next);
                          })
                        }
                      >
                        {t("Mở bản làm việc")}
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={() => {
                          if (deleting !== row.id) {
                            setDeleting(row.id);
                            return;
                          }
                          void run(async () => {
                            await repository.remove(row.id, row.version);
                            if (binding?.remoteId === row.id) setBinding(null);
                            await refresh();
                            setMessage(
                              "Đã xóa bản máy chủ. Bản đang sửa và bản cục bộ vẫn được giữ lại.",
                            );
                          });
                        }}
                      >
                        {deleting === row.id
                          ? t("Xác nhận xóa bản máy chủ")
                          : t("Xóa bản máy chủ")}
                      </Button>
                    </li>
                  ))}
                </ul>
                {cursor && (
                  <Button
                    disabled={busy}
                    onClick={() => void run(() => refresh(cursor))}
                  >
                    {t("Tải thêm biểu mẫu máy chủ")}
                  </Button>
                )}
              </>
            )}
          </FieldGroup>
        </Modal>
      )}
    </>
  );
}
