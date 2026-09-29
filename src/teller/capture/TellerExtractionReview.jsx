import React, {
  useMemo,
  useState,
} from "react";

import {
  acceptTellerExtractionField,
  rejectTellerExtractionField,
  resetTellerExtractionDecision,
  tellerExtractionConfidenceCopy,
  tellerExtractionNeedsAttention,
  updateTellerExtractionValue,
  getTellerExtractionReviewSummary,
} from "./tellerExtractionVerification.js";

import {
  buildVerifiedTellerAutofillPacket,
} from "./tellerCaptureAutofill.js";


function ExtractionFieldRow({
  field,
  role,
  onChange,
}) {
  const needsAttention =
    tellerExtractionNeedsAttention(
      field
    );


  return (
    <article
      className={
        `teller-extraction-field ${
          needsAttention
            ? "needs-attention"
            : ""
        }`
      }
    >

      <div className="teller-extraction-field-head">

        <div>
          <small>
            {field.label}
          </small>

          <strong>
            {
              tellerExtractionConfidenceCopy(
                field
              )
            }
          </strong>
        </div>


        <span>
          {
            field.confidence === null
              ? "—"
              : `${Math.round(
                  field.confidence * 100
                )}%`
          }
        </span>

      </div>


      <label>
        <span>
          Review value
        </span>

        <input
          type="text"

          value={
            field.reviewed_value || ""
          }

          onChange={(event) =>
            onChange(
              updateTellerExtractionValue(
                field,
                event.target.value
              )
            )
          }
        />
      </label>


      {field.original_value !==
      field.reviewed_value ? (
        <p className="teller-extraction-original">
          Extracted:
          {" "}
          {field.original_value || "—"}
        </p>
      ) : null}


      <div className="teller-extraction-actions">

        <button
          type="button"

          className={
            field.decision ===
            "accepted"
              ? "is-selected"
              : ""
          }

          onClick={() =>
            onChange(
              acceptTellerExtractionField(
                field,
                role
              )
            )
          }

          disabled={
            !String(
              field.reviewed_value || ""
            ).trim()
          }
        >
          Accept
        </button>


        <button
          type="button"

          className={
            field.decision ===
            "rejected"
              ? "is-selected danger"
              : ""
          }

          onClick={() =>
            onChange(
              rejectTellerExtractionField(
                field,
                role
              )
            )
          }
        >
          Reject
        </button>


        {field.decision !==
        "pending" ? (
          <button
            type="button"

            onClick={() =>
              onChange(
                resetTellerExtractionDecision(
                  field
                )
              )
            }
          >
            Undo
          </button>
        ) : null}

      </div>

    </article>
  );
}


export default function TellerExtractionReview({
  role,
  capture,
  mapping,
  onAutofillReady,
}) {
  const [
    fields,
    setFields,
  ] = useState(
    () => [
      ...(mapping?.mapped_fields || []),
    ]
  );


  const summary =
    useMemo(
      () =>
        getTellerExtractionReviewSummary(
          fields
        ),
      [fields]
    );


  function replaceField(
    index,
    nextField
  ) {
    setFields(
      (current) =>
        current.map(
          (field, fieldIndex) =>
            fieldIndex === index
              ? nextField
              : field
        )
    );
  }


  function prepareAutofill() {
    const packet =
      buildVerifiedTellerAutofillPacket({
        capture_id:
          capture.capture_id,

        fingerprint:
          capture.fingerprint,

        document_type:
          capture.confirmed_document_type,

        form:
          mapping.form,

        mapped_fields:
          fields,

        reviewer_role:
          role,
      });


    onAutofillReady?.(
      packet
    );
  }


  if (
    !mapping?.form ||
    !fields.length
  ) {
    return (
      <section className="teller-extraction-empty">
        <strong>
          No extracted form fields to review.
        </strong>

        <p>
          Teller will never invent values.
          A configured extraction provider must
          return supported fields before autofill
          can begin.
        </p>
      </section>
    );
  }


  return (
    <section className="teller-extraction-review">

      <div className="teller-extraction-review-head">

        <div>
          <p className="teller-capture-kicker">
            Extracted fields
          </p>

          <h3>
            Verify before autofill
          </h3>

          <p>
            Correct every value, then accept
            or reject every suggestion.
          </p>
        </div>


        <div className="teller-extraction-count">
          <strong>
            {summary.accepted}
            /
            {summary.total}
          </strong>

          <span>
            accepted
          </span>
        </div>

      </div>


      <div className="teller-extraction-fields">

        {fields.map(
          (field, index) => (
            <ExtractionFieldRow
              key={
                `${field.extraction_key}-${index}`
              }

              field={field}

              role={role}

              onChange={(nextField) =>
                replaceField(
                  index,
                  nextField
                )
              }
            />
          )
        )}

      </div>


      <div className="teller-extraction-summary">

        <span>
          Accepted: {summary.accepted}
        </span>

        <span>
          Rejected: {summary.rejected}
        </span>

        <span>
          Pending: {summary.pending}
        </span>

      </div>


      <button
        type="button"

        className="teller-capture-prepare"

        disabled={
          !summary.complete
        }

        onClick={
          prepareAutofill
        }
      >
        Open verified form
      </button>

    </section>
  );
}
