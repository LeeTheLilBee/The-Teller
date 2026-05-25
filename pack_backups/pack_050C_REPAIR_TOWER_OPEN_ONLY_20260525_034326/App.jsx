import React, { useState } from "react";
import Pack050BDemo from "./teller/Pack050BDemo.jsx";
import Pack050CDemo from "./teller/Pack050CDemo.jsx";

function ComingOwnerView() {
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
  const [view, setView] = useState("employee");

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">
              SimpleePay presents
            </p>
            <h1 className="text-2xl font-black text-white">The Teller</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["employee", "Employee"],
              ["manager", "Manager"],
              ["owner", "Owner"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                  view === key
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-white/[0.06] text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {view === "employee" ? <Pack050BDemo /> : null}
      {view === "manager" ? <Pack050CDemo /> : null}
      {view === "owner" ? <ComingOwnerView /> : null}
    </div>
  );
}
