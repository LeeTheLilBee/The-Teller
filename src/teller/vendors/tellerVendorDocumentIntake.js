export const TELLER_VENDOR_INTAKE_ACTIONS =
  Object.freeze([
    {
      action_id: "setup",
      form_id: "vendor_setup_request",
      label: "Vendor setup",
      description:
        "Start a new vendor relationship and track the tax-document workflow.",
    },

    {
      action_id: "profile",
      form_id: "vendor_profile_intake",
      label: "Vendor profile",
      description:
        "Enter or update business contact, category, terms, and relationship details.",
    },

    {
      action_id: "payment_setup",
      form_id: "vendor_payment_setup_request",
      label: "Payment setup",
      description:
        "Start protected vendor payment setup without entering bank credentials in this form.",
    },

    {
      action_id: "invoice",
      form_id: "invoice_intake",
      label: "Invoice",
      description:
        "Enter an invoice connected to a vendor payment workflow.",
    },
  ]);


export const TELLER_DOCUMENT_INTAKE_ACTIONS =
  Object.freeze([
    {
      action_id: "missing",
      form_id: "missing_document_request",
      label: "Request missing document",
      description:
        "Record what document is missing, who needs to provide it, and when it is needed.",
    },

    {
      action_id: "replacement",
      form_id: "replacement_document_request",
      label: "Replace document",
      description:
        "Request a corrected, updated, expired, damaged, or unreadable document.",
    },

    {
      action_id: "verify",
      form_id: "document_verification_review",
      label: "Verify document",
      description:
        "Review document workflow status without automatically accepting captured material.",
    },
  ]);


function countForm(
  packets,
  formId
) {
  return (packets || []).filter(
    (packet) =>
      packet?.form_id === formId
  ).length;
}


function enrichActions(
  actions,
  packets
) {
  return actions.map(
    (action) => ({
      ...action,

      prepared_count:
        countForm(
          packets,
          action.form_id
        ),
    })
  );
}


export function getTellerVendorIntakeStatus(
  packets = []
) {
  const actions =
    enrichActions(
      TELLER_VENDOR_INTAKE_ACTIONS,
      packets
    );

  return {
    actions,

    prepared_count:
      actions.reduce(
        (total, action) =>
          total +
          action.prepared_count,
        0
      ),
  };
}


export function getTellerDocumentIntakeStatus(
  packets = []
) {
  const actions =
    enrichActions(
      TELLER_DOCUMENT_INTAKE_ACTIONS,
      packets
    );

  return {
    actions,

    prepared_count:
      actions.reduce(
        (total, action) =>
          total +
          action.prepared_count,
        0
      ),
  };
}
