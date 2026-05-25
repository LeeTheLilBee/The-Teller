import React, { Component } from "react";
import EmployeeDocumentVaultPanel from "./teller/EmployeeDocumentVaultPanel.jsx";
import ManagerMeldPanel from "./teller/ManagerMeldPanel.jsx";

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
        <main className="min-h-screen bg-slate-950 p-6 text-white">
          <section className="mx-auto max-w-4xl rounded-[2rem] border border-red-300/30 bg-red-300/10 p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">
              The Teller caught a screen error
            </p>
            <h1 className="mt-3 text-3xl font-black">The screen did not crash silently.</h1>
            <pre className="mt-4 overflow-auto rounded-2xl bg-black/40 p-4 text-xs text-red-100">
              {String(this.state.error?.message || this.state.error)}
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
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
          Tower clearance required
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
          The Teller opens from The Tower.
        </h1>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-slate-300">
          This workspace is not a public doorway. Employee, manager, and owner access must be opened by The Tower with the correct clearance.
        </p>

        <div className="mt-6 rounded-[1.5rem] border border-amber-300/25 bg-amber-300/10 p-5">
          <p className="text-sm font-black text-amber-100">Dev test links</p>
          <p className="mt-2 text-sm font-semibold text-slate-300">
            Use these only while building, so we can test the screens before the real Tower backend exists.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950" href="?tower_clearance=employee">
              Open as Employee
            </a>
            <a className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950" href="?tower_clearance=manager">
              Open as Manager
            </a>
            <a className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950" href="?tower_clearance=owner">
              Open as Owner
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function TellerHeader({ clearance }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">
            Opened by The Tower
          </p>
          <h1 className="text-2xl font-black text-white">The Teller</h1>
        </div>

        <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-200">
          Tower clearance · {clearance}
        </div>
      </div>
    </nav>
  );
}

function OwnerComingSoon() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <section className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200">
          Owner money workspace
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
          Owner Money Queue is next.
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-300">
          Pack 050D will add Today’s Money Focus, business money snapshots, trust snapshot,
          MrkTrade protected paperwork, source confidence, final action previews, and Calm Money Mode.
        </p>
      </section>
    </main>
  );
}

export default function App() {
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
      <div className="min-h-screen bg-slate-950">
        <TellerHeader clearance={clearance} />

        <section className="mx-auto max-w-7xl px-4 py-5">
          {clearance === "employee" ? <EmployeeDocumentVaultPanel /> : null}
          {clearance === "manager" ? <ManagerMeldPanel /> : null}
          {clearance === "owner" ? <OwnerComingSoon /> : null}
        </section>
      </div>
    </TellerErrorBoundary>
  );
}
