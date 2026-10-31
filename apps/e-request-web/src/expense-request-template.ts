import type { FormDefinition, FormField } from "@flowdocker/form-builder";

const field = (
  key: string,
  type: FormField["type"],
  vi: string,
  en: string,
  properties: Partial<FormField> = {},
): FormField => ({
  id: `expense-template-${key}`,
  key,
  type,
  label: { vi, en },
  required: false,
  options: [],
  ...properties,
});

/** Domain template with synthetic defaults only. No PDF records or approval outcomes. */
export function createExpenseRequestTemplate(): FormDefinition {
  return {
    id: "expense-request-vnd-template",
    title: {
      vi: "Đề nghị thanh toán · mẫu chi phí VND",
      en: "Expense request · VND template",
    },
    version: 1,
    schemaVersion: 2,
    status: "DRAFT",
    orientation: "landscape",
    fields: [
      field(
        "guide",
        "alert",
        "Mẫu thử · chỉ lưu bản thiết kế trên máy",
        "Demo · design saved on this device only",
        {
          tone: "info",
          help: {
            vi: "Nhập thông tin minh họa. Mẫu dùng VND, tỷ giá 1. Chưa kết nối nhân sự, cấp số chứng từ, ngân hàng hoặc quy trình duyệt.",
            en: "Use synthetic entries. This template uses VND at rate 1. Identity, document numbering, banking and approvals are not connected.",
          },
        },
      ),
      field("general", "section", "Thông tin chung", "General information", {
        children: [
          field(
            "general_layout",
            "columns",
            "Thông tin chứng từ",
            "Document details",
            {
              columns: 2,
              children: [
                field(
                  "document_ref",
                  "text",
                  "Số chứng từ · mẫu",
                  "Document reference · sample",
                  {
                    defaultValue: "DEMO-EXPENSE-001",
                    readOnly: true,
                    help: {
                      vi: "Mã minh họa; chưa cấp số tự động.",
                      en: "Sample reference; automatic numbering is not connected.",
                    },
                  },
                ),
                field("requester", "text", "Người yêu cầu", "Requestor", {
                  required: true,
                }),
                field(
                  "department",
                  "select",
                  "Bộ phận · danh sách mẫu",
                  "Department · sample list",
                  {
                    required: true,
                    options: [
                      {
                        value: "demo-it",
                        label: { vi: "CNTT · mẫu", en: "IT · sample" },
                      },
                      {
                        value: "demo-admin",
                        label: {
                          vi: "Hành chính · mẫu",
                          en: "Administration · sample",
                        },
                      },
                      {
                        value: "demo-sales",
                        label: { vi: "Kinh doanh · mẫu", en: "Sales · sample" },
                      },
                    ],
                  },
                ),
                field(
                  "accounting_date",
                  "date",
                  "Ngày hạch toán",
                  "Accounting date",
                ),
              ],
            },
          ),
        ],
      }),
      field(
        "beneficiary",
        "section",
        "Thông tin người thụ hưởng",
        "Beneficiary details",
        {
          children: [
            field(
              "beneficiary_layout",
              "columns",
              "Tài khoản thanh toán",
              "Payment account",
              {
                columns: 2,
                children: [
                  field(
                    "beneficiary_name",
                    "text",
                    "Tên người/đơn vị thụ hưởng",
                    "Beneficiary name",
                    { required: true },
                  ),
                  field(
                    "account_number",
                    "text",
                    "Số tài khoản · chỉ nhập dữ liệu mẫu",
                    "Account number · synthetic data only",
                    { required: true, maxLength: 64 },
                  ),
                  field("bank_name", "text", "Ngân hàng", "Bank", {
                    required: true,
                  }),
                  field("bank_branch", "text", "Chi nhánh", "Branch"),
                ],
              },
            ),
            field(
              "transfer_description",
              "textarea",
              "Nội dung chuyển khoản",
              "Transfer description",
              { required: true, maxLength: 500 },
            ),
          ],
        },
      ),
      field("lines", "repeat", "Chi tiết chi phí", "Expense lines", {
        minRows: 1,
        maxRows: 50,
        children: [
          field("invoice_date", "date", "Ngày hóa đơn", "Invoice date", {
            required: true,
          }),
          field("invoice_ref", "text", "Số hóa đơn", "Invoice reference", {
            required: true,
            maxLength: 100,
          }),
          field("description", "textarea", "Diễn giải", "Description", {
            required: true,
            maxLength: 1000,
          }),
          field(
            "expense_type",
            "select",
            "Loại chi phí · mẫu",
            "Expense type · sample",
            {
              required: true,
              options: [
                {
                  value: "software",
                  label: { vi: "Bản quyền phần mềm", en: "Software licenses" },
                },
                { value: "services", label: { vi: "Dịch vụ", en: "Services" } },
                {
                  value: "office",
                  label: { vi: "Văn phòng", en: "Office expenses" },
                },
                { value: "other", label: { vi: "Khác", en: "Other" } },
              ],
            },
          ),
          field("currency_code", "select", "Loại tiền", "Currency", {
            required: true,
            defaultValue: "VND",
            options: [{ value: "VND", label: { vi: "VND", en: "VND" } }],
          }),
          field("amount", "currency", "Số tiền", "Amount", {
            required: true,
            currency: "VND",
            min: 0,
          }),
          field(
            "amount_vnd",
            "currency",
            "Thành tiền VND",
            "Total payment VND",
            {
              currency: "VND",
              calculation: {
                operator: "multiply",
                fields: ["amount", "exchange_rate"],
                precision: 2,
              },
            },
          ),
          field("exchange_rate", "number", "Tỷ giá", "Exchange rate", {
            required: true,
            defaultValue: "1",
            readOnly: true,
            min: 1,
            max: 1,
          }),
        ],
      }),
      field(
        "settlement",
        "section",
        "Tạm ứng và thanh toán",
        "Advance and settlement",
        {
          children: [
            field(
              "advance_layout",
              "columns",
              "Thông tin tạm ứng",
              "Advance details",
              {
                columns: 2,
                children: [
                  field(
                    "advance_ref",
                    "text",
                    "Số chứng từ tạm ứng",
                    "Advance reference",
                    {
                      requiredWhen: {
                        mode: "all",
                        conditions: [
                          { field: "advance_amount", operator: "gt", value: 0 },
                        ],
                      },
                    },
                  ),
                  field(
                    "advance_amount",
                    "currency",
                    "Số tiền đã tạm ứng",
                    "Advance amount",
                    {
                      required: true,
                      currency: "VND",
                      min: 0,
                      defaultValue: "0",
                    },
                  ),
                ],
              },
            ),
            field("totals_layout", "columns", "Đối trừ", "Settlement totals", {
              columns: 2,
              children: [
                field(
                  "total_payment",
                  "currency",
                  "Tổng thanh toán VND",
                  "Total payment VND",
                  {
                    currency: "VND",
                    calculation: {
                      operator: "sum",
                      fields: ["lines.amount_vnd"],
                      precision: 2,
                    },
                  },
                ),
                field("difference", "currency", "Chênh lệch", "Difference", {
                  currency: "VND",
                  calculation: {
                    operator: "subtract",
                    fields: ["advance_amount", "total_payment"],
                    precision: 2,
                  },
                  help: {
                    vi: "Tạm ứng trừ tổng thanh toán. Số âm: còn phải thanh toán; số dương: cần hoàn lại.",
                    en: "Advance minus total payment. Negative: amount still payable; positive: amount to return.",
                  },
                }),
              ],
            }),
          ],
        },
      ),
      field(
        "approval_note",
        "alert",
        "Phê duyệt · chưa kết nối",
        "Approvals · not connected",
        {
          tone: "info",
          help: {
            vi: "Các vị trí trong mẫu PDF: quản lý trực tiếp, trưởng bộ phận, kế toán và CFO. Người duyệt, kết quả và lịch sử sẽ do quy trình cung cấp; người làm đơn không tự nhập phần này.",
            en: "PDF approval positions: line manager, department head, accounting and CFO. Approvers, decisions and history must come from the workflow, not the requestor.",
          },
        },
      ),
    ],
  };
}
