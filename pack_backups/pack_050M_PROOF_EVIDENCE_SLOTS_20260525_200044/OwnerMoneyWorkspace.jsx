
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



function makeOwnerReceipt(action) {
  const stamp = new Date().toISOString();
  const random = Math.floor(100000 + Math.random() * 900000);
  const receiptId = `OWNER-RCPT-${random}`;

  return {
    id: receiptId,
    action: action?.label || action?.action || "Owner action",
    target: action?.target || action?.business || "Owner workspace",
    business: action?.business || "Owner workspace",
    tower: Boolean(action?.tower),
    money: Boolean(action?.money),
    proof: Boolean(action?.proof),
    createdAt: stamp,
    status: action?.tower ? "Queued for Tower" : "Recorded",
    decision: action?.decision || "recorded",
    decisionReason: action?.decisionReason || "Owner reviewed and recorded this money action.",
    decisionNote: action?.decisionNote || "",
    proofReviewed: Array.isArray(action?.proofReviewed) ? action.proofReviewed : [],
    towerCopyRequired: true,
    towerReceiptId: `TOWER-COPY-${random}`,
    towerReceiptStatus: "Queued for Tower",
  };
}

function makeTowerReceiptCopy(ownerReceipt) {
  return {
    id: ownerReceipt.towerReceiptId,
    ownerReceiptId: ownerReceipt.id,
    action: ownerReceipt.action,
    target: ownerReceipt.target,
    business: ownerReceipt.business,
    createdAt: ownerReceipt.createdAt,
    status: "Queued for Tower",
    reason: ownerReceipt.tower
      ? "Protected or Tower-routed owner action."
      : "Owner money action receipt copied to The Tower for audit trail.",
    decision: ownerReceipt.decision,
    decisionReason: ownerReceipt.decisionReason,
    decisionNote: ownerReceipt.decisionNote,
    proofReviewed: ownerReceipt.proofReviewed,
    deliveryMode: "local_handoff_until_tower_api",
  };
}

function defaultDecisionReason(decision, card) {
  const title = card?.title || "this review card";

  if (decision === "approved") {
    return `${title} was approved because the visible money impact, status, and proof context looked acceptable for this stage.`;
  }

  if (decision === "held") {
    return `${title} was held because the item needs more owner review before it should affect money movement.`;
  }

  if (decision === "proof_requested") {
    return `${title} needs supporting proof before the money record should be treated as clean.`;
  }

  if (decision === "tower_sent") {
    return `${title} was sent to The Tower because it is sensitive, protected, or requires Tower-level clearance.`;
  }

  return `${title} was reviewed and recorded.`;
}

const decisionReasonOptions = [
  "Proof looks acceptable.",
  "Needs supporting proof first.",
  "Manager edit needs explanation.",
  "Money impact needs owner review.",
  "Sensitive change requires Tower clearance.",
  "Hold until the record is cleaner.",
  "Ready for the next step.",
];

function makeOwnerNotification({ type = "info", title, body, receiptId, towerReceiptId, decisionReason, decisionNote }) {
  const random = Math.floor(100000 + Math.random() * 900000);

  return {
    id: `NOTICE-${random}`,
    type,
    title,
    body,
    receiptId,
    towerReceiptId,
    decisionReason,
    decisionNote,
    createdAt: new Date().toISOString(),
    read: false,
  };
}


function notificationTone(type = "info") {
  const map = {
    owner_receipt: "strong",
    tower_copy: "warn",
    approved: "strong",
    held: "warn",
    proof_requested: "warn",
    tower_sent: "warn",
    info: "quiet",
  };

  return map[type] || "quiet";
}

function NotificationsDropdown({ notifications, open, setOpen, onClear }) {
  const unreadCount = notifications.filter((notice) => !notice.read).length;

  return (
    <div className="fb-notifications-shell">
      <button
        type="button"
        className={`fb-notifications-button ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
      >
        Notifications
        {notifications.length ? <span>{unreadCount || notifications.length}</span> : null}
      </button>

      {open ? (
        <aside className="fb-notifications-menu">
          <div className="fb-notifications-head">
            <div>
              <p className="fb-kicker">Notifications</p>
              <h2>Recent money activity</h2>
            </div>
            {notifications.length ? (
              <button type="button" className="fb-ghost" onClick={onClear}>
                Clear
              </button>
            ) : null}
          </div>

          <div className="fb-notifications-list">
            {notifications.length ? notifications.map((notice) => (
              <article key={notice.id} className={`fb-notice fb-notice-${notice.type}`}>
                <div className="fb-notice-top">
                  <Badge tone={notificationTone(notice.type)}>{notice.type.replaceAll("_", " ")}</Badge>
                  <small>{new Date(notice.createdAt).toLocaleTimeString()}</small>
                </div>
                <strong>{notice.title}</strong>
                <p>{notice.body}</p>
                {notice.decisionReason ? <p className="fb-notice-reason">Reason: {notice.decisionReason}</p> : null}
                {notice.decisionNote ? <p className="fb-notice-reason">Note: {notice.decisionNote}</p> : null}
                {notice.receiptId ? <small>Owner: {notice.receiptId}</small> : null}
                {notice.towerReceiptId ? <small>Tower: {notice.towerReceiptId}</small> : null}
              </article>
            )) : (
              <article className="fb-notice-empty">
                <p className="fb-kicker">Quiet</p>
                <strong>No notifications yet.</strong>
                <p>Review Desk decisions will appear here.</p>
              </article>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
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


function OwnerFlowGuide({ activeBusiness, pendingAction, receipts }) {
  return (
    <section className="fb-flow-guide">
      <div>
        <p className="fb-kicker">How to use this page</p>
        <h2>Touch the page in this order.</h2>
      </div>

      <div className="fb-flow-steps">
        <article className={activeBusiness ? "is-done" : ""}>
          <span>1</span>
          <strong>Pick a business</strong>
          <p>Tap a business circle in the orbit.</p>
        </article>

        <article className={activeBusiness ? "is-active" : ""}>
          <span>2</span>
          <strong>Review the money focus</strong>
          <p>The section underneath changes to that business.</p>
        </article>

        <article>
          <span>3</span>
          <strong>Choose an action</strong>
          <p>Use the buttons inside the business workspace.</p>
        </article>

        <article className={pendingAction ? "is-active" : ""}>
          <span>4</span>
          <strong>Confirm final review</strong>
          <p>The system previews what will happen first.</p>
        </article>

        <article className={receipts.length ? "is-done" : ""}>
          <span>5</span>
          <strong>Receipt appears</strong>
          <p>The action gets a simple owner receipt.</p>
        </article>
      </div>
    </section>
  );
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


function getReviewCardDetails(card) {
  const key = String(card?.key || "").toLowerCase();

  const base = {
    timeline: [
      ["Source", card?.proof || "Review record"],
      ["Status", card?.status || "Open"],
      ["Risk", card?.risk || "Unknown"],
    ],
    checklist: [
      "Confirm money impact",
      "Confirm proof source",
      "Confirm decision reason",
    ],
    managerNote: "No manager note has been attached yet.",
  };

  if (key.includes("clock")) {
    return {
      timeline: [
        ["Scheduled shift", "9:00 AM - 2:00 PM"],
        ["Clock in", "8:57 AM"],
        ["Clock out", "2:01 PM"],
        ["Rounding impact", "Low"],
      ],
      checklist: [
        "Clock-in time is within expected range",
        "Shift matches schedule",
        "No missing punch",
        "Pay impact reviewed",
      ],
      managerNote: "Clock-in appears normal. No manager correction required unless rounding policy changes the paid time.",
    };
  }

  if (key.includes("edit")) {
    return {
      timeline: [
        ["Original punch count", "2"],
        ["Edited entries", "2"],
        ["Edited by", "Manager"],
        ["Reason attached", "Missing"],
      ],
      checklist: [
        "Manager reason attached",
        "Original punches reviewed",
        "Edited time does not create payroll mismatch",
        "Employee dispute status checked",
      ],
      managerNote: "Manager edited two entries. Owner should request or confirm the edit reason before payroll closes.",
    };
  }

  if (key.includes("break")) {
    return {
      timeline: [
        ["Shift reviewed", "One shift"],
        ["Break confirmation", "Missing"],
        ["Pay impact", card?.money || "Unknown"],
        ["Proof source", "Break confirmation"],
      ],
      checklist: [
        "Break confirmation attached",
        "Policy impact reviewed",
        "Manager follow-up completed",
      ],
      managerNote: "Break confirmation is missing. Request proof before final payroll approval.",
    };
  }

  if (key.includes("deposit")) {
    return {
      timeline: [
        ["Change type", "Direct deposit"],
        ["Sensitive field", "Bank account"],
        ["Identity check", "Required"],
        ["Access route", "The Tower"],
      ],
      checklist: [
        "Do not approve inside The Teller",
        "Send to The Tower",
        "Require identity/bank change proof",
        "Audit receipt required",
      ],
      managerNote: "Direct deposit changes are Tower-routed. The Teller should never casually approve bank changes.",
    };
  }

  if (key.includes("packet") || key.includes("mrk")) {
    return {
      timeline: [
        ["Workspace", "MrkTrade paperwork only"],
        ["Protected details", "Hidden"],
        ["Tower handoff", "Required"],
        ["OB access", "Blocked here"],
      ],
      checklist: [
        "No OB details exposed",
        "Prepare financial paperwork only",
        "Queue Tower copy",
        "Audit receipt created",
      ],
      managerNote: "MrkTrade protected details must stay behind The Tower. This review is paperwork-only.",
    };
  }

  return base;
}



function ReviewDetailPanel({ selectedReview, onClose, onAutoReceipt, onDetailDecision }) {
  const [decisionReason, setDecisionReason] = useState(decisionReasonOptions[0]);
  const [decisionNote, setDecisionNote] = useState("");

  if (!selectedReview?.card) return null;

  const card = selectedReview.card;
  const details = getReviewCardDetails(card);
  const tower = Boolean(card.tower);

  function detailAction(decision, label, description) {
    const action = {
      label,
      business: selectedReview.deskTitle || "Review Desk",
      target: card.title,
      description,
      money: true,
      proof: decision === "proof_requested" || decision === "approved",
      tower: tower || decision === "tower_sent",
      decision,
      decisionReason,
      decisionNote,
      proofReviewed: details.checklist,
      autoCreated: true,
    };

    if (onDetailDecision) {
      onDetailDecision(card.key, decision);
    }

    if (onAutoReceipt) {
      onAutoReceipt(action);
    }

    onClose();
  }

  return (
    <div className="fb-review-detail-overlay" role="dialog" aria-modal="true">
      <section className={`fb-review-detail-panel ${tower ? "is-tower" : ""}`}>
        <div className="fb-section-head">
          <div>
            <p className="fb-kicker">Review details</p>
            <h2>{card.title}</h2>
            <p>{card.detail}</p>
          </div>
          <button type="button" className="fb-ghost" onClick={onClose}>Close</button>
        </div>

        <div className="fb-review-detail-layout">
          <article className="fb-review-detail-main">
            <p className="fb-kicker">Small-picture breakdown</p>
            <div className="fb-review-detail-facts">
              <div>
                <span>Money impact</span>
                <strong>{card.money}</strong>
              </div>
              <div>
                <span>Risk</span>
                <strong>{card.risk}</strong>
              </div>
              <div>
                <span>Proof</span>
                <strong>{card.proof}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{card.status}</strong>
              </div>
            </div>

            <div className="fb-review-timeline">
              <p className="fb-kicker">Timeline / card facts</p>
              {details.timeline.map(([label, value]) => (
                <div key={`${label}-${value}`}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="fb-decision-reason-box">
              <p className="fb-kicker">Decision reason</p>
              <label>
                <span>Reason</span>
                <select value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)}>
                  {decisionReasonOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Optional note</span>
                <textarea
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value)}
                  placeholder="Add a short owner note for the receipt and Tower copy..."
                  rows={4}
                />
              </label>
            </div>
          </article>

          <aside className="fb-review-detail-side">
            <p className="fb-kicker">Proof checklist</p>
            <div className="fb-proof-checklist">
              {details.checklist.map((item) => (
                <label key={item}>
                  <input type="checkbox" readOnly />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            <div className="fb-manager-note">
              <p className="fb-kicker">Manager note</p>
              <p>{details.managerNote}</p>
            </div>
          </aside>
        </div>

        <div className="fb-review-detail-actions">
          <button
            type="button"
            onClick={() => detailAction("approved", `Approve detail · ${card.title}`, `Approved from detail review: ${card.detail}`)}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => detailAction("held", `Hold detail · ${card.title}`, `Held from detail review: ${card.detail}`)}
          >
            Hold
          </button>
          <button
            type="button"
            onClick={() => detailAction(tower ? "tower_sent" : "proof_requested", tower ? `Send detail to Tower · ${card.title}` : `Request proof from detail · ${card.title}`, tower ? "Protected detail item sent to The Tower handoff queue." : `Proof requested from detail review: ${card.proof}`)}
          >
            {tower ? "Send to Tower" : "Request Proof"}
          </button>
        </div>
      </section>
    </div>
  );
}


function FinalActionPreview({ action, onCancel, onConfirm }) {
  if (!action) return null;

  return (
    <section className="fb-final-preview">
      <div>
        <p className="fb-kicker">{action.alreadyReceipted ? "Receipt auto-created + Tower copy queued" : "Step 4 · Final review"}</p>
        <h2>{action.label}</h2>
        <p>{action.description}</p>

        <div className="fb-badge-row">
          {action.money ? <Badge tone="warn">Money-related</Badge> : null}
          {action.proof ? <Badge>Proof will be checked</Badge> : null}
          {action.tower ? <Badge tone="warn">Tower handoff</Badge> : <Badge tone="strong">Owner receipt</Badge>}
        </div>
      </div>

      <div className="fb-final-actions">
        {action.alreadyReceipted ? (
          <button type="button" className="fb-primary" onClick={onCancel}>
            Got it
          </button>
        ) : (
          <button type="button" className="fb-primary" onClick={() => onConfirm(action)}>
            Create receipt + Tower copy
          </button>
        )}
        <button type="button" className="fb-ghost" onClick={onCancel}>
          {action.alreadyReceipted ? "Close" : "Cancel"}
        </button>
      </div>
    </section>
  );
}


function TowerReceiptDock({ towerReceipts }) {
  if (!towerReceipts.length) return null;

  return (
    <section className="fb-tower-receipt-dock">
      <div className="fb-section-head">
        <div>
          <p className="fb-kicker">Tower receipt copies</p>
          <h2>Receipts queued for The Tower too.</h2>
          <p>
            These are local Tower handoff copies for now. When The Tower backend is connected,
            this is the stream that should be sent into the real Tower audit system.
          </p>
        </div>
        <Badge tone="warn">{towerReceipts.length} Tower copies</Badge>
      </div>

      <div className="fb-tower-receipt-grid">
        {towerReceipts.map((receipt) => (
          <article key={receipt.id} className="fb-tower-receipt-card">
            <span>{receipt.id}</span>
            <strong>{receipt.action}</strong>
            <p>{receipt.reason}</p>
            {receipt.decisionReason ? <p className="fb-receipt-reason">Reason: {receipt.decisionReason}</p> : null}
            {receipt.decisionNote ? <p className="fb-receipt-reason">Note: {receipt.decisionNote}</p> : null}
            <small>Owner receipt: {receipt.ownerReceiptId}</small>
          </article>
        ))}
      </div>
    </section>
  );
}


function ReceiptDock({ receipts }) {
  if (!receipts.length) return null;

  return (
    <section className="fb-receipt-dock">
      <div className="fb-section-head">
        <div>
          <p className="fb-kicker">Step 5 · Owner receipts</p>
          <h2>Recent owner action trail.</h2>
        </div>
        <Badge>{receipts.length} receipts</Badge>
      </div>

      <div className="fb-receipt-grid">
        {receipts.map((receipt) => (
          <article key={receipt.id} className="fb-receipt-card">
            <span>{receipt.id}</span>
            <strong>{receipt.action}</strong>
            <p>{receipt.target}</p>
            {receipt.decisionReason ? <p className="fb-receipt-reason">Reason: {receipt.decisionReason}</p> : null}
            {receipt.decisionNote ? <p className="fb-receipt-reason">Note: {receipt.decisionNote}</p> : null}
            <small>{receipt.status} · {new Date(receipt.createdAt).toLocaleString()}</small>
          </article>
        ))}
      </div>
    </section>
  );
}


function PriorityFocus({ focus, onAction }) {
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
          <button
            type="button"
            className="fb-primary"
            onClick={() => onAction({
              label: focus.action,
              business: focus.business,
              target: focus.title,
              description: focus.why,
              money: true,
              proof: true,
              tower: focus.status === "tower_required",
            })}
          >
            {focus.action}
          </button>
          <button
            type="button"
            className="fb-ghost"
            onClick={() => onAction({
              label: "Review urgency reason",
              business: focus.business,
              target: focus.title,
              description: "Review why this item is currently the highest-priority owner money matter.",
              money: false,
              proof: false,
              tower: false,
            })}
          >
            Why this matters
          </button>
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
          <p className="fb-kicker">Step 1 · Pick a business</p>
          <h2>Tap a business circle. The workspace below changes with it.</h2>
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

function BusinessSpecificWorkspace({ activeBusiness, lane, onAction }) {
  const copy = businessSpecificCopy(activeBusiness);
  const items = getBusinessSpecificItems(activeBusiness);
  const snapshot = getBusinessSnapshot(activeBusiness);

  return (
    <section className={`fb-business-workspace ${copy.protected ? "is-protected" : ""}`} style={{ "--business-color": lane.color }}>
      <div className="fb-section-head">
        <div>
          <p className="fb-kicker">Step 2 · Review this business money view</p>
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
          <p className="fb-kicker">Step 3 · Choose an action</p>
          <div className="fb-action-cloud">
            {lane.actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onAction({
                  label: action,
                  business: lane.title,
                  target: copy.title,
                  description: copy.focusBody,
                  money: true,
                  proof: true,
                  tower: Boolean(lane.protected),
                })}
              >
                {action}
              </button>
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


function getCardDecisionState(card, reviewDecisions) {
  return reviewDecisions[card.key] || "open";
}

function reviewFilterMatches(card, filter, reviewDecisions) {
  const decision = getCardDecisionState(card, reviewDecisions);
  const status = String(card.status || "").toLowerCase();

  if (filter === "all") return true;
  if (filter === "open") return decision === "open";
  if (filter === "needs_review") return status.includes("review") || decision === "open";
  if (filter === "needs_proof") return status.includes("proof") || decision === "proof_requested";
  if (filter === "tower_required") return card.tower || decision === "tower_sent";
  if (filter === "approved") return decision === "approved";
  if (filter === "held") return decision === "held";

  return true;
}

function decisionLabel(value) {
  const map = {
    open: "Open",
    approved: "Approved",
    held: "Held",
    proof_requested: "Proof requested",
    tower_sent: "Sent to Tower",
  };
  return map[value] || "Open";
}

function decisionTone(value) {
  const map = {
    open: "quiet",
    approved: "strong",
    held: "warn",
    proof_requested: "warn",
    tower_sent: "warn",
  };
  return map[value] || "quiet";
}

function getReviewDeskData(activeBusiness) {
  const map = {
    simpleepay: {
      title: "SimpleePay Review Desk",
      subtitle: "Small-picture payroll review: clock-ins, manager notes, missing punches, pay impact, and proof before payroll moves.",
      managerView: "Manager view · Payroll readiness",
      cards: [
        {
          key: "maya-clock",
          label: "Clock-in card",
          title: "Maya J. clocked in early",
          detail: "Clock-in 8:57 AM for a 9:00 AM shift. No issue unless this affects rounding rules.",
          money: "$46.25",
          status: "Looks normal",
          risk: "Low",
          proof: "Time clock",
          tower: false,
        },
        {
          key: "jordan-edit",
          label: "Manager edit",
          title: "Jordan R. edited two time entries",
          detail: "Manager changed 2 punches. Review before payroll so the edit has a clean reason.",
          money: "$118.40",
          status: "Needs review",
          risk: "Medium",
          proof: "Manager note missing",
          tower: false,
        },
        {
          key: "missing-break",
          label: "Break issue",
          title: "One missing break confirmation",
          detail: "Employee shift shows no break confirmation. Hold or request manager proof.",
          money: "$22.10",
          status: "Needs proof",
          risk: "Medium",
          proof: "Break confirmation",
          tower: false,
        },
        {
          key: "direct-deposit-change",
          label: "Tower item",
          title: "Direct deposit change pending",
          detail: "This cannot be changed casually. Route to The Tower before payroll uses it.",
          money: "Protected",
          status: "Tower required",
          risk: "High",
          proof: "Identity + bank change",
          tower: true,
        },
      ],
    },
    mrktrade: {
      title: "MrkTrade Paperwork Review Desk",
      subtitle: "Financial paperwork and vague money records only. OB, trading, engine, broker, and signals stay behind The Tower.",
      managerView: "Protected finance view · Tower handoff",
      cards: [
        {
          key: "mrk-packet",
          label: "Paperwork packet",
          title: "Financial packet needs Tower review",
          detail: "The Teller can prepare the packet, but protected details must be opened by The Tower.",
          money: "$3.1k",
          status: "Tower required",
          risk: "High",
          proof: "Protected packet",
          tower: true,
        },
        {
          key: "mrk-expense",
          label: "Expense proof",
          title: "Expense proof needs matching",
          detail: "Attach or confirm receipt before this is treated as clean admin money.",
          money: "$280",
          status: "Needs proof",
          risk: "Medium",
          proof: "Receipt",
          tower: true,
        },
      ],
    },
    skincare: {
      title: "SimpleeSkincare Money Review Desk",
      subtitle: "Small-picture sales, shipping spend, refunds, fees, costs, deposits, and proof records.",
      managerView: "Business money view · Product money only",
      cards: [
        {
          key: "skin-sales",
          label: "Sales card",
          title: "Sales batch needs deposit match",
          detail: "Compare expected sales to deposit amount before showing net.",
          money: "$2.6k",
          status: "Needs review",
          risk: "Medium",
          proof: "Sales report",
          tower: false,
        },
        {
          key: "skin-shipping",
          label: "Shipping spend",
          title: "Shipping spend is high this cycle",
          detail: "Shipping cost should be separated from product costs so margin is not inflated.",
          money: "$318",
          status: "Needs review",
          risk: "Medium",
          proof: "Shipping receipts",
          tower: false,
        },
        {
          key: "skin-refund",
          label: "Refund card",
          title: "Refund proof needs attachment",
          detail: "One refund needs proof before the batch closes.",
          money: "$42",
          status: "Needs proof",
          risk: "Low",
          proof: "Refund receipt",
          tower: false,
        },
      ],
    },
    onthego: {
      title: "SimpleeOnTheGo Route Review Desk",
      subtitle: "Route-level review for cash movement, route revenue, location fees, machine costs, worker pay, and proof.",
      managerView: "Route manager view · Cash/proof",
      cards: [
        {
          key: "route-cash",
          label: "Cash movement",
          title: "Route cash movement needs proof",
          detail: "Cash movement should not be counted clean until route proof is attached.",
          money: "$8.1k",
          status: "Needs proof",
          risk: "High",
          proof: "Route receipt",
          tower: false,
        },
        {
          key: "location-fee",
          label: "Location fee",
          title: "Location fee due soon",
          detail: "Review due date, amount, and proof before payment.",
          money: "$450",
          status: "Needs review",
          risk: "Medium",
          proof: "Location agreement",
          tower: false,
        },
      ],
    },
    property: {
      title: "SimpleeProperty Review Desk",
      subtitle: "Property money review for income, vendor bills, repairs, reserves, insurance, taxes, and paperwork.",
      managerView: "Property manager view · Bills/reserves",
      cards: [
        {
          key: "vendor-bill",
          label: "Vendor bill",
          title: "Three vendor bills need matching",
          detail: "Match bill, property, due date, and proof before money moves.",
          money: "3 bills",
          status: "Needs review",
          risk: "Medium",
          proof: "Vendor invoices",
          tower: false,
        },
        {
          key: "reserve-check",
          label: "Reserve impact",
          title: "Repair may hit reserves",
          detail: "Review reserve impact before paying the repair bill.",
          money: "$850",
          status: "Needs review",
          risk: "Medium",
          proof: "Repair estimate",
          tower: false,
        },
      ],
    },
  };

  return map[activeBusiness] || map.simpleepay;
}

function OwnerReviewDesk({ activeBusiness, lane, onAction, onAutoReceipt, reviewDecisions, setReviewDecisions, onOpenReviewCard }) {
  const [reviewFilter, setReviewFilter] = useState("all");
  const desk = getReviewDeskData(activeBusiness);
  const filteredCards = desk.cards.filter((card) => reviewFilterMatches(card, reviewFilter, reviewDecisions));

  const filters = [
    ["all", "All"],
    ["open", "Open"],
    ["needs_review", "Needs Review"],
    ["needs_proof", "Needs Proof"],
    ["tower_required", "Tower Required"],
    ["approved", "Approved"],
    ["held", "Held"],
  ];

  function setDecision(card, decision) {
    setReviewDecisions((current) => ({
      ...current,
      [card.key]: decision,
    }));
  }

  function reviewAction(card, decision, label, description) {
    setDecision(card, decision);

    const action = {
      label,
      business: desk.title,
      target: card.title,
      description,
      money: true,
      proof: decision === "proof_requested" || decision === "approved",
      tower: card.tower || decision === "tower_sent",
      decision,
      decisionReason: defaultDecisionReason(decision, card),
      decisionNote: "Quick Review Desk action.",
      proofReviewed: [card.proof, card.status, card.risk].filter(Boolean),
      autoCreated: true,
    };

    if (onAutoReceipt) {
      onAutoReceipt(action);
    } else {
      onAction(action);
    }
  }

  const counts = {
    all: desk.cards.length,
    open: desk.cards.filter((card) => getCardDecisionState(card, reviewDecisions) === "open").length,
    needs_review: desk.cards.filter((card) => reviewFilterMatches(card, "needs_review", reviewDecisions)).length,
    needs_proof: desk.cards.filter((card) => reviewFilterMatches(card, "needs_proof", reviewDecisions)).length,
    tower_required: desk.cards.filter((card) => reviewFilterMatches(card, "tower_required", reviewDecisions)).length,
    approved: desk.cards.filter((card) => getCardDecisionState(card, reviewDecisions) === "approved").length,
    held: desk.cards.filter((card) => getCardDecisionState(card, reviewDecisions) === "held").length,
  };

  return (
    <section className="fb-review-desk" style={{ "--review-color": lane.color }}>
      <div className="fb-section-head">
        <div>
          <p className="fb-kicker">Big picture + small picture</p>
          <h2>{desk.title}</h2>
          <p>{desk.subtitle}</p>
        </div>
        <Badge tone="strong">{desk.managerView}</Badge>
      </div>

      <div className="fb-review-filter-row">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={reviewFilter === key ? "is-active" : ""}
            onClick={() => setReviewFilter(key)}
          >
            {label}
            <span>{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      <div className="fb-review-layout">
        <aside className="fb-review-manager-card">
          <p className="fb-kicker">Manager view</p>
          <h3>What needs your eyes</h3>
          <p>
            This is the small-picture layer: clock-in cards, manager edits, proof needs,
            pay impact, and Tower-routed items. Big picture tells you where to look.
            Review Desk shows the actual cards.
          </p>
          <div className="fb-review-mini-metrics">
            <article>
              <span>Cards</span>
              <strong>{desk.cards.length}</strong>
            </article>
            <article>
              <span>Needs proof</span>
              <strong>{counts.needs_proof}</strong>
            </article>
            <article>
              <span>Tower</span>
              <strong>{counts.tower_required}</strong>
            </article>
            <article>
              <span>Approved</span>
              <strong>{counts.approved}</strong>
            </article>
          </div>
        </aside>

        <div className="fb-review-card-grid">
          {filteredCards.length ? filteredCards.map((card) => {
            const decision = getCardDecisionState(card, reviewDecisions);

            return (
              <article key={card.key} className={`fb-review-card is-${decision} ${card.tower ? "is-tower" : ""}`}>
                <div className="fb-review-card-top">
                  <span>{card.label}</span>
                  <small>{card.status}</small>
                </div>

                <div className="fb-review-decision-row">
                  <Badge tone={decisionTone(decision)}>{decisionLabel(decision)}</Badge>
                  {card.tower ? <Badge tone="warn">Tower item</Badge> : null}
                </div>

                <h3>{card.title}</h3>
                <p>{card.detail}</p>

                <div className="fb-review-facts">
                  <div>
                    <span>Money impact</span>
                    <strong>{card.money}</strong>
                  </div>
                  <div>
                    <span>Risk</span>
                    <strong>{card.risk}</strong>
                  </div>
                  <div>
                    <span>Proof</span>
                    <strong>{card.proof}</strong>
                  </div>
                </div>

                <div className="fb-review-actions">
                  <button
                    type="button"
                    onClick={() => onOpenReviewCard({ deskTitle: desk.title, card })}
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewAction(
                      card,
                      "approved",
                      `Approve · ${card.title}`,
                      `Approve this reviewed card: ${card.detail}`
                    )}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewAction(
                      card,
                      "held",
                      `Hold · ${card.title}`,
                      `Hold this card for more review: ${card.detail}`
                    )}
                  >
                    Hold
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewAction(
                      card,
                      card.tower ? "tower_sent" : "proof_requested",
                      card.tower ? `Send to Tower · ${card.title}` : `Request proof · ${card.title}`,
                      card.tower ? "Send this protected review item to The Tower." : `Request proof for this review item: ${card.proof}`
                    )}
                  >
                    {card.tower ? "Send to Tower" : "Request proof"}
                  </button>
                </div>
              </article>
            );
          }) : (
            <article className="fb-review-empty">
              <p className="fb-kicker">Nothing here</p>
              <h3>No cards match this filter.</h3>
              <p>Switch filters or choose another business circle.</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
function MoneyConstellations({ queue, onAction }) {
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
              {first ? (
                <button
                  type="button"
                  onClick={() => onAction({
                    label: first.action,
                    business: first.business,
                    target: first.title,
                    description: first.why,
                    money: true,
                    proof: first.status === "proof_missing",
                    tower: first.status === "tower_required",
                  })}
                >
                  {first.action}
                </button>
              ) : (
                <button type="button">Rest easy</button>
              )}
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
  const [pendingAction, setPendingAction] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [towerReceiptQueue, setTowerReceiptQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reviewDecisions, setReviewDecisions] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);

  const theme = getOwnerTheme(themeKey);
  const focus = useMemo(() => getTodayOwnerFocus(ownerMoneyQueue), []);
  const activeLane = ownerBusinessLanes.find((lane) => lane.key === activeBusiness) || ownerBusinessLanes[0];

  function openAction(action) {
    setPendingAction(action);
  }

  function pushNotification(notification) {
    setNotifications((current) => [notification, ...current].slice(0, 12));
  }

  function clearNotifications() {
    setNotifications([]);
    setNotificationsOpen(false);
  }

  function confirmAction(action) {
    const receipt = makeOwnerReceipt(action);
    const towerCopy = makeTowerReceiptCopy(receipt);

    setReceipts((current) => [receipt, ...current].slice(0, 8));
    setTowerReceiptQueue((current) => [towerCopy, ...current].slice(0, 8));

    pushNotification(makeOwnerNotification({
      type: "owner_receipt",
      title: "Owner receipt created",
      body: `${receipt.action} was recorded in The Teller.`,
      receiptId: receipt.id,
      decisionReason: receipt.decisionReason,
      decisionNote: receipt.decisionNote,
    }));

    pushNotification(makeOwnerNotification({
      type: "tower_copy",
      title: "Tower copy queued",
      body: `${receipt.action} was copied into the Tower handoff queue.`,
      receiptId: receipt.id,
      towerReceiptId: towerCopy.id,
      decisionReason: receipt.decisionReason,
      decisionNote: receipt.decisionNote,
    }));

    setPendingAction(null);
  }

  function autoCreateReceipt(action) {
    const receipt = makeOwnerReceipt(action);
    const towerCopy = makeTowerReceiptCopy(receipt);

    setReceipts((current) => [receipt, ...current].slice(0, 8));
    setTowerReceiptQueue((current) => [towerCopy, ...current].slice(0, 8));

    const decisionType = action.tower
      ? "tower_sent"
      : String(action.label || "").toLowerCase().includes("hold")
        ? "held"
        : String(action.label || "").toLowerCase().includes("proof")
          ? "proof_requested"
          : String(action.label || "").toLowerCase().includes("approve")
            ? "approved"
            : "owner_receipt";

    pushNotification(makeOwnerNotification({
      type: decisionType,
      title: "Review decision recorded",
      body: `${action.label} was recorded and receipted.`,
      receiptId: receipt.id,
      decisionReason: receipt.decisionReason,
      decisionNote: receipt.decisionNote,
    }));

    pushNotification(makeOwnerNotification({
      type: "tower_copy",
      title: "Tower copy queued",
      body: `${action.label} was copied into the Tower handoff queue.`,
      receiptId: receipt.id,
      towerReceiptId: towerCopy.id,
      decisionReason: receipt.decisionReason,
      decisionNote: receipt.decisionNote,
    }));

    setNotificationsOpen(true);

    setPendingAction({
      ...action,
      label: `Receipt auto-created · ${action.label}`,
      description: `A receipt was automatically created here and copied into the Tower handoff queue. ${action.description || ""}`,
      alreadyReceipted: true,
    });
  }

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
      <div className="fb-corner-tools">
        <NotificationsDropdown
          notifications={notifications}
          open={notificationsOpen}
          setOpen={setNotificationsOpen}
          onClear={clearNotifications}
        />

        <button
          type="button"
          className={`fb-settings-corner ${settingsOpen ? "is-open" : ""}`}
          onClick={() => setSettingsOpen((value) => !value)}
        >
          Settings
        </button>
      </div>

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

      <FinalActionPreview
        action={pendingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />

      <ReviewDetailPanel
        selectedReview={selectedReview}
        onClose={() => setSelectedReview(null)}
        onAutoReceipt={autoCreateReceipt}
        onDetailDecision={(key, decision) => setReviewDecisions((current) => ({
          ...current,
          [key]: decision,
        }))}
      />

      <OwnerFlowGuide activeBusiness={activeBusiness} pendingAction={pendingAction} receipts={receipts} />

      <PriorityFocus focus={focus} onAction={openAction} />

      {calmMode ? (
        <section className="fb-calm-card">
          <p className="fb-kicker">Calm Money Mode</p>
          <h2>Only this one thing right now.</h2>
          <p>{focus.why}</p>
          <button
            type="button"
            className="fb-primary"
            onClick={() => openAction({
              label: focus.action,
              business: focus.business,
              target: focus.title,
              description: focus.why,
              money: true,
              proof: true,
              tower: focus.status === "tower_required",
            })}
          >
            {focus.action}
          </button>
        </section>
      ) : (
        <>
          <BusinessOrbit lanes={ownerBusinessLanes} activeBusiness={activeBusiness} setActiveBusiness={setActiveBusiness} />
          <BusinessSpecificWorkspace activeBusiness={activeBusiness} lane={activeLane} onAction={openAction} />
          <OwnerReviewDesk
            activeBusiness={activeBusiness}
            lane={activeLane}
            onAction={openAction}
            onAutoReceipt={autoCreateReceipt}
            reviewDecisions={reviewDecisions}
            setReviewDecisions={setReviewDecisions}
            onOpenReviewCard={setSelectedReview}
          />
          <MoneyConstellations queue={getBusinessSpecificItems(activeBusiness)} onAction={openAction} />
          <SnapshotRibbon cards={[getBusinessSnapshot(activeBusiness), ...ownerSnapshotCards.filter((card) => card.key !== activeBusiness).slice(0, 3)]} />
        </>
      )}

      <ReceiptDock receipts={receipts} />
      <TowerReceiptDock towerReceipts={towerReceiptQueue} />
    </main>
  );
}
