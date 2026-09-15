export const TELLER_VENDOR_RECORD_VERSION =
  "1.0.0";

export const TELLER_DOCUMENT_WORKFLOW_VERSION =
  "1.0.0";


function clean(value, fallback = "") {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value).trim();
}


function packetsFor(
  packets,
  formId
) {
  return (packets || []).filter(
    (packet) =>
      packet?.form_id === formId
  );
}


function latestValues(
  packets,
  formId
) {
  return (
    packetsFor(
      packets,
      formId
    )[0]?.values || {}
  );
}


export function createBlankTellerVendorRecord() {
  return {
    record_version:
      TELLER_VENDOR_RECORD_VERSION,

    vendor_id: "",

    identity: {
      vendor_name: "",
      contact_name: "",
      email: "",
      phone: "",
    },

    relationship: {
      business_unit: "",
      service_category: "",
      payment_terms: "",
      active_status: "proposed",
    },

    compliance_workflow: {
      tax_document_status: "",
      payment_setup_status: "",
      verification_status: "",
    },

    sensitive_credentials: {
      tin_collected_here: false,
      bank_account_collected_here: false,
      routing_number_collected_here: false,
    },

    source_forms: [],

    persistence: {
      mode: "session_memory_only",
      production_record_saved: false,
    },
  };
}


export function createBlankTellerDocumentWorkflowRecord() {
  return {
    record_version:
      TELLER_DOCUMENT_WORKFLOW_VERSION,

    document_workflow_id: "",

    subject: {
      subject_type: "",
      subject_name: "",
      business_unit: "",
    },

    document: {
      document_category: "",
      document_label: "",
      reference_date: "",
      workflow_status: "proposed",
    },

    review: {
      verification_status: "",
      correction_required: false,
      replacement_required: false,
    },

    capture: {
      capture_reference: "",
      raw_file_saved_here: false,
      uploaded_here: false,
      vault_link_present: false,
    },

    source_forms: [],

    persistence: {
      mode: "session_memory_only",
      production_record_saved: false,
    },
  };
}


export function buildTellerVendorDocumentPreview(
  packets = []
) {
  const setup =
    latestValues(
      packets,
      "vendor_setup_request"
    );

  const profile =
    latestValues(
      packets,
      "vendor_profile_intake"
    );

  const paymentSetup =
    latestValues(
      packets,
      "vendor_payment_setup_request"
    );

  const verification =
    latestValues(
      packets,
      "document_verification_review"
    );


  const vendor =
    createBlankTellerVendorRecord();


  vendor.identity.vendor_name =
    clean(
      profile.vendor_name ||
      setup.vendor_name
    );

  vendor.identity.contact_name =
    clean(
      profile.contact_name ||
      setup.contact_name
    );

  vendor.identity.email =
    clean(
      profile.email ||
      setup.email
    );

  vendor.identity.phone =
    clean(
      profile.phone ||
      setup.phone
    );

  vendor.relationship.business_unit =
    clean(
      profile.business_unit ||
      paymentSetup.business_unit
    );

  vendor.relationship.service_category =
    clean(
      profile.service_category ||
      setup.service_category
    );

  vendor.relationship.payment_terms =
    clean(
      profile.payment_terms ||
      setup.payment_terms
    );

  vendor.compliance_workflow.tax_document_status =
    clean(
      setup.tax_document_status
    );

  vendor.compliance_workflow.payment_setup_status =
    paymentSetup.vendor_name
      ? "requested"
      : "";

  vendor.compliance_workflow.verification_status =
    clean(
      verification.verification_result
    );


  vendor.source_forms = [
    "vendor_setup_request",
    "vendor_profile_intake",
    "vendor_payment_setup_request",
  ].filter(
    (formId) =>
      packetsFor(
        packets,
        formId
      ).length > 0
  );


  const documents =
    createBlankTellerDocumentWorkflowRecord();


  documents.subject.subject_type =
    clean(
      verification.subject_type
    );

  documents.subject.subject_name =
    clean(
      verification.subject_name
    );

  documents.subject.business_unit =
    clean(
      verification.business_unit
    );

  documents.document.document_category =
    clean(
      verification.document_category
    );

  documents.document.document_label =
    clean(
      verification.document_label
    );

  documents.review.verification_status =
    clean(
      verification.verification_result
    );

  documents.review.correction_required =
    verification.verification_result ===
      "needs_correction";

  documents.review.replacement_required =
    verification.verification_result ===
      "replacement_required";


  documents.source_forms = [
    "missing_document_request",
    "replacement_document_request",
    "document_verification_review",
  ].filter(
    (formId) =>
      packetsFor(
        packets,
        formId
      ).length > 0
  );


  return {
    vendor,
    documents,

    preview_only: true,

    production_record_saved: false,
    raw_document_saved: false,
    vault_document_linked: false,
  };
}
