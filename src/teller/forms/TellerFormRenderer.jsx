import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createTellerFormDraft,
  updateTellerDraft,
  createTellerFormSubmissionPacket,
} from "./tellerFormState.js";

import {
  isTellerFieldVisible,
  validateTellerFormValues,
  getTellerFormCompletion,
} from "./tellerFormValidation.js";


function sensitivityLabel(value) {
  const labels = {
    normal: "",
    internal: "Internal",
    restricted: "Restricted",
    owner_only: "Owner only",
    tower_review: "Tower review",
  };

  return labels[value] || "";
}


function TellerField({
  field,
  value,
  error,
  onChange,
}) {
  const common = {
    id: field.field_id,
    name: field.field_id,
    value: value ?? "",
    placeholder: field.placeholder || "",
    onChange: (event) => {
      if (field.type === "checkbox") {
        onChange(
          event.target.checked
            ? "yes"
            : ""
        );

        return;
      }

      onChange(event.target.value);
    },
  };

  let control = null;

  if (field.type === "textarea") {
    control = (
      <textarea
        {...common}
        rows={4}
      />
    );
  } else if (field.type === "select") {
    control = (
      <select {...common}>
        <option value="">
          Select…
        </option>

        {(field.options || []).map(
          (item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          )
        )}
      </select>
    );
  } else if (field.type === "checkbox") {
    control = (
      <input
        id={field.field_id}
        name={field.field_id}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) =>
          onChange(
            event.target.checked
              ? "yes"
              : ""
          )
        }
      />
    );
  } else {
    const htmlType = {
      text: "text",
      email: "email",
      tel: "tel",
      date: "date",
      time: "time",
      number: "number",
      currency: "number",
    }[field.type] || "text";

    control = (
      <input
        {...common}
        type={htmlType}
        min={
          field.min ?? undefined
        }
        max={
          field.max ?? undefined
        }
        step={
          field.step ??
          (
            field.type === "currency"
              ? "0.01"
              : undefined
          )
        }
      />
    );
  }

  const sensitivity =
    sensitivityLabel(
      field.sensitivity
    );

  return (
    <div
      className={
        `teller-form-field ${
          error
            ? "has-error"
            : ""
        }`
      }
    >
      <div className="teller-form-label-row">
        <label htmlFor={field.field_id}>
          {field.label}
          {field.required ? (
            <span aria-hidden="true">
              {" "}*
            </span>
          ) : null}
        </label>

        {sensitivity ? (
          <span className="teller-form-sensitive-chip">
            {sensitivity}
          </span>
        ) : null}
      </div>

      {control}

      {field.help_text ? (
        <small>
          {field.help_text}
        </small>
      ) : null}

      {error ? (
        <p className="teller-form-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}


export default function TellerFormRenderer({
  form,
  role,
  actor,
  business,
  initialValues = {},
  onDraftChange,
  onPrepared,
  onBack,
}) {
  const [draft, setDraft] =
    useState(() =>
      createTellerFormDraft({
        form_id: form.form_id,
        role,
        actor,
        business,
        values: initialValues,
      })
    );

  const [showErrors, setShowErrors] =
    useState(false);

  const validation = useMemo(
    () =>
      validateTellerFormValues(
        form,
        draft.values
      ),
    [form, draft.values]
  );

  const completion = useMemo(
    () =>
      getTellerFormCompletion(
        form,
        draft.values
      ),
    [form, draft.values]
  );

  useEffect(() => {
    onDraftChange?.(
      form.form_id,
      draft.values
    );
  }, [
    draft.values,
    form.form_id,
    onDraftChange,
  ]);


  function updateField(
    field_id,
    value
  ) {
    setDraft(
      (current) =>
        updateTellerDraft(
          current,
          field_id,
          value
        )
    );
  }


  function prepareWorkflow() {
    setShowErrors(true);

    if (!validation.valid) {
      return;
    }

    const packet =
      createTellerFormSubmissionPacket(
        draft
      );

    onPrepared?.(packet);
  }


  return (
    <section className="teller-form-renderer">
      <div className="teller-form-renderer-head">
        <div>
          <button
            type="button"
            className="teller-form-back"
            onClick={onBack}
          >
            ← Forms
          </button>

          <p className="teller-form-kicker">
            {form.category}
          </p>

          <h2>
            {form.title}
          </h2>

          <p>
            {form.description}
          </p>
        </div>

        <div className="teller-form-progress">
          <strong>
            {
              completion
                .completed_required_count
            }
            /
            {
              completion
                .required_count
            }
          </strong>

          <span>
            required fields
          </span>
        </div>
      </div>

      {form.tower_approval_required ? (
        <div className="teller-form-protected-note">
          <strong>
            Tower review required
          </strong>

          <span>
            This workflow contains protected
            information or authority.
          </span>
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          prepareWorkflow();
        }}
      >
        {form.sections.map(
          (formSection) => (
            <section
              key={formSection.section_id}
              className="teller-form-section"
            >
              <div className="teller-form-section-head">
                <h3>
                  {formSection.title}
                </h3>

                {formSection.description ? (
                  <p>
                    {
                      formSection
                        .description
                    }
                  </p>
                ) : null}
              </div>

              <div className="teller-form-grid">
                {formSection.fields
                  .filter(
                    (field) =>
                      isTellerFieldVisible(
                        field,
                        draft.values
                      )
                  )
                  .map((field) => (
                    <TellerField
                      key={field.field_id}
                      field={field}
                      value={
                        draft.values[
                          field.field_id
                        ]
                      }
                      error={
                        showErrors
                          ? validation
                              .field_errors[
                                field.field_id
                              ]?.[0]
                          : ""
                      }
                      onChange={(value) =>
                        updateField(
                          field.field_id,
                          value
                        )
                      }
                    />
                  ))}
              </div>
            </section>
          )
        )}

        <div className="teller-form-footer">
          <div>
            <strong>
              Draft status:
            </strong>

            <span>
              {" "}
              {draft.status
                .replaceAll("_", " ")}
            </span>

            <small>
              Draft values stay in this
              open Teller session only.
            </small>
          </div>

          <div className="teller-form-footer-actions">
            <button
              type="button"
              className="teller-form-secondary"
              onClick={onBack}
            >
              Back
            </button>

            <button
              type="submit"
              className="teller-form-primary"
            >
              Prepare workflow
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
