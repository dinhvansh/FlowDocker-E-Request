import { expect, it } from "vitest";
import {
  flattenFields,
  prepareValues,
  validateFormDefinition,
  validatePreview,
  importFormDefinition,
  exportFormDefinition,
} from "@flowdocker/form-builder";
import { createConnectedExpenseTemplate } from "./connected-expense-template";
import { createExpenseRequestTemplate } from "./expense-request-template";
import { demoFormRuntimeContext, demoCurrentPersonId } from "./demo-profile";
import { formCatalog } from "./form-drafts";
import { masterFormSources } from "./master-form-sources";
import { seedEntities } from "./mock";
import { organizationForm } from "./organization";

it("connects the payment template to creator context and master keys, preserving invoice calculations", async () => {
  const original = createExpenseRequestTemplate();
  const form = createConnectedExpenseTemplate();
  expect(validateFormDefinition(form)).toEqual([]);
  expect(importFormDefinition(exportFormDefinition(form))).toEqual(form);
  const fields = flattenFields(form.fields);
  const vendor = fields.find((f) => f.key === "vendor_id")!;
  const choices = await masterFormSources(seedEntities).providers[
    vendor.dataSource!.provider
  ]({
    query: "",
    dependency: undefined,
    signal: new AbortController().signal,
    ...vendor.dataSource,
  });
  expect(choices).toEqual([
    {
      value: "V-001",
      label: { vi: "Nhà cung cấp mẫu A", en: "Nhà cung cấp mẫu A" },
    },
  ]);
  const input = {
    vendor_id: "V-001",
    beneficiary_name: "Synthetic vendor",
    account_number: "SAMPLE",
    bank_name: "Demo bank",
    transfer_description: "Synthetic only",
    lines: [
      {
        invoice_date: "2026-01-15",
        invoice_ref: "SAMPLE-001",
        description: "Synthetic invoice",
        expense_type: "software",
        amount: "1200000.25",
      },
    ],
  };
  const values = prepareValues(form, input, {}, demoFormRuntimeContext);
  expect(values).toMatchObject({
    requester: demoCurrentPersonId,
    department: demoFormRuntimeContext.currentUser.department,
    requester_email: demoFormRuntimeContext.currentUser.email,
    total_payment: "1200000.25",
    vendor_id: "V-001",
  });
  expect(
    validatePreview(
      form,
      values,
      {},
      { requester: [demoCurrentPersonId], vendor_id: ["V-001"] },
      demoFormRuntimeContext,
    ),
  ).toEqual([]);
  expect(
    validatePreview(
      form,
      { ...values, lines: [{ amount: "-1" }] },
      {},
      {},
      demoFormRuntimeContext,
    ).length,
  ).toBeGreaterThan(0);
  expect(createExpenseRequestTemplate()).toEqual(original);
  expect(form.id).not.toBe(original.id);
  expect(vendor.options).toEqual([]);
});

it("keeps owner saved designs and demonstrates creator defaults in the organization form", () => {
  const saved = createConnectedExpenseTemplate();
  saved.title.vi = "Owner saved design";
  saved.fields = [];
  expect(formCatalog([saved]).find((f) => f.id === saved.id)).toBe(saved);
  const values = prepareValues(
    organizationForm,
    {},
    {},
    demoFormRuntimeContext,
  );
  expect(values).toMatchObject({
    requester: demoCurrentPersonId,
    creator_email: demoFormRuntimeContext.currentUser.email,
    creator_department: demoFormRuntimeContext.currentUser.department,
  });
  expect(
    prepareValues(
      organizationForm,
      { requester: "person_02" },
      {},
      demoFormRuntimeContext,
    ),
  ).toMatchObject({ ...values, requester: "person_02" });
});
