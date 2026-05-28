
import React, { useEffect, useState } from "react";
import {
  createEmployeeDecisionResponseItem,
  createFinalResolutionPacket,
  createTowerBackupItem,
  readFinalResolutionPackets,
  readOwnerEscalationQueue,
  saveEmployeeResponseItem,
  saveFinalResolutionPacket,
  saveTowerBackupItem,
  updateOwnerEscalationItem,
} from "./managerOwnerBridge";
import "./ownerEscalationDock.css";

import RequestThreadPanel from "./RequestThreadPanel.jsx";
function OwnerDockBadge({ children, tone = "quiet" }) {
  return <span className={`owner-dock-badge owner-dock-badge-${tone}`}>{children}</span>;
}

function getOwnerDecisionNote(status) {
  if (status === "Owner Approved") return "Owner approved this request.";
  if (status === "Owner Rejected") return "Owner rejected this request.";
  if (status === "Returned to Manager") return "Owner returned this request to manager.";
  if (status === "Resolved") return "Owner resolved this request and created a final receipt.";
  return "Owner reviewed this request.";
}


function getOwnerStreamlinePriorityScore(item) {
  const text = JSON.stringify(item || {}).toLowerCase();

  if (String(item.urgency || "").toLowerCase().includes("payroll urgent")) return 1000;
  if (text.includes("direct deposit") || text.includes("bank") || text.includes("tax")) return 930;
  if (text.includes("tower") || text.includes("secure document")) return 860;
  if (String(item.proofStatus || "").toLowerCase().includes("proof")) return 760;
  return 500;
}

function getOwnerStreamlineTask(items) {
  const active = items
    .slice()
    .sort((a, b) => {
      const scoreDiff = getOwnerStreamlinePriorityScore(b) - getOwnerStreamlinePriorityScore(a);
      if (scoreDiff !== 0) return scoreDiff;

      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

  return active[0] || null;
}


function getOwnerStreamlineWhy(item) {
  const text = JSON.stringify(item || {}).toLowerCase();

  if (String(item.urgency || "").toLowerCase().includes("payroll urgent")) {
    return "This is first because payroll-urgent escalations may affect pay timing or employee support.";
  }

  if (text.includes("direct deposit") || text.includes("bank") || text.includes("tax")) {
    return "This is first because it may involve sensitive banking, tax, payment, or identity data.";
  }

  if (text.includes("tower") || text.includes("secure document")) {
    return "This is next because Tower and secure-document escalations need owner-level oversight.";
  }

  return "This is next because it is the highest-priority active owner escalation.";
}

function OwnerStreamlinePanel({ items, onOpen, onDecide }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.sessionStorage.getItem("the_teller_owner_streamline_hidden_v1") === "yes";
    } catch {
      return false;
    }
  });
  const [whyOpen, setWhyOpen] = useState(false);
  const [streamlineChoice, setStreamlineChoice] = useState(() => {
    try {
      return window.sessionStorage.getItem("the_teller_owner_streamline_choice_v1") || "ask";
    } catch {
      return "ask";
    }
  });
  const task = getOwnerStreamlineTask(items);

  function dismissForNow() {
    try {
      window.sessionStorage.setItem("the_teller_owner_streamline_hidden_v1", "yes");
    } catch {
      // session storage is optional
    }
    setDismissed(true);
  }

  function showFullDashboard() {
    const queue = document.querySelector(".owner-escalation-grid, .owner-escalation-dock");
    if (queue?.scrollIntoView) {
      queue.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function restoreOwnerStreamline() {
    try {
      window.sessionStorage.removeItem("the_teller_owner_streamline_hidden_v1");
      window.sessionStorage.setItem("the_teller_owner_streamline_choice_v1", "streamline");
    } catch {
      // session storage is optional
    }
    setDismissed(false);
    setStreamlineChoice("streamline");
  }

  function chooseOwnerStreamline() {
    try {
      window.sessionStorage.setItem("the_teller_owner_streamline_choice_v1", "streamline");
      window.sessionStorage.removeItem("the_teller_owner_streamline_hidden_v1");
    } catch {
      // session storage is optional
    }
    setStreamlineChoice("streamline");
    setDismissed(false);
  }

  function chooseOwnerDashboard() {
    try {
      window.sessionStorage.setItem("the_teller_owner_streamline_choice_v1", "dashboard");
      window.sessionStorage.setItem("the_teller_owner_streamline_hidden_v1", "yes");
    } catch {
      // session storage is optional
    }
    setStreamlineChoice("dashboard");
    setDismissed(true);
  }

  function resetOwnerStreamlineChoice() {
    try {
      window.sessionStorage.removeItem("the_teller_owner_streamline_choice_v1");
      window.sessionStorage.removeItem("the_teller_owner_streamline_hidden_v1");
    } catch {
      // session storage is optional
    }
    setStreamlineChoice("ask");
    setDismissed(false);
  }

  if (!task) return null;

  if (streamlineChoice === "ask") {
    return (
      <section className="owner-streamline-choice-card">
        <div>
          <p className="owner-dock-kicker">Choose your work mode</p>
          <h2>Streamline or full dashboard?</h2>
          <p>Streamline gives the owner one priority escalation. Full dashboard shows the full oversight queue.</p>
          <div className="owner-streamline-mode-chip">Current mode: asking you first</div>
        </div>
        <div className="owner-streamline-choice-actions">
          <button type="button" onClick={chooseOwnerStreamline}>
            Enter Streamline
          </button>
          <button type="button" className="owner-streamline-choice-secondary" onClick={chooseOwnerDashboard}>
            Stay in Full Dashboard
          </button>
        </div>
      </section>
    );
  }

  if (dismissed || streamlineChoice === "dashboard") {
    return (
      <section className="owner-streamline-reset-card">
        <div>
          <p className="owner-dock-kicker">Full dashboard mode</p>
          <h2>Owner guidance is tucked away.</h2>
          <p>You chose the full oversight queue. Bring Streamline back or make The Teller ask again.</p>
          <div className="owner-streamline-mode-chip">Current mode: full dashboard</div>
        </div>
        <div className="owner-streamline-reset-actions">
          <button type="button" onClick={restoreOwnerStreamline}>
            Show Streamline
          </button>
          <button type="button" className="owner-streamline-reset-secondary" onClick={resetOwnerStreamlineChoice}>
            Ask me again
          </button>
        </div>
      </section>
    );
  }

  const score = getOwnerStreamlinePriorityScore(task);

  return (
    <section className="owner-streamline-panel">
      <div className="owner-streamline-copy">
        <p className="owner-dock-kicker">Streamline Mode</p>
        <h2>One owner decision first.</h2>
        <p>
          The Teller surfaced the most important active escalation so owner review stays focused.
        </p>

        <div className="owner-dock-badge-row">
          <OwnerDockBadge tone="warn">Priority {score}</OwnerDockBadge>
          <OwnerDockBadge tone="strong">{task.urgency || "Normal"}</OwnerDockBadge>
          <OwnerDockBadge>{task.proofStatus || "Proof status"}</OwnerDockBadge>
        </div>
      </div>

      <article className="owner-streamline-task-card">
        <div className="owner-card-top">
          <span>{task.employeeName}</span>
          <small>{task.ownerStatus}</small>
        </div>

        <strong>{task.title}</strong>
        <p>{task.body}</p>

        <div className="owner-escalation-facts">
          <small>{task.businessKey}</small>
          <small>{task.proofStatus}</small>
          <small>{task.urgency}</small>
          <small>{task.towerBackedUp ? "Tower-backed" : "Needs backup"}</small>
        </div>

        <div className="owner-escalation-actions owner-streamline-actions">
          <button type="button" onClick={() => onOpen(task)}>Open</button>
          <button type="button" className="owner-approve" onClick={() => onDecide(task, "Owner Approved")}>Approve</button>
          <button type="button" className="owner-return" onClick={() => onDecide(task, "Returned to Manager")}>Return</button>
          <button type="button" className="owner-reject" onClick={() => onDecide(task, "Owner Rejected")}>Reject</button>
          <button type="button" className="owner-resolve" onClick={() => onDecide(task, "Resolved")}>Resolve</button>
          <button type="button" className="owner-streamline-secondary" onClick={() => setWhyOpen((value) => !value)}>Why this is next</button>
          <button type="button" className="owner-streamline-secondary" onClick={showFullDashboard}>Show full dashboard</button>
          <button type="button" className="owner-streamline-ghost" onClick={dismissForNow}>Dismiss for now</button>
          <button type="button" className="owner-streamline-ghost" onClick={resetOwnerStreamlineChoice}>Change mode</button>
        </div>

        {whyOpen ? (
          <div className="owner-streamline-why">
            <span>Why this is next</span>
            <p>{getOwnerStreamlineWhy(task)}</p>
          </div>
        ) : null}
      </article>
    </section>
  );
}

export default function OwnerEscalationDock() {
  const [items, setItems] = useState([]);
  const [packets, setPackets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  function refresh() {
    setItems(readOwnerEscalationQueue());
    setPackets(readFinalResolutionPackets());
  }

  useEffect(() => {
    refresh();

    function handleUpdate() {
      refresh();
    }

    window.addEventListener("the-teller-bridge-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("the-teller-bridge-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  function ownerDecide(item, status) {
    const note = getOwnerDecisionNote(status);

    const packet = createFinalResolutionPacket(item, {
      status,
      note,
      actor: "Owner Dashboard",
    });

    const responseItem = createEmployeeDecisionResponseItem(item.sourceRequest || item, {
      decisionStatus: status,
      managerNote: note,
      proofStatus: status === "Returned to Manager" ? "Needs manager follow-up" : "Owner reviewed",
      managerName: "Owner Dashboard",
    });

    const towerBackup = createTowerBackupItem({
      source: "owner_dashboard",
      action: `Owner escalation decision: ${status}`,
      target: packet.title,
      summary: "Owner decision on escalated manager/employee request backed up to The Tower local handoff queue.",
      payload: {
        escalation: item,
        finalPacket: packet,
        employeeResponse: responseItem,
      },
    });

    updateOwnerEscalationItem(item.id, {
      ownerStatus: status,
      ownerNote: note,
      finalPacketId: packet.id,
      towerBackupId: towerBackup.id,
      resolvedAt: new Date().toISOString(),
    });

    saveFinalResolutionPacket(packet);
    saveEmployeeResponseItem(responseItem);
    saveTowerBackupItem(towerBackup);
    setSelectedItem(null);
    refresh();
  }

  function isActiveOwnerEscalation(item) {
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
  }

  const activeItems = items.filter((item) => isActiveOwnerEscalation(item));
  const completedItems = items.filter((item) => !isActiveOwnerEscalation(item));

  // PACK_051LMN_HIDE_EMPTY_OWNER_ESCALATION_DOCK
  // Owner oversight is an active-work queue. If there is nothing active,
  // the whole dock disappears until a manager sends something upward again.
  if (!activeItems.length) {
    return null;
  }

  return (
    <section className="owner-escalation-dock">
      <div className="owner-dock-head">
        <div>
          <p className="owner-dock-kicker">Owner oversight queue</p>
          <h2>Escalated items only.</h2>
          <p>
            This queue shows what managers sent upward. Owner does not need every employee-manager message,
            only items that require owner/Tower oversight.
          </p>
        </div>
        <div className="owner-dock-badge-row">
          <OwnerDockBadge tone="warn">{activeItems.length} active</OwnerDockBadge>
          <OwnerDockBadge tone="strong">{packets.length} receipt packets</OwnerDockBadge>
        </div>
      </div>

      <OwnerStreamlinePanel
        items={activeItems}
        onOpen={setSelectedItem}
        onDecide={ownerDecide}
      />

      <div className="owner-escalation-grid">
        {activeItems.length ? activeItems.map((item) => (
          <article key={item.id} className="owner-escalation-card">
            <div className="owner-card-top">
              <span>{item.employeeName}</span>
              <small>{item.ownerStatus}</small>
            </div>
            <strong>{item.title}</strong>
            <p>{item.body}</p>

            <div className="owner-escalation-facts">
              <small>{item.businessKey}</small>
              <small>{item.proofStatus}</small>
              <small>{item.urgency}</small>
              <small>{item.towerBackedUp ? "Tower-backed" : "Needs backup"}</small>
            </div>

            <div className="owner-escalation-actions">
              <button type="button" onClick={() => setSelectedItem(item)}>Open</button>
              <button type="button" className="owner-approve" onClick={() => ownerDecide(item, "Owner Approved")}>Approve</button>
              <button type="button" className="owner-return" onClick={() => ownerDecide(item, "Returned to Manager")}>Return</button>
              <button type="button" className="owner-reject" onClick={() => ownerDecide(item, "Owner Rejected")}>Reject</button>
              <button type="button" className="owner-resolve" onClick={() => ownerDecide(item, "Resolved")}>Resolve</button>
            </div>
          </article>
        )) : (
          <article className="owner-empty-card">
            <span>Clear</span>
            <strong>No active owner escalations.</strong>
            <p>Items appear here only when a manager sends something upward.</p>
          </article>
        )}
      </div>

      {completedItems.length ? (
        <details className="owner-completed-escalations">
          <summary>Completed / returned owner decisions ({completedItems.length})</summary>
          <div className="owner-completed-grid">
            {completedItems.slice(0, 8).map((item) => (
              <article key={item.id}>
                <span>{item.ownerStatus}</span>
                <strong>{item.title}</strong>
                <p>{item.ownerNote}</p>
                <small>{item.finalPacketId}</small>
              </article>
            ))}
          </div>
        </details>
      ) : null}

      {selectedItem ? (
        <div className="owner-escalation-overlay" role="dialog" aria-modal="true">
          <section className="owner-escalation-modal">
            <div className="owner-dock-head">
              <div>
                <p className="owner-dock-kicker">Owner escalation detail</p>
                <h2>{selectedItem.title}</h2>
                <p>{selectedItem.body}</p>
              </div>
              <button type="button" className="owner-secondary" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>

            <div className="owner-detail-grid">
              <article><span>Employee</span><strong>{selectedItem.employeeName}</strong></article>
              <article><span>Manager status</span><strong>{selectedItem.managerStatus}</strong></article>
              <article><span>Proof</span><strong>{selectedItem.proofStatus}</strong></article>
              <article><span>Urgency</span><strong>{selectedItem.urgency}</strong></article>
            </div>

            <section className="owner-source-box">
              <p className="owner-dock-kicker">Escalation reason</p>
              <p>{selectedItem.escalationReason}</p>
            </section>

            <RequestThreadPanel
              seed={selectedItem}
              employeeName={selectedItem.employeeName}
              title="Owner escalation thread"
              compact
            />

            <div className="owner-escalation-actions">
              <button type="button" className="owner-approve" onClick={() => ownerDecide(selectedItem, "Owner Approved")}>Approve</button>
              <button type="button" className="owner-return" onClick={() => ownerDecide(selectedItem, "Returned to Manager")}>Return to manager</button>
              <button type="button" className="owner-reject" onClick={() => ownerDecide(selectedItem, "Owner Rejected")}>Reject</button>
              <button type="button" className="owner-resolve" onClick={() => ownerDecide(selectedItem, "Resolved")}>Resolve</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
