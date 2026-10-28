import { type FormDefinition, type FormField } from "./schema";
const field = (
  key: string,
  type: FormField["type"],
  vi: string,
  en: string,
  patch: Partial<FormField> = {},
): FormField => ({
  id: `showcase-${key}`,
  key,
  type,
  label: { vi, en },
  required: false,
  options: [],
  ...patch,
});
/** Synthetic portability fixture, no employee, ERP or actual financial records. */
export function createShowcaseDefinition(): FormDefinition {
  return {
    id: "flowdocker-forms-showcase",
    title: {
      vi: "Bộ mẫu tính năng · dữ liệu tổng hợp",
      en: "Feature showcase · synthetic data",
    },
    status: "DRAFT",
    version: 1,
    schemaVersion: 2,
    fields: [
      field("details", "columns", "Thông tin đề nghị", "Request details", {
        columns: 2,
        children: [
          field("requester_name", "text", "Tên mẫu", "Sample name", {
            required: true,
            minLength: 2,
            placeholder: { vi: "Ví dụ tổng hợp", en: "Synthetic example" },
          }),
          field("contact", "email", "Email mẫu", "Sample email", {
            required: true,
          }),
          field("need_on", "date", "Ngày bắt đầu", "Start date"),
          field("end_on", "date", "Ngày kết thúc", "End date", {
            compare: { field: "need_on", operator: "gte" },
          }),
        ],
      }),
      field("urgent", "checkbox", "Cần ưu tiên", "Priority needed"),
      field("reason", "textarea", "Lý do ưu tiên", "Priority reason", {
        requiredWhen: {
          mode: "all",
          conditions: [{ field: "urgent", operator: "eq", value: true }],
        },
        visibleWhen: {
          mode: "all",
          conditions: [{ field: "urgent", operator: "eq", value: true }],
        },
        maxLength: 500,
      }),
      field("lines", "repeat", "Dòng thiết bị mẫu", "Sample equipment rows", {
        minRows: 1,
        maxRows: 10,
        uniqueBy: "item",
        children: [
          field("item", "text", "Mã thiết bị", "Item key", { required: true }),
          field("quantity", "number", "Số lượng", "Quantity", {
            required: true,
            min: 1,
            max: 100,
            integer: true,
            defaultValue: "1",
          }),
          field(
            "unit_price",
            "currency",
            "Đơn giá tham khảo",
            "Reference unit price",
            { min: 0, defaultValue: "0", currency: "VND" },
          ),
          field(
            "line_total",
            "currency",
            "Tổng dòng tham khảo",
            "Reference line total",
            {
              currency: "VND",
              calculation: {
                operator: "multiply",
                fields: ["quantity", "unit_price"],
                precision: 2,
              },
            },
          ),
        ],
      }),
      field("total", "currency", "Tổng tham khảo", "Reference total", {
        currency: "VND",
        calculation: {
          operator: "sum",
          fields: ["lines.line_total"],
          precision: 2,
        },
      }),
      field(
        "preferences",
        "tabs",
        "Thông tin bổ sung",
        "Additional information",
        {
          children: [
            field(
              "structured_tab",
              "section",
              "Thông tin có cấu trúc",
              "Structured details",
              {
                children: [
                  field(
                    "delivery",
                    "address",
                    "Địa chỉ nhận mẫu",
                    "Sample delivery address",
                  ),
                  field(
                    "anniversary",
                    "day",
                    "Ngày theo thành phần",
                    "Date parts",
                  ),
                  field(
                    "contact_details",
                    "container",
                    "Liên hệ bổ sung",
                    "Additional contact",
                    {
                      children: [
                        field("name", "text", "Tên liên hệ", "Contact name"),
                        field(
                          "phone",
                          "phone",
                          "Điện thoại liên hệ",
                          "Contact phone",
                        ),
                      ],
                    },
                  ),
                  field(
                    "layout_table",
                    "table",
                    "Bảng tham khảo",
                    "Reference layout",
                    {
                      columns: 2,
                      children: [
                        field(
                          "reference_code",
                          "text",
                          "Mã tham khảo",
                          "Reference code",
                        ),
                        field(
                          "reference_note",
                          "text",
                          "Ghi chú tham khảo",
                          "Reference note",
                        ),
                      ],
                    },
                  ),
                  field(
                    "sample_notice",
                    "alert",
                    "Lưu ý biểu mẫu",
                    "Form note",
                    {
                      tone: "info",
                      help: {
                        vi: "Đây là dữ liệu tổng hợp để thử giao diện.",
                        en: "Synthetic data for interface testing.",
                      },
                    },
                  ),
                  field(
                    "clear_action",
                    "button",
                    "Làm lại biểu mẫu",
                    "Start over",
                    { buttonAction: "reset" },
                  ),
                ],
              },
            ),
            field("choices_tab", "section", "Lựa chọn", "Choices", {
              children: [
                field(
                  "equipment_kind",
                  "radio",
                  "Loại thiết bị",
                  "Equipment kind",
                  {
                    options: [
                      {
                        value: "laptop",
                        label: { vi: "Máy tính", en: "Computer" },
                      },
                      {
                        value: "display",
                        label: { vi: "Màn hình", en: "Display" },
                      },
                    ],
                  },
                ),
                field("accessories", "checkboxes", "Phụ kiện", "Accessories", {
                  options: [
                    { value: "mouse", label: { vi: "Chuột", en: "Mouse" } },
                    {
                      value: "keyboard",
                      label: { vi: "Bàn phím", en: "Keyboard" },
                    },
                  ],
                }),
                field("labels", "tags", "Thẻ phân loại", "Classification tags"),
              ],
            }),
            field("confirmation_tab", "section", "Xác nhận", "Confirmation", {
              children: [
                field(
                  "signature",
                  "signature",
                  "Chữ ký xác nhận mẫu",
                  "Sample acknowledgement signature",
                ),
                field("files", "file", "Tệp mẫu", "Sample files", {
                  accept: ".pdf,image/*",
                  maxFiles: 3,
                  maxFileSize: 2097152,
                }),
              ],
            }),
          ],
        },
      ),
    ],
  };
}
