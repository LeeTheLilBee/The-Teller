import {
  getTellerExtractableFields,
  isForbiddenTellerExtractedField,
  tellerConfidenceLevel,
} from "./tellerExtractionSchema.js";


function clean(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}


function numberOrNull(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


export function normalizeTellerExtractionField(
  rawField,
  documentType
) {
  if (
    !rawField ||
    typeof rawField !== "object"
  ) {
    return null;
  }


  const fieldId =
    clean(
      rawField.field_id ||
      rawField.key ||
      rawField.name
    );


  if (
    !fieldId ||
    isForbiddenTellerExtractedField(
      fieldId
    )
  ) {
    return null;
  }


  const allowed =
    getTellerExtractableFields(
      documentType
    ).find(
      (definition) =>
        definition.extraction_key ===
        fieldId
    );


  if (!allowed) {
    return null;
  }


  const confidence =
    numberOrNull(
      rawField.confidence
    );


  return {
    extraction_key:
      fieldId,

    label:
      allowed.label,

    target_field:
      allowed.target_field,

    original_value:
      clean(
        rawField.value
      ),

    reviewed_value:
      clean(
        rawField.value
      ),

    confidence,

    confidence_level:
      tellerConfidenceLevel(
        confidence
      ),

    provider_source:
      clean(
        rawField.source ||
        "ocr_provider"
      ),

    decision:
      "pending",

    verified:
      false,

    verified_by:
      "",

    verified_at:
      null,
  };
}


export function normalizeTellerExtractionResult({
  document_type,
  provider_id = "",
  fields = [],
}) {
  const normalized =
    (fields || [])
      .map(
        (field) =>
          normalizeTellerExtractionField(
            field,
            document_type
          )
      )
      .filter(Boolean);


  return {
    document_type,

    provider_id:
      String(provider_id || ""),

    fields:
      normalized,

    field_count:
      normalized.length,

    human_review_required:
      true,

    auto_accept_allowed:
      false,

    raw_text_retained:
      false,
  };
}
