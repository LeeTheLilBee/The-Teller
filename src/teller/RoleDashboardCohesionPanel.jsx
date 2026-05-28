
import React, { useEffect, useMemo, useState } from "react";
import "./roleDashboardCohesionPanel.css";

function safeRead(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function countActiveOwnerEscalations(items = []) {
  return items.filter((item) => {
    const status = String(item.ownerStatus || "").toLowerCase();

    if (!status || status.includes("needs owner review")) return true;

    return !(
      status.includes("resolved") ||
      status.includes("approved") ||
      status.includes("rejected") ||
      status.includes("returned") ||
      status.includes("closed") ||
      status.includes("complete")
    );
  }).length;
}

function countActiveReceipts(items = []) {
  return items.filter((item) => !item.archiveReady).length;
}

function getRoleConfig(role, stats) {
  if (role === "employee") {
    return {
      kicker: "Employee room",
      title: "Simple work lane.",
      body: "This page is for your hours/pay snapshot, requests, manager responses, and resolved records. Tower proof stays out of the way.",
      mode: "Employee focus",
      cards: [
        {
          label: "Keep",
          title: "Pay snapshot + requests",
          body: "The employee page should stay practical: hours, request form, responses, and resolved records.",
        },
        {
          label: "Avoid",
          title: "No Tower clutter",
          body: "The full proof trail belongs in Tower. Employee only needs readable resolved-record status.",
        },
        {
          label: "Status",
          title: `${stats.employeeResponses} responses`,
          body: "Manager and owner replies stay in the response/resolved-record areas.",
        },
      ],
      empty: "If nothing needs action, this page should feel calm, not empty or broken.",
    };
  }

  if (role === "manager") {
    return {
      kicker: "Manager room",
      title: "Requests, lanes, decisions.",
      body: "This page is for manager review work: employee requests, follow-ups, proof needs, and secure/Tower decisions.",
      mode: "Manager focus",
      cards: [
        {
          label: "Keep",
          title: "Streamline + lanes",
          body: "Manager should either choose one next task or use the full request lanes.",
        },
        {
          label: "Avoid",
          title: "No owner proof trail",
          body: "Owner receipts and Tower proof should not crowd the manager workbench.",
        },
        {
          label: "Status",
          title: `${stats.managerRequests} request records`,
          body: "Employee-submitted items and follow-ups should stay grouped by action lane.",
        },
      ],
      empty: "When there are no active requests, the manager area should say everything is clear.",
    };
  }

  if (role === "owner") {
    return {
      kicker: "Owner room",
      title: "Escalations and receipts only.",
      body: "Owner should see what rose upward: active escalations, receipts needing archive prep, and high-level owner context.",
      mode: "Owner focus",
      cards: [
        {
          label: "Keep",
          title: `${stats.ownerActive} active escalations`,
          body: "Owner queues should appear only when active owner work exists.",
        },
        {
          label: "Receipts",
          title: `${stats.activeReceipts} need archive prep`,
          body: "Receipt/archive prep should disappear once everything is archive-ready.",
        },
        {
          label: "Avoid",
          title: "No employee clutter",
          body: "Employee-manager back-and-forth stays out of owner view unless it is escalated.",
        },
      ],
      empty: "When nothing is escalated, owner should not be staring at empty work panels.",
    };
  }

  if (role === "tower") {
    return {
      kicker: "Tower entry",
      title: "Clearance first. Proof after.",
      body: "Tower stays gated. Proof trails, sensitive records, and threads should only appear after clearance.",
      mode: "Tower gate",
      cards: [
        {
          label: "Gate",
          title: "Password first",
          body: "The Tower clearance screen should stay clean and protected.",
        },
        {
          label: "After clearance",
          title: "Proof trail appears inside",
          body: "Lifecycle proof and request threads belong inside the cleared Tower workspace, not under the login.",
        },
        {
          label: "Safety",
          title: "No pre-clearance proof",
          body: "No backup records, proof trails, or request threads should render before clearance.",
        },
      ],
      empty: "If someone has not cleared Tower, they should only see the clearance experience.",
    };
  }

  return {
    kicker: "Role room",
    title: "Focused workspace.",
    body: "This room should show only what belongs here.",
    mode: "Focused",
    cards: [],
    empty: "Nothing needs action right now.",
  };
}

function RoleCohesionCard({ card }) {
  return (
    <article className="role-cohesion-card">
      <span>{card.label}</span>
      <strong>{card.title}</strong>
      <p>{card.body}</p>
    </article>
  );
}

export default function RoleDashboardCohesionPanel({ role = "employee", compact = false }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((value) => value + 1);
    }

    window.addEventListener("the-teller-bridge-updated", refresh);
    window.addEventListener("the-teller-receipts-updated", refresh);
    window.addEventListener("the-teller-tower-plugin-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("the-teller-bridge-updated", refresh);
      window.removeEventListener("the-teller-receipts-updated", refresh);
      window.removeEventListener("the-teller-tower-plugin-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const stats = useMemo(() => {
    const managerRequests = safeRead("the_teller_employee_manager_queue_v1");
    const employeeResponses = safeRead("the_teller_employee_response_queue_v1");
    const ownerEscalations = safeRead("the_teller_owner_escalation_queue_v1");
    const receipts = safeRead("the_teller_final_resolution_packets_v1");

    return {
      managerRequests: managerRequests.length,
      employeeResponses: employeeResponses.length,
      ownerActive: countActiveOwnerEscalations(ownerEscalations),
      activeReceipts: countActiveReceipts(receipts),
      receipts: receipts.length,
      tick,
    };
  }, [tick]);

  const config = getRoleConfig(role, stats);

  return (
    <section className={`role-cohesion-panel role-cohesion-${role} ${compact ? "is-compact" : ""}`}>
      <div className="role-cohesion-head">
        <div>
          <p className="role-cohesion-kicker">{config.kicker}</p>
          <h2>{config.title}</h2>
          <p>{config.body}</p>
        </div>

        <div className="role-cohesion-mode-pill">
          {config.mode}
        </div>
      </div>

      <div className="role-cohesion-grid">
        {config.cards.map((card) => (
          <RoleCohesionCard key={`${role}-${card.label}-${card.title}`} card={card} />
        ))}
      </div>

      <div className="role-cohesion-empty-note">
        <span>No duplicate work rule</span>
        <p>{config.empty}</p>
      </div>
    </section>
  );
}
