import {
  TELLER_FIELD_SENSITIVITY,
  validateTellerFormDefinition,
} from "./tellerFormSchema.js";

import { TELLER_PEOPLE_EMPLOYMENT_FORMS } from "../people/tellerPeopleEmploymentForms.js";


const BUSINESS_OPTIONS = Object.freeze([
  ["simpleepay", "SimpleePay"],
  ["skincare", "SimpleeSkincare"],
  ["onthego", "SimpleeOnTheGo"],
  ["mrktrade", "MrkTrade"],
  ["property", "The Grounds"],
]);


function option(value, label) {
  return {
    value,
    label,
  };
}


function selectOptions(rows) {
  return rows.map(
    ([value, label]) => option(value, label)
  );
}


function field({
  field_id,
  label,
  type = "text",
  required = false,
  placeholder = "",
  help_text = "",
  options = [],
  sensitivity = TELLER_FIELD_SENSITIVITY.NORMAL,
  show_when = null,
  required_when = null,
  min = null,
  max = null,
  step = null,
}) {
  return {
    field_id,
    label,
    type,
    required,
    placeholder,
    help_text,
    options,
    sensitivity,
    show_when,
    required_when,
    min,
    max,
    step,
  };
}


function section(section_id, title, fields, description = "") {
  return {
    section_id,
    title,
    description,
    fields,
  };
}


export const TELLER_FORM_REGISTRY = Object.freeze([

  ...TELLER_PEOPLE_EMPLOYMENT_FORMS,

  // ------------------------------------------------------------------------------------------------
  // EMPLOYEE — CONTACT
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "employee_contact_update",
    version: "1.0.0",
    title: "Contact information update",
    short_title: "Update contact info",
    description:
      "Update the contact information Teller workflows should use for you.",
    category: "people",
    workflow_type: "employee_profile_change",
    allowed_roles: ["employee", "manager", "owner"],
    tower_approval_required: false,
    owner_approval_required: false,
    document_slots: [],
    sections: [
      section(
        "contact",
        "Contact information",
        [
          field({
            field_id: "effective_date",
            label: "Effective date",
            type: "date",
            required: true,
          }),
          field({
            field_id: "phone",
            label: "Phone number",
            type: "tel",
            placeholder: "New phone number",
          }),
          field({
            field_id: "email",
            label: "Email address",
            type: "email",
            placeholder: "New email address",
          }),
          field({
            field_id: "address_line_1",
            label: "Street address",
            placeholder: "Street address",
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "address_line_2",
            label: "Apartment / unit",
            placeholder: "Optional",
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "city",
            label: "City",
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "state",
            label: "State",
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "postal_code",
            label: "ZIP / postal code",
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
        ],
        "Only enter the fields that need to change."
      ),
      section(
        "reason",
        "Why is this changing?",
        [
          field({
            field_id: "reason",
            label: "Reason or note",
            type: "textarea",
            placeholder: "Optional context for the update",
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // EMPLOYEE — EMERGENCY CONTACT
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "emergency_contact_update",
    version: "1.0.0",
    title: "Emergency contact update",
    short_title: "Emergency contact",
    description:
      "Add or update the emergency contact connected to your employee record.",
    category: "people",
    workflow_type: "employee_profile_change",
    allowed_roles: ["employee", "manager", "owner"],
    tower_approval_required: false,
    owner_approval_required: false,
    document_slots: [],
    sections: [
      section(
        "contact",
        "Emergency contact",
        [
          field({
            field_id: "contact_name",
            label: "Contact name",
            required: true,
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "relationship",
            label: "Relationship",
            required: true,
          }),
          field({
            field_id: "phone",
            label: "Primary phone",
            type: "tel",
            required: true,
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "alternate_phone",
            label: "Alternate phone",
            type: "tel",
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // EMPLOYEE — MISSING PUNCH
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "missing_punch_request",
    version: "1.0.0",
    title: "Missing punch request",
    short_title: "Missing punch",
    description:
      "Send a clear correction request when a clock-in, clock-out, or break punch is missing.",
    category: "payroll",
    workflow_type: "time_correction_request",
    allowed_roles: ["employee", "manager"],
    tower_approval_required: false,
    owner_approval_required: false,
    document_slots: [],
    sections: [
      section(
        "shift",
        "Shift information",
        [
          field({
            field_id: "work_date",
            label: "Work date",
            type: "date",
            required: true,
          }),
          field({
            field_id: "punch_type",
            label: "Missing punch",
            type: "select",
            required: true,
            options: selectOptions([
              ["clock_in", "Clock in"],
              ["clock_out", "Clock out"],
              ["break_start", "Break start"],
              ["break_end", "Break end"],
            ]),
          }),
          field({
            field_id: "expected_time",
            label: "Correct time",
            type: "time",
            required: true,
          }),
        ]
      ),
      section(
        "details",
        "What happened?",
        [
          field({
            field_id: "explanation",
            label: "Explanation",
            type: "textarea",
            required: true,
            placeholder:
              "Tell your manager what happened and what should be corrected.",
          }),
          field({
            field_id: "urgency",
            label: "Urgency",
            type: "select",
            required: true,
            options: selectOptions([
              ["normal", "Normal"],
              ["payroll_urgent", "Payroll urgent"],
            ]),
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // EMPLOYEE — PAY QUESTION
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "pay_question_request",
    version: "1.0.0",
    title: "Pay question",
    short_title: "Ask about pay",
    description:
      "Ask about a pay period, missing pay, hours, deduction, reimbursement, or other payroll concern.",
    category: "payroll",
    workflow_type: "payroll_question",
    allowed_roles: ["employee", "manager"],
    tower_approval_required: false,
    owner_approval_required: false,
    document_slots: [],
    sections: [
      section(
        "pay",
        "Pay question",
        [
          field({
            field_id: "pay_period",
            label: "Pay period or payday",
            required: true,
            placeholder: "Example: payday 09/18/2026",
          }),
          field({
            field_id: "question_type",
            label: "What is the question about?",
            type: "select",
            required: true,
            options: selectOptions([
              ["hours", "Hours"],
              ["missing_pay", "Missing pay"],
              ["rate", "Pay rate"],
              ["deduction", "Deduction"],
              ["reimbursement", "Reimbursement"],
              ["other", "Other"],
            ]),
          }),
          field({
            field_id: "amount_in_question",
            label: "Amount in question",
            type: "currency",
            min: 0,
            step: 0.01,
          }),
          field({
            field_id: "details",
            label: "What should payroll review?",
            type: "textarea",
            required: true,
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // EMPLOYEE — DIRECT DEPOSIT CHANGE REQUEST
  // NO RAW ACCOUNT OR ROUTING NUMBERS IN THIS PACK
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "direct_deposit_change_request",
    version: "1.0.0",
    title: "Direct deposit change request",
    short_title: "Direct deposit change",
    description:
      "Start a protected direct-deposit change workflow without entering raw bank account numbers here.",
    category: "payroll",
    workflow_type: "direct_deposit_change_request",
    allowed_roles: ["employee", "owner"],
    tower_approval_required: true,
    owner_approval_required: true,
    document_slots: [
      {
        slot_id: "bank_change_proof",
        label: "Bank change proof",
        sensitivity: "tower_review",
        capture_enabled: false,
      },
    ],
    sections: [
      section(
        "change",
        "Change request",
        [
          field({
            field_id: "change_type",
            label: "What are you changing?",
            type: "select",
            required: true,
            options: selectOptions([
              ["replace", "Replace current deposit destination"],
              ["add", "Add another deposit destination"],
              ["remove", "Remove a deposit destination"],
            ]),
            sensitivity: TELLER_FIELD_SENSITIVITY.TOWER_REVIEW,
          }),
          field({
            field_id: "effective_date",
            label: "Requested effective date",
            type: "date",
            required: true,
            sensitivity: TELLER_FIELD_SENSITIVITY.TOWER_REVIEW,
          }),
          field({
            field_id: "bank_name",
            label: "Financial institution name",
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
          field({
            field_id: "reason",
            label: "Reason for the change",
            type: "textarea",
            required: true,
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // MANAGER / OWNER — NEW HIRE
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "new_hire_request",
    version: "1.0.0",
    title: "New hire request",
    short_title: "Add employee",
    description:
      "Start the internal employee setup workflow before payroll and onboarding records are completed.",
    category: "people",
    workflow_type: "new_hire_request",
    allowed_roles: ["manager", "owner"],
    tower_approval_required: false,
    owner_approval_required: true,
    document_slots: [
      {
        slot_id: "onboarding_documents",
        label: "Onboarding documents",
        sensitivity: "restricted",
        capture_enabled: false,
      },
    ],
    sections: [
      section(
        "person",
        "Person",
        [
          field({
            field_id: "legal_name",
            label: "Legal name",
            required: true,
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
          field({
            field_id: "preferred_name",
            label: "Preferred name",
          }),
          field({
            field_id: "personal_email",
            label: "Personal email",
            type: "email",
            required: true,
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "phone",
            label: "Phone",
            type: "tel",
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
        ]
      ),
      section(
        "employment",
        "Employment",
        [
          field({
            field_id: "business_unit",
            label: "Business",
            type: "select",
            required: true,
            options: selectOptions(BUSINESS_OPTIONS),
          }),
          field({
            field_id: "start_date",
            label: "Start date",
            type: "date",
            required: true,
          }),
          field({
            field_id: "job_title",
            label: "Job title",
            required: true,
          }),
          field({
            field_id: "department",
            label: "Department / team",
          }),
          field({
            field_id: "employment_type",
            label: "Employment type",
            type: "select",
            required: true,
            options: selectOptions([
              ["full_time", "Full time"],
              ["part_time", "Part time"],
              ["temporary", "Temporary"],
              ["seasonal", "Seasonal"],
            ]),
          }),
          field({
            field_id: "manager_name",
            label: "Manager",
          }),
        ]
      ),
      section(
        "pay",
        "Pay setup",
        [
          field({
            field_id: "pay_basis",
            label: "Pay basis",
            type: "select",
            required: true,
            options: selectOptions([
              ["hourly", "Hourly"],
              ["salary", "Salary"],
            ]),
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
          field({
            field_id: "pay_rate",
            label: "Pay rate",
            type: "currency",
            required: true,
            min: 0,
            step: 0.01,
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // MANAGER / OWNER — EMPLOYEE CHANGE
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "employee_change_request",
    version: "1.0.0",
    title: "Employee change request",
    short_title: "Change employee",
    description:
      "Request a job, pay, department, schedule, status, or manager change.",
    category: "people",
    workflow_type: "employee_change_request",
    allowed_roles: ["manager", "owner"],
    tower_approval_required: false,
    owner_approval_required: true,
    document_slots: [],
    sections: [
      section(
        "employee",
        "Employee",
        [
          field({
            field_id: "employee_name",
            label: "Employee name",
            required: true,
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "business_unit",
            label: "Business",
            type: "select",
            required: true,
            options: selectOptions(BUSINESS_OPTIONS),
          }),
          field({
            field_id: "change_type",
            label: "Change type",
            type: "select",
            required: true,
            options: selectOptions([
              ["pay_rate", "Pay rate"],
              ["job_title", "Job title"],
              ["department", "Department"],
              ["manager", "Manager"],
              ["schedule", "Schedule"],
              ["employment_status", "Employment status"],
              ["other", "Other"],
            ]),
          }),
          field({
            field_id: "effective_date",
            label: "Effective date",
            type: "date",
            required: true,
          }),
        ]
      ),
      section(
        "change",
        "Requested change",
        [
          field({
            field_id: "current_value",
            label: "Current value",
            sensitivity: TELLER_FIELD_SENSITIVITY.INTERNAL,
          }),
          field({
            field_id: "requested_value",
            label: "Requested value",
            required: true,
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
          field({
            field_id: "reason",
            label: "Reason",
            type: "textarea",
            required: true,
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // REIMBURSEMENT
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "reimbursement_request",
    version: "1.0.0",
    title: "Reimbursement request",
    short_title: "Reimbursement",
    description:
      "Request repayment for a business expense and identify the receipt/proof status.",
    category: "payments",
    workflow_type: "reimbursement_request",
    allowed_roles: ["employee", "manager", "owner"],
    tower_approval_required: false,
    owner_approval_required: true,
    document_slots: [
      {
        slot_id: "receipt",
        label: "Receipt",
        sensitivity: "internal",
        capture_enabled: false,
      },
    ],
    sections: [
      section(
        "expense",
        "Expense",
        [
          field({
            field_id: "business_unit",
            label: "Business",
            type: "select",
            required: true,
            options: selectOptions(BUSINESS_OPTIONS),
          }),
          field({
            field_id: "expense_date",
            label: "Expense date",
            type: "date",
            required: true,
          }),
          field({
            field_id: "merchant",
            label: "Merchant / payee",
            required: true,
          }),
          field({
            field_id: "amount",
            label: "Amount",
            type: "currency",
            required: true,
            min: 0,
            step: 0.01,
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
          field({
            field_id: "category",
            label: "Expense category",
            type: "select",
            required: true,
            options: selectOptions([
              ["supplies", "Supplies"],
              ["travel", "Travel"],
              ["meals", "Meals"],
              ["maintenance", "Maintenance"],
              ["shipping", "Shipping"],
              ["fees", "Fees"],
              ["other", "Other"],
            ]),
          }),
          field({
            field_id: "business_purpose",
            label: "Business purpose",
            type: "textarea",
            required: true,
          }),
          field({
            field_id: "receipt_status",
            label: "Receipt status",
            type: "select",
            required: true,
            options: selectOptions([
              ["ready", "Receipt ready"],
              ["missing", "Receipt missing"],
              ["not_applicable", "No receipt available"],
            ]),
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // VENDOR SETUP
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "vendor_setup_request",
    version: "1.0.0",
    title: "Vendor setup request",
    short_title: "Add vendor",
    description:
      "Create the operational vendor setup request without collecting raw tax identifiers here.",
    category: "vendors",
    workflow_type: "vendor_setup_request",
    allowed_roles: ["manager", "owner"],
    tower_approval_required: false,
    owner_approval_required: true,
    document_slots: [
      {
        slot_id: "vendor_tax_document",
        label: "Vendor tax document",
        sensitivity: "tower_review",
        capture_enabled: false,
      },
    ],
    sections: [
      section(
        "vendor",
        "Vendor",
        [
          field({
            field_id: "vendor_name",
            label: "Vendor / business name",
            required: true,
          }),
          field({
            field_id: "contact_name",
            label: "Contact person",
          }),
          field({
            field_id: "email",
            label: "Email",
            type: "email",
          }),
          field({
            field_id: "phone",
            label: "Phone",
            type: "tel",
          }),
          field({
            field_id: "service_category",
            label: "Service / expense category",
            required: true,
          }),
          field({
            field_id: "payment_terms",
            label: "Payment terms",
            placeholder: "Example: due on receipt, Net 15, Net 30",
          }),
          field({
            field_id: "tax_document_status",
            label: "Tax document status",
            type: "select",
            required: true,
            options: selectOptions([
              ["received", "Received"],
              ["requested", "Requested"],
              ["missing", "Missing"],
            ]),
            sensitivity: TELLER_FIELD_SENSITIVITY.TOWER_REVIEW,
          }),
          field({
            field_id: "notes",
            label: "Notes",
            type: "textarea",
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // INVOICE
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "invoice_intake",
    version: "1.0.0",
    title: "Invoice intake",
    short_title: "Enter invoice",
    description:
      "Enter an invoice so it can move into the correct payment and proof workflow.",
    category: "payments",
    workflow_type: "invoice_intake",
    allowed_roles: ["manager", "owner"],
    tower_approval_required: false,
    owner_approval_required: true,
    document_slots: [
      {
        slot_id: "invoice_document",
        label: "Invoice document",
        sensitivity: "internal",
        capture_enabled: false,
      },
    ],
    sections: [
      section(
        "invoice",
        "Invoice",
        [
          field({
            field_id: "business_unit",
            label: "Business",
            type: "select",
            required: true,
            options: selectOptions(BUSINESS_OPTIONS),
          }),
          field({
            field_id: "vendor_name",
            label: "Vendor",
            required: true,
          }),
          field({
            field_id: "invoice_number",
            label: "Invoice number",
            required: true,
          }),
          field({
            field_id: "invoice_date",
            label: "Invoice date",
            type: "date",
            required: true,
          }),
          field({
            field_id: "due_date",
            label: "Due date",
            type: "date",
          }),
          field({
            field_id: "subtotal",
            label: "Subtotal",
            type: "currency",
            min: 0,
            step: 0.01,
          }),
          field({
            field_id: "tax",
            label: "Tax",
            type: "currency",
            min: 0,
            step: 0.01,
          }),
          field({
            field_id: "total",
            label: "Total",
            type: "currency",
            required: true,
            min: 0,
            step: 0.01,
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
          field({
            field_id: "expense_category",
            label: "Expense category",
            required: true,
          }),
          field({
            field_id: "description",
            label: "What is this invoice for?",
            type: "textarea",
            required: true,
          }),
        ]
      ),
    ],
  },


  // ------------------------------------------------------------------------------------------------
  // PAYMENT REQUEST
  // ------------------------------------------------------------------------------------------------

  {
    form_id: "payment_request",
    version: "1.0.0",
    title: "Payment request",
    short_title: "Request payment",
    description:
      "Request a business payment and tie it to the correct business, invoice, and proof state.",
    category: "payments",
    workflow_type: "payment_request",
    allowed_roles: ["manager", "owner"],
    tower_approval_required: false,
    owner_approval_required: true,
    document_slots: [],
    sections: [
      section(
        "payment",
        "Payment",
        [
          field({
            field_id: "business_unit",
            label: "Business",
            type: "select",
            required: true,
            options: selectOptions(BUSINESS_OPTIONS),
          }),
          field({
            field_id: "payee",
            label: "Payee",
            required: true,
          }),
          field({
            field_id: "amount",
            label: "Amount",
            type: "currency",
            required: true,
            min: 0,
            step: 0.01,
            sensitivity: TELLER_FIELD_SENSITIVITY.RESTRICTED,
          }),
          field({
            field_id: "due_date",
            label: "Due date",
            type: "date",
          }),
          field({
            field_id: "payment_category",
            label: "Payment category",
            required: true,
          }),
          field({
            field_id: "related_invoice",
            label: "Related invoice / reference",
          }),
          field({
            field_id: "proof_status",
            label: "Proof status",
            type: "select",
            required: true,
            options: selectOptions([
              ["ready", "Proof ready"],
              ["partial", "Some proof available"],
              ["missing", "Proof missing"],
            ]),
          }),
          field({
            field_id: "payment_reason",
            label: "Why should this be paid?",
            type: "textarea",
            required: true,
          }),
        ]
      ),
    ],
  },

]);


const FORM_MAP = new Map(
  TELLER_FORM_REGISTRY.map(
    (form) => [form.form_id, form]
  )
);


export function getTellerFormDefinition(formId) {
  return FORM_MAP.get(formId) || null;
}


export function listTellerFormsForRole(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  return TELLER_FORM_REGISTRY.filter(
    (form) => form.allowed_roles.includes(normalized)
  );
}


export function listTellerFormsByCategory(role) {
  return listTellerFormsForRole(role).reduce(
    (groups, form) => {
      const category = form.category || "other";

      groups[category] ||= [];
      groups[category].push(form);

      return groups;
    },
    {}
  );
}


export function validateTellerFormRegistry() {
  const problems = [];
  const ids = new Set();

  TELLER_FORM_REGISTRY.forEach((form) => {
    if (ids.has(form.form_id)) {
      problems.push(
        `Duplicate form_id: ${form.form_id}`
      );
    }

    ids.add(form.form_id);

    const validation =
      validateTellerFormDefinition(form);

    validation.problems.forEach(
      (problem) => {
        problems.push(
          `${form.form_id}: ${problem}`
        );
      }
    );
  });

  return {
    valid: problems.length === 0,
    problems,
    form_count: TELLER_FORM_REGISTRY.length,
  };
}
