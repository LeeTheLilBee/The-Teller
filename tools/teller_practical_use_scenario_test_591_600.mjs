import assert
  from "node:assert/strict";


import {
  TELLER_FORM_REGISTRY,
  listTellerFormsForRole,
} from "../src/teller/forms/tellerFormRegistry.js";


import {
  createTellerRecordEnvelope,
} from "../src/teller/records/tellerRecordSchema.js";


import {
  createUnconfiguredTellerRecordRepository,
} from "../src/teller/records/tellerRecordRepository.js";


import {
  searchTellerRecords,
} from "../src/teller/records/tellerRecordSearch.js";


import {
  validateTellerProductionRecord,
  validateTellerRecordSet,
} from "../src/teller/recovery/tellerProductionValidation.js";


import {
  buildTellerSubmissionFingerprint,
} from "../src/teller/recovery/tellerSubmissionGuard.js";


import {
  startTellerRecordCorrection,
  clearTellerRecordCorrection,
} from "../src/teller/recovery/tellerRecordCorrection.js";


import {
  lockTellerRecord,
  unlockTellerRecord,
  isTellerRecordLocked,
} from "../src/teller/recovery/tellerRecordLock.js";


import {
  createTellerRecoverySnapshot,
  restoreTellerRecoverySnapshot,
} from "../src/teller/recovery/tellerRecoverySnapshot.js";


import {
  createUnconfiguredTellerOcrAdapter,
} from "../src/teller/capture/tellerOcrAdapter.js";


import {
  getTellerCaptureFormSuggestion,
} from "../src/teller/capture/tellerCaptureMapping.js";


import {
  getTellerPracticalUseReadiness,
  getTellerIntegrationBlockers,
} from "../src/teller/readiness/tellerPracticalUseReadiness.js";


function ids(
  forms
) {
  return new Set(
    forms.map(
      (form) =>
        form.form_id
    )
  );
}


// ============================================================================================================
// ROLE / FORM CERTIFICATION
// ============================================================================================================

const employeeForms =
  listTellerFormsForRole(
    "employee"
  );


const managerForms =
  listTellerFormsForRole(
    "manager"
  );


const ownerForms =
  listTellerFormsForRole(
    "owner"
  );


assert.ok(
  employeeForms.length > 0,
  "Employee must have practical Teller forms."
);


assert.ok(
  managerForms.length > 0,
  "Manager must have practical Teller forms."
);


assert.ok(
  ownerForms.length > 0,
  "Owner must have practical Teller forms."
);


const employeeIds =
  ids(
    employeeForms
  );

const managerIds =
  ids(
    managerForms
  );

const ownerIds =
  ids(
    ownerForms
  );


assert.ok(
  employeeIds.has(
    "missing_document_request"
  ),
  "Employee must be able to request a missing document."
);


assert.ok(
  managerIds.has(
    "vendor_profile_intake"
  ),
  "Manager must be able to use Vendor Profile intake."
);


assert.ok(
  ownerIds.has(
    "vendor_payment_setup_request"
  ),
  "Owner must be able to start protected Vendor Payment Setup."
);


assert.equal(
  employeeIds.has(
    "vendor_payment_setup_request"
  ),
  false,
  "Employee must not receive owner-only Vendor Payment Setup."
);


// Ensure registry has unique form IDs.
const allFormIds =
  TELLER_FORM_REGISTRY.map(
    (form) =>
      form.form_id
  );


assert.equal(
  new Set(
    allFormIds
  ).size,
  allFormIds.length,
  "Canonical Teller form IDs must remain unique."
);


// ============================================================================================================
// CAPTURE / OCR TRUTH
// ============================================================================================================

const ocr =
  createUnconfiguredTellerOcrAdapter();


assert.equal(
  ocr.configured,
  false,
  "Default Teller OCR adapter must remain unconfigured."
);


const invoiceSuggestion =
  getTellerCaptureFormSuggestion(
    "invoice",
    "owner"
  );


assert.equal(
  invoiceSuggestion?.form_id,
  "invoice_intake",
  "Invoice Capture should suggest Invoice Intake for Owner."
);


assert.equal(
  invoiceSuggestion?.autofill_applied,
  false,
  "Capture suggestion must not falsely claim autofill."
);


// ============================================================================================================
// RECORD SANITIZATION + VALIDATION
// ============================================================================================================

const record =
  createTellerRecordEnvelope({
    record_id:
      "scenario_record_001",

    source:
      "form",

    source_id:
      "scenario_submission_001",

    form_id:
      "invoice_intake",

    workflow_type:
      "invoice_intake",

    category:
      "vendors",

    title:
      "Invoice Intake",

    business_key:
      "simpleepay",

    actor_role:
      "owner",

    payload: {
      values: {
        vendor_name:
          "Scenario Vendor",

        invoice_number:
          "SCENARIO-001",

        total:
          "125.00",

        // Must be removed.
        ssn:
          "000-00-0000",

        // Must be removed.
        routing_number:
          "000000000",
      },
    },
  });


assert.equal(
  Object.prototype.hasOwnProperty.call(
    record.payload.values,
    "ssn"
  ),
  false,
  "SSN must be removed from Teller record payload."
);


assert.equal(
  Object.prototype.hasOwnProperty.call(
    record.payload.values,
    "routing_number"
  ),
  false,
  "Routing number must be removed from Teller record payload."
);


const recordValidation =
  validateTellerProductionRecord(
    record
  );


assert.equal(
  recordValidation.valid,
  true,
  "Sanitized Teller record must pass production-shape validation."
);


// ============================================================================================================
// SAFE SEARCH
// ============================================================================================================

const searched =
  searchTellerRecords(
    [record],
    {
      text:
        "invoice",

      category:
        "vendors",
    }
  );


assert.equal(
  searched.length,
  1,
  "Safe record metadata search must find the scenario invoice."
);


// Search should not discover payload-only values.
const payloadOnlySearch =
  searchTellerRecords(
    [record],
    {
      text:
        "Scenario Vendor",
    }
  );


assert.equal(
  payloadOnlySearch.length,
  0,
  "Record search must not index raw workflow payload values."
);


// ============================================================================================================
// DUPLICATE FINGERPRINT
// ============================================================================================================

const packet = {
  form_id:
    "invoice_intake",

  workflow_type:
    "invoice_intake",

  values: {
    vendor_name:
      "Scenario Vendor",

    invoice_number:
      "SCENARIO-001",

    total:
      "125.00",
  },

  owner_approval_required:
    true,

  tower_approval_required:
    false,
};


const fingerprintA =
  buildTellerSubmissionFingerprint(
    packet
  );


const fingerprintB =
  buildTellerSubmissionFingerprint(
    {
      ...packet,
    }
  );


assert.equal(
  fingerprintA,
  fingerprintB,
  "Equivalent prepared workflows must produce the same duplicate fingerprint."
);


// ============================================================================================================
// CORRECTION
// ============================================================================================================

const correction =
  startTellerRecordCorrection(
    record,
    {
      actor_role:
        "owner",

      reason:
        "Scenario correction check",
    }
  );


assert.equal(
  correction.record_status,
  "needs_correction",
  "Correction flow must move record to needs_correction."
);


const correctionCleared =
  clearTellerRecordCorrection(
    correction,
    {
      actor_role:
        "owner",

      note:
        "Scenario correction completed",
    }
  );


assert.equal(
  correctionCleared.record_status,
  "prepared",
  "Clearing correction must return record to prepared."
);


// ============================================================================================================
// WORKFLOW LOCK
// ============================================================================================================

const locked =
  lockTellerRecord(
    record,
    {
      actor_role:
        "owner",

      reason:
        "Scenario lock",
    }
  );


assert.equal(
  isTellerRecordLocked(
    locked
  ),
  true,
  "Session record lock must engage."
);


assert.equal(
  locked.workflow_lock
    .tower_security_lock,
  false,
  "Teller session lock must not claim Tower security authority."
);


const unlocked =
  unlockTellerRecord(
    locked,
    {
      actor_role:
        "owner",

      reason:
        "Scenario unlock",
    }
  );


assert.equal(
  isTellerRecordLocked(
    unlocked
  ),
  false,
  "Session record lock must release."
);


// ============================================================================================================
// RECOVERY
// ============================================================================================================

const setValidation =
  validateTellerRecordSet(
    [record]
  );


assert.equal(
  setValidation.valid,
  true,
  "Scenario record set must be valid."
);


const snapshot =
  createTellerRecoverySnapshot(
    [record]
  );


assert.equal(
  snapshot.persistence,
  "memory_only",
  "Recovery snapshot must remain memory-only."
);


assert.equal(
  snapshot.survives_reload,
  false,
  "Recovery snapshot must not claim reload survival."
);


assert.equal(
  snapshot.production_backup,
  false,
  "Recovery snapshot must not claim production backup."
);


const restored =
  restoreTellerRecoverySnapshot(
    snapshot
  );


assert.equal(
  restored.length,
  1,
  "Recovery snapshot must restore the scenario record set."
);


// ============================================================================================================
// PRODUCTION REPOSITORY TRUTH
// ============================================================================================================

const repository =
  createUnconfiguredTellerRecordRepository();


assert.equal(
  repository.configured,
  false,
  "Production record repository must remain unconfigured."
);


assert.equal(
  repository.persistent,
  false,
  "Default record repository must not claim persistence."
);


// ============================================================================================================
// PRACTICAL-USE READINESS
// ============================================================================================================

const readiness =
  getTellerPracticalUseReadiness();


assert.equal(
  readiness.practical_use_source_certified,
  true,
  "Practical-use source lanes must satisfy certification criteria."
);


assert.equal(
  readiness.deployment_ready,
  false,
  "Practical-use certification must not claim deployment readiness."
);


assert.equal(
  readiness.deployment_authorized,
  false,
  "Practical-use certification must not authorize deployment."
);


assert.equal(
  readiness.production_integrations_complete,
  false,
  "Production integrations must remain incomplete."
);


const blockers =
  getTellerIntegrationBlockers();


for (
  const requiredBlocker
  of [
    "production record repository",
    "production OCR provider",
    "payroll processor",
    "payment processor",
    "real money movement",
    "reload-safe persistence",
    "Tower transport/API",
    "Tower-mediated Vault transport/storage",
  ]
) {
  assert.ok(
    blockers.includes(
      requiredBlocker
    ),
    `Missing integration blocker: ${requiredBlocker}`
  );
}


console.log(
  "GP591-GP600 EXECUTABLE PRACTICAL-USE SCENARIO PASSED"
);

console.log(
  `Canonical forms: ${TELLER_FORM_REGISTRY.length}`
);

console.log(
  `Employee forms: ${employeeForms.length}`
);

console.log(
  `Manager forms: ${managerForms.length}`
);

console.log(
  `Owner forms: ${ownerForms.length}`
);

console.log(
  "Role filtering: passed"
);

console.log(
  "OCR default unconfigured: passed"
);

console.log(
  "Capture→Invoice suggestion: passed"
);

console.log(
  "Credential sanitization: passed"
);

console.log(
  "Metadata-only search: passed"
);

console.log(
  "Duplicate fingerprint: passed"
);

console.log(
  "Correction workflow: passed"
);

console.log(
  "Session workflow lock: passed"
);

console.log(
  "In-memory recovery: passed"
);

console.log(
  "Production repository truth: passed"
);

console.log(
  "Practical-use readiness truth: passed"
);
