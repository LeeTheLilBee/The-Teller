import {
  TELLER_EXTRACTION_DECISIONS,
  isForbiddenTellerExtractedField,
} from "./tellerExtractionSchema.js";

import {
  getTellerExtractionReviewSummary,
} from "./tellerExtractionVerification.js";


function createId(prefix) {
  const random =
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID().slice(0, 10)
      : Math.random()
          .toString(36)
          .slice(2, 12);

  return `${prefix}_${Date.now()}_${random}`;
}


export function buildVerifiedTellerAutofillPacket({
  capture_id,
  fingerprint,
  document_type,
  form,
  mapped_fields = [],
  reviewer_role,
}) {
  if (!form?.form_id) {
    throw new Error(
      "A role-safe target form is required."
    );
  }


  const summary =
    getTellerExtractionReviewSummary(
      mapped_fields
    );


  if (!summary.complete) {
    throw new Error(
      "Every mapped extraction field must be accepted or rejected before autofill."
    );
  }


  const accepted =
    mapped_fields.filter(
      (field) =>
        field.decision ===
          TELLER_EXTRACTION_DECISIONS.ACCEPTED &&
        field.verified
    );


  const values = {};
  const provenance = {};


  accepted.forEach(
    (field) => {
      if (
        isForbiddenTellerExtractedField(
          field.target_field
        )
      ) {
        return;
      }


      values[
        field.target_field
      ] =
        field.reviewed_value;


      provenance[
        field.target_field
      ] = {
        source:
          "verified_document_extraction",

        capture_id,

        fingerprint,

        document_type,

        extraction_key:
          field.extraction_key,

        original_value:
          field.original_value,

        reviewed_value:
          field.reviewed_value,

        confidence:
          field.confidence,

        confidence_level:
          field.confidence_level,

        reviewer_role:
          reviewer_role,

        verified:
          true,

        verified_at:
          field.verified_at,
      };
    }
  );


  return Object.freeze({
    handoff_id:
      createId(
        "teller_verified_autofill"
      ),

    capture_id,

    fingerprint,

    document_type,

    form_id:
      form.form_id,

    values,

    provenance,

    accepted_field_count:
      Object.keys(values).length,

    rejected_field_count:
      summary.rejected,

    human_verified:
      true,

    auto_submitted:
      false,

    form_submission_created:
      false,

    file_attached:
      false,

    raw_file_included:
      false,

    workflow_transport_connected:
      false,

    created_at:
      new Date().toISOString(),
  });
}


export function isValidTellerAutofillHandoff(
  handoff
) {
  return Boolean(
    handoff &&
    handoff.handoff_id &&
    handoff.form_id &&
    handoff.human_verified === true &&
    handoff.auto_submitted === false &&
    handoff.file_attached === false &&
    handoff.raw_file_included === false
  );
}
