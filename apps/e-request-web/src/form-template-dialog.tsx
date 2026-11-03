import { useState } from "react";
import { useI18n } from "@flowdocker/i18n";
import { FormPreview, type FormDefinition } from "@flowdocker/form-builder";
import {
  Button,
  Field,
  FieldGroup,
  Input,
  Modal,
  Notice,
} from "@flowdocker/ui";
import { createFromTemplate } from "./form-versions";
import "./form-history.css";

export function FormTemplateDialog({
  template,
  onCreate,
  onClose,
}: {
  template: FormDefinition;
  onCreate(definition: FormDefinition): void;
  onClose(): void;
}) {
  const { t, locale } = useI18n();
  const [title, setTitle] = useState({ ...template.title });
  const [error, setError] = useState(false);
  return (
    <Modal
      title={t("Tạo từ mẫu")}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t("Hủy")}</Button>
          <Button
            variant="primary"
            disabled={!title.vi.trim() || !title.en.trim()}
            onClick={() => {
              try {
                onCreate(createFromTemplate(template, title));
              } catch {
                setError(true);
              }
            }}
          >
            {t("Tạo bản riêng")}
          </Button>
        </>
      }
    >
      <div className="fd-form-template-dialog">
        <Notice>
          {t(
            "Tạo biểu mẫu mới với mã riêng. Mẫu gốc được giữ nguyên; bản mới chỉ được lưu khi bạn bấm Lưu bản nháp.",
          )}
        </Notice>
        <FieldGroup>
          <Field label={t("Tên biểu mẫu · tiếng Việt")}>
            <Input
              value={title.vi}
              onChange={(event) =>
                setTitle({ ...title, vi: event.target.value })
              }
            />
          </Field>
          <Field label={t("Tên biểu mẫu · tiếng Anh")}>
            <Input
              value={title.en}
              onChange={(event) =>
                setTitle({ ...title, en: event.target.value })
              }
            />
          </Field>
        </FieldGroup>
        {error && (
          <Notice tone="danger">
            {t("Mẫu chưa hợp lệ, không thể tạo bản riêng.")}
          </Notice>
        )}
        <details>
          <summary>{t("Xem mẫu trước khi tạo")}</summary>
          <h3>{template.title[locale]}</h3>
          <FormPreview
            definition={template}
            values={{}}
            onChange={() => {}}
            readOnly
          />
        </details>
      </div>
    </Modal>
  );
}
