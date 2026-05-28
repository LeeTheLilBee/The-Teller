
import React, { useEffect, useMemo, useState } from "react";
import {
  createTowerBackupItem,
  getFinalReceiptArchiveStatus,
  readFinalResolutionPackets,
  saveTowerBackupItem,
  updateFinalResolutionPacket,
} from "./managerOwnerBridge";
import "./finalReceiptViewer.css";

function ReceiptBadge({ children, tone = "quiet" }) {
  return <span className={`receipt-badge receipt-badge-${tone}`}>{children}</span>;
}

function receiptMatches(packet, filter) {
  const isArchived = Boolean(packet.archiveReady);
  const status = String(packet.resolutionStatus || packet.title || "").toLowerCase();

  if (filter === "active") return !isArchived;
  if (filter === "archive") return isArchived;

  if (filter === "all") return true;
  if (filter === "approved") return status.includes("approved") && !isArchived;
  if (filter === "rejected") return status.includes("rejected") && !isArchived;
  if (filter === "returned") return status.includes("returned") && !isArchived;
  if (filter === "resolved") return status.includes("resolved") && !isArchived;

  return true;
}

export default function FinalReceiptViewer({ mode = "owner", employeeName = "" }) {
  const [packets, setPackets] = useState([]);
  const [filter, setFilter] = useState("active");
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [archiveFlashId, setArchiveFlashId] = useState(null);

  function refresh() {
    setPackets(readFinalResolutionPackets());
  }

  useEffect(() => {
    refresh();

    function handleUpdate() {
      refresh();
    }

    window.addEventListener("the-teller-bridge-updated", handleUpdate);
    window.addEventListener("the-teller-receipts-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("the-teller-bridge-updated", handleUpdate);
      window.removeEventListener("the-teller-receipts-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const visiblePackets = useMemo(() => {
    let next = packets;

    if (mode === "employee" && employeeName) {
      next = next.filter((packet) => packet.employeeName === employeeName);
    }

    return next.filter((packet) => receiptMatches(packet, filter));
  }, [packets, filter, mode, employeeName]);

  const archivedPackets = useMemo(() => {
    let next = packets.filter((packet) => packet.archiveReady);

    if (mode === "employee" && employeeName) {
      next = next.filter((packet) => packet.employeeName === employeeName);
    }

    return next;
  }, [packets, mode, employeeName]);

  const activePackets = useMemo(() => {
    let next = packets.filter((packet) => !packet.archiveReady);

    if (mode === "employee" && employeeName) {
      next = next.filter((packet) => packet.employeeName === employeeName);
    }

    return next;
  }, [packets, mode, employeeName]);

  const counts = {
    total: visiblePackets.length,
    active: activePackets.length,
    archiveReady: archivedPackets.length,
    towerBacked: visiblePackets.filter((packet) => packet.towerBackedUp).length,
  };

  function markArchiveReady(packet) {
    const archiveReadyAt = new Date().toISOString();

    const towerBackup = createTowerBackupItem({
      source: "owner_receipt_archive_dock",
      action: "Final receipt marked Archive Vault ready",
      target: packet.title,
      summary: "Owner marked final receipt packet ready for future Archive Vault handoff.",
      payload: {
        receiptPacket: packet,
        archiveReadyAt,
        archiveStatus: "Archive Vault ready",
      },
    });

    const updatedPackets = updateFinalResolutionPacket(packet.id, {
      archiveReady: true,
      archiveReadyAt,
      archiveStatus: "Archive Vault ready",
      archiveTowerBackupId: towerBackup.id,
    });

    saveTowerBackupItem(towerBackup);

    setPackets(updatedPackets);

    const updated = updatedPackets.find((item) => item.id === packet.id);
    if (updated) setSelectedPacket(updated);

    setArchiveFlashId(packet.id);
    setFilter("active");
    setSelectedPacket(null);

    try {
      window.dispatchEvent(new CustomEvent("the-teller-receipts-updated", { detail: { id: packet.id } }));
      window.dispatchEvent(new CustomEvent("the-teller-bridge-updated", { detail: { key: "archive_ready" } }));
    } catch {
      // events are optional
    }

    setTimeout(() => {
      setArchiveFlashId((current) => current === packet.id ? null : current);
    }, 2600);
  }

  // PACK_051LMN_HIDE_EMPTY_OWNER_RECEIPT_DOCK
  // Owner archive-prep dock is active-work only. Once all receipts are archive-ready,
  // hide the interface until a new active final receipt exists.
  if (mode === "owner" && !activePackets.length) {
    return null;
  }

  const filters = [
    ["active", "Active"],
    ["all", "All"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
    ["returned", "Returned"],
    ["resolved", "Resolved"],
    ["archive", "Archive Ready"],
  ];

  return (
    <section className={`final-receipt-viewer final-receipt-viewer-${mode}`}>
      <div className="receipt-head">
        <div>
          <p className="receipt-kicker">
            {mode === "employee" ? "Resolved records" : "Final receipt packets"}
          </p>
          <h2>{mode === "employee" ? "Your resolved decisions." : "Receipt / Archive Prep Dock."}</h2>
          <p>
            {mode === "employee"
              ? "Resolved manager and owner decisions appear here as receipt-style records."
              : "Final packets collect the owner decision, source request, Tower backup state, and Archive Vault readiness."}
          </p>
        </div>

        <div className="receipt-badge-row">
          <ReceiptBadge tone="strong">{counts.total} visible</ReceiptBadge>
          <ReceiptBadge tone="ready">{counts.archiveReady} archive ready</ReceiptBadge>
          <ReceiptBadge>{counts.towerBacked} Tower-backed</ReceiptBadge>
        </div>
      </div>

      <div className="receipt-filter-row">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={filter === key ? "is-active" : ""}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="receipt-grid">
        {visiblePackets.length ? visiblePackets.map((packet) => {
          const archive = getFinalReceiptArchiveStatus(packet);

          return (
            <article key={packet.id} className={`receipt-card receipt-${archive.tone} ${packet.archiveReady ? "is-archive-ready" : ""} ${archiveFlashId === packet.id ? "is-flashing" : ""}`}>
              <div className="receipt-card-top">
                <span>{packet.employeeName}</span>
                <small>{packet.resolutionStatus}</small>
              </div>

              <strong>{packet.title}</strong>
              <p>{packet.body}</p>

              <div className="receipt-facts">
                <small>{packet.id}</small>
                <small>{packet.businessKey}</small>
                <small>{packet.towerBackedUp ? "Tower-backed" : "Needs Tower backup"}</small>
                <small>{archive.status}</small>
              </div>

              {packet.archiveReady ? (
                <div className="receipt-archive-ready-banner">
                  Archive Vault ready
                </div>
              ) : null}

              {archiveFlashId === packet.id ? (
                <div className="receipt-archive-flash">
                  Archive readiness saved
                </div>
              ) : null}

              <div className="receipt-actions">
                <button type="button" onClick={() => setSelectedPacket(packet)}>
                  Open receipt
                </button>
                {mode !== "employee" ? (
                  <button
                    type="button"
                    className={packet.archiveReady ? "is-complete" : ""}
                    onClick={() => markArchiveReady(packet)}
                  >
                    {packet.archiveReady ? "Archive Ready Saved" : "Mark Archive Ready"}
                  </button>
                ) : null}
              </div>
            </article>
          );
        }) : (
          <article className="receipt-empty-card">
            <span>Clear</span>
            <strong>No final receipts yet.</strong>
            <p>
              {filter === "active"
                ? "No active receipts need archive prep. Archive-ready receipts moved out of this view."
                : "Receipts appear after owner decisions or resolved escalations."}
            </p>
          </article>
        )}
      </div>

      {archivedPackets.length ? (
        <details className="receipt-archived-drawer">
          <summary>Archive-ready receipts ({archivedPackets.length})</summary>
          <div className="receipt-archived-grid">
            {archivedPackets.slice(0, 10).map((packet) => (
              <article key={packet.id}>
                <span>{packet.resolutionStatus}</span>
                <strong>{packet.title}</strong>
                <p>{packet.archiveStatus || "Archive Vault ready"}</p>
                <small>{packet.archiveReadyAt ? new Date(packet.archiveReadyAt).toLocaleString() : packet.id}</small>
                <button type="button" onClick={() => setSelectedPacket(packet)}>
                  Open
                </button>
              </article>
            ))}
          </div>
        </details>
      ) : null}

      {selectedPacket ? (
        <div className="receipt-overlay" role="dialog" aria-modal="true">
          <section className="receipt-modal">
            <div className="receipt-head">
              <div>
                <p className="receipt-kicker">Receipt detail</p>
                <h2>{selectedPacket.title}</h2>
                <p>{selectedPacket.body}</p>
              </div>
              <button type="button" className="receipt-secondary" onClick={() => setSelectedPacket(null)}>
                Close
              </button>
            </div>

            <div className="receipt-detail-grid">
              <article>
                <span>Employee</span>
                <strong>{selectedPacket.employeeName}</strong>
              </article>
              <article>
                <span>Status</span>
                <strong>{selectedPacket.resolutionStatus}</strong>
              </article>
              <article>
                <span>Business</span>
                <strong>{selectedPacket.businessKey}</strong>
              </article>
              <article>
                <span>Archive</span>
                <strong>{getFinalReceiptArchiveStatus(selectedPacket).status}</strong>
                {selectedPacket.archiveReadyAt ? <small>{new Date(selectedPacket.archiveReadyAt).toLocaleString()}</small> : null}
              </article>
            </div>

            <section className="receipt-source-box">
              <p className="receipt-kicker">Owner note</p>
              <p>{selectedPacket.ownerNote || selectedPacket.body}</p>
            </section>

            <section className="receipt-source-box">
              <p className="receipt-kicker">Packet payload preview</p>
              <pre>{JSON.stringify(selectedPacket.payload || {}, null, 2)}</pre>
            </section>

            {mode !== "employee" ? (
              <div className="receipt-actions">
                <button
                  type="button"
                  className={selectedPacket.archiveReady ? "is-complete" : ""}
                  onClick={() => markArchiveReady(selectedPacket)}
                >
                  {selectedPacket.archiveReady ? "Archive Ready Saved" : "Mark Archive Vault Ready"}
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
