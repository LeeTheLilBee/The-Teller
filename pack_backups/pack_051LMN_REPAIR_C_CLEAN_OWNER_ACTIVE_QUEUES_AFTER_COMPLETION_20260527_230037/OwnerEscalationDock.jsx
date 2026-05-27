
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

function OwnerDockBadge({ children, tone = "quiet" }) {
  return <span className={`owner-dock-badge owner-dock-badge-${tone}`}>{children}</span>;
}

function getOwnerDecisionNote(status) {
  if (status === "Owner Approved") return "Owner approved this escalated request.";
  if (status === "Owner Rejected") return "Owner rejected this escalated request.";
  if (status === "Returned to Manager") return "Owner returned this request to manager for more work.";
  if (status === "Resolved") return "Owner marked this request resolved and sealed a final receipt packet.";
  return "Owner reviewed this request.";
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

  const activeItems = items.filter((item) => {
    const status = String(item.ownerStatus || "").toLowerCase();
    return !status.includes("resolved") && !status.includes("approved") && !status.includes("rejected");
  });

  const completedItems = items.filter((item) => !activeItems.includes(item));

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
              <button type="button" className="owner-resolve" onClick={() => ownerDecide(item, "Resolved")}>Resolve + Receipt</button>
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
          <summary>Completed owner decisions ({completedItems.length})</summary>
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

            <div className="owner-escalation-actions">
              <button type="button" className="owner-approve" onClick={() => ownerDecide(selectedItem, "Owner Approved")}>Approve</button>
              <button type="button" className="owner-return" onClick={() => ownerDecide(selectedItem, "Returned to Manager")}>Return to manager</button>
              <button type="button" className="owner-reject" onClick={() => ownerDecide(selectedItem, "Owner Rejected")}>Reject</button>
              <button type="button" className="owner-resolve" onClick={() => ownerDecide(selectedItem, "Resolved")}>Resolve + seal receipt</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
