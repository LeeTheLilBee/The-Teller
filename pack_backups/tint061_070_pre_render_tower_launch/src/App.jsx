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
  bootstrapTellerFromTower,
} from "./teller/towerAccess.js";

import {
  validateTellerProductionRecord,
} from "./teller/recovery/tellerProductionValidation.js";

import {
  findDuplicateTellerRecord,
} from "./teller/recovery/tellerSubmissionGuard.js";

import {
  createTellerPersistenceTransportFromRuntime,
} from "./teller/persistence/tellerPersistenceTransport.js";

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


function TellerOpeningScreen() {
  return (
    <main className="teller-shell">

      <div className="teller-lock-wrap">

        <section className="teller-lock-card">

          <p className="teller-kicker">
            Tower handoff
          </p>

          <h1>
            Opening The Teller…
          </h1>

          <p>
            The Teller is verifying the protected
            Tower handoff before opening your
            workspace.
          </p>

        </section>

      </div>

    </main>
  );
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
    towerBootstrap,
    setTowerBootstrap,
  ] = useState({
    status:
      "checking",

    reason:
      "",
  });


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


  const towerIdentityKey = [
    towerSession?.sessionId || "",
    towerSession?.towerReceiptId || "",
    towerSession?.actor?.id ||
      towerSession?.actor?.actor_id ||
      towerSession?.actor?.actorId ||
      "",
    towerSession?.business?.key ||
      towerSession?.business?.business_key ||
      towerSession?.business?.businessKey ||
      "",
    towerSession?.role || "",
  ].join("|");



  useEffect(
    () => {
      let cancelled =
        false;


      bootstrapTellerFromTower({
        windowLike:
          window,

        locationLike:
          window.location,

        historyLike:
          window.history,

        fetchImpl:
          window.fetch.bind(
            window
          ),

        env:
          import.meta.env,
      })
        .then(
          (result) => {
            if (cancelled) {
              return;
            }


            setTowerBootstrap({
              status:
                result?.status ||
                "locked",

              reason:
                result?.reason ||
                "",
            });
          }
        )
        .catch(
          () => {
            if (cancelled) {
              return;
            }


            setTowerBootstrap({
              status:
                "locked",

              reason:
                "tower_bootstrap_failed",
            });
          }
        );


      return () => {
        cancelled =
          true;
      };
    },
    []
  );


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


          if (cancelled) {
            return;
          }


          const records =
            Array.isArray(
              result?.records
            )
              ? result.records
              : [];


          sessionRecordsRef.current =
            records;


          setSessionRecords(
            records
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


  if (
    towerBootstrap.status ===
      "checking"
  ) {
    return (
      <TellerErrorBoundary>
        <TellerOpeningScreen />
      </TellerErrorBoundary>
    );
  }


  if (
    towerBootstrap.status ===
      "locked"
  ) {
    return (
      <TellerErrorBoundary>
        <TowerLockedScreen
          reason={
            towerBootstrap.reason
          }
        />
      </TellerErrorBoundary>
    );
  }


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
        sessionRecordsRef.current,
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


    const nextRecords = [
      record,

      ...sessionRecordsRef.current.filter(
        (item) =>
          item.record_id !==
          record.record_id
      ),
    ].slice(
      0,
      250
    );


    sessionRecordsRef.current =
      nextRecords;


    setSessionRecords(
      nextRecords
    );


    addRecoveryEvent({
      event:
        "record_accepted",

      record_id:
        record.record_id,

      reason:
        "Prepared Teller record passed validation and duplicate checks.",
    });


    if (
      persistenceTransport?.connected
    ) {
      void persistenceTransport
        .saveRecord(
          record
        )
        .then(
          (result) => {
            const persistedRecord =
              result?.record;


            if (
              !persistedRecord
                ?.record_id
            ) {
              throw new Error(
                "Teller persistence transport returned no durable record."
              );
            }


            const durableRecords = [
              persistedRecord,

              ...sessionRecordsRef.current
                .filter(
                  (item) =>
                    item.record_id !==
                    persistedRecord.record_id
                ),
            ].slice(
              0,
              250
            );


            sessionRecordsRef.current =
              durableRecords;


            setSessionRecords(
              durableRecords
            );


            addRecoveryEvent({
              event:
                "record_persisted",

              record_id:
                persistedRecord.record_id,

              reason:
                result
                  ?.idempotent_replay
                  ? "Teller confirmed the durable record already existed."
                  : "Teller saved the prepared record to the authenticated production repository.",

              persistence_revision:
                persistedRecord
                  ?.persistence_revision ||
                1,
            });
          }
        )
        .catch(
          (error) => {
            addRecoveryEvent({
              event:
                "record_persistence_failed",

              record_id:
                record.record_id,

              reason:
                String(
                  error?.message ||
                  "Authenticated Teller persistence failed."
                ),
            });
          }
        );
    }
  }


  function replaceSessionRecords(
    nextRecords
  ) {
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
