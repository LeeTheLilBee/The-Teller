import {
  getTellerFormDefinition,
} from "../forms/tellerFormRegistry.js";

import {
  getTellerCaptureFormSuggestion,
} from "./tellerCaptureMapping.js";

import {
  isForbiddenTellerExtractedField,
} from "./tellerExtractionSchema.js";


function getFormFieldIds(
  form
) {
  return new Set(
    (form?.sections || [])
      .flatMap(
        (section) =>
          section.fields || []
      )
      .map(
        (field) =>
          field.field_id
      )
  );
}


export function mapTellerExtractionToForm({
  document_type,
  role,
  extraction_fields = [],
}) {
  const suggestion =
    getTellerCaptureFormSuggestion(
      document_type,
      role
    );


  if (!suggestion) {
    return {
      form:
        null,

      mapped_fields:
        [],

      rejected_fields:
        extraction_fields.map(
          (field) => ({
            ...field,
            mapping_status:
              "no_role_safe_form",
          })
        ),
    };
  }


  const form =
    getTellerFormDefinition(
      suggestion.form_id
    );


  if (!form) {
    return {
      form:
        null,

      mapped_fields:
        [],

      rejected_fields:
        extraction_fields,
    };
  }


  const formFieldIds =
    getFormFieldIds(
      form
    );


  const mappedFields = [];
  const rejectedFields = [];


  (extraction_fields || [])
    .forEach(
      (field) => {
        if (
          isForbiddenTellerExtractedField(
            field.extraction_key
          ) ||
          isForbiddenTellerExtractedField(
            field.target_field
          )
        ) {
          rejectedFields.push({
            ...field,
            mapping_status:
              "forbidden_sensitive_field",
          });

          return;
        }


        if (
          !formFieldIds.has(
            field.target_field
          )
        ) {
          rejectedFields.push({
            ...field,
            mapping_status:
              "target_not_in_form",
          });

          return;
        }


        mappedFields.push({
          ...field,

          form_id:
            form.form_id,

          mapping_status:
            "mapped_pending_verification",
        });
      }
    );


  return {
    form: {
      form_id:
        form.form_id,

      title:
        form.title,

      short_title:
        form.short_title,

      workflow_type:
        form.workflow_type,
    },

    mapped_fields:
      mappedFields,

    rejected_fields:
      rejectedFields,
  };
}
