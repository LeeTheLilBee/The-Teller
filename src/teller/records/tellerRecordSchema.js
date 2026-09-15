export const TELLER_RECORD_VERSION =
  "1.0.0";


export const TELLER_RECORD_STATUS =
  Object.freeze({
    PREPARED:
      "prepared",

    AWAITING_REVIEW:
      "awaiting_review",

    NEEDS_CORRECTION:
      "needs_correction",

    APPROVED:
      "approved",

    CLOSED:
      "closed",

    VOID:
      "void",
  });


export const TELLER_RECORD_SOURCE =
  Object.freeze({
    FORM:
      "form",

    CAPTURE:
      "capture",

    IMPORT:
      "import",

    SYSTEM:
      "system",
  });


export const TELLER_FORBIDDEN_RECORD_KEYS =
  Object.freeze([
    "ssn",
    "social_security_number",
    "tin",
    "taxpayer_identification_number",
    "ein",
    "routing_number",
    "bank_routing_number",
    "account_number",
    "bank_account_number",
    "card_number",
    "credit_card_number",
    "cvv",
    "pin",
    "password",
    "passport_number",
    "drivers_license_number",
    "driver_license_number",
    "document_number",
  ]);


function normalizedKey(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}


export function isForbiddenTellerRecordKey(
  key
) {
  return (
    TELLER_FORBIDDEN_RECORD_KEYS
      .includes(
        normalizedKey(key)
      )
  );
}


export function sanitizeTellerRecordPayload(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }


  if (Array.isArray(value)) {
    return value
      .map(
        (item) =>
          sanitizeTellerRecordPayload(
            item
          )
      );
  }


  if (
    typeof value === "object"
  ) {
    const clean = {};

    Object.entries(value)
      .forEach(
        ([key, item]) => {
          if (
            isForbiddenTellerRecordKey(
              key
            )
          ) {
            return;
          }

          clean[key] =
            sanitizeTellerRecordPayload(
              item
            );
        }
      );

    return clean;
  }


  return value;
}


export function humanizeTellerRecordToken(
  value
) {
  return String(
    value || ""
  )
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


export function createTellerRecordEnvelope({
  record_id,
  source,
  source_id,
  form_id = "",
  workflow_type = "",
  category = "",
  title = "",
  business_key = "",
  actor_role = "",
  payload = {},
  created_at = null,
}) {
  if (!record_id) {
    throw new Error(
      "Teller record_id is required."
    );
  }


  const safePayload =
    sanitizeTellerRecordPayload(
      payload
    );


  const timestamp =
    created_at ||
    new Date().toISOString();


  return Object.freeze({
    record_version:
      TELLER_RECORD_VERSION,

    record_id,

    source,

    source_id,

    form_id,

    workflow_type,

    category,

    title:
      title ||
      humanizeTellerRecordToken(
        form_id ||
        workflow_type ||
        "Teller record"
      ),

    business_key:
      String(
        business_key || ""
      ),

    actor_role:
      String(
        actor_role || ""
      ),

    record_status:
      TELLER_RECORD_STATUS.PREPARED,

    payload:
      safePayload,

    search_projection: {
      title:
        title ||
        humanizeTellerRecordToken(
          form_id ||
          workflow_type ||
          "Teller record"
        ),

      form_id,

      workflow_type,

      category,

      business_key:
        String(
          business_key || ""
        ),

      record_status:
        TELLER_RECORD_STATUS.PREPARED,
    },

    audit_history: [
      {
        event:
          "record_prepared",

        at:
          timestamp,

        actor_role:
          String(
            actor_role || ""
          ),
      },
    ],

    persistence: {
      session_memory:
        true,

      production_repository_connected:
        false,

      production_persisted:
        false,
    },

    created_at:
      timestamp,

    updated_at:
      timestamp,
  });
}
