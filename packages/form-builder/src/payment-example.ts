import type { FormDefinition, FormField } from "./schema";
const field = (
  key: string,
  type: FormField["type"],
  vi: string,
  en: string,
  patch: Partial<FormField> = {},
): FormField => ({
  id: `payment-${key}`,
  key,
  type,
  label: { vi, en },
  required: false,
  options: [],
  ...patch,
});
/** Synthetic local UX fixture. Provider names are host contracts, never upstream URLs. */
export function createPaymentDefinition(): FormDefinition {
  return {
    id: "payment-request-example",
    title: { vi: "Đề nghị thanh toán · mẫu", en: "Payment request · sample" },
    version: 1,
    status: "DRAFT",
    schemaVersion: 2,
    fields: [
      field("details", "columns", "Thông tin thanh toán", "Payment details", {
        columns: 2,
        children: [
          field(
            "requester",
            "text",
            "Người đề nghị · mẫu",
            "Requester · sample",
            { defaultValue: "Demo User", readOnly: true },
          ),
          field("company", "select", "Công ty", "Company", {
            dataSource: { provider: "demo.companies" },
            required: true,
          }),
          field("department", "select", "Phòng ban", "Department", {
            dataSource: { provider: "demo.departments", dependsOn: "company" },
          }),
          field("vendor", "text", "Nhà cung cấp", "Vendor", { required: true }),
          field("invoice_date", "date", "Ngày hóa đơn", "Invoice date"),
          field("due_date", "date", "Hạn thanh toán", "Due date", {
            compare: { field: "invoice_date", operator: "gte" },
          }),
        ],
      }),
      field("payment_type", "radio", "Loại thanh toán", "Payment type", {
        required: true,
        defaultValue: "invoice",
        options: [
          {
            value: "invoice",
            label: { vi: "Thanh toán hóa đơn", en: "Invoice payment" },
          },
          { value: "advance", label: { vi: "Tạm ứng", en: "Advance" } },
        ],
      }),
      field("advance_reason", "textarea", "Lý do tạm ứng", "Advance reason", {
        visibleWhen: {
          mode: "all",
          conditions: [
            { field: "payment_type", operator: "eq", value: "advance" },
          ],
        },
        requiredWhen: {
          mode: "all",
          conditions: [
            { field: "payment_type", operator: "eq", value: "advance" },
          ],
        },
      }),
      field("currency", "select", "Loại tiền", "Currency", {
        defaultValue: "USD",
        options: [
          {
            value: "USD",
            label: { vi: "USD · Đô la Mỹ", en: "USD · US Dollar" },
          },
        ],
        help: {
          vi: "Mẫu này dùng USD để kiểm tra số thập phân.",
          en: "This sample uses USD to test decimal calculations.",
        },
      }),
      field(
        "amount_requested",
        "currency",
        "Số tiền đề nghị",
        "Amount requested",
        {
          currency: "USD",
          min: 0,
          required: true,
          compare: { field: "total", operator: "eq" },
          help: {
            vi: "Phải khớp với tổng các dòng chi phí.",
            en: "Must match the expense rows total.",
          },
        },
      ),
      field("lines", "repeat", "Chi tiết chi phí", "Expense lines", {
        minRows: 1,
        maxRows: 20,
        children: [
          field("description", "text", "Nội dung", "Description", {
            required: true,
          }),
          field("amount", "currency", "Chi phí", "Expense amount", {
            currency: "USD",
            min: 0,
            required: true,
          }),
        ],
      }),
      field("total", "currency", "Tổng chi phí", "Expense total", {
        currency: "USD",
        calculation: {
          operator: "sum",
          fields: ["lines.amount"],
          precision: 2,
        },
      }),
      field(
        "payment_description",
        "textarea",
        "Diễn giải thanh toán",
        "Payment description",
      ),
      field("attachment", "file", "Chứng từ đính kèm", "Attachment", {
        accept: ".pdf,image/*",
        help: {
          vi: "Chưa có bộ tích hợp tải tệp; không gửi chứng từ thật.",
          en: "No upload adapter configured; do not use real documents.",
        },
      }),
    ],
  };
}
