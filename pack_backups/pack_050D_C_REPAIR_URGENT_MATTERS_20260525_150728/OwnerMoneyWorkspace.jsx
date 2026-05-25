
import React, { useMemo, useState } from "react";
import {
  ownerProfile,
  ownerThemeChoices,
  ownerSnapshotCards,
  ownerMoneyQueue,
  ownerBusinessLanes,
  getOwnerTheme,
  getTodayOwnerFocus,
} from "./ownerMoneyData";
import "./ownerMoneyWorkspace.css";

function statusLabel(status = "") {
  const map = {
    needs_review: "Needs review",
    ready: "Ready",
    blocked: "Blocked",
    sent: "Sent",
    proof_missing: "Proof missing",
    proof_sealed: "Proof sealed",
    tower_required: "Tower required",
    escalated: "Escalated",
    signature_required: "Signature required",
    view_only: "View only",
  };
  return map[status] || String(status || "Status");
}

function confidenceLabel(confidence = "") {
  const map = {
    confirmed: "Confirmed",
    estimated: "Estimated",
    needs_proof: "Needs proof",
    manual_entry: "Manual entry",
    waiting_on_receipt: "Waiting on receipt",
    tower_gated: "Tower-gated",
  };
  return map[confidence] || String(confidence || "Estimated");
}

function Badge({ children, tone = "quiet" }) {
  return <span className={`fb-badge fb-badge-${tone}`}>{children}</span>;
}

function ThemeCloset({ themeKey, setThemeKey, theme }) {
  return (
    <section className="fb-settings">
      <div>
        <p className="fb-kicker">Owner settings</p>
        <h2>Theme closet</h2>
        <p>Private owner themes live here. Employee and manager screens stay normal.</p>
      </div>

      <div className="fb-theme-row">
        {Object.values(ownerThemeChoices).map((item) => (
          <button
            key={item.key}
            type="button"
            className={`fb-theme ${themeKey === item.key ? "is-active" : ""}`}
            style={{
              "--swatch-a": item.primary,
              "--swatch-b": item.secondary,
              "--swatch-c": item.third,
            }}
            onClick={() => setThemeKey(item.key)}
          >
            <span />
            <strong>{item.name}</strong>
            <small>{item.vibe}</small>
          </button>
        ))}
      </div>

      <div className="fb-current-theme" style={{ "--theme-line": theme.primary }}>
        <span>Current</span>
        <strong>{theme.name}</strong>
        <small>{theme.vibe}</small>
      </div>
    </section>
  );
}

function PriorityFocus({ focus, theme }) {
  return (
    <section className="fb-priority" style={{ "--focus": theme.primary }}>
      <div className="fb-priority-glow" />
      <div className="fb-priority-main">
        <p className="fb-kicker">Start here</p>
        <h2>{focus.title}</h2>
        <p>{focus.why}</p>

        <div className="fb-badge-row">
          <Badge tone="strong">{focus.business}</Badge>
          <Badge tone="warn">{statusLabel(focus.status)}</Badge>
          <Badge>{confidenceLabel(focus.confidence)}</Badge>
        </div>

        <div className="fb-priority-actions">
          <button type="button" className="fb-primary">{focus.action}</button>
          <button type="button" className="fb-ghost">Why this matters</button>
        </div>
      </div>

      <aside className="fb-priority-side">
        <span>{focus.amount}</span>
        <small>{focus.due}</small>
        <p>{focus.lane}</p>
      </aside>
    </section>
  );
}

function BusinessOrbit({ lanes, activeBusiness, setActiveBusiness }) {
  const activeLane = lanes.find((lane) => lane.key === activeBusiness) || lanes[0];

  return (
    <section className="fb-orbit-shell">
      <div className="fb-section-head">
        <div>
          <p className="fb-kicker">Business orbit</p>
          <h2>Tap a business. See only that money lane.</h2>
        </div>
        <Badge tone="strong">{activeLane.title}</Badge>
      </div>

      <div className="fb-orbit">
        <div className="fb-orbit-center" style={{ "--center-color": activeLane.color }}>
          <span>{activeLane.personality}</span>
          <strong>{activeLane.title}</strong>
          <p>{activeLane.summary}</p>
        </div>

        {lanes.map((lane, index) => (
          <button
            key={lane.key}
            type="button"
            className={`fb-planet fb-planet-${index + 1} ${activeBusiness === lane.key ? "is-active" : ""} ${lane.protected ? "is-protected" : ""}`}
            style={{ "--planet": lane.color }}
            onClick={() => setActiveBusiness(lane.key)}
          >
            <strong>{lane.title.replace("Simplee", "")}</strong>
            <small>{lane.protected ? "Tower" : "Money"}</small>
          </button>
        ))}
      </div>

      <div className="fb-active-lane" style={{ "--lane": activeLane.color }}>
        <p className="fb-kicker">Selected lane</p>
        <h3>{activeLane.focus}</h3>
        <div className="fb-action-cloud">
          {activeLane.actions.map((action) => (
            <button key={action} type="button">{action}</button>
          ))}
        </div>
        {activeLane.protected ? (
          <div className="fb-protected">
            MrkTrade is paperwork and vague financial numbers only here. No OB access. No engine details. No broker doorway. The Tower opens anything protected.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MoneyConstellations({ queue }) {
  const grouped = {
    "Pay People": queue.filter((item) => item.lane === "Pay People"),
    "Proof + Records": queue.filter((item) => item.lane.includes("Proof") || item.lane.includes("Attach")),
    "Protected": queue.filter((item) => item.lane.includes("Tower")),
    "Costs + Bills": queue.filter((item) => item.lane.includes("Costs") || item.lane.includes("Bills")),
  };

  return (
    <section className="fb-constellations">
      <div className="fb-section-head">
        <div>
          <p className="fb-kicker">Money constellations</p>
          <h2>Grouped work, not a stressful list.</h2>
        </div>
        <Badge>{queue.length} hidden details</Badge>
      </div>

      <div className="fb-constellation-grid">
        {Object.entries(grouped).map(([label, items]) => {
          const first = items[0];
          return (
            <article key={label} className="fb-constellation-card">
              <span>{label}</span>
              <strong>{items.length}</strong>
              <p>{first ? first.title : "Nothing urgent here."}</p>
              {first ? <button type="button">{first.action}</button> : <button type="button">Rest easy</button>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SnapshotRibbon({ cards }) {
  return (
    <section className="fb-ribbon">
      <div className="fb-section-head">
        <div>
          <p className="fb-kicker">Quiet money snapshot</p>
          <h2>Numbers visible without turning the page into a spreadsheet.</h2>
        </div>
      </div>

      <div className="fb-ribbon-track">
        {cards.map((card) => (
          <article key={card.key} className="fb-ribbon-card" style={{ "--ribbon": card.color }}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{statusLabel(card.status)} · {confidenceLabel(card.confidence)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function OwnerMoneyWorkspace() {
  const [themeKey, setThemeKey] = useState(ownerProfile.defaultTheme);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [activeBusiness, setActiveBusiness] = useState("simpleepay");

  const theme = getOwnerTheme(themeKey);
  const focus = useMemo(() => getTodayOwnerFocus(ownerMoneyQueue), []);

  return (
    <main
      className={`focus-board ${calmMode ? "is-calm" : ""}`}
      style={{
        "--fb-bg": theme.bg,
        "--fb-bg2": theme.bg2,
        "--fb-card": theme.card,
        "--fb-panel": theme.panel,
        "--fb-ink": theme.ink,
        "--fb-muted": theme.muted,
        "--fb-primary": theme.primary,
        "--fb-secondary": theme.secondary,
        "--fb-third": theme.third,
        "--fb-warning": theme.warning,
        "--fb-good": theme.good,
      }}
    >
      <section className="fb-hero">
        <div className="fb-starfield" />
        <div className="fb-hero-copy">
          <p className="fb-kicker">Opened by The Tower · Owner clearance</p>
          <h1>Solice’s Money Desk, but make it magic.</h1>
          <p>
            One clear next move, business money orbit, quiet snapshots, and protected paperwork.
            The Teller stays money-only. The Tower guards the real doors.
          </p>

          <div className="fb-badge-row">
            <Badge tone="strong">{ownerProfile.ownerId}</Badge>
            <Badge>Money-only</Badge>
            <Badge tone="warn">Tower protected</Badge>
          </div>
        </div>

        <div className="fb-hero-buttons">
          <button type="button" className="fb-primary" onClick={() => setSettingsOpen((value) => !value)}>
            {settingsOpen ? "Close settings" : "Open settings"}
          </button>
          <button type="button" className="fb-ghost" onClick={() => setCalmMode((value) => !value)}>
            {calmMode ? "Exit calm mode" : "Calm Money Mode"}
          </button>
        </div>
      </section>

      {settingsOpen ? (
        <ThemeCloset themeKey={themeKey} setThemeKey={setThemeKey} theme={theme} />
      ) : null}

      <PriorityFocus focus={focus} theme={theme} />

      {calmMode ? (
        <section className="fb-calm-card">
          <p className="fb-kicker">Calm Money Mode</p>
          <h2>Only this one thing right now.</h2>
          <p>{focus.why}</p>
          <button type="button" className="fb-primary">{focus.action}</button>
        </section>
      ) : (
        <>
          <BusinessOrbit lanes={ownerBusinessLanes} activeBusiness={activeBusiness} setActiveBusiness={setActiveBusiness} />
          <MoneyConstellations queue={ownerMoneyQueue} />
          <SnapshotRibbon cards={ownerSnapshotCards} />
        </>
      )}
    </main>
  );
}
