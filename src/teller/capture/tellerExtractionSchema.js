import {
  TELLER_DOCUMENT_TYPES,
} from "./tellerCaptureTypes.js";


export const TELLER_EXTRACTION_VERSION =
  "1.0.0";


export const TELLER_EXTRACTION_DECISIONS =
  Object.freeze({
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
  });


export const TELLER_CONFIDENCE_LEVELS =
  Object.freeze({
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    UNKNOWN: "unknown",
  });


export const TELLER_FORBIDDEN_EXTRACTED_FIELDS =
  Object.freeze([
    "ssn",
    "social_security_number",
    "tin",
    "taxpayer_identification_number",
    "routing_number",
    "bank_routing_number",
    "account_number",
    "bank_account_number",
    "card_number",
    "credit_card_number",
    "cvv",
    "pin",
    "password",
    "document_number",
    "passport_number",
    "drivers_license_number",
  ]);


export const TELLER_DOCUMENT_EXTRACTION_FIELDS =
  Object.freeze({

    [TELLER_DOCUMENT_TYPES.INVOICE]: [
      {
        extraction_key: "vendor_name",
        label: "Vendor",
        target_field: "vendor_name",
      },
      {
        extraction_key: "invoice_number",
        label: "Invoice number",
        target_field: "invoice_number",
      },
      {
        extraction_key: "invoice_date",
        label: "Invoice date",
        target_field: "invoice_date",
      },
      {
        extraction_key: "due_date",
        label: "Due date",
        target_field: "due_date",
      },
      {
        extraction_key: "subtotal",
        label: "Subtotal",
        target_field: "subtotal",
      },
      {
        extraction_key: "tax",
        label: "Tax",
        target_field: "tax",
      },
      {
        extraction_key: "total",
        label: "Total",
        target_field: "total",
      },
      {
        extraction_key: "description",
        label: "Description",
        target_field: "description",
      },
    ],


    [TELLER_DOCUMENT_TYPES.RECEIPT]: [
      {
        extraction_key: "merchant",
        label: "Merchant",
        target_field: "merchant",
      },
      {
        extraction_key: "expense_date",
        label: "Expense date",
        target_field: "expense_date",
      },
      {
        extraction_key: "amount",
        label: "Amount",
        target_field: "amount",
      },
      {
        extraction_key: "business_purpose",
        label: "Business purpose",
        target_field: "business_purpose",
      },
    ],


    [TELLER_DOCUMENT_TYPES.VENDOR_DOCUMENT]: [
      {
        extraction_key: "vendor_name",
        label: "Vendor / business name",
        target_field: "vendor_name",
      },
      {
        extraction_key: "contact_name",
        label: "Contact name",
        target_field: "contact_name",
      },
      {
        extraction_key: "email",
        label: "Email",
        target_field: "email",
      },
      {
        extraction_key: "phone",
        label: "Phone",
        target_field: "phone",
      },
    ],


    [TELLER_DOCUMENT_TYPES.EMPLOYEE_DOCUMENT]: [
      {
        extraction_key: "employee_name",
        label: "Employee name",
        target_field: "employee_name",
      },
    ],


    [TELLER_DOCUMENT_TYPES.TAX_DOCUMENT]: [
      {
        extraction_key: "employee_name",
        label: "Employee name",
        target_field: "employee_name",
      },
    ],


    [TELLER_DOCUMENT_TYPES.PAYMENT_PROOF]: [
      {
        extraction_key: "payment_reference",
        label: "Payment reference",
        target_field: "payment_reference",
      },
      {
        extraction_key: "payee",
        label: "Payee",
        target_field: "payee",
      },
      {
        extraction_key: "amount",
        label: "Amount",
        target_field: "amount",
      },
    ],

  });


export function getTellerExtractableFields(
  documentType
) {
  return [
    ...(
      TELLER_DOCUMENT_EXTRACTION_FIELDS[
        documentType
      ] || []
    ),
  ];
}


export function isForbiddenTellerExtractedField(
  fieldId
) {
  const normalized =
    String(fieldId || "")
      .trim()
      .toLowerCase();

  return (
    TELLER_FORBIDDEN_EXTRACTED_FIELDS
      .includes(normalized)
  );
}


export function tellerConfidenceLevel(
  confidence
) {
  const value =
    Number(confidence);

  if (!Number.isFinite(value)) {
    return TELLER_CONFIDENCE_LEVELS.UNKNOWN;
  }

  if (value >= 0.90) {
    return TELLER_CONFIDENCE_LEVELS.HIGH;
  }

  if (value >= 0.70) {
    return TELLER_CONFIDENCE_LEVELS.MEDIUM;
  }

  return TELLER_CONFIDENCE_LEVELS.LOW;
}
