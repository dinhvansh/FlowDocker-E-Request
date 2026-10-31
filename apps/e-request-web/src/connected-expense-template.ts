import {
  flattenFields,
  type FormDefinition,
  type FormField,
} from "@flowdocker/form-builder";
import { createExpenseRequestTemplate } from "./expense-request-template";

/** Domain example using injected creator context and the host's local catalog registry. */
export function createConnectedExpenseTemplate(): FormDefinition {
  const form = createExpenseRequestTemplate();
  form.id = "expense-request-connected-template";
  form.title = {
    vi: "Đề nghị thanh toán · người tạo & Master Data",
    en: "Expense request · creator & Master Data",
  };
  const fields = flattenFields(form.fields);
  const get = (key: string) => fields.find((field) => field.key === key)!;
  get("guide").help = {
    vi: "Người đề nghị và hồ sơ tự điền từ tài khoản mẫu. Nhà cung cấp đọc từ Master Data và chỉ lưu mã; thông tin thụ hưởng nhập riêng. Chỉ thử trên máy, chưa cấp số chứng từ hoặc gửi duyệt.",
    en: "Requester and profile fill from the sample account. Vendor reads Master Data and stores only its key; enter beneficiary details separately. Local testing only; no document numbering or approval submission.",
  };
  Object.assign(get("requester"), {
    type: "person",
    defaultValueSource: "currentUser",
    readOnly: true,
    dataSource: { provider: "organization.people" },
  });
  Object.assign(get("department"), {
    type: "text",
    label: { vi: "Phòng ban người tạo", en: "Creator department" },
    defaultValueSource: "currentUser.department",
    readOnly: true,
    options: [],
  });
  const profile = (
    key: string,
    type: FormField["type"],
    vi: string,
    en: string,
    source: FormField["defaultValueSource"],
  ): FormField => ({
    id: `expense-connected-${key}`,
    key,
    type,
    label: { vi, en },
    required: false,
    options: [],
    readOnly: true,
    defaultValueSource: source,
  });
  get("general_layout").children!.push(
    profile(
      "requester_email",
      "email",
      "Email người tạo",
      "Creator email",
      "currentUser.email",
    ),
    profile(
      "requester_employee_code",
      "text",
      "Mã nhân viên",
      "Employee code",
      "currentUser.employeeCode",
    ),
    profile(
      "requester_position",
      "text",
      "Chức danh",
      "Job title",
      "currentUser.position",
    ),
  );
  get("beneficiary_layout").children!.unshift({
    id: "expense-connected-vendor",
    key: "vendor_id",
    type: "select",
    label: { vi: "Nhà cung cấp từ Master Data", en: "Vendor from Master Data" },
    required: false,
    options: [],
    dataSource: {
      provider: "master.vendor",
      valueField: "code",
      labelField: "name",
    },
    help: {
      vi: "Chọn nếu thanh toán cho nhà cung cấp đã có trong danh mục. Chỉ lưu mã nhà cung cấp; kiểm tra và nhập riêng tên thụ hưởng, tài khoản, ngân hàng.",
      en: "Select an existing catalog vendor when applicable. Stores only the vendor key; verify and enter beneficiary name, account and bank separately.",
    },
  });
  return form;
}
