
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

function OwnerBadge({ children, tone = "quiet" }) {
  return <span className={`owner-badge owner-badge-${tone}`}>{children}</span>;
}

function ThemeCloset({ themeKey, setThemeKey, theme }) {
  return (
    <section className="owner-settings-card">
      <div>
        <p className="owner-kicker">Owner settings</p>
        <h2>Theme Closet</h2>
        <p className="owner-muted">The employee and manager portals stay normal. This private owner view gets the sauce.</p>
      </div>

      <div className="owner-theme-grid">
        {Object.values(ownerThemeChoices).map((item) => (
          <button
            key={item.key}
            type="button"
            className={`owner-theme-button ${themeKey === item.key ? "is-active" : ""}`}
            style={{
              "--theme-primary": item.primary,
              "--theme-secondary": item.secondary,
              "--theme-bg": item.card,
            }}
            onClick={() => setThemeKey(item.key)}
          >
            <span>{item.name}</span>
            <small>{item.vibe}</small>
          </button>
        ))}
      </div>

      <div className="owner-current-theme" style={{ borderColor: theme.primary }}>
        <span>Current theme</span>
        <strong>{theme.name}</strong>
        <small>{theme.vibe}</small>
      </div>
    </section>
  );
}

function TodayFocus({ focus, theme, calmMode }) {
  if (!focus) return null;

  return (
    <section className={`owner-focus-card ${calmMode ? "is-calm" : ""}`} style={{ "--accent": theme.primary }}>
      <div className="owner-focus-orb" />
      <div className="owner-card-head">
        <div>
          <p className="owner-kicker">Today’s Money Focus</p>
          <h2>{focus.title}</h2>
          <p>{focus.why}</p>
        </div>
        <div className="owner-focus-amount">
          <span>{focus.amount}</span>
          <small>{focus.due}</small>
        </div>
      </div>

      <div className="owner-badge-row">
        <OwnerBadge tone="strong">{focus.business}</OwnerBadge>
        <OwnerBadge tone="warn">{statusLabel(focus.status)}</OwnerBadge>
        <OwnerBadge>{confidenceLabel(focus.confidence)}</OwnerBadge>
        <OwnerBadge>{focus.source}</OwnerBadge>
      </div>

      <div className="owner-focus-actions">
        <button type="button" className="owner-primary-button">{focus.action}</button>
        <button type="button" className="owner-ghost-button">Why am I seeing this?</button>
      </div>
    </section>
  );
}

function SnapshotCard({ item }) {
  const tower = item.status === "tower_required" || item.visibility === "tower_required";

  return (
    <article className={`owner-snapshot-card ${tower ? "is-protected" : ""}`} style={{ "--card-accent": item.color }}>
      <div className="owner-card-topline">
        <span>{item.label}</span>
        <small>{statusLabel(item.status)}</small>
      </div>
      <h3>{item.title}</h3>
      <strong>{item.value}</strong>
      <p>{item.detail}</p>

      <div className="owner-mini-chip-row">
        <span>{confidenceLabel(item.confidence)}</span>
        <span>{item.source}</span>
      </div>

      {tower ? (
        <div className="owner-protected-note">
          Tower clearance required. The Teller can prepare paperwork, but protected details stay outside this app.
        </div>
      ) : null}
    </article>
  );
}

function MoneyQueue({ queue }) {
  return (
    <section className="owner-panel-card">
      <div className="owner-section-head">
        <div>
          <p className="owner-kicker">Money Queue</p>
          <h2>What needs money attention next.</h2>
        </div>
        <OwnerBadge tone="strong">{queue.length} items</OwnerBadge>
      </div>

      <div className="owner-queue-list">
        {queue.map((item) => (
          <article key={item.key} className="owner-queue-item">
            <div>
              <p className="owner-queue-lane">{item.lane} · {item.business}</p>
              <h3>{item.title}</h3>
              <p>{item.why}</p>
            </div>
            <div className="owner-queue-side">
              <strong>{item.amount}</strong>
              <small>{item.due}</small>
              <button type="button">{item.action}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BusinessLanes({ lanes, activeBusiness, setActiveBusiness }) {
  return (
    <section className="owner-panel-card">
      <div className="owner-section-head">
        <div>
          <p className="owner-kicker">Business Money Pulse</p>
          <h2>Each business moves different. The Teller only tracks money.</h2>
        </div>
      </div>

      <div className="owner-lane-grid">
        {lanes.map((lane) => (
          <button
            key={lane.key}
            type="button"
            className={`owner-lane-card ${activeBusiness === lane.key ? "is-active" : ""} ${lane.protected ? "is-protected" : ""}`}
            style={{ "--lane-color": lane.color }}
            onClick={() => setActiveBusiness(lane.key)}
          >
            <span>{lane.personality}</span>
            <strong>{lane.title}</strong>
            <p>{lane.summary}</p>
            {lane.protected ? <small>No OB doorway · Tower required</small> : <small>{lane.focus}</small>}
          </button>
        ))}
      </div>
    </section>
  );
}

function ActiveBusinessPanel({ lane }) {
  return (
    <section className="owner-active-business-card" style={{ "--lane-color": lane.color }}>
      <div>
        <p className="owner-kicker">Selected Money Lane</p>
        <h2>{lane.title}</h2>
        <p>{lane.focus}</p>
      </div>

      <div className="owner-action-pills">
        {lane.actions.map((action) => (
          <button key={action} type="button">{action}</button>
        ))}
      </div>

      {lane.protected ? (
        <div className="owner-protected-note is-big">
          MrkTrade is paperwork and vague numbers only inside The Teller. Any OB, trading, broker, engine, signal, or protected detail must open through The Tower.
        </div>
      ) : null}
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
  const activeLane = ownerBusinessLanes.find((lane) => lane.key === activeBusiness) || ownerBusinessLanes[0];

  return (
    <main
      className={`owner-money-workspace ${calmMode ? "is-calm-mode" : ""}`}
      style={{
        "--owner-bg": theme.bg,
        "--owner-bg2": theme.bg2,
        "--owner-panel": theme.panel,
        "--owner-card": theme.card,
        "--owner-ink": theme.ink,
        "--owner-muted": theme.muted,
        "--owner-primary": theme.primary,
        "--owner-secondary": theme.secondary,
        "--owner-third": theme.third,
        "--owner-warning": theme.warning,
        "--owner-good": theme.good,
      }}
    >
      <section className="owner-hero">
        <div className="owner-hero-glow one" />
        <div className="owner-hero-glow two" />

        <div className="owner-hero-content">
          <p className="owner-kicker">Opened by The Tower · Owner Clearance</p>
          <h1>Solice’s Money Workspace</h1>
          <p>
            Money, payroll, proof, paperwork, protected financial snapshots, and clean owner visibility.
            Business operations and empire control stay in their own systems.
          </p>

          <div className="owner-hero-badges">
            <OwnerBadge tone="strong">{ownerProfile.ownerId}</OwnerBadge>
            <OwnerBadge>Money-only</OwnerBadge>
            <OwnerBadge tone="warn">Tower protected</OwnerBadge>
          </div>
        </div>

        <div className="owner-hero-controls">
          <button type="button" className="owner-primary-button" onClick={() => setSettingsOpen((value) => !value)}>
            {settingsOpen ? "Close settings" : "Open settings"}
          </button>
          <button type="button" className="owner-ghost-button" onClick={() => setCalmMode((value) => !value)}>
            {calmMode ? "Exit Calm Money Mode" : "Calm Money Mode"}
          </button>
        </div>
      </section>

      {settingsOpen ? (
        <ThemeCloset themeKey={themeKey} setThemeKey={setThemeKey} theme={theme} />
      ) : null}

      <TodayFocus focus={focus} theme={theme} calmMode={calmMode} />

      {!calmMode ? (
        <>
          <section className="owner-snapshot-section">
            <div className="owner-section-head">
              <div>
                <p className="owner-kicker">Money Snapshot</p>
                <h2>Owner-level money without operational clutter.</h2>
              </div>
              <OwnerBadge tone="strong">6 lanes</OwnerBadge>
            </div>

            <div className="owner-snapshot-grid">
              {ownerSnapshotCards.map((item) => (
                <SnapshotCard key={item.key} item={item} />
              ))}
            </div>
          </section>

          <BusinessLanes lanes={ownerBusinessLanes} activeBusiness={activeBusiness} setActiveBusiness={setActiveBusiness} />
          <ActiveBusinessPanel lane={activeLane} />
          <MoneyQueue queue={ownerMoneyQueue} />
        </>
      ) : (
        <section className="owner-calm-card">
          <p className="owner-kicker">Calm Money Mode</p>
          <h2>One task. One decision. No crowding.</h2>
          <p>{focus?.why}</p>
          <button type="button" className="owner-primary-button">{focus?.action}</button>
        </section>
      )}
    </main>
  );
}
