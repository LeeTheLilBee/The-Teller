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


export const TELLER_PAYROLL_PAYMENT_FORMS =
  Object.freeze([

    // ----------------------------------------------------------------------------------------------------------
    // GP534 — PAYROLL CYCLE SETUP
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "payroll_cycle_setup",

      version:
        "1.0.0",

      title:
        "Payroll cycle setup",

      short_title:
        "Payroll cycle",

      description:
        "Prepare the pay period and scheduled payday that payroll review should use.",

      category:
        "payroll",

      workflow_type:
        "payroll_cycle_setup",

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
          "cycle",
          "Payroll cycle",
          [
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
                "pay_period_start",

              label:
                "Pay period start",

              type:
                "date",

              required:
                true,
            }),

            field({
              field_id:
                "pay_period_end",

              label:
                "Pay period end",

              type:
                "date",

              required:
                true,
            }),

            field({
              field_id:
                "scheduled_payday",

              label:
                "Scheduled payday",

              type:
                "date",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.INTERNAL,
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
            }),

            field({
              field_id:
                "cycle_note",

              label:
                "Payroll note",

              type:
                "textarea",

              placeholder:
                "Optional internal payroll context",
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP535 — PAYROLL ADJUSTMENT
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "payroll_adjustment_request",

      version:
        "1.0.0",

      title:
        "Payroll adjustment request",

      short_title:
        "Payroll adjustment",

      description:
        "Request a reviewed change to payroll inputs without directly changing payroll or moving money.",

      category:
        "payroll",

      workflow_type:
        "payroll_adjustment_request",

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
                "affected_payday",

              label:
                "Affected payday",

              type:
                "date",

              required:
                true,
            }),
          ]
        ),

        section(
          "adjustment",
          "Adjustment",
          [
            field({
              field_id:
                "adjustment_type",

              label:
                "Adjustment type",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["hours", "Hours"],
                  ["rate", "Pay rate"],
                  ["earning", "Earning"],
                  ["deduction_review", "Deduction review"],
                  ["reimbursement", "Reimbursement"],
                  ["other", "Other"],
                ]),
            }),

            field({
              field_id:
                "amount_or_hours",

              label:
                "Amount or hours involved",

              placeholder:
                "Example: 3.5 hours or 125.00",

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "requested_change",

              label:
                "Requested change",

              type:
                "textarea",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "reason",

              label:
                "Reason",

              type:
                "textarea",

              required:
                true,
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP535 — BONUS / COMMISSION
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "bonus_commission_request",

      version:
        "1.0.0",

      title:
        "Bonus or commission request",

      short_title:
        "Bonus / commission",

      description:
        "Prepare a bonus or commission item for approval and payroll review.",

      category:
        "payroll",

      workflow_type:
        "bonus_commission_request",

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
          "earning",
          "Additional earning",
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
                "earning_type",

              label:
                "Earning type",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["bonus", "Bonus"],
                  ["commission", "Commission"],
                  ["incentive", "Incentive"],
                  ["other", "Other"],
                ]),
            }),

            field({
              field_id:
                "amount",

              label:
                "Amount",

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
                "earning_period",

              label:
                "Earning period / reference",

              required:
                true,
            }),

            field({
              field_id:
                "requested_payday",

              label:
                "Requested payday",

              type:
                "date",
            }),

            field({
              field_id:
                "reason",

              label:
                "Reason / calculation note",

              type:
                "textarea",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP536 — OFF-CYCLE PAY
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "off_cycle_pay_request",

      version:
        "1.0.0",

      title:
        "Off-cycle pay request",

      short_title:
        "Off-cycle pay",

      description:
        "Request payroll review for money that may need to be paid outside the normal cycle.",

      category:
        "payroll",

      workflow_type:
        "off_cycle_pay_request",

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
          "request",
          "Off-cycle request",
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
                "amount",

              label:
                "Amount under review",

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
                "requested_pay_date",

              label:
                "Requested pay date",

              type:
                "date",

              required:
                true,
            }),

            field({
              field_id:
                "reason_type",

              label:
                "Reason type",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["missed_pay", "Missed pay"],
                  ["correction", "Correction"],
                  ["final_pay_review", "Final-pay review"],
                  ["urgent_adjustment", "Urgent adjustment"],
                  ["other", "Other"],
                ]),
            }),

            field({
              field_id:
                "reason",

              label:
                "Reason",

              type:
                "textarea",

              required:
                true,
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP536 — PAYROLL CORRECTION
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "payroll_correction_request",

      version:
        "1.0.0",

      title:
        "Payroll correction request",

      short_title:
        "Payroll correction",

      description:
        "Document a payroll issue that needs investigation and correction.",

      category:
        "payroll",

      workflow_type:
        "payroll_correction_request",

      allowed_roles:
        ["employee", "manager", "owner"],

      tower_approval_required:
        false,

      owner_approval_required:
        true,

      document_slots:
        [],

      sections: [
        section(
          "issue",
          "Payroll issue",
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
                "affected_payday",

              label:
                "Affected payday",

              type:
                "date",

              required:
                true,
            }),

            field({
              field_id:
                "issue_type",

              label:
                "Issue type",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["missing_pay", "Missing pay"],
                  ["incorrect_hours", "Incorrect hours"],
                  ["incorrect_rate", "Incorrect rate"],
                  ["incorrect_earning", "Incorrect earning"],
                  ["deduction_question", "Deduction question"],
                  ["reimbursement_issue", "Reimbursement issue"],
                  ["other", "Other"],
                ]),
            }),

            field({
              field_id:
                "amount_in_question",

              label:
                "Amount in question",

              type:
                "currency",

              min:
                0,

              step:
                0.01,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "expected_result",

              label:
                "What should be reviewed or corrected?",

              type:
                "textarea",

              required:
                true,
            }),

            field({
              field_id:
                "details",

              label:
                "Details",

              type:
                "textarea",

              required:
                true,
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP537 — PAYMENT EXCEPTION
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "payment_exception_request",

      version:
        "1.0.0",

      title:
        "Payment exception request",

      short_title:
        "Payment exception",

      description:
        "Report a payment problem for investigation without claiming Teller can move or recover money.",

      category:
        "payments",

      workflow_type:
        "payment_exception_request",

      allowed_roles:
        ["manager", "owner"],

      tower_approval_required:
        false,

      owner_approval_required:
        true,

      document_slots:
        [
          {
            slot_id:
              "payment_exception_proof",

            label:
              "Payment exception proof",

            sensitivity:
              "internal",

            capture_enabled:
              false,
          },
        ],

      sections: [
        section(
          "payment",
          "Payment",
          [
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
                "payment_reference",

              label:
                "Payment / invoice reference",

              required:
                true,
            }),

            field({
              field_id:
                "payee",

              label:
                "Payee",

              required:
                true,
            }),

            field({
              field_id:
                "amount",

              label:
                "Amount",

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
                "exception_type",

              label:
                "Exception type",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["failed", "Failed"],
                  ["duplicate", "Possible duplicate"],
                  ["incorrect_amount", "Incorrect amount"],
                  ["wrong_payee", "Wrong payee"],
                  ["returned", "Returned"],
                  ["missing", "Not received / missing"],
                  ["other", "Other"],
                ]),
            }),

            field({
              field_id:
                "details",

              label:
                "What happened?",

              type:
                "textarea",

              required:
                true,
            }),
          ]
        ),
      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP537 — REFUND / REVERSAL REQUEST
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "refund_reversal_request",

      version:
        "1.0.0",

      title:
        "Refund, void, or reversal request",

      short_title:
        "Refund / reversal",

      description:
        "Request review of a refund, void, or reversal. This form does not execute the transaction.",

      category:
        "payments",

      workflow_type:
        "refund_reversal_request",

      allowed_roles:
        ["manager", "owner"],

      tower_approval_required:
        true,

      owner_approval_required:
        true,

      document_slots:
        [
          {
            slot_id:
              "refund_reversal_proof",

            label:
              "Supporting proof",

            sensitivity:
              "tower_review",

            capture_enabled:
              false,
          },
        ],

      sections: [
        section(
          "request",
          "Refund / reversal review",
          [
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
                "payment_reference",

              label:
                "Original payment reference",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

            field({
              field_id:
                "payee_or_payer",

              label:
                "Payee / payer",

              required:
                true,
            }),

            field({
              field_id:
                "original_amount",

              label:
                "Original amount",

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
                "requested_amount",

              label:
                "Amount under review",

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
                "request_type",

              label:
                "Request type",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["refund", "Refund review"],
                  ["void", "Void review"],
                  ["reversal", "Reversal review"],
                ]),

              sensitivity:
                TELLER_FIELD_SENSITIVITY.TOWER_REVIEW,
            }),

            field({
              field_id:
                "reason",

              label:
                "Reason",

              type:
                "textarea",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),
          ]
        ),
      ],
    },

  ]);
