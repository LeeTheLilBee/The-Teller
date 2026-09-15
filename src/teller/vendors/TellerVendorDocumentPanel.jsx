import React, {
  useMemo,
} from "react";

import {
  getTellerVendorIntakeStatus,
  getTellerDocumentIntakeStatus,
} from "./tellerVendorDocumentIntake.js";

import {
  buildTellerVendorDocumentPreview,
} from "./tellerVendorDocumentModel.js";


function IntakeList({
  actions,
  onOpenForm,
}) {
  return (
    <div className="teller-vendor-document-actions">

      {actions.map(
        (action) => (
          <button
            type="button"

            key={
              action.action_id
            }

            onClick={() =>
              onOpenForm?.(
                action.form_id
              )
            }
          >

            <div>
              <strong>
                {action.label}
              </strong>

              <p>
                {action.description}
              </p>
            </div>


            <small>
              {
                action.prepared_count
                  ? `${action.prepared_count} prepared`
                  : "Open"
              }
            </small>

          </button>
        )
      )}

    </div>
  );
}


export default function TellerVendorDocumentPanel({
  role,
  preparedPackets = [],
  onOpenForm,
}) {
  const normalizedRole =
    String(role || "")
      .trim()
      .toLowerCase();


  const managerOrOwner =
    normalizedRole === "manager" ||
    normalizedRole === "owner";


  const vendor =
    useMemo(
      () =>
        getTellerVendorIntakeStatus(
          preparedPackets
        ),
      [preparedPackets]
    );


  const documents =
    useMemo(
      () =>
        getTellerDocumentIntakeStatus(
          preparedPackets
        ),
      [preparedPackets]
    );


  const preview =
    useMemo(
      () =>
        buildTellerVendorDocumentPreview(
          preparedPackets
        ),
      [preparedPackets]
    );


  const documentActions =
    documents.actions.filter(
      (action) => {
        if (
          normalizedRole === "employee"
        ) {
          return [
            "missing",
            "replacement",
          ].includes(
            action.action_id
          );
        }

        return true;
      }
    );


  if (
    ![
      "employee",
      "manager",
      "owner",
    ].includes(
      normalizedRole
    )
  ) {
    return null;
  }


  return (
    <section className="teller-vendor-document-panel">

      <div className="teller-vendor-document-head">

        <div>
          <p className="teller-form-kicker">
            Records intake
          </p>

          <h2>
            Vendors & Documents
          </h2>

          <p>
            Keep vendor setup and document
            follow-up inside the money/admin
            workflow without turning Teller
            into a file-storage system.
          </p>
        </div>


        <div className="teller-vendor-document-counts">

          {managerOrOwner ? (
            <div>
              <strong>
                {
                  vendor.prepared_count
                }
              </strong>

              <span>
                vendor items
              </span>
            </div>
          ) : null}


          <div>
            <strong>
              {
                documents.prepared_count
              }
            </strong>

            <span>
              document items
            </span>
          </div>

        </div>

      </div>


      <div
        className={
          `teller-vendor-document-grid ${
            managerOrOwner
              ? ""
              : "documents-only"
          }`
        }
      >

        {managerOrOwner ? (
          <article className="teller-vendor-document-column">

            <p className="teller-form-kicker">
              Vendors
            </p>

            <h3>
              Vendor intake
            </h3>

            <p className="teller-vendor-document-description">
              Setup, profile, protected payment
              setup, and invoice entry.
            </p>


            <IntakeList
              actions={
                vendor.actions
              }

              onOpenForm={
                onOpenForm
              }
            />

          </article>
        ) : null}


        <article className="teller-vendor-document-column">

          <p className="teller-form-kicker">
            Documents
          </p>

          <h3>
            Document workflow
          </h3>

          <p className="teller-vendor-document-description">
            Request missing material, replace
            bad documents, and record human
            verification outcomes.
          </p>


          <IntakeList
            actions={
              documentActions
            }

            onOpenForm={
              onOpenForm
            }
          />

        </article>

      </div>


      <div className="teller-vendor-document-truth">

        <div>
          <small>
            Vendor record
          </small>

          <strong>
            {
              preview.vendor
                .identity
                .vendor_name ||
              "No vendor prepared yet"
            }
          </strong>
        </div>


        <div>
          <small>
            Raw document stored
          </small>

          <strong>
            No
          </strong>
        </div>


        <div>
          <small>
            Vault link
          </small>

          <strong>
            None
          </strong>
        </div>


        <div>
          <small>
            Production persistence
          </small>

          <strong>
            Not connected
          </strong>
        </div>

      </div>

    </section>
  );
}
