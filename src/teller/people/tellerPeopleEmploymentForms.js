import {
  TELLER_FIELD_SENSITIVITY,
} from "../forms/tellerFormSchema.js";


const BUSINESS_OPTIONS = Object.freeze([
  ["simpleepay", "SimpleePay"],
  ["skincare", "SimpleeSkincare"],
  ["onthego", "SimpleeOnTheGo"],
  ["mrktrade", "MrkTrade"],
  ["property", "The Grounds"],
]);


function options(rows) {
  return rows.map(
    ([value, label]) => ({
      value,
      label,
    })
  );
}


function field({
  field_id,
  label,
  type = "text",
  required = false,
  placeholder = "",
  help_text = "",
  options: fieldOptions = [],
  sensitivity =
    TELLER_FIELD_SENSITIVITY.NORMAL,
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
    options: fieldOptions,
    sensitivity,
    show_when,
    required_when,
    min,
    max,
    step,
  };
}


function section(
  section_id,
  title,
  fields,
  description = ""
) {
  return {
    section_id,
    title,
    fields,
    description,
  };
}


const STATUS_OPTIONS = options([
  ["not_started", "Not started"],
  ["requested", "Requested"],
  ["in_progress", "In progress"],
  ["complete", "Complete"],
  ["not_applicable", "Not applicable"],
]);


export const TELLER_PEOPLE_EMPLOYMENT_FORMS =
  Object.freeze([

    // ----------------------------------------------------------------------------------------------------------
    // GP524 — EMPLOYEE PERSONAL PROFILE
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "employee_personal_profile",

      version:
        "1.0.0",

      title:
        "Employee personal profile",

      short_title:
        "Personal profile",

      description:
        "Collect the employee's basic identity, contact, address, and emergency-contact details for Teller workflows.",

      category:
        "people",

      workflow_type:
        "employee_personal_profile",

      allowed_roles:
        ["employee", "manager", "owner"],

      tower_approval_required:
        false,

      owner_approval_required:
        false,

      document_slots:
        [],

      sections: [
        section(
          "identity",
          "Identity",
          [
            field({
              field_id:
                "legal_name",

              label:
                "Legal name",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "preferred_name",

              label:
                "Preferred name",
            }),

            field({
              field_id:
                "personal_email",

              label:
                "Personal email",

              type:
                "email",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),

            field({
              field_id:
                "phone",

              label:
                "Phone",

              type:
                "tel",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),
          ]
        ),

        section(
          "address",
          "Address",
          [
            field({
              field_id:
                "address_line_1",

              label:
                "Street address",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "address_line_2",

              label:
                "Apartment / unit",

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "city",

              label:
                "City",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "state",

              label:
                "State",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "postal_code",

              label:
                "ZIP / postal code",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),
          ]
        ),

        section(
          "emergency",
          "Emergency contact",
          [
            field({
              field_id:
                "emergency_contact_name",

              label:
                "Contact name",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),

            field({
              field_id:
                "emergency_contact_relationship",

              label:
                "Relationship",

              required:
                true,
            }),

            field({
              field_id:
                "emergency_contact_phone",

              label:
                "Phone",

              type:
                "tel",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),

            field({
              field_id:
                "emergency_contact_alternate_phone",

              label:
                "Alternate phone",

              type:
                "tel",

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP525 — EMPLOYMENT ASSIGNMENT
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "employment_assignment_setup",

      version:
        "1.0.0",

      title:
        "Employment assignment setup",

      short_title:
        "Employment assignment",

      description:
        "Set the employee's business, job, team, manager, work location, employment type, and start date.",

      category:
        "people",

      workflow_type:
        "employment_assignment_setup",

      allowed_roles:
        ["manager", "owner"],

      tower_approval_required:
        false,

      owner_approval_required:
        true,

      document_slots:
        [],

      sections: [
        section(
          "employee",
          "Employee",
          [
            field({
              field_id:
                "employee_name",

              label:
                "Employee name",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),

            field({
              field_id:
                "business_unit",

              label:
                "Business",

              type:
                "select",

              required:
                true,

              options:
                options(BUSINESS_OPTIONS),
            }),
          ]
        ),

        section(
          "assignment",
          "Assignment",
          [
            field({
              field_id:
                "start_date",

              label:
                "Start date",

              type:
                "date",

              required:
                true,
            }),

            field({
              field_id:
                "job_title",

              label:
                "Job title",

              required:
                true,
            }),

            field({
              field_id:
                "department",

              label:
                "Department / team",
            }),

            field({
              field_id:
                "work_location",

              label:
                "Work location",

              placeholder:
                "Office, property, route, remote, or assigned location",
            }),

            field({
              field_id:
                "employment_type",

              label:
                "Employment type",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["full_time", "Full time"],
                  ["part_time", "Part time"],
                  ["temporary", "Temporary"],
                  ["seasonal", "Seasonal"],
                ]),
            }),

            field({
              field_id:
                "manager_name",

              label:
                "Manager / supervisor",
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP526 — COMPENSATION SETUP
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "compensation_setup_request",

      version:
        "1.0.0",

      title:
        "Compensation setup request",

      short_title:
        "Compensation setup",

      description:
        "Prepare the employee's pay basis, rate, frequency, and effective date for review.",

      category:
        "payroll",

      workflow_type:
        "compensation_setup_request",

      allowed_roles:
        ["manager", "owner"],

      tower_approval_required:
        false,

      owner_approval_required:
        true,

      document_slots:
        [],

      sections: [
        section(
          "employee",
          "Employee",
          [
            field({
              field_id:
                "employee_name",

              label:
                "Employee name",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),

            field({
              field_id:
                "business_unit",

              label:
                "Business",

              type:
                "select",

              required:
                true,

              options:
                options(BUSINESS_OPTIONS),
            }),
          ]
        ),

        section(
          "pay",
          "Compensation",
          [
            field({
              field_id:
                "pay_basis",

              label:
                "Pay basis",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["hourly", "Hourly"],
                  ["salary", "Salary"],
                ]),

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "pay_rate",

              label:
                "Pay rate / salary amount",

              type:
                "currency",

              required:
                true,

              min:
                0,

              step:
                0.01,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "pay_frequency",

              label:
                "Pay frequency",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["weekly", "Weekly"],
                  ["biweekly", "Every two weeks"],
                  ["semimonthly", "Twice a month"],
                  ["monthly", "Monthly"],
                ]),

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "effective_date",

              label:
                "Effective date",

              type:
                "date",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "compensation_note",

              label:
                "Pay setup note",

              type:
                "textarea",

              placeholder:
                "Optional internal context",

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP527 — EMPLOYMENT DOCUMENT CHECKLIST
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "employment_document_checklist",

      version:
        "1.0.0",

      title:
        "Employment document checklist",

      short_title:
        "Document checklist",

      description:
        "Track workflow status for payroll, eligibility, policy, and payment-setup documents without reproducing official form content.",

      category:
        "documents",

      workflow_type:
        "employment_document_checklist",

      allowed_roles:
        ["manager", "owner"],

      tower_approval_required:
        false,

      owner_approval_required:
        false,

      document_slots: [
        {
          slot_id:
            "official_employment_documents",

          label:
            "Official employment documents",

          sensitivity:
            "tower_review",

          capture_enabled:
            false,
        },
      ],

      sections: [
        section(
          "employee",
          "Employee",
          [
            field({
              field_id:
                "employee_name",

              label:
                "Employee name",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),

            field({
              field_id:
                "business_unit",

              label:
                "Business",

              type:
                "select",

              required:
                true,

              options:
                options(BUSINESS_OPTIONS),
            }),
          ]
        ),

        section(
          "documents",
          "Workflow status",
          [
            field({
              field_id:
                "federal_withholding_status",

              label:
                "Federal withholding form workflow",

              type:
                "select",

              required:
                true,

              options:
                STATUS_OPTIONS,

              help_text:
                "Track the workflow status only. Use the current official form outside this registry.",
            }),

            field({
              field_id:
                "state_withholding_status",

              label:
                "State withholding workflow",

              type:
                "select",

              required:
                true,

              options:
                STATUS_OPTIONS,
            }),

            field({
              field_id:
                "employment_eligibility_status",

              label:
                "Employment eligibility verification workflow",

              type:
                "select",

              required:
                true,

              options:
                STATUS_OPTIONS,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.TOWER_REVIEW,

              help_text:
                "Track completion status only. Do not enter document numbers here.",
            }),

            field({
              field_id:
                "direct_deposit_status",

              label:
                "Direct deposit setup workflow",

              type:
                "select",

              required:
                true,

              options:
                STATUS_OPTIONS,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.TOWER_REVIEW,
            }),

            field({
              field_id:
                "handbook_status",

              label:
                "Handbook acknowledgement",

              type:
                "select",

              required:
                true,

              options:
                STATUS_OPTIONS,
            }),

            field({
              field_id:
                "policy_acknowledgement_status",

              label:
                "Required policy acknowledgements",

              type:
                "select",

              required:
                true,

              options:
                STATUS_OPTIONS,
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP528 — SEPARATION / FINAL PAY
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "final_pay_termination_request",

      version:
        "1.0.0",

      title:
        "Separation and final-pay request",

      short_title:
        "Final pay / separation",

      description:
        "Start the internal separation and final-pay review workflow without pretending Teller has determined legal timing or payment requirements.",

      category:
        "payroll",

      workflow_type:
        "final_pay_termination_request",

      allowed_roles:
        ["manager", "owner"],

      tower_approval_required:
        false,

      owner_approval_required:
        true,

      document_slots:
        [],

      sections: [
        section(
          "employee",
          "Employee",
          [
            field({
              field_id:
                "employee_name",

              label:
                "Employee name",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
            }),

            field({
              field_id:
                "business_unit",

              label:
                "Business",

              type:
                "select",

              required:
                true,

              options:
                options(BUSINESS_OPTIONS),
            }),

            field({
              field_id:
                "separation_type",

              label:
                "Separation type",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["resignation", "Resignation"],
                  ["termination", "Termination"],
                  ["end_of_temporary_assignment", "End of temporary assignment"],
                  ["other", "Other"],
                ]),
            }),

            field({
              field_id:
                "last_day_worked",

              label:
                "Last day worked",

              type:
                "date",

              required:
                true,
            }),

            field({
              field_id:
                "separation_effective_date",

              label:
                "Separation effective date",

              type:
                "date",

              required:
                true,
            }),
          ]
        ),

        section(
          "final_pay",
          "Final-pay review",
          [
            field({
              field_id:
                "unpaid_hours_review",

              label:
                "Unpaid hours review",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["none_known", "No unpaid hours known"],
                  ["review_needed", "Review needed"],
                  ["hours_identified", "Hours identified"],
                ]),
            }),

            field({
              field_id:
                "reimbursement_review",

              label:
                "Outstanding reimbursement review",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["none_known", "None known"],
                  ["review_needed", "Review needed"],
                  ["amount_identified", "Amount identified"],
                ]),
            }),

            field({
              field_id:
                "deduction_or_property_review",

              label:
                "Company property / deduction review",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["none_known", "None known"],
                  ["review_needed", "Review needed"],
                ]),

              help_text:
                "This is only a review flag. Teller does not determine whether a deduction is lawful.",
            }),

            field({
              field_id:
                "final_pay_timing_status",

              label:
                "Final-pay timing review",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["needs_review", "Needs legal/policy review"],
                  ["reviewed", "Timing reviewed"],
                ]),

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,

              help_text:
                "Timing rules may vary. This field records review status only.",
            }),

            field({
              field_id:
                "separation_note",

              label:
                "Internal separation note",

              type:
                "textarea",

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),
          ]
        ),
      ],
    },

  ]);
