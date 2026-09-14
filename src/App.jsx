import React, {
  Component,
  useEffect,
  useState,
} from "react";

import EmployeeDocumentVaultPanel from "./teller/EmployeeDocumentVaultPanel.jsx";
import ManagerStandaloneWorkspace from "./teller/ManagerStandaloneWorkspace.jsx";
import EmployeeStandaloneWorkspace from "./teller/EmployeeStandaloneWorkspace.jsx";
import OwnerMoneyWorkspace from "./teller/OwnerMoneyWorkspace.jsx";
import TowerBackupWorkspace from "./teller/TowerBackupWorkspace.jsx";

import {
  resolveTellerAccess,
  tellerDevShortcutsEnabled,
} from "./teller/towerAccess.js";

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
            The Teller is checking the protected
            Tower handoff before opening your
            money workspace.
          </p>
        </section>
      </div>
    </main>
  );
}


function TowerLockedScreen({
  reason,
  devShortcuts,
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
            This workspace is not a public doorway.
            Hosted employee, manager, and owner access
            must be issued and verified by The Tower.
          </p>

          {reason ? (
            <p>
              Access status · {reason}
            </p>
          ) : null}

          {devShortcuts ? (
            <div className="teller-dev-box">
              <strong>
                Local development shortcuts
              </strong>

              <p>
                These links work only when Vite is
                running in development mode and
                VITE_TELLER_DEV_CLEARANCE_ENABLED=1.
              </p>

              <div className="teller-dev-links">
                <a href="?tower_clearance=employee">
                  Open as Employee
                </a>

                <a href="?tower_clearance=manager">
                  Open as Manager
                </a>

                <a href="?tower_clearance=owner">
                  Open as Owner
                </a>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}


function TellerHeader({
  clearance,
  source,
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

        <div className="teller-clearance-chip">
          Tower clearance · {clearance}
          {source === "explicit_local_development"
            ? " · local dev"
            : ""}
        </div>
      </div>
    </nav>
  );
}


function workspaceFor({
  clearance,
  devShortcuts,
  navigationContext,
}) {

  if (
    clearance === "owner"
  ) {
    return (
      <OwnerMoneyWorkspace
        navigationContext={
          navigationContext
        }
      />
    );
  }

  if (
    devShortcuts &&
    clearance === "manager"
  ) {
    return (
      <ManagerStandaloneWorkspace />
    );
  }

  if (
    devShortcuts &&
    clearance === "employee"
  ) {
    return (
      <>
        <EmployeeDocumentVaultPanel />
        <EmployeeStandaloneWorkspace />
      </>
    );
  }

  if (
    devShortcuts &&
    clearance === "tower"
  ) {
    return <TowerBackupWorkspace />;
  }

  return null;
}


export default function App() {
  const devShortcuts =
    tellerDevShortcutsEnabled(
      import.meta.env
    );

  const [
    access,
    setAccess,
  ] = useState({
    status: "checking",
    clearance: "",
    source: "none",
    reason: "",
    navigationContext: null,
  });

  useEffect(() => {
    let cancelled = false;

    resolveTellerAccess({
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
      .then((result) => {
        if (!cancelled) {
          setAccess(
            result
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccess({
            status: "locked",
            clearance: "",
            source: "none",
            reason:
              "tower_access_bootstrap_failed",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);


  if (
    access.status
    === "checking"
  ) {
    return (
      <TellerErrorBoundary>
        <TellerOpeningScreen />
      </TellerErrorBoundary>
    );
  }


  if (
    access.status
    !== "granted"
  ) {
    return (
      <TellerErrorBoundary>
        <TowerLockedScreen
          reason={
            access.reason
          }
          devShortcuts={
            devShortcuts
          }
        />
      </TellerErrorBoundary>
    );
  }


  const workspace =
    workspaceFor({
      clearance:
        access.clearance,

      devShortcuts,

      navigationContext:
        access.navigationContext,
    });


  if (!workspace) {
    return (
      <TellerErrorBoundary>
        <TowerLockedScreen
          reason="unsupported_clearance"
          devShortcuts={
            devShortcuts
          }
        />
      </TellerErrorBoundary>
    );
  }


  return (
    <TellerErrorBoundary>
      <div className="teller-shell">
        <TellerHeader
          clearance={
            access.clearance
          }
          source={
            access.source
          }
        />

        <main className="teller-main">
          <section className="teller-screen-card">
            {workspace}
          </section>
        </main>
      </div>
    </TellerErrorBoundary>
  );
}
