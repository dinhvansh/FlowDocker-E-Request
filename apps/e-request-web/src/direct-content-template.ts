import { createField, type FormDefinition } from "@flowdocker/form-builder";
import { demoLogo } from "./demo-form-logo";

/** Synthetic example, discoverable without replacing any saved draft. */
export function createDirectContentTemplate(): FormDefinition {
  const form: FormDefinition = {
    schemaVersion: 2,
    id: "demo-logo-heading",
    title: { vi: "DEMO · Logo và tiêu đề", en: "DEMO · Logo and heading" },
    status: "DRAFT",
    version: 1,
    fields: [
      {
        ...createField("columns", []),
        id: "header",
        key: "header",
        columns: 2,
        hideLabel: true,
        label: { vi: "Bố cục đầu biểu mẫu", en: "Form header layout" },
        children: [
          {
            ...createField("image", []),
            id: "logo",
            key: "logo",
            label: { vi: "Logo mẫu", en: "Sample logo" },
            presentation: {
              align: "left",
              size: "body",
              bold: false,
              image: demoLogo,
              imageWidth: 160,
            },
          },
          {
            ...createField("content", []),
            id: "heading",
            key: "heading",
            label: { vi: "ĐỀ NGHỊ THANH TOÁN", en: "PAYMENT REQUEST" },
            presentation: { align: "right", size: "title", bold: true },
          },
        ],
      },
      {
        ...createField("content", []),
        id: "instructions",
        key: "instructions",
        label: {
          vi: "Mẫu thử chỉnh logo và tiêu đề",
          en: "Logo and heading editing example",
        },
        help: {
          vi: "Chọn logo hoặc tiêu đề để kéo vị trí, đổi cỡ và căn lề. Trong Xem thử biểu mẫu, bật Chỉnh logo / tiêu đề. Đây là dữ liệu minh họa cục bộ.",
          en: "Select the logo or heading to move, resize and align it. In Preview, enable Edit logo / heading. This is a local synthetic example.",
        },
        presentation: { align: "left", size: "body", bold: false },
      },
      {
        ...createField("columns", []),
        id: "details",
        key: "details",
        columns: 2,
        hideLabel: true,
        label: { vi: "Thông tin mẫu", en: "Sample details" },
        children: [
          {
            ...createField("text", []),
            id: "requester",
            key: "requester",
            label: { vi: "Người đề nghị", en: "Requester" },
          },
          {
            ...createField("date", []),
            id: "request_date",
            key: "request_date",
            label: { vi: "Ngày đề nghị", en: "Request date" },
          },
        ],
      },
      {
        ...createField("textarea", []),
        id: "description",
        key: "description",
        label: { vi: "Nội dung đề nghị", en: "Request details" },
      },
    ],
  };
  form.fields[0] = {
    ...createField("section", form.fields),
    id: "page_header",
    key: "page_header",
    documentRegion: "header",
    regionEnabled: true,
    required: false,
    label: { vi: "Đầu trang", en: "Header" },
    children: [form.fields[0]],
  };
  form.fields.push({
    ...createField("section", form.fields),
    id: "page_footer",
    key: "page_footer",
    documentRegion: "footer",
    regionEnabled: true,
    required: false,
    label: { vi: "Chân trang", en: "Footer" },
    children: [
      {
        ...createField("content", form.fields),
        id: "footer_note",
        key: "footer_note",
        label: {
          vi: "FlowDocker · Biểu mẫu minh họa",
          en: "FlowDocker · Sample form",
        },
        presentation: { align: "center", size: "body", bold: false },
      },
    ],
  });
  return form;
}
