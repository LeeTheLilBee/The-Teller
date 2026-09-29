import {
  TELLER_DOCUMENT_TYPES,
} from "./tellerCaptureTypes.js";

import {
  getTellerFormDefinition,
} from "../forms/tellerFormRegistry.js";


const DOCUMENT_FORM_MAP =
  Object.freeze({
    [TELLER_DOCUMENT_TYPES.INVOICE]:
      "invoice_intake",

    [TELLER_DOCUMENT_TYPES.RECEIPT]:
      "reimbursement_request",

    [TELLER_DOCUMENT_TYPES.EMPLOYEE_DOCUMENT]:
      "employment_document_checklist",

    [TELLER_DOCUMENT_TYPES.TAX_DOCUMENT]:
      "employment_document_checklist",

    [TELLER_DOCUMENT_TYPES.VENDOR_DOCUMENT]:
      "vendor_setup_request",

    [TELLER_DOCUMENT_TYPES.PAYMENT_PROOF]:
      "payment_exception_request",
  });


export function getTellerCaptureFormSuggestion(
  documentType,
  role
) {
  const formId =
    DOCUMENT_FORM_MAP[
      documentType
    ];

  if (!formId) {
    return null;
  }

  const form =
    getTellerFormDefinition(
      formId
    );

  if (!form) {
    return null;
  }

  const normalizedRole =
    String(role || "")
      .trim()
      .toLowerCase();

  if (
    !form.allowed_roles.includes(
      normalizedRole
    )
  ) {
    return null;
  }

  return {
    form_id:
      form.form_id,

    title:
      form.title,

    short_title:
      form.short_title,

    workflow_type:
      form.workflow_type,

    category:
      form.category,

    autofill_applied:
      false,

    attachment_applied:
      false,
  };
}
