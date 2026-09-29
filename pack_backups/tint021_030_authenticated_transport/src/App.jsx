import React, {
  Component,
  useState,
} from "react";

import EmployeeStandaloneWorkspace
  from "./teller/EmployeeStandaloneWorkspace.jsx";

import ManagerStandaloneWorkspace
  from "./teller/ManagerStandaloneWorkspace.jsx";

import OwnerMoneyWorkspace
  from "./teller/OwnerMoneyWorkspace.jsx";

import TellerFormsWorkspace
  from "./teller/forms/TellerFormsWorkspace.jsx";

import TellerCaptureWorkspace
  from "./teller/capture/TellerCaptureWorkspace.jsx";

import TellerRecordsWorkspace
  from "./teller/records/TellerRecordsWorkspace.jsx";

import {
  readTellerTowerSession,
} from "./teller/tellerRuntimeSession.js";

import {
  validateTellerProductionRecord,
} from "./teller/recovery/tellerProductionValidation.js";

import {
  findDuplicateTellerRecord,
} from "./teller/recovery/tellerSubmissionGuard.js";

import "./teller/tellerShell.css";


class TellerErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
    };
  }


  static getDerivedStateFromError(error) {
    return {
      error,
    };
  }


  render() {
    if (this.state.error) {
      return (
        <main className="teller-error">

          <section className="teller-error-card">

            <p className="teller-kicker">
              The Teller caught a screen error
            </p>

            <h1>
              The screen did not crash silently.
            </h1>

            <pre>
              {String(
                this.state.error?.message ||
                this.state.error
              )}
            </pre>

          </section>

        </main>
      );
    }

    return this.props.children;
  }
}


function TowerLockedScreen() {
  return (
    <main className="teller-shell">

      <div className="teller-lock-wrap">

        <section className="teller-lock-card">

          <p className="teller-kicker">
            Tower clearance required
          </p>

          <h1>
            The Teller opens from The Tower.
          </h1>

          <p>
            The Tower must issue an employee,
            manager, or owner Teller session
            before this workspace opens.
          </p>

        </section>

      </div>

    </main>
  );
}


function TellerHeader({
  role,
  recordCount,
  onOpenForms,
  onOpenCapture,
  onOpenRecords,
}) {
  return (
    <nav className="teller-topbar">

      <div className="teller-topbar-inner">

        <div>
          <p className="teller-kicker">
            Opened by The Tower
          </p>

          <h1 className="teller-title">
            The Teller
          </h1>
        </div>


        <div className="teller-global-actions">

          <button
            type="button"
            className="teller-global-new"
            onClick={onOpenForms}
          >
            + New
          </button>


          <button
            type="button"
            className="teller-global-new teller-global-scan"
            onClick={onOpenCapture}
          >
            Scan
          </button>


          <button
            type="button"
            className="teller-global-new teller-global-search"
            onClick={onOpenRecords}
          >
            Search
            {
              recordCount
                ? ` · ${recordCount}`
                : ""
            }
          </button>


          <div className="teller-clearance-chip">
            Tower clearance · {role}
          </div>

        </div>

      </div>

    </nav>
  );
}


function TellerWorkspace({
  role,
}) {
  if (role === "employee") {
    return (
      <EmployeeStandaloneWorkspace />
    );
  }

  if (role === "manager") {
    return (
      <ManagerStandaloneWorkspace />
    );
  }

  if (role === "owner") {
    return (
      <OwnerMoneyWorkspace />
    );
  }

  return null;
}


export default function App() {
  const [
    formsOpen,
    setFormsOpen,
  ] = useState(false);


  const [
    captureOpen,
    setCaptureOpen,
  ] = useState(false);


  const [
    recordsOpen,
    setRecordsOpen,
  ] = useState(false);


  const [
    verifiedAutofillHandoff,
    setVerifiedAutofillHandoff,
  ] = useState(null);


  const [
    sessionRecords,
    setSessionRecords,
  ] = useState([]);


  const [
    recordRecoveryEvents,
    setRecordRecoveryEvents,
  ] = useState([]);


  const towerSession =
    readTellerTowerSession();


  if (!towerSession) {
    return (
      <TellerErrorBoundary>
        <TowerLockedScreen />
      </TellerErrorBoundary>
    );
  }


  function closeAllWorkspaces() {
    setFormsOpen(false);
    setCaptureOpen(false);
    setRecordsOpen(false);
  }


  function openForms() {
    closeAllWorkspaces();
    setFormsOpen(true);
  }


  function openCapture() {
    closeAllWorkspaces();
    setCaptureOpen(true);
  }


  function openRecords() {
    closeAllWorkspaces();
    setRecordsOpen(true);
  }


  function handleVerifiedAutofill(
    handoff
  ) {
    setVerifiedAutofillHandoff(
      handoff
    );

    closeAllWorkspaces();
    setFormsOpen(true);
  }


  function addRecoveryEvent(
    event
  ) {
    setRecordRecoveryEvents(
      (current) => [
        {
          event_id:
            `recovery_event_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 8)}`,

          at:
            new Date().toISOString(),

          ...event,
        },

        ...current,
      ].slice(0, 100)
    );
  }


  function handleRecordPrepared(
    record
  ) {
    if (!record?.record_id) {
      addRecoveryEvent({
        event:
          "record_blocked",

        reason:
          "Record ID missing",
      });

      return;
    }


    const validation =
      validateTellerProductionRecord(
        record
      );


    if (!validation.valid) {
      addRecoveryEvent({
        event:
          "record_validation_blocked",

        record_id:
          record.record_id,

        reason:
          "Prepared record failed Teller production validation.",

        problem_count:
          validation.problems.length,
      });

      return;
    }


    const duplicate =
      findDuplicateTellerRecord(
        sessionRecords,
        record
      );


    if (duplicate) {
      addRecoveryEvent({
        event:
          "duplicate_preparation_blocked",

        record_id:
          record.record_id,

        duplicate_of:
          duplicate.record_id,

        reason:
          "An identical prepared workflow already exists in this Teller session.",
      });

      return;
    }


    setSessionRecords(
      (current) => [
        record,

        ...current.filter(
          (item) =>
            item.record_id !==
            record.record_id
        ),
      ].slice(0, 250)
    );


    addRecoveryEvent({
      event:
        "record_accepted",

      record_id:
        record.record_id,

      reason:
        "Prepared Teller record passed validation and duplicate checks.",
    });
  }


  function replaceSessionRecords(
    nextRecords
  ) {
    setSessionRecords(
      Array.isArray(nextRecords)
        ? nextRecords.slice(0, 250)
        : []
    );


    addRecoveryEvent({
      event:
        "session_records_recovered",

      reason:
        "Teller session records were restored from an in-memory recovery point.",
    });
  }


  return (
    <TellerErrorBoundary>

      <div className="teller-shell">

        <TellerHeader
          role={
            towerSession.role
          }

          recordCount={
            sessionRecords.length
          }

          onOpenForms={
            openForms
          }

          onOpenCapture={
            openCapture
          }

          onOpenRecords={
            openRecords
          }
        />


        <main className="teller-main">

          <section className="teller-screen-card">

            <TellerWorkspace
              role={
                towerSession.role
              }
            />

          </section>

        </main>


        <TellerFormsWorkspace
          open={
            formsOpen
          }

          onClose={() =>
            setFormsOpen(false)
          }

          role={
            towerSession.role
          }

          towerSession={
            towerSession
          }

          externalHandoff={
            verifiedAutofillHandoff
          }

          onHandoffConsumed={() =>
            setVerifiedAutofillHandoff(
              null
            )
          }

          onRecordPrepared={
            handleRecordPrepared
          }
        />


        <TellerCaptureWorkspace
          open={
            captureOpen
          }

          onClose={() =>
            setCaptureOpen(false)
          }

          role={
            towerSession.role
          }

          onFormHandoff={
            handleVerifiedAutofill
          }
        />


        <TellerRecordsWorkspace
          open={
            recordsOpen
          }

          onClose={() =>
            setRecordsOpen(false)
          }

          role={
            towerSession.role
          }

          records={
            sessionRecords
          }

          recoveryEvents={
            recordRecoveryEvents
          }

          onReplaceRecords={
            replaceSessionRecords
          }
        />

      </div>

    </TellerErrorBoundary>
  );
}
