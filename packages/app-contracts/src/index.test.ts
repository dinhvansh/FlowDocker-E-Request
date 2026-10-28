import { describe, expect, it } from "vitest";
import {
  evaluateAccess,
  validateEntity,
  type Role,
  type MasterEntity,
} from "./index";

const role: Role = {
  id: "r",
  name: "Manager",
  description: "",
  scope: "ASSIGNED_TASK",
  grants: { "task.approval": ["APPROVE"] },
  fieldRules: {},
  version: 1,
  status: "DRAFT",
};
const context = {
  actorActive: true,
  sameTenant: true,
  sameCompany: true,
  sameDepartment: true,
  isOwner: false,
  assignedActiveTask: true,
};
describe("mô phỏng quyền mặc định từ chối", () => {
  it("chỉ ALLOW khi có quyền và tác vụ hiện hành", () => {
    expect(
      evaluateAccess(role, "task.approval", "APPROVE", context).effect,
    ).toBe("ALLOW");
    expect(
      evaluateAccess(role, "task.approval", "APPROVE", {
        ...context,
        assignedActiveTask: false,
      }).effect,
    ).toBe("DENY");
  });
  it("từ chối khác tenant và hành động chưa đăng ký", () => {
    expect(
      evaluateAccess(role, "task.approval", "APPROVE", {
        ...context,
        sameTenant: false,
      }).effect,
    ).toBe("DENY");
    expect(
      evaluateAccess(role, "task.approval", "EXPORT", context).effect,
    ).toBe("DENY");
  });
});
describe("kiểm tra schema bản nháp", () => {
  it("phát hiện mã trường trùng và tham chiếu thiếu target", () => {
    const entity: MasterEntity = {
      id: "x",
      key: "valid_key",
      name: "Test",
      kind: "LOCAL_CATALOG",
      sourceOwner: "Local",
      businessOwner: "IT",
      scope: "TENANT",
      version: 1,
      status: "DRAFT",
      records: [],
      fields: [
        {
          id: "1",
          key: "code",
          label: "Code",
          type: "text",
          required: true,
          classification: "INTERNAL",
        },
        {
          id: "2",
          key: "code",
          label: "Reference",
          type: "reference",
          required: false,
          classification: "INTERNAL",
        },
      ],
    };
    expect(validateEntity(entity)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("bị trùng"),
        expect.stringContaining("tham chiếu"),
      ]),
    );
  });
});
