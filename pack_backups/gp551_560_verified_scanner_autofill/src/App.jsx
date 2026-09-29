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

import {
  readTellerTowerSession,
} from "./teller/tellerRuntimeSession.js";

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
  onOpenForms,
  onOpenCapture,
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


  const towerSession =
    readTellerTowerSession();


  if (!towerSession) {
    return (
      <TellerErrorBoundary>
        <TowerLockedScreen />
      </TellerErrorBoundary>
    );
  }


  function openForms() {
    setCaptureOpen(false);
    setFormsOpen(true);
  }


  function openCapture() {
    setFormsOpen(false);
    setCaptureOpen(true);
  }


  return (
    <TellerErrorBoundary>

      <div className="teller-shell">

        <TellerHeader
          role={towerSession.role}
          onOpenForms={openForms}
          onOpenCapture={openCapture}
        />


        <main className="teller-main">
          <section className="teller-screen-card">
            <TellerWorkspace
              role={towerSession.role}
            />
          </section>
        </main>


        <TellerFormsWorkspace
          open={formsOpen}
          onClose={() =>
            setFormsOpen(false)
          }
          role={towerSession.role}
          towerSession={towerSession}
        />


        <TellerCaptureWorkspace
          open={captureOpen}
          onClose={() =>
            setCaptureOpen(false)
          }
          role={towerSession.role}
        />

      </div>

    </TellerErrorBoundary>
  );
}
