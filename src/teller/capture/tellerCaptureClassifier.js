import {
  TELLER_DOCUMENT_TYPES,
} from "./tellerCaptureTypes.js";


const RULES = Object.freeze([
  {
    type:
      TELLER_DOCUMENT_TYPES.INVOICE,

    confidence:
      0.62,

    tokens: [
      "invoice",
      "inv_",
      "inv-",
      "bill_",
      "bill-",
    ],
  },

  {
    type:
      TELLER_DOCUMENT_TYPES.RECEIPT,

    confidence:
      0.62,

    tokens: [
      "receipt",
      "purchase",
      "expense",
    ],
  },

  {
    type:
      TELLER_DOCUMENT_TYPES.VENDOR_DOCUMENT,

    confidence:
      0.58,

    tokens: [
      "w9",
      "w-9",
      "vendor",
      "supplier",
    ],
  },

  {
    type:
      TELLER_DOCUMENT_TYPES.TAX_DOCUMENT,

    confidence:
      0.58,

    tokens: [
      "w2",
      "w-2",
      "w4",
      "w-4",
      "tax",
      "withholding",
    ],
  },

  {
    type:
      TELLER_DOCUMENT_TYPES.EMPLOYEE_DOCUMENT,

    confidence:
      0.55,

    tokens: [
      "i9",
      "i-9",
      "employee",
      "handbook",
      "paystub",
      "pay_stub",
    ],
  },

  {
    type:
      TELLER_DOCUMENT_TYPES.PAYMENT_PROOF,

    confidence:
      0.52,

    tokens: [
      "payment",
      "proof",
      "transaction",
      "confirmation",
    ],
  },
]);


export function classifyTellerCapture(
  metadata,
  requestedType =
    TELLER_DOCUMENT_TYPES.AUTO
) {
  if (
    requestedType &&
    requestedType !==
      TELLER_DOCUMENT_TYPES.AUTO
  ) {
    return {
      suggested_document_type:
        requestedType,

      confidence:
        1,

      source:
        "user_selected",

      human_review_required:
        true,
    };
  }


  const name =
    String(
      metadata?.name || ""
    ).toLowerCase();


  const matched =
    RULES.find(
      (rule) =>
        rule.tokens.some(
          (token) =>
            name.includes(token)
        )
    );


  if (matched) {
    return {
      suggested_document_type:
        matched.type,

      confidence:
        matched.confidence,

      source:
        "filename_heuristic",

      human_review_required:
        true,
    };
  }


  return {
    suggested_document_type:
      TELLER_DOCUMENT_TYPES.OTHER,

    confidence:
      0.25,

    source:
      "unknown",

    human_review_required:
      true,
  };
}


export function tellerClassificationConfidenceLabel(
  confidence
) {
  const value =
    Number(confidence || 0);

  if (value >= 0.9) {
    return "User selected";
  }

  if (value >= 0.6) {
    return "Possible match";
  }

  if (value >= 0.45) {
    return "Low-confidence suggestion";
  }

  return "Needs manual review";
}
