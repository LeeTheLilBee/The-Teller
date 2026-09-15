export const TELLER_FORM_SCHEMA_VERSION = "1.0.0";


export const TELLER_FORM_ROLES = Object.freeze([
  "employee",
  "manager",
  "owner",
]);


export const TELLER_FORM_FIELD_TYPES = Object.freeze([
  "text",
  "textarea",
  "email",
  "tel",
  "date",
  "time",
  "number",
  "currency",
  "select",
  "checkbox",
]);


export const TELLER_FIELD_SENSITIVITY = Object.freeze({
  NORMAL: "normal",
  INTERNAL: "internal",
  RESTRICTED: "restricted",
  OWNER_ONLY: "owner_only",
  TOWER_REVIEW: "tower_review",
});


export const TELLER_FORM_STATUSES = Object.freeze({
  DRAFT: "draft",
  INCOMPLETE: "incomplete",
  READY: "ready_to_submit",
  READY_FOR_TRANSPORT: "ready_for_workflow_transport",
  SUBMITTED: "submitted",
  NEEDS_CORRECTION: "needs_correction",
  AWAITING_APPROVAL: "awaiting_approval",
  ACCEPTED: "accepted",
  CLOSED: "closed",
});


export const TELLER_FORM_CATEGORIES = Object.freeze([
  "people",
  "payroll",
  "payments",
  "vendors",
  "documents",
]);


function clean(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}


export function isSupportedTellerRole(role) {
  return TELLER_FORM_ROLES.includes(
    clean(role).toLowerCase()
  );
}


export function isSupportedTellerFieldType(type) {
  return TELLER_FORM_FIELD_TYPES.includes(
    clean(type).toLowerCase()
  );
}


export function validateTellerFormDefinition(form) {
  const problems = [];

  if (!form || typeof form !== "object") {
    return {
      valid: false,
      problems: ["Form definition must be an object."],
    };
  }

  if (!clean(form.form_id)) {
    problems.push("form_id is required.");
  }

  if (!clean(form.version)) {
    problems.push("version is required.");
  }

  if (!clean(form.title)) {
    problems.push("title is required.");
  }

  if (!clean(form.category)) {
    problems.push("category is required.");
  }

  if (
    !Array.isArray(form.allowed_roles) ||
    !form.allowed_roles.length
  ) {
    problems.push("allowed_roles must contain at least one role.");
  } else {
    const unsupported = form.allowed_roles.filter(
      (role) => !isSupportedTellerRole(role)
    );

    if (unsupported.length) {
      problems.push(
        `Unsupported roles: ${unsupported.join(", ")}`
      );
    }
  }

  if (
    !Array.isArray(form.sections) ||
    !form.sections.length
  ) {
    problems.push("sections must contain at least one section.");
  }

  const fieldIds = new Set();

  (form.sections || []).forEach((section, sectionIndex) => {
    if (!clean(section.section_id)) {
      problems.push(
        `Section ${sectionIndex + 1} is missing section_id.`
      );
    }

    if (!clean(section.title)) {
      problems.push(
        `Section ${sectionIndex + 1} is missing title.`
      );
    }

    if (!Array.isArray(section.fields)) {
      problems.push(
        `Section ${sectionIndex + 1} fields must be an array.`
      );

      return;
    }

    section.fields.forEach((field, fieldIndex) => {
      if (!clean(field.field_id)) {
        problems.push(
          `Section ${sectionIndex + 1}, field ${fieldIndex + 1} is missing field_id.`
        );

        return;
      }

      if (fieldIds.has(field.field_id)) {
        problems.push(
          `Duplicate field_id: ${field.field_id}`
        );
      }

      fieldIds.add(field.field_id);

      if (!clean(field.label)) {
        problems.push(
          `${field.field_id} is missing label.`
        );
      }

      if (!isSupportedTellerFieldType(field.type)) {
        problems.push(
          `${field.field_id} has unsupported type: ${field.type}`
        );
      }

      if (
        field.type === "select" &&
        (!Array.isArray(field.options) || !field.options.length)
      ) {
        problems.push(
          `${field.field_id} select field requires options.`
        );
      }
    });
  });

  return {
    valid: problems.length === 0,
    problems,
  };
}


export function getTellerFormFields(form) {
  return (form?.sections || []).flatMap(
    (section) => section.fields || []
  );
}
