import React, {
  useMemo,
  useState,
} from "react";

import {
  listTellerFormsForRole,
} from "./tellerFormRegistry.js";

import {
  buildTellerSubmissionSummary,
} from "./tellerFormState.js";

import TellerFormRenderer
  from "./TellerFormRenderer.jsx";

import "./tellerForms.css";


const CATEGORY_LABELS = {
  people: "People",
  payroll: "Payroll",
  payments: "Payments",
  vendors: "Vendors",
  documents: "Documents",
};


function formMatchesSearch(
  form,
  search
) {
  if (!search.trim()) {
    return true;
  }

  const query =
    search.trim().toLowerCase();

  return [
    form.title,
    form.short_title,
    form.description,
    form.category,
    form.workflow_type,
  ]
    .filter(Boolean)
    .some(
      (value) =>
        String(value)
          .toLowerCase()
          .includes(query)
    );
}


export default function TellerFormsWorkspace({
  open,
  onClose,
  role,
  towerSession,
}) {
  const [selectedFormId, setSelectedFormId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [draftValues, setDraftValues] =
    useState({});

  const [preparedPackets, setPreparedPackets] =
    useState([]);


  const forms = useMemo(
    () =>
      listTellerFormsForRole(
        role
      ),
    [role]
  );


  const visibleForms = useMemo(
    () =>
      forms.filter(
        (form) =>
          formMatchesSearch(
            form,
            search
          )
      ),
    [forms, search]
  );


  const selectedForm =
    forms.find(
      (form) =>
        form.form_id ===
        selectedFormId
    ) || null;


  function updateDraft(
    formId,
    values
  ) {
    setDraftValues(
      (current) => ({
        ...current,
        [formId]: values,
      })
    );
  }


  function preparePacket(packet) {
    setPreparedPackets(
      (current) => [
        packet,
        ...current.filter(
          (item) =>
            item.submission_id !==
            packet.submission_id
        ),
      ].slice(0, 10)
    );

    setSelectedFormId("");
  }


  function closeWorkspace() {
    setSelectedFormId("");
    onClose?.();
  }


  if (!open) {
    return null;
  }


  return (
    <div
      className="teller-forms-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Forms and requests"
    >
      <section className="teller-forms-shell">
        <header className="teller-forms-header">
          <div>
            <p className="teller-form-kicker">
              The Teller
            </p>

            <h1>
              Forms & Requests
            </h1>

            <p>
              Start the real workflow here.
              Teller only shows forms your
              Tower-issued role can use.
            </p>
          </div>

          <button
            type="button"
            className="teller-forms-close"
            onClick={closeWorkspace}
            aria-label="Close forms"
          >
            ×
          </button>
        </header>

        {selectedForm ? (
          <TellerFormRenderer
            key={selectedForm.form_id}
            form={selectedForm}
            role={role}
            actor={
              towerSession?.actor || {}
            }
            business={
              towerSession?.business || {}
            }
            initialValues={
              draftValues[
                selectedForm.form_id
              ] || {}
            }
            onDraftChange={
              updateDraft
            }
            onPrepared={
              preparePacket
            }
            onBack={() =>
              setSelectedFormId("")
            }
          />
        ) : (
          <>
            <section className="teller-form-launcher">
              <div className="teller-form-launcher-top">
                <div>
                  <p className="teller-form-kicker">
                    + New
                  </p>

                  <h2>
                    What do you need to do?
                  </h2>
                </div>

                <label className="teller-form-search">
                  <span>
                    Find a form
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search forms"
                  />
                </label>
              </div>

              <div className="teller-form-card-grid">
                {visibleForms.map(
                  (form) => {
                    const hasDraft =
                      Boolean(
                        Object.keys(
                          draftValues[
                            form.form_id
                          ] || {}
                        ).length
                      );

                    return (
                      <button
                        type="button"
                        className="teller-form-card"
                        key={form.form_id}
                        onClick={() =>
                          setSelectedFormId(
                            form.form_id
                          )
                        }
                      >
                        <span>
                          {
                            CATEGORY_LABELS[
                              form.category
                            ] ||
                            form.category
                          }
                        </span>

                        <strong>
                          {form.short_title}
                        </strong>

                        <p>
                          {form.description}
                        </p>

                        <div className="teller-form-card-bottom">
                          {hasDraft ? (
                            <small>
                              Draft in this session
                            </small>
                          ) : (
                            <small>
                              Blank form
                            </small>
                          )}

                          {form.tower_approval_required ? (
                            <small>
                              Tower review
                            </small>
                          ) : null}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              {!visibleForms.length ? (
                <article className="teller-form-empty">
                  <strong>
                    No forms match that search.
                  </strong>

                  <p>
                    Try another word or clear
                    the search.
                  </p>
                </article>
              ) : null}
            </section>

            <section className="teller-form-prepared">
              <div>
                <p className="teller-form-kicker">
                  Prepared this session
                </p>

                <h2>
                  Workflow packets
                </h2>

                <p>
                  Preparing a packet does not
                  claim it reached a server,
                  The Tower, payroll, a bank,
                  or The Vault.
                </p>
              </div>

              {preparedPackets.length ? (
                <div className="teller-form-prepared-list">
                  {preparedPackets.map(
                    (packet) => {
                      const summary =
                        buildTellerSubmissionSummary(
                          packet
                        );

                      return (
                        <article
                          key={
                            packet.submission_id
                          }
                        >
                          <strong>
                            {packet.form_id
                              .replaceAll(
                                "_",
                                " "
                              )}
                          </strong>

                          <span>
                            {
                              summary
                                .submission_status
                                .replaceAll(
                                  "_",
                                  " "
                                )
                            }
                          </span>

                          {summary
                            .owner_approval_required ? (
                            <small>
                              Owner approval
                              required
                            </small>
                          ) : null}

                          {summary
                            .tower_approval_required ? (
                            <small>
                              Tower review
                              required
                            </small>
                          ) : null}
                        </article>
                      );
                    }
                  )}
                </div>
              ) : (
                <article className="teller-form-empty">
                  <strong>
                    Nothing prepared yet.
                  </strong>

                  <p>
                    Start a form above.
                  </p>
                </article>
              )}
            </section>
          </>
        )}
      </section>
    </div>
  );
}
