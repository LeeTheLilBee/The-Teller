import {
  TELLER_EXTRACTION_DECISIONS,
  TELLER_CONFIDENCE_LEVELS,
} from "./tellerExtractionSchema.js";


export function tellerExtractionNeedsAttention(
  field
) {
  return (
    field?.confidence_level ===
      TELLER_CONFIDENCE_LEVELS.LOW ||
    field?.confidence_level ===
      TELLER_CONFIDENCE_LEVELS.UNKNOWN
  );
}


export function tellerExtractionConfidenceCopy(
  field
) {
  if (
    field?.confidence_level ===
    TELLER_CONFIDENCE_LEVELS.HIGH
  ) {
    return "High-confidence suggestion";
  }

  if (
    field?.confidence_level ===
    TELLER_CONFIDENCE_LEVELS.MEDIUM
  ) {
    return "Review carefully";
  }

  if (
    field?.confidence_level ===
    TELLER_CONFIDENCE_LEVELS.LOW
  ) {
    return "Low confidence — correction may be needed";
  }

  return "Confidence unavailable — verify manually";
}


export function updateTellerExtractionValue(
  field,
  value
) {
  return {
    ...field,

    reviewed_value:
      value === null ||
      value === undefined
        ? ""
        : String(value),

    decision:
      TELLER_EXTRACTION_DECISIONS.PENDING,

    verified:
      false,

    verified_by:
      "",

    verified_at:
      null,
  };
}


export function acceptTellerExtractionField(
  field,
  reviewerRole
) {
  if (
    !String(
      field?.reviewed_value || ""
    ).trim()
  ) {
    throw new Error(
      "A blank extracted value cannot be accepted."
    );
  }


  return {
    ...field,

    decision:
      TELLER_EXTRACTION_DECISIONS.ACCEPTED,

    verified:
      true,

    verified_by:
      String(
        reviewerRole || ""
      ),

    verified_at:
      new Date().toISOString(),
  };
}


export function rejectTellerExtractionField(
  field,
  reviewerRole
) {
  return {
    ...field,

    decision:
      TELLER_EXTRACTION_DECISIONS.REJECTED,

    verified:
      true,

    verified_by:
      String(
        reviewerRole || ""
      ),

    verified_at:
      new Date().toISOString(),
  };
}


export function resetTellerExtractionDecision(
  field
) {
  return {
    ...field,

    decision:
      TELLER_EXTRACTION_DECISIONS.PENDING,

    verified:
      false,

    verified_by:
      "",

    verified_at:
      null,
  };
}


export function getTellerExtractionReviewSummary(
  fields = []
) {
  const accepted =
    fields.filter(
      (field) =>
        field.decision ===
        TELLER_EXTRACTION_DECISIONS.ACCEPTED &&
        field.verified
    );


  const rejected =
    fields.filter(
      (field) =>
        field.decision ===
        TELLER_EXTRACTION_DECISIONS.REJECTED &&
        field.verified
    );


  const pending =
    fields.filter(
      (field) =>
        field.decision ===
        TELLER_EXTRACTION_DECISIONS.PENDING ||
        !field.verified
    );


  return {
    total:
      fields.length,

    accepted:
      accepted.length,

    rejected:
      rejected.length,

    pending:
      pending.length,

    complete:
      fields.length > 0 &&
      pending.length === 0,
  };
}
