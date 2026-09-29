import {
  getTellerFormFields,
} from "./tellerFormSchema.js";


function text(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}


export function tellerConditionMatches(
  condition,
  values = {}
) {
  if (!condition) {
    return true;
  }

  const current = values[condition.field];

  if (
    Object.prototype.hasOwnProperty.call(
      condition,
      "equals"
    )
  ) {
    return current === condition.equals;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      condition,
      "not_equals"
    )
  ) {
    return current !== condition.not_equals;
  }

  if (Array.isArray(condition.in)) {
    return condition.in.includes(current);
  }

  if (Array.isArray(condition.not_in)) {
    return !condition.not_in.includes(current);
  }

  return true;
}


export function isTellerFieldVisible(
  field,
  values = {}
) {
  return tellerConditionMatches(
    field.show_when,
    values
  );
}


export function isTellerFieldRequired(
  field,
  values = {}
) {
  if (field.required) {
    return true;
  }

  if (!field.required_when) {
    return false;
  }

  return tellerConditionMatches(
    field.required_when,
    values
  );
}


export function validateTellerFieldValue(
  field,
  value,
  values = {}
) {
  const errors = [];

  if (!isTellerFieldVisible(field, values)) {
    return errors;
  }

  const required =
    isTellerFieldRequired(field, values);

  const cleaned = text(value);

  if (required && !cleaned) {
    errors.push(`${field.label} is required.`);
    return errors;
  }

  if (!cleaned) {
    return errors;
  }

  if (
    field.type === "email" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)
  ) {
    errors.push(
      `${field.label} must be a valid email address.`
    );
  }

  if (
    ["number", "currency"].includes(field.type)
  ) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      errors.push(
        `${field.label} must be a number.`
      );
    }

    if (
      field.min !== null &&
      field.min !== undefined &&
      numeric < Number(field.min)
    ) {
      errors.push(
        `${field.label} must be at least ${field.min}.`
      );
    }

    if (
      field.max !== null &&
      field.max !== undefined &&
      numeric > Number(field.max)
    ) {
      errors.push(
        `${field.label} must be no more than ${field.max}.`
      );
    }
  }

  return errors;
}


export function validateTellerFormValues(
  form,
  values = {}
) {
  const field_errors = {};

  getTellerFormFields(form).forEach((field) => {
    const errors = validateTellerFieldValue(
      field,
      values[field.field_id],
      values
    );

    if (errors.length) {
      field_errors[field.field_id] = errors;
    }
  });

  return {
    valid: Object.keys(field_errors).length === 0,
    field_errors,
    error_count: Object.values(field_errors)
      .flat()
      .length,
  };
}


export function getTellerFormCompletion(
  form,
  values = {}
) {
  const fields = getTellerFormFields(form)
    .filter(
      (field) =>
        isTellerFieldVisible(field, values)
    );

  const required = fields.filter(
    (field) =>
      isTellerFieldRequired(field, values)
  );

  const completedRequired = required.filter(
    (field) =>
      text(values[field.field_id])
  );

  return {
    required_count: required.length,
    completed_required_count:
      completedRequired.length,

    complete:
      required.length ===
      completedRequired.length,
  };
}
