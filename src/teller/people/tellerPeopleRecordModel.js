export const TELLER_PERSON_RECORD_VERSION = "1.0.0";
export const TELLER_EMPLOYMENT_RECORD_VERSION = "1.0.0";


function clean(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}


function firstPacket(packets, formId) {
  return (
    (packets || []).find(
      (packet) =>
        packet?.form_id === formId
    ) || null
  );
}


function packetValues(packets, formId) {
  return (
    firstPacket(packets, formId)?.values ||
    {}
  );
}


export function createBlankTellerPersonRecord() {
  return {
    record_version:
      TELLER_PERSON_RECORD_VERSION,

    person_id: "",

    identity: {
      legal_name: "",
      preferred_name: "",
    },

    contact: {
      personal_email: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
    },

    emergency_contact: {
      name: "",
      relationship: "",
      phone: "",
      alternate_phone: "",
    },

    record_status: "proposed",

    source_forms: [],

    persistence: {
      mode: "session_memory_only",
      production_record_saved: false,
    },
  };
}


export function createBlankTellerEmploymentRecord() {
  return {
    record_version:
      TELLER_EMPLOYMENT_RECORD_VERSION,

    employment_id: "",
    person_id: "",

    business: {
      business_key: "",
      business_label: "",
    },

    assignment: {
      start_date: "",
      job_title: "",
      department: "",
      work_location: "",
      employment_type: "",
      manager_name: "",
    },

    compensation: {
      pay_basis: "",
      pay_rate: "",
      pay_frequency: "",
      effective_date: "",
    },

    documents: {
      federal_withholding_status: "",
      state_withholding_status: "",
      employment_eligibility_status: "",
      direct_deposit_status: "",
      handbook_status: "",
      policy_acknowledgement_status: "",
    },

    relationship_status: "proposed",

    source_forms: [],

    persistence: {
      mode: "session_memory_only",
      production_record_saved: false,
    },
  };
}


export function buildTellerPeopleEmploymentPreview(
  packets = []
) {
  const newHire =
    packetValues(
      packets,
      "new_hire_request"
    );

  const personal =
    packetValues(
      packets,
      "employee_personal_profile"
    );

  const assignment =
    packetValues(
      packets,
      "employment_assignment_setup"
    );

  const compensation =
    packetValues(
      packets,
      "compensation_setup_request"
    );

  const documents =
    packetValues(
      packets,
      "employment_document_checklist"
    );

  const person =
    createBlankTellerPersonRecord();

  person.identity.legal_name =
    clean(
      personal.legal_name ||
      newHire.legal_name
    );

  person.identity.preferred_name =
    clean(
      personal.preferred_name ||
      newHire.preferred_name
    );

  person.contact.personal_email =
    clean(
      personal.personal_email ||
      newHire.personal_email
    );

  person.contact.phone =
    clean(
      personal.phone ||
      newHire.phone
    );

  person.contact.address_line_1 =
    clean(personal.address_line_1);

  person.contact.address_line_2 =
    clean(personal.address_line_2);

  person.contact.city =
    clean(personal.city);

  person.contact.state =
    clean(personal.state);

  person.contact.postal_code =
    clean(personal.postal_code);

  person.emergency_contact.name =
    clean(personal.emergency_contact_name);

  person.emergency_contact.relationship =
    clean(personal.emergency_contact_relationship);

  person.emergency_contact.phone =
    clean(personal.emergency_contact_phone);

  person.emergency_contact.alternate_phone =
    clean(personal.emergency_contact_alternate_phone);

  person.source_forms = [
    "new_hire_request",
    "employee_personal_profile",
  ].filter(
    (formId) =>
      Boolean(firstPacket(packets, formId))
  );


  const employment =
    createBlankTellerEmploymentRecord();

  employment.business.business_key =
    clean(
      assignment.business_unit ||
      newHire.business_unit
    );

  employment.assignment.start_date =
    clean(
      assignment.start_date ||
      newHire.start_date
    );

  employment.assignment.job_title =
    clean(
      assignment.job_title ||
      newHire.job_title
    );

  employment.assignment.department =
    clean(
      assignment.department ||
      newHire.department
    );

  employment.assignment.work_location =
    clean(
      assignment.work_location
    );

  employment.assignment.employment_type =
    clean(
      assignment.employment_type ||
      newHire.employment_type
    );

  employment.assignment.manager_name =
    clean(
      assignment.manager_name ||
      newHire.manager_name
    );

  employment.compensation.pay_basis =
    clean(
      compensation.pay_basis ||
      newHire.pay_basis
    );

  employment.compensation.pay_rate =
    clean(
      compensation.pay_rate ||
      newHire.pay_rate
    );

  employment.compensation.pay_frequency =
    clean(
      compensation.pay_frequency
    );

  employment.compensation.effective_date =
    clean(
      compensation.effective_date ||
      assignment.start_date ||
      newHire.start_date
    );

  employment.documents.federal_withholding_status =
    clean(
      documents.federal_withholding_status
    );

  employment.documents.state_withholding_status =
    clean(
      documents.state_withholding_status
    );

  employment.documents.employment_eligibility_status =
    clean(
      documents.employment_eligibility_status
    );

  employment.documents.direct_deposit_status =
    clean(
      documents.direct_deposit_status
    );

  employment.documents.handbook_status =
    clean(
      documents.handbook_status
    );

  employment.documents.policy_acknowledgement_status =
    clean(
      documents.policy_acknowledgement_status
    );

  employment.source_forms = [
    "new_hire_request",
    "employment_assignment_setup",
    "compensation_setup_request",
    "employment_document_checklist",
  ].filter(
    (formId) =>
      Boolean(firstPacket(packets, formId))
  );


  return {
    person,
    employment,

    preview_only: true,

    persistence: {
      mode: "session_memory_only",
      production_record_saved: false,
    },
  };
}
