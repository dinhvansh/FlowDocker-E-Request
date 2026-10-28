export const appModules = [
  {
    id: "identity",
    label: "Identity & Organization",
    description: "Đăng nhập, người dùng và cơ cấu phòng ban.",
    required: true,
    available: false,
  },
  {
    id: "permissions",
    label: "Permission Builder",
    description: "Quy định ai được xem hoặc thực hiện từng thao tác.",
    required: true,
    available: true,
  },
  {
    id: "master",
    label: "Master Data Builder",
    description:
      "Thiết kế danh mục dùng trong app: loại chi phí, loại tài sản, vị trí…",
    required: false,
    available: true,
  },
  {
    id: "connections",
    label: "Connection Manager",
    description: "Quản lý cấu hình kết nối đến hệ thống bên ngoài.",
    required: false,
    available: true,
  },
  {
    id: "flows",
    label: "Data Flow Studio",
    description: "Thiết kế luồng lấy, chuyển đổi và đồng bộ dữ liệu.",
    required: false,
    available: true,
  },
  {
    id: "forms",
    label: "Form & Approval Studios",
    description: "Thiết kế biểu mẫu và các bước phê duyệt yêu cầu.",
    required: false,
    available: false,
  },
] as const;
export type AppModuleId = (typeof appModules)[number]["id"];
export interface AppDraft {
  appId: string;
  title: string;
  version: string;
  modules: AppModuleId[];
  status: "DRAFT";
}
export function validateAppDraft(
  draft: AppDraft,
  existingIds: string[] = [],
): string[] {
  const errors: string[] = [];
  if (!/^flowdocker\.[a-z][a-z0-9-]*$/.test(draft.appId))
    errors.push("App ID cần dạng flowdocker.my-app.");
  if (existingIds.includes(draft.appId)) errors.push("App ID đã tồn tại.");
  if (!draft.title.trim()) errors.push("Tên ứng dụng là bắt buộc.");
  if (!/^\d+\.\d+\.\d+$/.test(draft.version))
    errors.push("Version cần dạng 0.1.0.");
  for (const module of appModules) {
    if (module.required && !draft.modules.includes(module.id))
      errors.push(`Thiếu module ${module.label}.`);
  }
  if (
    draft.modules.some((id) => !appModules.some((module) => module.id === id))
  )
    errors.push("Module không được hỗ trợ.");
  if (new Set(draft.modules).size !== draft.modules.length)
    errors.push("Module bị trùng.");
  if (
    draft.modules.includes("flows") &&
    (!draft.modules.includes("connections") ||
      !draft.modules.includes("master"))
  )
    errors.push("Flow Studio cần Connection Manager và Master Data Builder.");
  return errors;
}
export function isAppDraft(value: unknown): value is AppDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as AppDraft;
  return (
    typeof draft.appId === "string" &&
    typeof draft.title === "string" &&
    typeof draft.version === "string" &&
    draft.status === "DRAFT" &&
    Array.isArray(draft.modules) &&
    validateAppDraft(draft).length === 0
  );
}
