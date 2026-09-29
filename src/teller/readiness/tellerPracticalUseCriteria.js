export const TELLER_CERTIFICATION_VERSION =
  "1.0.0";


export const TELLER_CERTIFICATION_STATE =
  Object.freeze({
    CERTIFIED:
      "certified",

    BLOCKED_PENDING_INTEGRATION:
      "blocked_pending_integration",

    NOT_AUTHORIZED:
      "not_authorized",
  });


export const TELLER_PRACTICAL_USE_CRITERIA =
  Object.freeze({

    session_boundary: {
      pack:
        "GP591",

      state:
        TELLER_CERTIFICATION_STATE.CERTIFIED,

      criteria: [
        "Tower-issued Teller session required",
        "employee / manager / owner role boundary present",
        "no local pretend Tower workspace",
      ],
    },


    forms_and_intake: {
      pack:
        "GP592",

      state:
        TELLER_CERTIFICATION_STATE.CERTIFIED,

      criteria: [
        "canonical Forms Engine present",
        "role-filtered forms present",
        "People intake present",
        "Payroll + Payment intake present",
        "Vendor + Document intake present",
        "prepared workflow packets remain workflow-safe",
      ],
    },


    practical_business_lanes: {
      pack:
        "GP593",

      state:
        TELLER_CERTIFICATION_STATE.CERTIFIED,

      criteria: [
        "people / employment intake",
        "payroll / payment intake",
        "vendor intake",
        "document request / replacement / verification",
        "invoice and reimbursement workflows",
      ],
    },


    capture_and_autofill: {
      pack:
        "GP594",

      state:
        TELLER_CERTIFICATION_STATE.CERTIFIED,

      criteria: [
        "camera / image / PDF intake",
        "file validation",
        "local SHA-256 duplicate fingerprint",
        "human document-type review",
        "provider-neutral OCR boundary",
        "human field verification",
        "verified autofill packet",
      ],
    },


    records_and_search: {
      pack:
        "GP595",

      state:
        TELLER_CERTIFICATION_STATE.CERTIFIED,

      criteria: [
        "canonical Teller record envelope",
        "forbidden credential sanitizer",
        "session records searchable",
        "safe metadata-only search",
        "category / status / business filters",
      ],
    },


    validation_and_recovery: {
      pack:
        "GP596",

      state:
        TELLER_CERTIFICATION_STATE.CERTIFIED,

      criteria: [
        "record validation",
        "duplicate workflow guard",
        "correction workflow",
        "session workflow lock",
        "in-memory recovery point",
        "reliability event tracking",
      ],
    },


    security_boundaries: {
      pack:
        "GP597",

      state:
        TELLER_CERTIFICATION_STATE.CERTIFIED,

      criteria: [
        "raw SSN/TIN blocked from current practical forms",
        "raw bank/routing values blocked from current practical forms",
        "direct Vault access blocked",
        "Tower permission authority preserved",
        "no browser production-record database",
        "no fake money movement",
      ],
    },


    production_integrations: {
      pack:
        "GP598",

      state:
        TELLER_CERTIFICATION_STATE.BLOCKED_PENDING_INTEGRATION,

      blockers: [
        "production record repository",
        "production OCR provider",
        "payroll processor",
        "payment processor",
        "real money movement",
        "reload-safe persistence",
        "Tower transport/API",
        "Tower-mediated Vault transport/storage",
      ],
    },


    deployment: {
      pack:
        "GP598",

      state:
        TELLER_CERTIFICATION_STATE.NOT_AUTHORIZED,

      blockers: [
        "no deployment authorization in this certification pack",
      ],
    },

  });
