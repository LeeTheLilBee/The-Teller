
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

function getBusinessSpecificItems(activeBusiness) {
  const items = ownerMoneyQueue.filter((item) => {
    const business = String(item.business || "").toLowerCase();
    if (activeBusiness === "simpleepay") return business.includes("simpleepay");
    if (activeBusiness === "mrktrade") return business.includes("mrktrade");
    if (activeBusiness === "skincare") return business.includes("skincare");
    if (activeBusiness === "onthego") return business.includes("onthego");
    if (activeBusiness === "property") return business.includes("property");
    return false;
  });

  return items.length ? items : ownerMoneyQueue.slice(0, 2);
}

function getBusinessSnapshot(activeBusiness) {
  return ownerSnapshotCards.find((card) => card.key === activeBusiness) || ownerSnapshotCards[0];
}

function businessSpecificCopy(activeBusiness) {
  const map = {
    simpleepay: {
      title: "SimpleePay money workspace",
      subtitle: "Payroll readiness, worker pay, proof packets, tax/payment records, and employee-change money risk.",
      focusTitle: "Payroll cannot move casually.",
      focusBody: "Before payroll sends, The Teller checks worker changes, pay-cycle readiness, funding, proof packets, and whether anything needs Tower review.",
      leftLabel: "Payroll pressure",
      leftValue: "$4.8k",
      middleLabel: "Records needing review",
      middleValue: "3",
      rightLabel: "Proof packet status",
      rightValue: "Waiting",
    },
    mrktrade: {
      title: "MrkTrade protected paperwork workspace",
      subtitle: "Only vague financial paperwork, receipts, proof health, deposits, expenses, and Tower handoff prep. No OB doorway.",
      focusTitle: "Protected details stay behind The Tower.",
      focusBody: "The Teller can organize MrkTrade’s money paperwork, but trading, broker, engine, signals, OB, and protected details must open through The Tower.",
      leftLabel: "Protected snapshot",
      leftValue: "$50.0k",
      middleLabel: "Paperwork packet",
      middleValue: "$3.1k",
      rightLabel: "Access route",
      rightValue: "Tower",
      protected: true,
    },
    skincare: {
      title: "SimpleeSkincare money workspace",
      subtitle: "Sales, fees, refunds, shipping spend, costs, deposits, and proof records only.",
      focusTitle: "Beauty money needs clean separation.",
      focusBody: "The Teller separates sales from costs, fees, refunds, shipping spend, deposits, and proof so the business money view does not lie to you.",
      leftLabel: "Sales snapshot",
      leftValue: "$2.6k",
      middleLabel: "Costs to review",
      middleValue: "$740",
      rightLabel: "Proof records",
      rightValue: "5",
    },
    onthego: {
      title: "SimpleeOnTheGo route money workspace",
      subtitle: "Route revenue, location fees, cash movement, machine costs, worker pay, and route proof.",
      focusTitle: "Route money needs receipts and movement records.",
      focusBody: "The Teller keeps revenue, location fees, machine costs, cash needs, and proof tied together before the route looks clean.",
      leftLabel: "Route revenue",
      leftValue: "$8.1k",
      middleLabel: "Missing proof",
      middleValue: "1",
      rightLabel: "Cash movement",
      rightValue: "Track",
    },
    property: {
      title: "SimpleeProperty money workspace",
      subtitle: "Income, vendor bills, reserves, repairs, taxes, insurance, acquisition costs, and property paperwork.",
      focusTitle: "Property money should not blur together.",
      focusBody: "The Teller separates income, bills, reserves, repairs, insurance, taxes, and paperwork before anything looks like profit.",
      leftLabel: "Income tracked",
      leftValue: "$12.4k",
      middleLabel: "Vendor bills",
      middleValue: "3",
      rightLabel: "Reserve check",
      rightValue: "$850",
    },
  };

  return map[activeBusiness] || map.simpleepay;
}

function ThemeCloset({ themeKey, setThemeKey, theme, calmMode, setCalmMode, onClose }) {
  return (
    <aside className="fb-settings-drawer">
      <div className="fb-settings-top">
        <div>
          <p className="fb-kicker">Owner settings</p>
          <h2>Theme closet</h2>
          <p>Private owner themes, focus comfort, and display behavior live here.</p>
        </div>
        <button type="button" className="fb-ghost" onClick={onClose}>Close</button>
      </div>

      <section className="fb-setting-block">
        <div>
          <h3>Calm Money Mode</h3>
          <p>Hide the extra sections and show only the most urgent money matter.</p>
        </div>
        <button
          type="button"
          className={`fb-toggle ${calmMode ? "is-on" : ""}`}
          onClick={() => setCalmMode((value) => !value)}
        >
          {calmMode ? "On" : "Off"}
        </button>
      </section>

      <section className="fb-setting-block">
        <div>
          <h3>Owner theme</h3>
          <p>Employee and manager stay normal. Your owner side gets the flavor.</p>
        </div>
      </section>

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
    </aside>
  );
}

function PriorityFocus({ focus }) {
  return (
    <section className="fb-priority" style={{ "--focus": "var(--fb-warning)" }}>
      <div className="fb-priority-glow" />
      <div className="fb-priority-main">
        <p className="fb-kicker">Most Urgent Matters</p>
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
        <div>
          <small>Due</small>
          <span>{focus.due}</span>
        </div>
        <div>
          <small>Money involved</small>
          <span>{focus.amount}</span>
        </div>
        <div>
          <small>Next move</small>
          <p>{focus.action}</p>
        </div>
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
          <h2>Tap a business. The workspace below changes with it.</h2>
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
    </section>
  );
}

function BusinessSpecificWorkspace({ activeBusiness, lane }) {
  const copy = businessSpecificCopy(activeBusiness);
  const items = getBusinessSpecificItems(activeBusiness);
  const snapshot = getBusinessSnapshot(activeBusiness);

  return (
    <section className={`fb-business-workspace ${copy.protected ? "is-protected" : ""}`} style={{ "--business-color": lane.color }}>
      <div className="fb-section-head">
        <div>
          <p className="fb-kicker">Business-specific money view</p>
          <h2>{copy.title}</h2>
          <p>{copy.subtitle}</p>
        </div>
        <Badge tone={copy.protected ? "warn" : "strong"}>{copy.protected ? "Tower protected" : "Money-only"}</Badge>
      </div>

      <div className="fb-business-focus">
        <div>
          <p className="fb-kicker">What changes when this business is selected</p>
          <h3>{copy.focusTitle}</h3>
          <p>{copy.focusBody}</p>
        </div>

        <div className="fb-business-metrics">
          <article>
            <span>{copy.leftLabel}</span>
            <strong>{copy.leftValue}</strong>
          </article>
          <article>
            <span>{copy.middleLabel}</span>
            <strong>{copy.middleValue}</strong>
          </article>
          <article>
            <span>{copy.rightLabel}</span>
            <strong>{copy.rightValue}</strong>
          </article>
        </div>
      </div>

      <div className="fb-business-bottom">
        <article className="fb-business-snapshot" style={{ "--snapshot-color": snapshot.color }}>
          <span>{snapshot.label}</span>
          <strong>{snapshot.value}</strong>
          <p>{snapshot.detail}</p>
          <small>{statusLabel(snapshot.status)} · {confidenceLabel(snapshot.confidence)}</small>
        </article>

        <div className="fb-business-actions">
          <p className="fb-kicker">Business-specific actions</p>
          <div className="fb-action-cloud">
            {lane.actions.map((action) => (
              <button key={action} type="button">{action}</button>
            ))}
          </div>

          <div className="fb-business-items">
            {items.map((item) => (
              <article key={item.key}>
                <span>{item.lane}</span>
                <strong>{item.title}</strong>
                <p>{item.why}</p>
                <small>{item.amount} · {item.due}</small>
              </article>
            ))}
          </div>
        </div>
      </div>

      {copy.protected ? (
        <div className="fb-protected">
          MrkTrade is financial paperwork only inside The Teller. Anything involving OB, trading, broker access, engine decisions, signals, or protected operations must be opened from The Tower.
        </div>
      ) : null}
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
          <h2>Secondary money matters, grouped softly.</h2>
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
  const activeLane = ownerBusinessLanes.find((lane) => lane.key === activeBusiness) || ownerBusinessLanes[0];

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
      <button
        type="button"
        className={`fb-settings-corner ${settingsOpen ? "is-open" : ""}`}
        onClick={() => setSettingsOpen((value) => !value)}
      >
        Settings
      </button>

      {settingsOpen ? (
        <ThemeCloset
          themeKey={themeKey}
          setThemeKey={setThemeKey}
          theme={theme}
          calmMode={calmMode}
          setCalmMode={setCalmMode}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}

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
            {calmMode ? <Badge tone="strong">Calm mode on</Badge> : null}
          </div>
        </div>
      </section>

      <PriorityFocus focus={focus} />

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
          <BusinessSpecificWorkspace activeBusiness={activeBusiness} lane={activeLane} />
          <MoneyConstellations queue={getBusinessSpecificItems(activeBusiness)} />
          <SnapshotRibbon cards={[getBusinessSnapshot(activeBusiness), ...ownerSnapshotCards.filter((card) => card.key !== activeBusiness).slice(0, 3)]} />
        </>
      )}
    </main>
  );
}
