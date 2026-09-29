import {
  TELLER_OCR_STATUS,
} from "./tellerOcrAdapter.js";


function createId(prefix) {
  const random =
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID().slice(0, 10)
      : Math.random()
          .toString(36)
          .slice(2, 12);

  return (
    `${prefix}_${Date.now()}_${random}`
  );
}


export function normalizeTellerExtractedField({
  field_id,
  value,
  confidence = null,
  source = "ocr",
}) {
  return {
    field_id,
    value,

    provenance: {
      source,

      confidence:
        confidence === null
          ? null
          : Number(confidence),

      verified:
        false,

      verified_by:
        null,

      verified_at:
        null,
    },
  };
}


export function createTellerCaptureReview({
  metadata,
  fingerprint,
  duplicate = false,
  classification,
}) {
  return {
    capture_id:
      createId("teller_capture"),

    metadata,

    fingerprint,

    duplicate,

    classification,

    confirmed_document_type:
      "",

    document_type_reviewed:
      false,

    human_verified:
      false,

    reviewer_role:
      "",

    reviewed_at:
      null,

    ocr: {
      status:
        TELLER_OCR_STATUS.NOT_CONNECTED,

      provider:
        null,

      extracted_fields:
        [],
    },

    raw_file_persisted:
      false,

    uploaded:
      false,

    tower_transport_connected:
      false,

    vault_storage_connected:
      false,
  };
}


export function reviewTellerCaptureDocumentType(
  review,
  {
    document_type,
    reviewer_role,
  }
) {
  return {
    ...review,

    confirmed_document_type:
      document_type,

    document_type_reviewed:
      true,

    human_verified:
      true,

    reviewer_role:
      String(
        reviewer_role || ""
      ),

    reviewed_at:
      new Date().toISOString(),
  };
}


export function canPrepareTellerCapture(
  review
) {
  return Boolean(
    review &&
    review.metadata &&
    review.fingerprint &&
    !review.duplicate &&
    review.document_type_reviewed &&
    review.human_verified &&
    review.confirmed_document_type
  );
}


export function buildPreparedTellerCapture(
  review,
  formSuggestion = null
) {
  if (!canPrepareTellerCapture(review)) {
    throw new Error(
      "Capture requires human document-type review before it can be prepared."
    );
  }

  return Object.freeze({
    capture_id:
      review.capture_id,

    metadata:
      {
        ...review.metadata,
      },

    fingerprint:
      review.fingerprint,

    duplicate:
      false,

    classification:
      {
        ...review.classification,
      },

    confirmed_document_type:
      review.confirmed_document_type,

    human_verified:
      true,

    reviewer_role:
      review.reviewer_role,

    reviewed_at:
      review.reviewed_at,

    ocr: {
      status:
        TELLER_OCR_STATUS.NOT_CONNECTED,

      provider:
        null,

      extracted_fields:
        [],
    },

    form_suggestion:
      formSuggestion,

    persistence: {
      mode:
        "session_memory_only",

      raw_file_persisted:
        false,

      production_record_saved:
        false,
    },

    transport: {
      uploaded:
        false,

      tower_connected:
        false,

      vault_connected:
        false,
    },
  });
}
