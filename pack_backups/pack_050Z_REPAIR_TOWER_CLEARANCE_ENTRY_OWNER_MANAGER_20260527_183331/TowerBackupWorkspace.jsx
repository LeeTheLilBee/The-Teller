
import React, { useEffect, useMemo, useState } from "react";
import {
  createTowerPluginPacket,
  getTowerBackupItems,
  getTowerBackupSummary,
  markTowerBackupItemReviewed,
} from "./towerBackupPlugin";
import "./towerBackupWorkspace.css";

function TowerBadge({ children, tone = "quiet" }) {
  return <span className={`tower-badge tower-badge-${tone}`}>{children}</span>;
}

function payloadSummary(payload) {
  if (!payload || typeof payload !== "object") return "No payload details.";

  const keys = Object.keys(payload).slice(0, 6);
  if (!keys.length) return "Payload exists but has no visible keys.";

  return keys.map((key) => `${key}: ${typeof payload[key] === "object" ? "object" : String(payload[key]).slice(0, 54)}`).join(" · ");
}

function towerFilterMatches(item, filter) {
  if (filter === "all") return true;
  if (filter === "employee") return item.source === "employee_portal";
  if (filter === "manager") return item.source === "manager_board";
  if (filter === "owner") return String(item.source || "").includes("owner") || String(item.action || "").toLowerCase().includes("owner");
  if (filter === "handoff") return item.deliveryMode === "local_handoff_until_tower_api";
  if (filter === "reviewed") return String(item.pluginStatus || "").toLowerCase().includes("reviewed");
  if (filter === "awaiting") return String(item.pluginStatus || "").toLowerCase().includes("awaiting");
  return true;
}

export default function TowerBackupWorkspace() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(getTowerBackupSummary());
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [pluginNotes, setPluginNotes] = useState("");

  function refreshTowerItems() {
    setItems(getTowerBackupItems());
    setSummary(getTowerBackupSummary());
  }

  useEffect(() => {
    refreshTowerItems();

    function handleUpdate() {
      refreshTowerItems();
    }

    window.addEventListener("the-teller-bridge-updated", handleUpdate);
    window.addEventListener("the-teller-tower-plugin-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("the-teller-bridge-updated", handleUpdate);
      window.removeEventListener("the-teller-tower-plugin-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const filters = [
    ["all", "All"],
    ["awaiting", "Awaiting Review"],
    ["reviewed", "Reviewed"],
    ["employee", "Employee Portal"],
    ["manager", "Manager Board"],
    ["owner", "Owner / Review"],
    ["handoff", "Local Handoff"],
  ];

  const filteredItems = useMemo(
    () => items.filter((item) => towerFilterMatches(item, activeFilter)),
    [items, activeFilter]
  );

  function openItem(item) {
    setSelectedItem(item);
    setPluginNotes(item.pluginNotes || "");
  }

  function markReviewed() {
    if (!selectedItem) return;

    markTowerBackupItemReviewed(selectedItem.id, {
      pluginStatus: "Reviewed locally",
      reviewedBy: "Tower Backup Viewer",
      pluginNotes,
    });

    const updated = getTowerBackupItems();
    const nextSelected = updated.find((item) => item.id === selectedItem.id) || null;
    setSelectedItem(nextSelected);
    refreshTowerItems();
  }

  const selectedPacket = selectedItem ? createTowerPluginPacket(selectedItem) : null;

  return (
    <main className="tower-backup-workspace">
      <section className="tower-hero">
        <div>
          <p className="tower-kicker">The Tower · Backup Viewer</p>
          <h1>Local evidence queue for Teller activity.</h1>
          <p>
            This is the Tower-facing backup dock for The Teller. It shows employee requests,
            manager responses, and other local handoff records until the real Tower API is connected.
          </p>
          <div className="tower-badge-row">
            <TowerBadge tone="strong">{summary.total} records</TowerBadge>
            <TowerBadge tone="warn">{summary.awaitingReview} awaiting</TowerBadge>
            <TowerBadge>{summary.localHandoff} local handoffs</TowerBadge>
          </div>
        </div>
      </section>

      <section className="tower-summary-grid">
        <article>
          <span>Total</span>
          <strong>{summary.total}</strong>
          <p>All Tower backup records from The Teller.</p>
        </article>
        <article>
          <span>Employee</span>
          <strong>{summary.employeePortal}</strong>
          <p>Employee portal requests backed up.</p>
        </article>
        <article>
          <span>Manager</span>
          <strong>{summary.managerBoard}</strong>
          <p>Manager board responses backed up.</p>
        </article>
        <article>
          <span>Reviewed</span>
          <strong>{summary.reviewed}</strong>
          <p>Locally marked reviewed in the plugin.</p>
        </article>
      </section>

      <section className="tower-filter-panel">
        <div className="tower-filter-row">
          {filters.map(([key, label]) => {
            const count = items.filter((item) => towerFilterMatches(item, key)).length;

            return (
              <button
                key={key}
                type="button"
                className={activeFilter === key ? "is-active" : ""}
                onClick={() => setActiveFilter(key)}
              >
                {label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="tower-record-grid">
        {filteredItems.length ? filteredItems.map((item) => (
          <article key={item.id} className={`tower-record-card ${String(item.pluginStatus || "").toLowerCase().includes("reviewed") ? "is-reviewed" : ""}`}>
            <div className="tower-card-top">
              <span>{item.source}</span>
              <small>{item.pluginStatus}</small>
            </div>
            <strong>{item.action}</strong>
            <p>{item.summary || item.target}</p>

            <div className="tower-record-facts">
              <small>{item.id}</small>
              <small>{item.deliveryMode || "local"}</small>
              <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "No timestamp"}</small>
            </div>

            <button type="button" onClick={() => openItem(item)}>
              Open evidence
            </button>
          </article>
        )) : (
          <article className="tower-empty-card">
            <p className="tower-kicker">No records</p>
            <strong>No Tower backup items match this filter.</strong>
            <p>Create an employee request or manager response, then return here.</p>
          </article>
        )}
      </section>

      {selectedItem ? (
        <div className="tower-detail-overlay" role="dialog" aria-modal="true">
          <section className="tower-detail-modal">
            <div className="tower-section-head">
              <div>
                <p className="tower-kicker">Evidence detail</p>
                <h2>{selectedItem.action}</h2>
                <p>{selectedItem.summary || selectedItem.target}</p>
              </div>
              <button type="button" className="tower-secondary" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>

            <div className="tower-detail-grid">
              <article>
                <span>Source</span>
                <strong>{selectedItem.source}</strong>
              </article>
              <article>
                <span>Status</span>
                <strong>{selectedItem.pluginStatus}</strong>
              </article>
              <article>
                <span>Delivery</span>
                <strong>{selectedItem.deliveryMode}</strong>
              </article>
              <article>
                <span>Created</span>
                <strong>{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : "No timestamp"}</strong>
              </article>
            </div>

            <section className="tower-payload-box">
              <p className="tower-kicker">Payload summary</p>
              <p>{payloadSummary(selectedItem.payload)}</p>
            </section>

            <section className="tower-packet-box">
              <p className="tower-kicker">Plugin packet preview</p>
              <pre>{JSON.stringify(selectedPacket, null, 2)}</pre>
            </section>

            <label className="tower-notes-box">
              <span>Tower plugin notes</span>
              <textarea
                value={pluginNotes}
                onChange={(event) => setPluginNotes(event.target.value)}
                rows={4}
                placeholder="Add local Tower review notes..."
              />
            </label>

            <div className="tower-detail-actions">
              <button type="button" className="tower-primary" onClick={markReviewed}>
                Mark reviewed locally
              </button>
              <button type="button" className="tower-secondary" onClick={() => setSelectedItem(null)}>
                Done
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
