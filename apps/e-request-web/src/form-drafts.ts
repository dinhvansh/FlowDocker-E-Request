import {
  createShowcaseDefinition,
  createPaymentDefinition,
  isFormDefinition,
  type FormDefinition,
} from "@flowdocker/form-builder";
import { createExpenseRequestTemplate } from "./expense-request-template";
import { organizationForm } from "./organization";
export const formDraftStorageKey = "flowdocker.form-drafts.v1";
export const demoForms: FormDefinition[] = [
  {
    id: "demo-purchase-intake",
    title: { vi: "Đề nghị mua sắm · mẫu", en: "Purchase intake · sample" },
    version: 1,
    status: "DRAFT",
    fields: [
      {
        id: "purpose",
        key: "purpose",
        label: { vi: "Mục đích mua sắm", en: "Purchase purpose" },
        type: "textarea",
        required: true,
        options: [],
      },
      {
        id: "needed_on",
        key: "needed_on",
        label: { vi: "Ngày cần sử dụng", en: "Needed on" },
        type: "date",
        required: true,
        options: [],
      },
      {
        id: "category",
        key: "category",
        label: { vi: "Nhóm hàng", en: "Category" },
        type: "select",
        required: true,
        options: [
          {
            value: "office",
            label: { vi: "Văn phòng phẩm", en: "Office supplies" },
          },
          { value: "equipment", label: { vi: "Thiết bị", en: "Equipment" } },
        ],
      },
    ],
  },
  {
    id: "demo-equipment-intake",
    title: {
      vi: "Đề nghị thiết bị IT · mẫu",
      en: "IT equipment intake · sample",
    },
    version: 1,
    status: "DRAFT",
    fields: [
      {
        id: "equipment_name",
        key: "equipment_name",
        label: { vi: "Tên thiết bị", en: "Equipment name" },
        type: "text",
        required: true,
        options: [],
      },
      {
        id: "quantity",
        key: "quantity",
        label: { vi: "Số lượng tham khảo", en: "Reference quantity" },
        type: "number",
        required: true,
        options: [],
      },
      {
        id: "confirmed",
        key: "confirmed",
        label: { vi: "Đã kiểm tra nhu cầu", en: "Needs reviewed" },
        type: "checkbox",
        required: true,
        options: [],
      },
    ],
  },
  createShowcaseDefinition(),
  createPaymentDefinition(),
  createExpenseRequestTemplate(),
  organizationForm,
];
/** Saved edits take precedence; missing built-in examples remain discoverable without storage writes. */
export function formCatalog(saved: FormDefinition[]): FormDefinition[] {
  const ids = new Set(saved.map((form) => form.id));
  return [
    ...saved,
    ...structuredClone(demoForms.filter((form) => !ids.has(form.id))),
  ];
}
export function readFormDrafts(
  storage: Pick<Storage, "getItem">,
): FormDefinition[] {
  const raw = storage.getItem(formDraftStorageKey);
  if (raw === null) return structuredClone(demoForms);
  const parsed: unknown = JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    parsed.length > 100 ||
    !parsed.every(isFormDefinition) ||
    new Set(parsed.map((form) => form.id)).size !== parsed.length
  )
    throw new Error("Invalid form drafts");
  return parsed;
}
