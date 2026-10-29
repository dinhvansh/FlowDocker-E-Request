import { RepeatField } from "./components/repeat-field";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useI18n } from "@flowdocker/i18n";
import {
  Badge,
  Button,
  Checkbox,
  Combobox,
  Field,
  FieldGroup,
  Input,
  DatePicker,
  Notice,
  Tabs,
  Textarea,
  FieldSet,
  FieldLegend,
  RadioGroup,
  RadioGroupItem,
} from "@flowdocker/ui";
import {
  checkFiles,
  defaultValues,
  evaluateRule,
  isRecord,
  prepareValues,
  submissionValues,
  validatePreview,
  type FieldAccess,
} from "./engine";
import {
  flattenFields,
  isContainer,
  validateFormDefinition,
  type FormDefinition,
  type FormField,
  type FormIssue,
  type FormValue,
  type PreviewValues,
} from "./schema";

export interface ChoiceOption {
  value: string;
  label: { vi: string; en: string };
}
export type DataProvider = (context: {
  query: string;
  dependency: FormValue | undefined;
  signal: AbortSignal;
}) => Promise<ChoiceOption[]>;
export interface FileReference {
  id: string;
  reference: string;
}
export type UploadHandler = (
  file: File,
  context: { field: FormField; signal: AbortSignal },
) => Promise<FileReference>;
export interface CustomControlProps {
  field: FormField;
  value: FormValue | undefined;
  onChange(value: FormValue): void;
  disabled: boolean;
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}
export interface FormRendererProps {
  definition: FormDefinition;
  values: PreviewValues;
  onChange(values: PreviewValues): void;
  onSubmit?(values: PreviewValues): Promise<void> | void;
  onInvalid?(issues: FormIssue[]): void;
  readOnly?: boolean;
  access?: FieldAccess;
  providers?: Record<string, DataProvider>;
  onUpload?: UploadHandler;
  onRemoveFile?(reference: string): Promise<void>;
  renderers?: Record<string, ComponentType<CustomControlProps>>;
  preview?: boolean;
}
function useChoices(
  field: FormField,
  dependency: FormValue | undefined,
  provider: DataProvider | undefined,
) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<{
    requestKey: string;
    options: ChoiceOption[];
    status: "loading" | "ready" | "error" | "missing";
  }>({ options: [], status: "loading", requestKey: "" });
  const dependencyKey = JSON.stringify(dependency);
  const requestKey = `${query}:${dependencyKey ?? ""}:${field.dataSource?.provider ?? ""}`;
  useEffect(() => {
    if (!field.dataSource) return;
    if (!provider) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setRemote({ options: [], status: "loading", requestKey });
      provider({
        query,
        dependency:
          dependencyKey === undefined
            ? undefined
            : (JSON.parse(dependencyKey) as FormValue),
        signal: controller.signal,
      })
        .then((options) => {
          if (!controller.signal.aborted)
            setRemote({
              options: options
                .filter(
                  (option) =>
                    option &&
                    typeof option.value === "string" &&
                    option.value &&
                    option.value !== "__fd_clear__" &&
                    typeof option.label?.vi === "string" &&
                    typeof option.label?.en === "string",
                )
                .slice(0, 500),
              status: "ready",
              requestKey,
            });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setRemote({ options: [], status: "error", requestKey });
        });
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [field.dataSource, provider, query, dependencyKey, requestKey]);
  return {
    query,
    setQuery,
    options: field.dataSource
      ? provider
        ? remote.requestKey === requestKey
          ? remote.options
          : []
        : []
      : field.options,
    status: field.dataSource
      ? provider
        ? remote.requestKey === requestKey
          ? remote.status
          : "loading"
        : "missing"
      : "ready",
  };
}
function SignatureControl({
  value,
  onChange,
  disabled,
  id,
  ...aria
}: Pick<
  CustomControlProps,
  "value" | "onChange" | "disabled" | "id" | "aria-describedby" | "aria-invalid"
>) {
  const { t } = useI18n();
  const record = isRecord(value) ? value : {};
  const strokes = (Array.isArray(record.strokes) ? record.strokes : []) as {
    x: number;
    y: number;
  }[][];
  const current = useRef<{ x: number; y: number }[] | null>(null);
  const baseStrokes = useRef(strokes);
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(480, ((event.clientX - bounds.left) * 480) / bounds.width),
      ),
      y: Math.max(
        0,
        Math.min(160, ((event.clientY - bounds.top) * 160) / bounds.height),
      ),
    };
  };
  return (
    <div id={id} {...aria}>
      <svg
        className="fd-signature"
        viewBox="0 0 480 160"
        role="img"
        aria-label={t("Vùng vẽ chữ ký; có thể nhập tên thay thế bên dưới")}
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          baseStrokes.current = strokes;
          current.current = [point(event)];
        }}
        onPointerMove={(event) => {
          if (
            !current.current ||
            disabled ||
            current.current.length > 1000 ||
            strokes.length >= 100
          )
            return;
          current.current.push(point(event));
          onChange({
            ...record,
            strokes: [
              ...baseStrokes.current.slice(0, 99),
              [...current.current],
            ],
          });
        }}
        onPointerUp={() => {
          current.current = null;
        }}
        onPointerCancel={() => {
          current.current = null;
        }}
      >
        {strokes.filter(Array.isArray).map((stroke, index) => (
          <polyline
            key={index}
            points={stroke
              .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y))
              .slice(0, 1000)
              .map((p) => `${p.x},${p.y}`)
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        ))}
      </svg>
      <Field label={t("Nhập tên thay cho vẽ chữ ký")}>
        <Input
          value={typeof record.typed === "string" ? record.typed : ""}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...record, typed: event.target.value })
          }
        />
      </Field>
      <Button type="button" disabled={disabled} onClick={() => onChange(null)}>
        {t("Xóa chữ ký")}
      </Button>
    </div>
  );
}
function FileControl({
  field,
  value,
  onChange,
  disabled,
  id,
  upload,
  remove,
  ...aria
}: CustomControlProps & {
  upload?: UploadHandler;
  remove?: FormRendererProps["onRemoveFile"];
}) {
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const latestChange = useRef(onChange);
  latestChange.current = onChange;
  const files = Array.isArray(value) ? value.filter(isRecord) : [];
  useEffect(() => () => controller.current?.abort(), []);
  return (
    <div id={id} {...aria}>
      <Input
        type="file"
        aria-label={field.label[useI18n().locale]}
        accept={field.accept}
        multiple={(field.maxFiles ?? 1) > 1}
        disabled={disabled || busy}
        onChange={async (event) => {
          const selected = Array.from(event.target.files ?? []);
          event.target.value = "";
          const problem = checkFiles(field, selected, files.length);
          setError(problem ?? "");
          if (problem || !selected.length) return;
          if (!upload) {
            setError("Chưa cấu hình dịch vụ tải tệp lên.");
            return;
          }
          controller.current?.abort();
          const request = new AbortController();
          controller.current = request;
          setBusy(true);
          const pending: PreviewValues[] = selected.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            status: "uploading",
          }));
          const next: FormValue[] = [...files, ...pending];
          onChange(next);
          try {
            for (const [index, file] of selected.entries()) {
              const uploaded = await upload(file, {
                field,
                signal: request.signal,
              });
              if (request.signal.aborted) return;
              next[files.length + index] = {
                id: uploaded.id,
                reference: uploaded.reference,
                name: file.name,
                size: file.size,
                type: file.type,
                status: "uploaded",
              };
              latestChange.current([...next]);
            }
            latestChange.current(next);
          } catch {
            if (!request.signal.aborted) {
              latestChange.current(
                next.map((item) =>
                  isRecord(item) && item.status === "uploading"
                    ? { ...item, status: "error" }
                    : item,
                ),
              );
              setError("Không tải được tệp. Hãy thử lại.");
            }
          } finally {
            if (!request.signal.aborted) setBusy(false);
          }
        }}
      />
      {busy && <Notice>{t("Đang tải tệp lên...")}</Notice>}
      {error && <Notice tone="danger">{t(error)}</Notice>}
      {files.map((file, index) => (
        <div className="fd-form-order" key={String(file.id ?? index)}>
          <span>
            {String(file.name)} · {Number(file.size)} {t("byte")}
          </span>
          <Button
            type="button"
            disabled={disabled || busy}
            onClick={async () => {
              setError("");
              try {
                if (remove && typeof file.reference === "string")
                  await remove(file.reference);
                onChange(files.filter((_, position) => position !== index));
              } catch {
                setError("Không xóa được tệp. Hãy thử lại.");
              }
            }}
          >
            {t("Xóa tệp")}
          </Button>
        </div>
      ))}
    </div>
  );
}
function TagsControl({
  value,
  onChange,
  disabled,
  id,
  ...aria
}: CustomControlProps) {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const items = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
  return (
    <div id={id} {...aria}>
      <div className="fd-form-order">
        {items.map((item) => (
          <Button
            type="button"
            key={item}
            disabled={disabled}
            aria-label={t("Xóa thẻ {{name}}", { name: item })}
            onClick={() => onChange(items.filter((value) => value !== item))}
          >
            {item}
            {" ×"}
          </Button>
        ))}
      </div>
      <Input
        aria-label={t("Thêm thẻ rồi nhấn Enter")}
        value={input}
        disabled={disabled}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (input.trim() && !items.includes(input.trim())) {
              onChange([...items, input.trim()]);
              setInput("");
            }
          }
        }}
      />
    </div>
  );
}
function KeyValueControl({
  value,
  onChange,
  disabled,
  id,
  ...aria
}: CustomControlProps) {
  const { t } = useI18n();
  const record = isRecord(value) ? value : {};
  const [key, setKey] = useState("");
  const [entry, setEntry] = useState("");
  return (
    <div id={id} {...aria}>
      {Object.entries(record).map(([name, value]) => (
        <div className="fd-form-order" key={name}>
          <strong>{name}</strong>
          <span>{String(value)}</span>
          <Button
            type="button"
            disabled={disabled}
            aria-label={t("Xóa thẻ {{name}}", { name })}
            onClick={() => {
              const next = { ...record };
              delete next[name];
              onChange(next);
            }}
          >
            {t("Xóa")}
          </Button>
        </div>
      ))}
      <FieldGroup>
        <Field label={t("Mã mục")}>
          <Input
            disabled={disabled}
            value={key}
            onChange={(event) => setKey(event.target.value)}
          />
        </Field>
        <Field label={t("Giá trị mục")}>
          <Input
            disabled={disabled}
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
          />
        </Field>
      </FieldGroup>
      <Button
        type="button"
        disabled={
          disabled ||
          !key.trim() ||
          ["__proto__", "prototype", "constructor"].includes(key.trim()) ||
          Object.hasOwn(record, key.trim())
        }
        onClick={() => {
          onChange({ ...record, [key.trim()]: entry });
          setKey("");
          setEntry("");
        }}
      >
        {t("Thêm mục")}
      </Button>
    </div>
  );
}
interface RuntimeFieldsProps extends Pick<
  FormRendererProps,
  | "access"
  | "providers"
  | "onUpload"
  | "onRemoveFile"
  | "renderers"
  | "readOnly"
> {
  design?: { wrap(field: FormField, control: ReactNode): ReactNode };
  fields: FormField[];
  data: PreviewValues;
  root: PreviewValues;
  onChange(values: PreviewValues): void;
  issues: FormIssue[];
  prefix: string;
  idPrefix: string;
  revealFieldId?: string;
  onOptions(key: string, options: string[]): void;
}
function RuntimeField({
  field,
  ...props
}: RuntimeFieldsProps & { field: FormField }) {
  const { t, locale } = useI18n();
  const {
    data,
    root,
    onChange,
    access = {},
    providers = {},
    renderers = {},
    issues,
    prefix,
    idPrefix,
  } = props;
  const path = prefix + field.key;
  const id = `${idPrefix}-${path}`;
  const context = { ...root, ...data };
  const accessRule = access[path] ?? access[field.key];
  const choice = useChoices(
    field,
    field.dataSource?.dependsOn
      ? context[field.dataSource.dependsOn]
      : undefined,
    field.dataSource ? providers[field.dataSource.provider] : undefined,
  );
  const optionKey = choice.options.map((option) => option.value).join("\u0000");
  const onOptionsRef = useRef(props.onOptions);
  onOptionsRef.current = props.onOptions;
  useEffect(() => {
    if (field.dataSource)
      onOptionsRef.current(
        path,
        choice.options.map((option) => option.value),
      );
  }, [path, field.dataSource, optionKey, choice.options]);
  const [tab, setTab] = useState(field.children?.[0]?.id ?? "");
  useEffect(() => {
    if (field.type === "tabs" && props.revealFieldId) {
      const containing = field.children?.find((child) =>
        flattenFields([child]).some((item) => item.id === props.revealFieldId),
      );
      if (containing) setTab(containing.id);
    }
  }, [field.children, field.type, props.revealFieldId]);
  const visible = evaluateRule(field.visibleWhen, context);
  if (
    (!visible && !props.design) ||
    accessRule?.read === "deny" ||
    field.type === "hidden"
  )
    return null;
  if (accessRule?.read === "mask")
    return (
      <Field label={field.label[locale]}>
        <Input id={id} value="••••••" readOnly />
      </Field>
    );
  const disabled = !!(
    props.readOnly ||
    field.disabled ||
    field.readOnly ||
    field.calculation ||
    accessRule?.write === false ||
    evaluateRule(field.disabledWhen, context, false)
  );
  const required =
    field.required || evaluateRule(field.requiredWhen, context, false);
  const label = required
    ? t("{{label}} (bắt buộc)", { label: field.label[locale] })
    : field.label[locale];
  const error = issues.find((issue) => issue.path === path);
  const value = data[field.key];
  const text =
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  const setValue = (next: FormValue) =>
    onChange({ ...data, [field.key]: next });
  const nextProps = { ...props, readOnly: disabled, prefix, data };
  if (field.type === "content")
    return (
      <section className="fd-form-content">
        <h3>{field.label[locale]}</h3>
        <p>{field.help?.[locale]}</p>
      </section>
    );
  if (field.type === "alert")
    return (
      <Notice tone={field.tone ?? "info"}>
        <strong>{label}</strong>
        <p>{field.help?.[locale]}</p>
      </Notice>
    );
  if (field.type === "button")
    return (
      <Button type={field.buttonAction ?? "submit"} disabled={disabled}>
        {label}
      </Button>
    );
  if (isContainer(field)) {
    const children = field.children ?? [];
    return (
      <FieldSet
        id={id}
        className="fd-runtime-section"
        data-field-type={field.type}
      >
        <FieldLegend
          className={
            field.type === "columns" && field.hideLabel !== false
              ? "sr-only"
              : undefined
          }
        >
          {label}
        </FieldLegend>
        {field.help?.[locale] && <p>{field.help[locale]}</p>}
        {field.type === "container" ? (
          <RuntimeFields
            {...nextProps}
            fields={children}
            data={isRecord(value) ? value : {}}
            prefix={`${path}.`}
            onChange={setValue}
          />
        ) : field.type === "repeat" ? (
          <RepeatField
            field={field}
            rows={Array.isArray(value) ? value.filter(isRecord) : []}
            onChange={setValue}
            disabled={disabled}
            design={!!props.design}
            renderFields={(fields, row, index, onRowChange) => (
              <RuntimeFields
                {...nextProps}
                fields={fields}
                data={row}
                prefix={`${path}.${index}.`}
                onChange={onRowChange}
              />
            )}
          />
        ) : field.type === "tabs" ? (
          <>
            <Tabs
              tabs={children.map((child) => ({
                id: child.id,
                label: child.label[locale],
              }))}
              active={
                children.some((child) => child.id === tab)
                  ? tab
                  : (children[0]?.id ?? "")
              }
              onChange={setTab}
            />
            <RuntimeFields
              {...nextProps}
              fields={children.filter(
                (child) =>
                  child.id ===
                  (children.some((child) => child.id === tab)
                    ? tab
                    : children[0]?.id),
              )}
            />
          </>
        ) : field.type === "table" ? (
          <div className="fd-table-scroll">
            <table className="fd-layout-table">
              <tbody>
                {Array.from(
                  { length: Math.ceil(children.length / (field.columns ?? 2)) },
                  (_, row) => (
                    <tr key={row}>
                      {children
                        .slice(
                          row * (field.columns ?? 2),
                          (row + 1) * (field.columns ?? 2),
                        )
                        .map((child) => (
                          <td key={child.id}>
                            <RuntimeFields {...nextProps} fields={[child]} />
                          </td>
                        ))}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className={
              field.type === "columns"
                ? `fd-runtime-columns fd-runtime-columns-${field.columns ?? 2}`
                : ""
            }
          >
            <RuntimeFields {...nextProps} fields={children} />
          </div>
        )}
        {error && (
          <Notice tone="danger">{t(error.message, error.params)}</Notice>
        )}
      </FieldSet>
    );
  }
  const Custom = field.customRenderer
    ? renderers[field.customRenderer]
    : undefined;
  const controlProps: CustomControlProps = {
    id,
    field,
    value,
    disabled,
    onChange: setValue,
    "aria-invalid": !!error,
  };
  let control;
  if (field.customRenderer)
    control = Custom ? (
      <Custom {...controlProps} />
    ) : (
      <Notice tone="danger">{t("Chưa đăng ký bộ hiển thị tùy chỉnh.")}</Notice>
    );
  else if (field.type === "address" || field.type === "day") {
    const parts =
      field.type === "address"
        ? [
            ["street", "Đường và số nhà"],
            ["city", "Thành phố"],
            ["region", "Tỉnh hoặc vùng"],
            ["postal", "Mã bưu chính"],
            ["country", "Quốc gia"],
          ]
        : [
            ["day", "Ngày trong tháng"],
            ["month", "Tháng"],
            ["year", "Năm"],
          ];
    control = (
      <div id={id} tabIndex={-1}>
        <FieldGroup>
          {parts.map(([key, title]) => (
            <Field key={key} label={t(title)}>
              <Input
                type={field.type === "day" ? "number" : "text"}
                min={field.type === "day" ? 1 : undefined}
                max={
                  field.type === "day"
                    ? key === "day"
                      ? 31
                      : key === "month"
                        ? 12
                        : 9999
                    : undefined
                }
                value={isRecord(value) ? String(value[key] ?? "") : ""}
                disabled={disabled}
                onChange={(event) =>
                  setValue({
                    ...(isRecord(value) ? value : {}),
                    [key]: event.target.value,
                  })
                }
              />
            </Field>
          ))}
        </FieldGroup>
      </div>
    );
  } else if (field.type === "checkbox")
    control = (
      <Checkbox
        id={id}
        checked={value === true}
        disabled={disabled}
        onCheckedChange={(checked) => setValue(checked === true)}
      />
    );
  else if (field.type === "select")
    control = (
      <Combobox
        id={id}
        label={label}
        value={text}
        disabled={disabled || choice.status !== "ready"}
        options={[
          { value: "__fd_clear__", label: t("Bỏ lựa chọn") },
          ...choice.options.map((option) => ({
            value: option.value,
            label: option.label[locale],
          })),
        ]}
        onValueChange={(next) => setValue(next === "__fd_clear__" ? "" : next)}
      />
    );
  else if (field.type === "radio")
    control = (
      <RadioGroup
        id={id}
        value={text}
        disabled={disabled}
        onValueChange={setValue}
      >
        {choice.options.map((option) => (
          <label className="fd-choice-row" key={option.value}>
            <RadioGroupItem value={option.value} />
            {option.label[locale]}
          </label>
        ))}
      </RadioGroup>
    );
  else if (["multiselect", "checkboxes"].includes(field.type))
    control = (
      <div id={id} role="group" aria-label={label}>
        {choice.options.map((option) => (
          <label className="fd-choice-row" key={option.value}>
            <Checkbox
              checked={Array.isArray(value) && value.includes(option.value)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                setValue(
                  checked
                    ? [...(Array.isArray(value) ? value : []), option.value]
                    : (Array.isArray(value) ? value : []).filter(
                        (item) => item !== option.value,
                      ),
                )
              }
            />
            {option.label[locale]}
          </label>
        ))}
      </div>
    );
  else if (field.type === "survey")
    control = (
      <div id={id}>
        {field.options.map((option) => (
          <FieldSet key={option.value}>
            <FieldLegend>{option.label[locale]}</FieldLegend>
            <RadioGroup
              value={isRecord(value) ? String(value[option.value] ?? "") : ""}
              disabled={disabled}
              onValueChange={(next) =>
                setValue({
                  ...(isRecord(value) ? value : {}),
                  [option.value]: next,
                })
              }
              className="fd-survey-options"
            >
              {["1", "2", "3", "4", "5"].map((rating) => (
                <label className="fd-choice-row" key={rating}>
                  <RadioGroupItem value={rating} />
                  {rating}
                </label>
              ))}
            </RadioGroup>
          </FieldSet>
        ))}
      </div>
    );
  else if (field.type === "signature")
    control = <SignatureControl {...controlProps} />;
  else if (field.type === "file")
    control = (
      <FileControl
        {...controlProps}
        upload={props.onUpload}
        remove={props.onRemoveFile}
      />
    );
  else if (field.type === "tags") control = <TagsControl {...controlProps} />;
  else if (field.type === "keyvalue")
    control = <KeyValueControl {...controlProps} />;
  else if (field.type === "textarea")
    control = (
      <Textarea
        id={id}
        value={text}
        disabled={disabled}
        placeholder={field.placeholder?.[locale]}
        maxLength={field.maxLength ?? 10000}
        onChange={(event) => setValue(event.target.value)}
      />
    );
  else if (field.type === "date" || field.type === "datetime")
    control = (
      <DatePicker
        id={id}
        label={label}
        value={text}
        onValueChange={setValue}
        withTime={field.type === "datetime"}
        disabled={disabled}
        placeholder={field.placeholder?.[locale]}
      />
    );
  else
    control = (
      <Input
        id={id}
        type={
          field.type === "phone"
            ? "tel"
            : ["number", "currency"].includes(field.type)
              ? "number"
              : field.type
        }
        value={text}
        disabled={disabled}
        min={field.min}
        max={field.max}
        step={field.integer ? "1" : "any"}
        placeholder={field.placeholder?.[locale]}
        maxLength={field.maxLength ?? 10000}
        onChange={(event) => setValue(event.target.value)}
      />
    );
  return (
    <div className="fd-runtime-field">
      {field.dataSource && (
        <>
          <Field label={t("Tìm lựa chọn cho {{label}}", { label })}>
            <Input
              disabled={disabled}
              value={choice.query}
              onChange={(event) => choice.setQuery(event.target.value)}
            />
          </Field>
          {choice.status !== "ready" && (
            <Notice tone={choice.status === "loading" ? "info" : "warning"}>
              {t(
                choice.status === "loading"
                  ? "Đang tải lựa chọn..."
                  : choice.status === "missing"
                    ? "Chưa cấu hình nguồn lựa chọn."
                    : "Không tải được lựa chọn. Hãy thử tìm lại.",
              )}
            </Notice>
          )}
        </>
      )}
      <Field
        label={label}
        hint={field.help?.[locale]}
        error={error ? t(error.message, error.params) : undefined}
      >
        {control}
      </Field>
      {field.type === "currency" && <Badge>{field.currency ?? "VND"}</Badge>}
    </div>
  );
}
export function RuntimeFields(props: RuntimeFieldsProps) {
  return (
    <>
      {props.fields.map((field) => (
        <RuntimeFieldSlot {...props} key={field.id} field={field} />
      ))}
    </>
  );
}
function RuntimeFieldSlot(props: RuntimeFieldsProps & { field: FormField }) {
  const control = <RuntimeField {...props} />;
  return props.design ? props.design.wrap(props.field, control) : control;
}
export function FormRenderer({
  definition,
  values,
  onChange,
  access = {},
  ...props
}: FormRendererProps) {
  const { t, locale } = useI18n();
  const id = useId();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const [result, setResult] = useState("");
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [revealFieldId, setRevealFieldId] = useState<string>();
  const [optionValues, setOptionValues] = useState<Record<string, string[]>>(
    {},
  );
  const summary = useRef<HTMLDivElement>(null);
  const schemaIssues = validateFormDefinition(definition);
  const prepared = prepareValues(definition, values, access);
  const allIssues = checked
    ? validatePreview(definition, values, access, optionValues)
    : [];
  const stepIndex = Math.min(step, Math.max(0, definition.fields.length - 1));
  const wizard = definition.display === "wizard";
  const visibleFields = wizard
    ? definition.fields.slice(stepIndex, stepIndex + 1)
    : definition.fields;
  const currentIds = new Set(
    flattenFields(visibleFields).map((field) => field.id),
  );
  const issues =
    wizard && stepIndex < definition.fields.length - 1
      ? allIssues.filter(
          (issue) => !issue.fieldId || currentIds.has(issue.fieldId),
        )
      : allIssues;
  useEffect(() => {
    if (checked && issues.length) summary.current?.focus();
  }, [checked, issues.length]);
  if (schemaIssues.length)
    return (
      <Notice tone="warning">
        {t("Sửa lỗi cấu trúc trước khi xem thử biểu mẫu.")}
      </Notice>
    );
  const update = (next: PreviewValues) => {
    onChange(prepareValues(definition, next, access));
    setChecked(false);
    setResult("");
  };
  return (
    <div className="fd-form-preview">
      <h2>{definition.title[locale]}</h2>
      {props.preview && (
        <Notice>
          {t("Xem thử cục bộ. Giá trị nhập không được gửi hoặc lưu.")}
        </Notice>
      )}
      {wizard && (
        <div className="fd-form-order">
          {definition.fields.map((field, index) => (
            <Badge
              key={field.id}
              tone={index === stepIndex ? "info" : "neutral"}
            >
              {index + 1} · {field.label[locale]}
            </Badge>
          ))}
        </div>
      )}
      {issues.length > 0 && (
        <div
          ref={summary}
          tabIndex={-1}
          role="alert"
          className="fd-form-error-summary"
        >
          <strong>
            {t("Cần sửa {{count}} lỗi trong dữ liệu thử.", {
              count: issues.length,
            })}
          </strong>
          <ul>
            {issues.map((issue, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => {
                    setRevealFieldId(issue.fieldId);
                    const top = definition.fields.findIndex(
                      (field) => field.key === issue.path?.split(".")[0],
                    );
                    if (wizard && top >= 0) setStep(top);
                    requestAnimationFrame(() =>
                      document.getElementById(`${id}-${issue.path}`)?.focus(),
                    );
                  }}
                >
                  {t(issue.message, issue.params)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form
        noValidate
        onReset={(event) => {
          event.preventDefault();
          if (props.readOnly || busy.current) return;
          update(defaultValues(definition.fields));
          setStep(0);
          setResetKey((key) => key + 1);
        }}
        onSubmit={async (event) => {
          event.preventDefault();
          if (props.readOnly || busy.current) return;
          setChecked(true);
          setResult("");
          const problems = validatePreview(
            definition,
            values,
            access,
            optionValues,
          );
          if (problems.length) {
            props.onInvalid?.(problems);
            return;
          }
          if (wizard && stepIndex < definition.fields.length - 1) {
            setStep(stepIndex + 1);
            setChecked(false);
            return;
          }
          if (!props.onSubmit) {
            setResult("Dữ liệu thử hợp lệ trên trình duyệt; chưa gửi yêu cầu.");
            setFailed(false);
            return;
          }
          busy.current = true;
          setSubmitting(true);
          try {
            await props.onSubmit(
              submissionValues(definition, prepared, access),
            );
            setResult("Bộ tích hợp đã xử lý dữ liệu biểu mẫu.");
            setFailed(false);
          } catch {
            setFailed(true);
            setResult("Không gửi được biểu mẫu. Dữ liệu vẫn còn; hãy thử lại.");
          } finally {
            busy.current = false;
            setSubmitting(false);
          }
        }}
      >
        <FieldGroup key={resetKey}>
          <RuntimeFields
            fields={visibleFields}
            data={prepared}
            root={prepared}
            onChange={update}
            issues={issues}
            prefix=""
            idPrefix={id}
            revealFieldId={revealFieldId}
            access={access}
            {...props}
            readOnly={props.readOnly || submitting}
            onOptions={(key, options) =>
              setOptionValues((current) =>
                JSON.stringify(current[key]) === JSON.stringify(options)
                  ? current
                  : { ...current, [key]: options },
              )
            }
          />
        </FieldGroup>
        <div className="fd-form-order">
          {wizard && (
            <>
              <Button
                type="button"
                disabled={stepIndex === 0 || submitting}
                onClick={() => {
                  setStep(stepIndex - 1);
                  setChecked(false);
                }}
              >
                {t("Bước trước")}
              </Button>
              {stepIndex < definition.fields.length - 1 && (
                <Button
                  type="button"
                  onClick={() => {
                    const problems = validatePreview(
                      definition,
                      values,
                      access,
                      optionValues,
                    ).filter(
                      (issue) =>
                        !issue.fieldId || currentIds.has(issue.fieldId),
                    );
                    if (problems.length) {
                      setChecked(true);
                      props.onInvalid?.(problems);
                    } else {
                      setStep(stepIndex + 1);
                      setChecked(false);
                    }
                  }}
                >
                  {t("Bước tiếp")}
                </Button>
              )}
            </>
          )}
          {(!wizard || stepIndex === definition.fields.length - 1) && (
            <Button
              type="submit"
              variant="primary"
              disabled={props.readOnly || submitting}
            >
              {t(
                submitting
                  ? "Đang xử lý..."
                  : props.onSubmit
                    ? "Gửi biểu mẫu"
                    : "Kiểm tra dữ liệu thử",
              )}
            </Button>
          )}
          <Button
            type="button"
            disabled={props.readOnly || submitting}
            onClick={() => {
              update(defaultValues(definition.fields));
              setStep(0);
              setResetKey((key) => key + 1);
            }}
          >
            {t("Xóa dữ liệu thử")}
          </Button>
        </div>
      </form>
      {result && (
        <Notice tone={failed ? "danger" : "success"}>{t(result)}</Notice>
      )}
    </div>
  );
}
export type FormPreviewProps = Omit<FormRendererProps, "onSubmit">;
export function FormPreview(props: FormPreviewProps) {
  return <FormRenderer {...props} preview />;
}
