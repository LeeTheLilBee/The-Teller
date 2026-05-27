import React, { Component } from "react";
import EmployeeDocumentVaultPanel from "./teller/EmployeeDocumentVaultPanel.jsx";
import ManagerMeldPanel from "./teller/ManagerMeldPanel.jsx";
import OwnerMoneyWorkspace from "./teller/OwnerMoneyWorkspace.jsx";
import ManagerStandaloneWorkspace from "./teller/ManagerStandaloneWorkspace.jsx";
import EmployeeStandaloneWorkspace from "./teller/EmployeeStandaloneWorkspace.jsx";
import TowerBackupWorkspace from "./teller/TowerBackupWorkspace.jsx";
import "./teller/tellerShell.css";

function readTowerClearance() {
  const params = new URLSearchParams(window.location.search);
  const clearance = String(params.get("tower_clearance") || "").toLowerCase().trim();

  if (["employee", "manager", "owner"].includes(clearance)) {
    return clearance;
  }

  return "";
}

class TellerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="teller-error">
          <section className="teller-error-card">
            <p className="teller-kicker">The Teller caught a screen error</p>
            <h1>The screen did not crash silently.</h1>
            <pre>{String(this.state.error?.message || this.state.error)}</pre>
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
          <p className="teller-kicker">Tower clearance required</p>
          <h1>The Teller opens from The Tower.</h1>
          <p>
            This workspace is not a public doorway. Employee, manager, and owner access
            must be opened by The Tower with the correct clearance.
          </p>

          <div className="teller-dev-box">
            <strong>Dev test links</strong>
            <p>
              Use these only while building, so we can test the screens before the real
              Tower backend exists.
            </p>
            <div className="teller-dev-links">
              <a href="?tower_clearance=employee">Open as Employee</a>
              <a href="?tower_clearance=manager">Open as Manager</a>
              <a href="?tower_clearance=owner">Open as Owner</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TellerHeader({ clearance }) {
  return (
    <nav className="teller-topbar">
      <div className="teller-topbar-inner">
        <div>
          <p className="teller-kicker">Opened by The Tower</p>
          <h1 className="teller-title">The Teller</h1>
        </div>

        <div className="teller-clearance-chip">
          Tower clearance · {clearance}
        </div>
      </div>
    </nav>
  );
}

function OwnerComingSoon() {
  return (
    <section className="teller-lock-card">
      <p className="teller-kicker">Owner money workspace</p>
      <h1>Owner Money Queue is next.</h1>
      <p>
        Pack 050D will add Today’s Money Focus, business money snapshots, trust snapshot,
        MrkTrade protected paperwork, source confidence, final action previews, and Calm Money Mode.
      </p>
    </section>
  );
}

export default function App() {
  const __tellerView = new URLSearchParams(window.location.search).get("teller_view") || "";

  const clearance = readTowerClearance();

  if (!clearance) {
    return (
      <TellerErrorBoundary>
        <TowerLockedScreen />
      </TellerErrorBoundary>
    );
  }

  return (
    <TellerErrorBoundary>
      <div className="teller-shell">
        <TellerHeader clearance={clearance} />

        <main className="teller-main">
          <section className="teller-screen-card">
            {clearance === "employee" ? <EmployeeDocumentVaultPanel /> : null}
            {clearance === "tower" || __tellerView === "tower" ? <TowerBackupWorkspace /> : null}
      {(__tellerView === "tower" || clearance === "tower") ? <TowerBackupWorkspace /> : null}
      {clearance === "employee" || __tellerView === "employee" ? <EmployeeStandaloneWorkspace /> : null}
      {clearance === "manager" || __tellerView === "manager" ? <ManagerStandaloneWorkspace /> : null}
            {clearance === "owner" ? <OwnerMoneyWorkspace /> : null}
          </section>
        </main>
      </div>
    </TellerErrorBoundary>
  );
}
