export const TELLER_CAPTURE_VERSION = "1.0.0";


export const TELLER_CAPTURE_SOURCES =
  Object.freeze({
    CAMERA: "camera",
    IMAGE_UPLOAD: "image_upload",
    PDF_UPLOAD: "pdf_upload",
  });


export const TELLER_DOCUMENT_TYPES =
  Object.freeze({
    AUTO: "auto_detect",
    INVOICE: "invoice",
    RECEIPT: "receipt",
    EMPLOYEE_DOCUMENT: "employee_document",
    TAX_DOCUMENT: "tax_document",
    VENDOR_DOCUMENT: "vendor_document",
    PAYMENT_PROOF: "payment_proof",
    OTHER: "other",
  });


export const TELLER_CAPTURE_MIME_TYPES =
  Object.freeze([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);


export const TELLER_CAPTURE_MAX_BYTES =
  25 * 1024 * 1024;


export const TELLER_DOCUMENT_TYPE_OPTIONS =
  Object.freeze([
    {
      value: TELLER_DOCUMENT_TYPES.AUTO,
      label: "Let Teller suggest the document type",
    },
    {
      value: TELLER_DOCUMENT_TYPES.INVOICE,
      label: "Invoice",
    },
    {
      value: TELLER_DOCUMENT_TYPES.RECEIPT,
      label: "Receipt",
    },
    {
      value:
        TELLER_DOCUMENT_TYPES.EMPLOYEE_DOCUMENT,
      label: "Employee document",
    },
    {
      value:
        TELLER_DOCUMENT_TYPES.TAX_DOCUMENT,
      label: "Tax document",
    },
    {
      value:
        TELLER_DOCUMENT_TYPES.VENDOR_DOCUMENT,
      label: "Vendor document",
    },
    {
      value:
        TELLER_DOCUMENT_TYPES.PAYMENT_PROOF,
      label: "Payment proof",
    },
    {
      value: TELLER_DOCUMENT_TYPES.OTHER,
      label: "Other",
    },
  ]);


const EMPLOYEE_ALLOWED =
  new Set([
    TELLER_DOCUMENT_TYPES.AUTO,
    TELLER_DOCUMENT_TYPES.RECEIPT,
    TELLER_DOCUMENT_TYPES.EMPLOYEE_DOCUMENT,
    TELLER_DOCUMENT_TYPES.TAX_DOCUMENT,
    TELLER_DOCUMENT_TYPES.PAYMENT_PROOF,
    TELLER_DOCUMENT_TYPES.OTHER,
  ]);


export function listTellerDocumentTypesForRole(
  role
) {
  const normalized =
    String(role || "")
      .trim()
      .toLowerCase();

  if (normalized === "employee") {
    return TELLER_DOCUMENT_TYPE_OPTIONS
      .filter(
        (item) =>
          EMPLOYEE_ALLOWED.has(
            item.value
          )
      );
  }

  if (
    normalized === "manager" ||
    normalized === "owner"
  ) {
    return [
      ...TELLER_DOCUMENT_TYPE_OPTIONS,
    ];
  }

  return [];
}


export function isTellerDocumentType(value) {
  return Object.values(
    TELLER_DOCUMENT_TYPES
  ).includes(value);
}
