import {
  TELLER_FIELD_SENSITIVITY,
} from "../forms/tellerFormSchema.js";


const BUSINESS_OPTIONS =
  Object.freeze([
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


const SUBJECT_OPTIONS =
  options([
    ["employee", "Employee"],
    ["vendor", "Vendor"],
    ["business", "Business"],
    ["payment", "Payment workflow"],
    ["other", "Other"],
  ]);


const DOCUMENT_CATEGORY_OPTIONS =
  options([
    ["tax", "Tax document"],
    ["employment", "Employment document"],
    ["vendor", "Vendor document"],
    ["invoice", "Invoice"],
    ["receipt", "Receipt"],
    ["payment_proof", "Payment proof"],
    ["policy", "Policy / acknowledgement"],
    ["other", "Other"],
  ]);


export const TELLER_VENDOR_DOCUMENT_FORMS =
  Object.freeze([

    // ----------------------------------------------------------------------------------------------------------
    // GP564 — VENDOR PROFILE
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "vendor_profile_intake",

      version:
        "1.0.0",

      title:
        "Vendor profile",

      short_title:
        "Vendor profile",

      description:
        "Enter practical vendor contact and relationship information without collecting tax IDs or bank credentials.",

      category:
        "vendors",

      workflow_type:
        "vendor_profile_intake",

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
          "vendor",
          "Vendor",
          [

            field({
              field_id:
                "vendor_name",

              label:
                "Vendor / business name",

              required:
                true,
            }),

            field({
              field_id:
                "contact_name",

              label:
                "Primary contact",
            }),

            field({
              field_id:
                "email",

              label:
                "Email",

              type:
                "email",
            }),

            field({
              field_id:
                "phone",

              label:
                "Phone",

              type:
                "tel",
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
                options(
                  BUSINESS_OPTIONS
                ),
            }),

            field({
              field_id:
                "service_category",

              label:
                "Service / expense category",

              required:
                true,
            }),

            field({
              field_id:
                "payment_terms",

              label:
                "Payment terms",

              placeholder:
                "Example: Due on receipt, Net 15, Net 30",
            }),

            field({
              field_id:
                "relationship_note",

              label:
                "Relationship note",

              type:
                "textarea",
            }),

          ]
        ),

      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP565 — VENDOR PAYMENT SETUP
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "vendor_payment_setup_request",

      version:
        "1.0.0",

      title:
        "Vendor payment setup request",

      short_title:
        "Vendor payment setup",

      description:
        "Start protected payment setup for a vendor without entering bank account or routing information here.",

      category:
        "vendors",

      workflow_type:
        "vendor_payment_setup_request",

      allowed_roles:
        ["owner"],

      tower_approval_required:
        true,

      owner_approval_required:
        true,

      document_slots: [
        {
          slot_id:
            "vendor_payment_setup_proof",

          label:
            "Vendor payment setup proof",

          sensitivity:
            "tower_review",

          capture_enabled:
            false,
        },
      ],

      sections: [

        section(
          "vendor",
          "Vendor payment setup",
          [

            field({
              field_id:
                "vendor_name",

              label:
                "Vendor",

              required:
                true,
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
                options(
                  BUSINESS_OPTIONS
                ),
            }),

            field({
              field_id:
                "payment_method_requested",

              label:
                "Requested payment method",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["ach_review", "ACH setup review"],
                  ["check", "Check"],
                  ["card_review", "Card payment review"],
                  ["other", "Other"],
                ]),

              sensitivity:
                TELLER_FIELD_SENSITIVITY.TOWER_REVIEW,
            }),

            field({
              field_id:
                "payment_terms",

              label:
                "Payment terms",
            }),

            field({
              field_id:
                "setup_reason",

              label:
                "Reason / setup note",

              type:
                "textarea",

              required:
                true,

              sensitivity:
                TELLER_FIELD_SENSITIVITY.RESTRICTED,
            }),

          ],
          "Bank account and routing details are intentionally not collected in this Teller form."
        ),

      ],
    },


    // ----------------------------------------------------------------------------------------------------------
    // GP566 — MISSING DOCUMENT
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "missing_document_request",

      version:
        "1.0.0",

      title:
        "Missing document request",

      short_title:
        "Request missing document",

      description:
        "Request a required document and record who needs to provide it.",

      category:
        "documents",

      workflow_type:
        "missing_document_request",

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
          "subject",
          "Document request",
          [

            field({
              field_id:
                "subject_type",

              label:
                "Who or what is this for?",

              type:
                "select",

              required:
                true,

              options:
                SUBJECT_OPTIONS,
            }),

            field({
              field_id:
                "subject_name",

              label:
                "Person / vendor / workflow",

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
                options(
                  BUSINESS_OPTIONS
                ),
            }),

            field({
              field_id:
                "document_category",

              label:
                "Document category",

              type:
                "select",

              required:
                true,

              options:
                DOCUMENT_CATEGORY_OPTIONS,
            }),

            field({
              field_id:
                "document_label",

              label:
                "Document needed",

              required:
                true,
            }),

            field({
              field_id:
                "needed_by",

              label:
                "Needed by",

              type:
                "date",
            }),

            field({
              field_id:
                "reason",

              label:
                "Why is it needed?",

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
    // GP567 — REPLACEMENT DOCUMENT
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "replacement_document_request",

      version:
        "1.0.0",

      title:
        "Replacement document request",

      short_title:
        "Replace document",

      description:
        "Request a replacement when a document is outdated, unreadable, incorrect, damaged, or otherwise unusable.",

      category:
        "documents",

      workflow_type:
        "replacement_document_request",

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
          "replacement",
          "Replacement request",
          [

            field({
              field_id:
                "subject_type",

              label:
                "Who or what is this for?",

              type:
                "select",

              required:
                true,

              options:
                SUBJECT_OPTIONS,
            }),

            field({
              field_id:
                "subject_name",

              label:
                "Person / vendor / workflow",

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
                options(
                  BUSINESS_OPTIONS
                ),
            }),

            field({
              field_id:
                "document_category",

              label:
                "Document category",

              type:
                "select",

              required:
                true,

              options:
                DOCUMENT_CATEGORY_OPTIONS,
            }),

            field({
              field_id:
                "document_label",

              label:
                "Document",

              required:
                true,
            }),

            field({
              field_id:
                "replacement_reason",

              label:
                "Why does it need replacement?",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["expired", "Expired / outdated"],
                  ["incorrect", "Incorrect information"],
                  ["unreadable", "Unreadable"],
                  ["damaged", "Damaged"],
                  ["missing_pages", "Missing pages"],
                  ["wrong_document", "Wrong document"],
                  ["other", "Other"],
                ]),
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
    // GP568 — DOCUMENT VERIFICATION
    // ----------------------------------------------------------------------------------------------------------

    {
      form_id:
        "document_verification_review",

      version:
        "1.0.0",

      title:
        "Document verification review",

      short_title:
        "Verify document",

      description:
        "Record a human review outcome for a document workflow without automatically accepting a scanned file.",

      category:
        "documents",

      workflow_type:
        "document_verification_review",

      allowed_roles:
        ["manager", "owner"],

      tower_approval_required:
        false,

      owner_approval_required:
        false,

      document_slots:
        [],

      sections: [

        section(
          "document",
          "Document",
          [

            field({
              field_id:
                "subject_type",

              label:
                "Subject type",

              type:
                "select",

              required:
                true,

              options:
                SUBJECT_OPTIONS,
            }),

            field({
              field_id:
                "subject_name",

              label:
                "Person / vendor / workflow",

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
                options(
                  BUSINESS_OPTIONS
                ),
            }),

            field({
              field_id:
                "document_category",

              label:
                "Document category",

              type:
                "select",

              required:
                true,

              options:
                DOCUMENT_CATEGORY_OPTIONS,
            }),

            field({
              field_id:
                "document_label",

              label:
                "Document",

              required:
                true,
            }),

            field({
              field_id:
                "capture_reference",

              label:
                "Capture / workflow reference",

              help_text:
                "Optional reference only. This is not a Vault URL or raw-file path.",
            }),

          ]
        ),


        section(
          "review",
          "Human review",
          [

            field({
              field_id:
                "verification_result",

              label:
                "Review result",

              type:
                "select",

              required:
                true,

              options:
                options([
                  ["accepted_for_workflow", "Accepted for workflow"],
                  ["needs_correction", "Needs correction"],
                  ["replacement_required", "Replacement required"],
                  ["unable_to_verify", "Unable to verify"],
                ]),
            }),

            field({
              field_id:
                "review_note",

              label:
                "Review note",

              type:
                "textarea",

              required:
                true,
            }),

          ],
          "This review records Teller workflow status only. It does not create a Vault verification or legal certification."
        ),

      ],
    },

  ]);
