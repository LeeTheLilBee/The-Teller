import React, {
  Component,
  useEffect,
  useRef,
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
  readTellerLiveTowerSession,
  readTellerTowerSession,
} from "./teller/tellerRuntimeSession.js";

import {
  validateTellerProductionRecord,
} from "./teller/recovery/tellerProductionValidation.js";

import {
  findDuplicateTellerRecord,
} from "./teller/recovery/tellerSubmissionGuard.js";

import {
  createTellerPersistenceTransportFromRuntime,
} from "./teller/persistence/tellerPersistenceTransport.js";

import {
  tellerRecordScopeKey,
  mergeTellerDurableRecords,
  resolveTellerPreparedRecord,
} from "./teller/records/tellerDurablePreparation.js";

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


function TowerLockedScreen({
  reason = "",
}) {
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

          {
            reason
              ? (
                  <p>
                    Access status · {reason}
                  </p>
                )
              : null
          }

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


  const sessionRecordsRef =
    useRef([]);


  const pendingRecordIdsRef =
    useRef(new Set());


  const lastTowerIdentityRef =
    useRef("");


  const [
    recordRecoveryEvents,
    setRecordRecoveryEvents,
  ] = useState([]);


  const towerSession =
    readTellerTowerSession();


  const liveTowerSession =
    readTellerLiveTowerSession();


  /*
   * Do not even construct the hosted persistence
   * transport until the LIVE Tower session exists.
   *
   * A stored UI-only Teller session is insufficient.
   */
  const persistenceTransport =
    liveTowerSession
      ? createTellerPersistenceTransportFromRuntime()
      : null;


  const persistenceIdentityKey =
    persistenceTransport
      ?.identityKey ||
    "";


  const towerIdentityKey =
    tellerRecordScopeKey(towerSession);


  useEffect(
    () => {
      sessionRecordsRef.current =
        sessionRecords;
    },
    [
      sessionRecords,
    ]
  );


  useEffect(
    () => {
      if (!towerIdentityKey) {
        lastTowerIdentityRef.current =
          "";

        return;
      }


      const previous =
        lastTowerIdentityRef.current;


      if (
        previous &&
        previous !==
          towerIdentityKey
      ) {
        sessionRecordsRef.current =
          [];


        setSessionRecords(
          []
        );


        addRecoveryEvent({
          event:
            "tower_identity_changed",

          reason:
            "Teller cleared in-memory records because the Tower session identity or business changed.",
        });
      }


      lastTowerIdentityRef.current =
        towerIdentityKey;
    },
    [
      towerIdentityKey,
    ]
  );


  useEffect(
    () => {
      if (
        !towerSession ||
        !persistenceTransport?.connected
      ) {
        return undefined;
      }


      let cancelled =
        false;


      async function hydrate() {
        try {
          const result =
            await persistenceTransport
              .searchRecords({
                limit:
                  100,
              });


          if (
            cancelled ||
            tellerRecordScopeKey(readTellerTowerSession()) !== towerIdentityKey
          ) {
            return;
          }


          const records =
            Array.isArray(
              result?.records
            )
              ? result.records
              : [];


          const reconciled =
            mergeTellerDurableRecords(
              sessionRecordsRef.current,
              records
            );


          sessionRecordsRef.current =
            reconciled;


          setSessionRecords(
            reconciled
          );


          addRecoveryEvent({
            event:
              "production_records_hydrated",

            reason:
              "Teller restored authenticated durable records from the production repository.",

            record_count:
              records.length,
          });

        } catch (error) {

          if (cancelled) {
            return;
          }


          addRecoveryEvent({
            event:
              "production_hydration_failed",

            reason:
              String(
                error?.message ||
                "Authenticated Teller persistence hydration failed."
              ),
          });
        }
      }


      void hydrate();


      return () => {
        cancelled =
          true;
      };
    },
    [
      towerIdentityKey,
      persistenceIdentityKey,
    ]
  );


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


  async function handleRecordPrepared(
    record
  ) {
    const result = await resolveTellerPreparedRecord({
      record,
      readRecords: () => sessionRecordsRef.current,
      validateRecord: validateTellerProductionRecord,
      findDuplicate: findDuplicateTellerRecord,
      pendingIds: pendingRecordIdsRef.current,
      transport: persistenceTransport,
      hostedSession:
        towerSession?.source === "tower_window_injection",
      expectedScopeKey: towerIdentityKey,
      readScopeKey: () =>
        tellerRecordScopeKey(readTellerTowerSession()),
    });

    if (!result.accepted) {
      addRecoveryEvent({
        // Retain the historical failure vocabulary for the recovery panel
        // while never admitting an unacknowledged record to the durable list.
        event: (
          result.status === "persistence_failed" ||
          result.status === "invalid_durable_ack" ||
          result.status === "authenticated_repository_unavailable"
        )
          ? "record_persistence_failed"
          : "record_preparation_blocked",
        record_id: record?.record_id || "",
        reason: result.status,
        ...(result.problemCount
          ? { problem_count: result.problemCount }
          : {}),
        ...(result.duplicateOf
          ? { duplicate_of: result.duplicateOf }
          : {}),
      });
      return result;
    }

    // A record can be displayed as durable only AFTER an authenticated
    // acknowledgement. In DEV/UI-only mode it is session-only instead.
    if (
      tellerRecordScopeKey(readTellerTowerSession()) !== towerIdentityKey
    ) {
      addRecoveryEvent({
        event: "record_preparation_blocked",
        record_id: record?.record_id || "",
        reason: "tower_identity_changed",
      });
      return { accepted: false, status: "tower_identity_changed" };
    }

    const accepted = result.record;
    const nextRecords = [
      accepted,
      ...sessionRecordsRef.current.filter(
        (item) => item.record_id !== accepted.record_id
      ),
    ].slice(0, 250);

    sessionRecordsRef.current = nextRecords;
    setSessionRecords(nextRecords);

    addRecoveryEvent({
      event: result.durable
        ? "record_persisted"
        : "record_prepared_session_only",
      record_id: accepted.record_id,
      reason: result.durable
        ? (
            result.idempotentReplay
              ? "Authenticated repository confirmed an existing durable record."
              : "Authenticated repository acknowledged the durable record."
          )
        : "Prepared in this browser session only; no durable save was requested.",
      ...(result.durable
        ? { persistence_revision: accepted.persistence_revision || 1 }
        : {}),
    });
    return result;
  }


  function replaceSessionRecords(
    nextRecords
  ) {
    if (towerSession?.source === "tower_window_injection") {
      addRecoveryEvent({
        event: "record_recovery_requires_repository",
        reason: "Hosted durable records must be restored through authenticated repository hydration, not an in-memory snapshot.",
      });
      return;
    }

    const resolvedRecords =
      Array.isArray(
        nextRecords
      )
        ? nextRecords.slice(
            0,
            250
          )
        : [];


    sessionRecordsRef.current =
      resolvedRecords;


    setSessionRecords(
      resolvedRecords
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
