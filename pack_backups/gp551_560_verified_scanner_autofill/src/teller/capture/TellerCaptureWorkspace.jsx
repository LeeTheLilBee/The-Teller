import React, {
  useMemo,
  useState,
} from "react";

import {
  TELLER_DOCUMENT_TYPES,
  listTellerDocumentTypesForRole,
} from "./tellerCaptureTypes.js";

import {
  buildTellerCaptureMetadata,
  formatTellerCaptureSize,
  validateTellerCaptureFile,
} from "./tellerCaptureValidation.js";

import {
  fingerprintTellerFile,
  isDuplicateTellerCapture,
  shortTellerFingerprint,
} from "./tellerCaptureFingerprint.js";

import {
  classifyTellerCapture,
  tellerClassificationConfidenceLabel,
} from "./tellerCaptureClassifier.js";

import {
  createTellerCaptureReview,
  reviewTellerCaptureDocumentType,
  buildPreparedTellerCapture,
} from "./tellerCaptureReview.js";

import {
  getTellerCaptureFormSuggestion,
} from "./tellerCaptureMapping.js";

import "./tellerCapture.css";


function labelForDocumentType(
  options,
  value
) {
  return (
    options.find(
      (item) =>
        item.value === value
    )?.label ||
    value ||
    "Unknown"
  );
}


export default function TellerCaptureWorkspace({
  open,
  onClose,
  role,
}) {
  const documentTypeOptions =
    useMemo(
      () =>
        listTellerDocumentTypesForRole(
          role
        ),
      [role]
    );


  const [
    requestedDocumentType,
    setRequestedDocumentType,
  ] = useState(
    TELLER_DOCUMENT_TYPES.AUTO
  );


  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);


  const [
    source,
    setSource,
  ] = useState("");


  const [
    validation,
    setValidation,
  ] = useState(null);


  const [
    fingerprint,
    setFingerprint,
  ] = useState("");


  const [
    classification,
    setClassification,
  ] = useState(null);


  const [
    confirmedDocumentType,
    setConfirmedDocumentType,
  ] = useState("");


  const [
    reviewed,
    setReviewed,
  ] = useState(false);


  const [
    duplicate,
    setDuplicate,
  ] = useState(false);


  const [
    processing,
    setProcessing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    preparedCaptures,
    setPreparedCaptures,
  ] = useState([]);


  const fingerprints =
    useMemo(
      () =>
        preparedCaptures.map(
          (item) =>
            item.fingerprint
        ),
      [preparedCaptures]
    );


  const metadata =
    selectedFile
      ? buildTellerCaptureMetadata(
          selectedFile,
          source
        )
      : null;


  const formSuggestion =
    useMemo(
      () =>
        getTellerCaptureFormSuggestion(
          confirmedDocumentType,
          role
        ),
      [
        confirmedDocumentType,
        role,
      ]
    );


  function resetCurrentCapture() {
    setSelectedFile(null);
    setSource("");
    setValidation(null);
    setFingerprint("");
    setClassification(null);
    setConfirmedDocumentType("");
    setReviewed(false);
    setDuplicate(false);
    setProcessing(false);
    setError("");
    setRequestedDocumentType(
      TELLER_DOCUMENT_TYPES.AUTO
    );
  }


  async function processFile(
    file,
    captureSource
  ) {
    setError("");
    setProcessing(true);

    setSelectedFile(
      file || null
    );

    setSource(
      captureSource
    );

    setReviewed(false);
    setConfirmedDocumentType("");
    setFingerprint("");
    setDuplicate(false);


    const result =
      validateTellerCaptureFile(
        file
      );

    setValidation(
      result
    );


    if (!result.valid) {
      setClassification(null);
      setProcessing(false);

      return;
    }


    try {
      const hash =
        await fingerprintTellerFile(
          file
        );

      const duplicateFound =
        isDuplicateTellerCapture(
          hash,
          fingerprints
        );

      const documentClassification =
        classifyTellerCapture(
          buildTellerCaptureMetadata(
            file,
            captureSource
          ),
          requestedDocumentType
        );


      setFingerprint(
        hash
      );

      setDuplicate(
        duplicateFound
      );

      setClassification(
        documentClassification
      );

      setConfirmedDocumentType(
        documentClassification
          .suggested_document_type
      );


      if (duplicateFound) {
        setError(
          "This document matches a capture already prepared in this Teller session."
        );
      }

    } catch (captureError) {
      setError(
        String(
          captureError?.message ||
          captureError
        )
      );
    } finally {
      setProcessing(false);
    }
  }


  function changeDocumentType(
    nextType
  ) {
    setRequestedDocumentType(
      nextType
    );

    setReviewed(false);


    if (!metadata) {
      setConfirmedDocumentType(
        nextType ===
          TELLER_DOCUMENT_TYPES.AUTO
          ? ""
          : nextType
      );

      return;
    }


    const nextClassification =
      classifyTellerCapture(
        metadata,
        nextType
      );


    setClassification(
      nextClassification
    );

    setConfirmedDocumentType(
      nextClassification
        .suggested_document_type
    );
  }


  function prepareCapture() {
    if (
      !selectedFile ||
      !validation?.valid ||
      !fingerprint ||
      duplicate ||
      !confirmedDocumentType ||
      !reviewed
    ) {
      return;
    }


    let review =
      createTellerCaptureReview({
        metadata,
        fingerprint,
        duplicate,
        classification,
      });


    review =
      reviewTellerCaptureDocumentType(
        review,
        {
          document_type:
            confirmedDocumentType,

          reviewer_role:
            role,
        }
      );


    const suggestion =
      getTellerCaptureFormSuggestion(
        confirmedDocumentType,
        role
      );


    const prepared =
      buildPreparedTellerCapture(
        review,
        suggestion
      );


    setPreparedCaptures(
      (current) => [
        prepared,
        ...current,
      ].slice(0, 20)
    );


    resetCurrentCapture();
  }


  if (!open) {
    return null;
  }


  return (
    <div
      className="teller-capture-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Teller Capture"
    >

      <aside className="teller-capture-drawer">

        <header className="teller-capture-header">

          <div>
            <p className="teller-capture-kicker">
              The Teller
            </p>

            <h1>
              Capture
            </h1>

            <p>
              Scan with your camera or choose
              an image/PDF. Nothing leaves
              this browser in this pack.
            </p>
          </div>


          <button
            type="button"
            className="teller-capture-close"
            onClick={onClose}
            aria-label="Close Capture"
          >
            ×
          </button>

        </header>


        <section className="teller-capture-actions">

          <label className="teller-capture-action">

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => {
                const file =
                  event.target
                    .files?.[0];

                if (file) {
                  processFile(
                    file,
                    "camera"
                  );
                }

                event.target.value = "";
              }}
            />

            <strong>
              Scan with camera
            </strong>

            <span>
              Take a document photo
            </span>

          </label>


          <label className="teller-capture-action">

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              onChange={(event) => {
                const file =
                  event.target
                    .files?.[0];

                if (file) {
                  processFile(
                    file,
                    file.type ===
                      "application/pdf"
                      ? "pdf_upload"
                      : "image_upload"
                  );
                }

                event.target.value = "";
              }}
            />

            <strong>
              Upload image or PDF
            </strong>

            <span>
              JPG, PNG, WEBP, PDF · 25 MB max
            </span>

          </label>

        </section>


        <section className="teller-capture-type">

          <label htmlFor="teller-capture-document-type">
            Document type
          </label>

          <select
            id="teller-capture-document-type"
            value={requestedDocumentType}
            onChange={(event) =>
              changeDocumentType(
                event.target.value
              )
            }
          >
            {documentTypeOptions.map(
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

        </section>


        {processing ? (
          <article className="teller-capture-status">
            <strong>
              Reading document metadata…
            </strong>

            <span>
              Teller is creating a local
              SHA-256 fingerprint.
            </span>
          </article>
        ) : null}


        {validation &&
        !validation.valid ? (
          <article className="teller-capture-error">
            <strong>
              This file cannot be used.
            </strong>

            {validation.problems.map(
              (problem) => (
                <span key={problem}>
                  {problem}
                </span>
              )
            )}
          </article>
        ) : null}


        {error ? (
          <article className="teller-capture-error">
            <strong>
              Capture needs attention.
            </strong>

            <span>
              {error}
            </span>
          </article>
        ) : null}


        {metadata &&
        validation?.valid ? (
          <>

            <section className="teller-capture-review">

              <div className="teller-capture-section-head">
                <div>
                  <p className="teller-capture-kicker">
                    Review
                  </p>

                  <h2>
                    Check this document
                  </h2>
                </div>

                <button
                  type="button"
                  className="teller-capture-clear"
                  onClick={resetCurrentCapture}
                >
                  Clear
                </button>
              </div>


              <div className="teller-capture-metadata">

                <div>
                  <small>
                    File
                  </small>

                  <strong>
                    {metadata.name}
                  </strong>
                </div>


                <div>
                  <small>
                    Type
                  </small>

                  <strong>
                    {metadata.mime_type}
                  </strong>
                </div>


                <div>
                  <small>
                    Size
                  </small>

                  <strong>
                    {
                      formatTellerCaptureSize(
                        metadata.size_bytes
                      )
                    }
                  </strong>
                </div>


                <div>
                  <small>
                    Source
                  </small>

                  <strong>
                    {
                      metadata.source
                        .replaceAll(
                          "_",
                          " "
                        )
                    }
                  </strong>
                </div>


                <div>
                  <small>
                    Fingerprint
                  </small>

                  <strong>
                    {
                      shortTellerFingerprint(
                        fingerprint
                      ) || "Calculating…"
                    }
                  </strong>
                </div>


                <div>
                  <small>
                    Duplicate
                  </small>

                  <strong>
                    {
                      duplicate
                        ? "Yes — blocked"
                        : "No match this session"
                    }
                  </strong>
                </div>

              </div>


              {classification ? (
                <article className="teller-capture-classification">

                  <div>
                    <small>
                      Teller suggestion
                    </small>

                    <strong>
                      {
                        labelForDocumentType(
                          documentTypeOptions,
                          classification
                            .suggested_document_type
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      Suggestion quality
                    </small>

                    <strong>
                      {
                        tellerClassificationConfidenceLabel(
                          classification
                            .confidence
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      Source
                    </small>

                    <strong>
                      {
                        classification
                          .source
                          .replaceAll(
                            "_",
                            " "
                          )
                      }
                    </strong>
                  </div>

                </article>
              ) : null}


              <label className="teller-capture-confirm-type">

                <span>
                  Confirm document type
                </span>

                <select
                  value={confirmedDocumentType}
                  onChange={(event) => {
                    setConfirmedDocumentType(
                      event.target.value
                    );

                    setReviewed(false);
                  }}
                >
                  <option value="">
                    Choose document type
                  </option>

                  {documentTypeOptions
                    .filter(
                      (item) =>
                        item.value !==
                        TELLER_DOCUMENT_TYPES.AUTO
                    )
                    .map(
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

              </label>


              <label className="teller-capture-human-review">

                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(event) =>
                    setReviewed(
                      event.target.checked
                    )
                  }
                />

                <span>
                  I reviewed the document type.
                  Teller suggestions are not accepted
                  as truth automatically.
                </span>

              </label>


              <section className="teller-capture-ocr">

                <div>
                  <small>
                    OCR / extraction
                  </small>

                  <strong>
                    Not connected
                  </strong>
                </div>

                <p>
                  No text or fields have been
                  extracted from this document.
                  A production OCR adapter will
                  plug into this boundary later.
                </p>

              </section>


              <section className="teller-capture-suggestion">

                <small>
                  Suggested Teller workflow
                </small>

                {formSuggestion ? (
                  <>
                    <strong>
                      {
                        formSuggestion
                          .short_title
                      }
                    </strong>

                    <p>
                      Teller can suggest the form,
                      but this pack does not autofill
                      it or attach the file.
                    </p>
                  </>
                ) : (
                  <>
                    <strong>
                      No role-safe form suggestion
                    </strong>

                    <p>
                      You can still prepare the
                      capture metadata after review.
                    </p>
                  </>
                )}

              </section>


              <button
                type="button"
                className="teller-capture-prepare"
                disabled={
                  !reviewed ||
                  !confirmedDocumentType ||
                  duplicate ||
                  !fingerprint ||
                  processing
                }
                onClick={prepareCapture}
              >
                Prepare capture record
              </button>

            </section>

          </>
        ) : null}


        <section className="teller-capture-prepared">

          <div>
            <p className="teller-capture-kicker">
              Prepared this session
            </p>

            <h2>
              Capture records
            </h2>

            <p>
              These records contain metadata
              and review status only. The raw
              documents are not uploaded or saved.
            </p>
          </div>


          {preparedCaptures.length ? (
            <div className="teller-capture-prepared-list">

              {preparedCaptures.map(
                (capture) => (
                  <article
                    key={capture.capture_id}
                  >

                    <div>
                      <strong>
                        {
                          capture
                            .metadata
                            .name
                        }
                      </strong>

                      <span>
                        {
                          labelForDocumentType(
                            documentTypeOptions,
                            capture
                              .confirmed_document_type
                          )
                        }
                      </span>
                    </div>


                    <div>
                      <small>
                        OCR
                      </small>

                      <strong>
                        Not connected
                      </strong>
                    </div>


                    <div>
                      <small>
                        Uploaded
                      </small>

                      <strong>
                        No
                      </strong>
                    </div>


                    <div>
                      <small>
                        Suggested workflow
                      </small>

                      <strong>
                        {
                          capture
                            .form_suggestion
                            ?.short_title ||
                          "None"
                        }
                      </strong>
                    </div>

                  </article>
                )
              )}

            </div>
          ) : (
            <article className="teller-capture-empty">
              <strong>
                No documents prepared yet.
              </strong>

              <p>
                Scan or choose a document above.
              </p>
            </article>
          )}

        </section>

      </aside>
    </div>
  );
}
