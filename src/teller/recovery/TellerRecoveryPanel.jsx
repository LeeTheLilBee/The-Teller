import React, {
  useMemo,
  useState,
} from "react";

import {
  validateTellerRecordSet,
} from "./tellerProductionValidation.js";

import {
  startTellerRecordCorrection,
  clearTellerRecordCorrection,
} from "./tellerRecordCorrection.js";

import {
  isTellerRecordLocked,
  lockTellerRecord,
  unlockTellerRecord,
} from "./tellerRecordLock.js";

import {
  createTellerRecoverySnapshot,
  restoreTellerRecoverySnapshot,
} from "./tellerRecoverySnapshot.js";


function humanize(
  value
) {
  return String(
    value || ""
  )
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


export default function TellerRecoveryPanel({
  role,
  records = [],
  recoveryEvents = [],
  onReplaceRecords,
}) {
  const [
    selectedRecordId,
    setSelectedRecordId,
  ] = useState("");


  const [
    correctionReason,
    setCorrectionReason,
  ] = useState("");


  const [
    lockReason,
    setLockReason,
  ] = useState("");


  const [
    snapshot,
    setSnapshot,
  ] = useState(null);


  const [
    message,
    setMessage,
  ] = useState("");


  const validation =
    useMemo(
      () =>
        validateTellerRecordSet(
          records
        ),
      [records]
    );


  const selectedRecord =
    records.find(
      (record) =>
        record.record_id ===
        selectedRecordId
    ) || null;


  const canManage =
    role === "manager" ||
    role === "owner";


  function replaceRecord(
    nextRecord
  ) {
    if (!nextRecord) {
      return;
    }


    onReplaceRecords?.(
      records.map(
        (record) =>
          record.record_id ===
            nextRecord.record_id
            ? nextRecord
            : record
      )
    );
  }


  function createSnapshot() {
    try {
      const next =
        createTellerRecoverySnapshot(
          records
        );

      setSnapshot(
        next
      );

      setMessage(
        `Recovery point created for ${next.record_count} session record${next.record_count === 1 ? "" : "s"}.`
      );

    } catch (error) {
      setMessage(
        String(
          error?.message ||
          error
        )
      );
    }
  }


  function restoreSnapshot() {
    if (!snapshot) {
      return;
    }


    try {
      const restored =
        restoreTellerRecoverySnapshot(
          snapshot
        );

      onReplaceRecords?.(
        restored
      );

      setMessage(
        `Restored ${restored.length} record${restored.length === 1 ? "" : "s"} from the current in-memory recovery point.`
      );

    } catch (error) {
      setMessage(
        String(
          error?.message ||
          error
        )
      );
    }
  }


  function startCorrection() {
    if (
      !selectedRecord ||
      !correctionReason.trim()
    ) {
      return;
    }


    try {
      replaceRecord(
        startTellerRecordCorrection(
          selectedRecord,
          {
            actor_role:
              role,

            reason:
              correctionReason.trim(),
          }
        )
      );

      setCorrectionReason("");

      setMessage(
        "Record moved to Needs Correction."
      );

    } catch (error) {
      setMessage(
        String(
          error?.message ||
          error
        )
      );
    }
  }


  function clearCorrection() {
    if (!selectedRecord) {
      return;
    }


    replaceRecord(
      clearTellerRecordCorrection(
        selectedRecord,
        {
          actor_role:
            role,

          note:
            "Correction review cleared from Recovery Center.",
        }
      )
    );

    setMessage(
      "Correction state cleared."
    );
  }


  function toggleLock() {
    if (!selectedRecord) {
      return;
    }


    if (
      isTellerRecordLocked(
        selectedRecord
      )
    ) {
      replaceRecord(
        unlockTellerRecord(
          selectedRecord,
          {
            actor_role:
              role,

            reason:
              lockReason ||
              "Workflow lock released.",
          }
        )
      );

      setMessage(
        "Session workflow lock released."
      );

    } else {
      replaceRecord(
        lockTellerRecord(
          selectedRecord,
          {
            actor_role:
              role,

            reason:
              lockReason ||
              "Protected during Teller workflow review.",
          }
        )
      );

      setMessage(
        "Session workflow lock applied."
      );
    }


    setLockReason("");
  }


  return (
    <section className="teller-recovery-panel">

      <div className="teller-recovery-head">

        <div>
          <p className="teller-records-kicker">
            Reliability
          </p>

          <h2>
            Recovery Center
          </h2>

          <p>
            Validate, protect, correct, and recover
            records created during this Teller session.
          </p>
        </div>


        <div className="teller-recovery-health">

          <div>
            <strong>
              {
                validation.valid_count
              }
            </strong>

            <span>
              valid
            </span>
          </div>


          <div>
            <strong>
              {
                validation.invalid_count
              }
            </strong>

            <span>
              blocked
            </span>
          </div>

        </div>

      </div>


      <div className="teller-recovery-truth">

        <div>
          <small>
            Recovery mode
          </small>

          <strong>
            In-memory only
          </strong>
        </div>


        <div>
          <small>
            Survives reload
          </small>

          <strong>
            No
          </strong>
        </div>


        <div>
          <small>
            Production backup
          </small>

          <strong>
            Not connected
          </strong>
        </div>


        <div>
          <small>
            Network retry
          </small>

          <strong>
            Not connected
          </strong>
        </div>

      </div>


      <div className="teller-recovery-snapshot">

        <div>
          <strong>
            Session recovery point
          </strong>

          <p>
            Save a temporary copy of the current
            valid record set while this Teller
            session remains open.
          </p>
        </div>


        <div className="teller-recovery-button-row">

          <button
            type="button"
            onClick={createSnapshot}
            disabled={
              !validation.valid
            }
          >
            Create recovery point
          </button>


          <button
            type="button"
            onClick={restoreSnapshot}
            disabled={
              !snapshot
            }
          >
            Restore recovery point
          </button>

        </div>


        {snapshot ? (
          <small>
            Recovery point:
            {" "}
            {snapshot.record_count}
            {" record"}
            {
              snapshot.record_count === 1
                ? ""
                : "s"
            }
            {" · "}
            {
              new Date(
                snapshot.created_at
              ).toLocaleString()
            }
          </small>
        ) : null}

      </div>


      {canManage &&
      records.length ? (
        <div className="teller-recovery-record-tools">

          <div>
            <p className="teller-records-kicker">
              Record controls
            </p>

            <h3>
              Correction & workflow lock
            </h3>
          </div>


          <label>
            <span>
              Record
            </span>

            <select
              value={
                selectedRecordId
              }

              onChange={(event) =>
                setSelectedRecordId(
                  event.target.value
                )
              }
            >

              <option value="">
                Choose a record
              </option>

              {records.map(
                (record) => (
                  <option
                    key={
                      record.record_id
                    }

                    value={
                      record.record_id
                    }
                  >
                    {
                      record.title ||
                      humanize(
                        record.form_id
                      )
                    }
                  </option>
                )
              )}

            </select>
          </label>


          {selectedRecord ? (
            <>

              <div className="teller-recovery-selected-state">

                <span>
                  Status:
                  {" "}
                  <strong>
                    {
                      humanize(
                        selectedRecord
                          .record_status
                      )
                    }
                  </strong>
                </span>


                <span>
                  Lock:
                  {" "}
                  <strong>
                    {
                      isTellerRecordLocked(
                        selectedRecord
                      )
                        ? "Locked"
                        : "Open"
                    }
                  </strong>
                </span>

              </div>


              <label>
                <span>
                  Correction reason
                </span>

                <textarea
                  value={
                    correctionReason
                  }

                  onChange={(event) =>
                    setCorrectionReason(
                      event.target.value
                    )
                  }

                  placeholder="What needs correction?"
                />
              </label>


              <div className="teller-recovery-button-row">

                <button
                  type="button"
                  onClick={
                    startCorrection
                  }
                  disabled={
                    !correctionReason.trim() ||
                    isTellerRecordLocked(
                      selectedRecord
                    )
                  }
                >
                  Start correction
                </button>


                <button
                  type="button"
                  onClick={
                    clearCorrection
                  }
                  disabled={
                    selectedRecord
                      .record_status !==
                    "needs_correction"
                  }
                >
                  Clear correction
                </button>

              </div>


              <label>
                <span>
                  Workflow lock note
                </span>

                <input
                  type="text"

                  value={
                    lockReason
                  }

                  onChange={(event) =>
                    setLockReason(
                      event.target.value
                    )
                  }

                  placeholder="Optional lock / unlock note"
                />
              </label>


              <button
                type="button"
                className="teller-recovery-lock-button"
                onClick={
                  toggleLock
                }
              >
                {
                  isTellerRecordLocked(
                    selectedRecord
                  )
                    ? "Release session lock"
                    : "Lock session record"
                }
              </button>


              <p className="teller-recovery-lock-copy">
                This is a Teller workflow lock only.
                It is not a Tower security lock or
                permission decision.
              </p>

            </>
          ) : null}

        </div>
      ) : null}


      <div className="teller-recovery-events">

        <div>
          <p className="teller-records-kicker">
            Session checks
          </p>

          <h3>
            Recent reliability events
          </h3>
        </div>


        {recoveryEvents.length ? (
          <div className="teller-recovery-event-list">

            {recoveryEvents
              .slice(0, 8)
              .map(
                (event) => (
                  <article
                    key={
                      event.event_id
                    }
                  >

                    <strong>
                      {
                        humanize(
                          event.event
                        )
                      }
                    </strong>

                    <span>
                      {
                        event.reason ||
                        "Teller reliability event"
                      }
                    </span>

                  </article>
                )
              )}

          </div>
        ) : (
          <p className="teller-recovery-empty">
            No validation, duplicate, or recovery
            events have occurred this session.
          </p>
        )}

      </div>


      {message ? (
        <div className="teller-recovery-message">
          {message}
        </div>
      ) : null}

    </section>
  );
}
