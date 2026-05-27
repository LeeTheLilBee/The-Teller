
import React, { useEffect, useMemo, useState } from "react";
import {
  createTowerPluginPacket,
  getTowerBackupItems,
  getTowerBackupSummary,
  markTowerBackupItemReviewed,
  getFormalTowerHandoffPackets,
  updateFormalTowerHandoffPacket,
  getSoulaanaTowerGuidance,
  TOWER_HANDOFF_STATUSES,
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


function readTowerAccessRequest() {
  try {
    const raw = window.sessionStorage.getItem("the_teller_tower_access_request_v1");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function createFallbackTowerAccessRequest() {
  return {
    id: `TOWER-ACCESS-${Math.floor(100000 + Math.random() * 900000)}`,
    sourceApp: "The Teller",
    sourceLane: "direct",
    requestedBy: "Direct Tower Route",
    requestedAccess: "Tower Evidence Viewer",
    reason: "Direct route opened Tower Evidence.",
    createdAt: new Date().toISOString(),
    status: "Pending Tower clearance",
  };
}

function createTowerClearanceToken(accessRequest) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 1000 * 60 * 30);

  return {
    tokenId: `TOWER-TOKEN-${Math.floor(100000 + Math.random() * 900000)}`,
    sourceApp: "The Teller",
    requestedBy: accessRequest?.requestedBy || "Unknown requester",
    sourceLane: accessRequest?.sourceLane || "unknown",
    requestedAccess: accessRequest?.requestedAccess || "Tower Evidence Viewer",
    reason: accessRequest?.reason || "Tower evidence access",
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "Active local Tower clearance",
  };
}

function readTowerClearanceToken() {
  try {
    const raw = window.sessionStorage.getItem("the_teller_tower_clearance_token_v1");
    const token = raw ? JSON.parse(raw) : null;

    if (!token?.expiresAt) return null;

    if (new Date(token.expiresAt).getTime() < Date.now()) {
      window.sessionStorage.removeItem("the_teller_tower_clearance_v1");
      window.sessionStorage.removeItem("the_teller_tower_clearance_token_v1");
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

function saveTowerClearanceToken(token) {
  try {
    window.sessionStorage.setItem("the_teller_tower_clearance_v1", "granted");
    window.sessionStorage.setItem("the_teller_tower_clearance_token_v1", JSON.stringify(token));
  } catch {
    // session storage is optional
  }
}

function clearTowerClearanceToken() {
  try {
    window.sessionStorage.removeItem("the_teller_tower_clearance_v1");
    window.sessionStorage.removeItem("the_teller_tower_clearance_token_v1");
  } catch {
    // session storage is optional
  }
}

function getSoulaanaClearanceGuidance(accessRequest, token) {
  if (token) {
    return {
      title: "Soulaana clearance read",
      body: `Tower clearance is active for ${token.requestedBy}. This should stay short-lived and specific to ${token.requestedAccess}.`,
      next: "Review only the evidence needed, then revoke clearance when finished.",
    };
  }

  return {
    title: "Soulaana clearance read",
    body: `This access request came from ${accessRequest?.sourceLane || "an unknown lane"} and is asking for ${accessRequest?.requestedAccess || "Tower evidence access"}.`,
    next: "Verify the request context before granting Tower evidence access.",
  };
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


function TowerClearanceGate({ accessRequest, onGrant }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submitClearance(event) {
    event.preventDefault();

    if (String(code || "").trim().toUpperCase() === "TOWER") {
      const token = createTowerClearanceToken(accessRequest || createFallbackTowerAccessRequest());
      saveTowerClearanceToken(token);

      setError("");
      onGrant(token);
      return;
    }

    setError("Tower clearance failed. Use the current Tower clearance code.");
  }

  return (
    <main className="tower-backup-workspace">
      <section className="tower-clearance-gate">
        <div>
          <p className="tower-kicker">The Tower · Clearance Gate</p>
          <h1>Evidence access requires Tower clearance.</h1>
          <p>
            This queue contains Teller backup records, employee request evidence, manager responses,
            and local handoff packets. Enter Tower clearance to continue.
          </p>
        </div>

        <aside className="tower-access-request-card">
          <p className="tower-kicker">Access request</p>
          <strong>{accessRequest?.requestedAccess || "Tower Evidence Viewer"}</strong>
          <div className="tower-access-facts">
            <div>
              <span>Requested by</span>
              <b>{accessRequest?.requestedBy || "Direct Tower Route"}</b>
            </div>
            <div>
              <span>Source lane</span>
              <b>{accessRequest?.sourceLane || "direct"}</b>
            </div>
            <div>
              <span>Reason</span>
              <b>{accessRequest?.reason || "Open Tower Evidence."}</b>
            </div>
          </div>
        </aside>

        <form className="tower-clearance-form" onSubmit={submitClearance}>
          <label>
            <span>Tower clearance code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter Tower clearance"
              autoComplete="off"
            />
          </label>

          {error ? <p className="tower-clearance-error">{error}</p> : null}

          <button type="submit" className="tower-primary">
            Open Tower Evidence
          </button>

          <small>Temporary local clearance code for this build: TOWER</small>
        </form>
      </section>
    </main>
  );
}

export default function TowerBackupWorkspace() {
  const [towerAccessRequest, setTowerAccessRequest] = useState(() => readTowerAccessRequest() || createFallbackTowerAccessRequest());
  const [towerClearanceToken, setTowerClearanceToken] = useState(() => readTowerClearanceToken());
  const [towerClearanceGranted, setTowerClearanceGranted] = useState(() => Boolean(readTowerClearanceToken()));
  const [items, setItems] = useState([]);
  const [handoffPackets, setHandoffPackets] = useState([]);
  const [summary, setSummary] = useState(getTowerBackupSummary());
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [pluginNotes, setPluginNotes] = useState("");

  function revokeTowerClearance() {
    clearTowerClearanceToken();
    const nextRequest = readTowerAccessRequest() || createFallbackTowerAccessRequest();
    setTowerAccessRequest(nextRequest);
    setTowerClearanceToken(null);
    setTowerClearanceGranted(false);
  }

  function refreshTowerItems() {
    setItems(getTowerBackupItems());
    setHandoffPackets(getFormalTowerHandoffPackets());
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

  const packetCounts = {
    total: handoffPackets.length,
    pending: handoffPackets.filter((packet) => packet.packetStatus === TOWER_HANDOFF_STATUSES.PENDING).length,
    ready: handoffPackets.filter((packet) => packet.packetStatus === TOWER_HANDOFF_STATUSES.READY).length,
    needsInfo: handoffPackets.filter((packet) => packet.packetStatus === TOWER_HANDOFF_STATUSES.NEEDS_INFO).length,
    reviewed: handoffPackets.filter((packet) => packet.packetStatus === TOWER_HANDOFF_STATUSES.REVIEWED).length,
    denied: handoffPackets.filter((packet) => packet.packetStatus === TOWER_HANDOFF_STATUSES.DENIED).length,
  };

  function openItem(item) {
    setSelectedItem(item);
    setPluginNotes(item.pluginNotes || "");
  }

  function updatePacketStatus(packetId, packetStatus, notes = "") {
    updateFormalTowerHandoffPacket(packetId, {
      packetStatus,
      notes,
      reviewedBy: "Tower Backup Viewer",
    });

    refreshTowerItems();
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

  if (!towerClearanceGranted) {
    return (
      <TowerClearanceGate
        accessRequest={towerAccessRequest}
        onGrant={(token) => {
          setTowerClearanceToken(token);
          setTowerClearanceGranted(true);
        }}
      />
    );
  }

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

      <section className="tower-token-session-panel">
        <div>
          <p className="tower-kicker">Tower clearance token</p>
          <h2>Short-lived local clearance is active.</h2>
          <p>
            This simulates the future Tower redirect: The Teller requests access, The Tower grants a
            short-lived clearance token, and evidence opens only inside that clearance window.
          </p>
        </div>

        <div className="tower-token-card">
          <span>{towerClearanceToken?.tokenId || "No token"}</span>
          <strong>{towerClearanceToken?.requestedBy || towerAccessRequest?.requestedBy}</strong>
          <p>{towerClearanceToken?.reason || towerAccessRequest?.reason}</p>
          <small>Lane: {towerClearanceToken?.sourceLane || towerAccessRequest?.sourceLane}</small>
          <small>Expires: {towerClearanceToken?.expiresAt ? new Date(towerClearanceToken.expiresAt).toLocaleString() : "No active expiry"}</small>
          <button type="button" onClick={revokeTowerClearance}>
            Revoke Tower clearance
          </button>
        </div>

        <div className="tower-soulaana-clearance">
          <span>{getSoulaanaClearanceGuidance(towerAccessRequest, towerClearanceToken).title}</span>
          <p>{getSoulaanaClearanceGuidance(towerAccessRequest, towerClearanceToken).body}</p>
          <strong>{getSoulaanaClearanceGuidance(towerAccessRequest, towerClearanceToken).next}</strong>
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

      <section className="tower-soulaana-panel">
        <div>
          <p className="tower-kicker">Soulaana · Tower guidance</p>
          <h2>Evidence needs a plain-language brain.</h2>
          <p>
            Soulaana reads the handoff packets in human language: what it is, why it matters,
            whether it needs more proof, and what the Tower should do next.
          </p>
        </div>

        <div className="tower-soulaana-stats">
          <article>
            <span>Packets</span>
            <strong>{packetCounts.total}</strong>
          </article>
          <article>
            <span>Ready</span>
            <strong>{packetCounts.ready}</strong>
          </article>
          <article>
            <span>Needs info</span>
            <strong>{packetCounts.needsInfo}</strong>
          </article>
          <article>
            <span>Blocked</span>
            <strong>{packetCounts.denied}</strong>
          </article>
        </div>
      </section>

      <section className="tower-handoff-packets">
        <div className="tower-section-head">
          <div>
            <p className="tower-kicker">Formal Tower handoff packets</p>
            <h2>Prepared evidence packets for the future Tower API.</h2>
            <p>These are structured from the raw local backups below.</p>
          </div>
          <TowerBadge tone="strong">{handoffPackets.length} packets</TowerBadge>
        </div>

        <div className="tower-packet-grid">
          {handoffPackets.length ? handoffPackets.map((packet) => {
            const guidance = getSoulaanaTowerGuidance(packet);

            return (
              <article key={packet.packetId} className={`tower-packet-card risk-${String(packet.riskLevel || "low").toLowerCase()}`}>
                <div className="tower-card-top">
                  <span>{packet.evidenceType}</span>
                  <small>{packet.packetStatus}</small>
                </div>

                <strong>{packet.target}</strong>
                <p>{packet.summary}</p>

                <div className="tower-packet-facts">
                  <small>{packet.packetId}</small>
                  <small>Risk: {packet.riskLevel}</small>
                  <small>Action: {packet.actionNeeded}</small>
                  <small>Lane: {packet.sourceLane}</small>
                </div>

                <div className="tower-soulaana-card">
                  <span>Soulaana says</span>
                  <p>{guidance.plainSummary}</p>
                  <p>{guidance.riskRead}</p>
                  <strong>{guidance.nextStep}</strong>
                </div>

                <div className="tower-packet-actions">
                  <button type="button" onClick={() => updatePacketStatus(packet.packetId, TOWER_HANDOFF_STATUSES.READY, "Marked ready for future Tower API.")}>
                    Ready for Tower API
                  </button>
                  <button type="button" onClick={() => updatePacketStatus(packet.packetId, TOWER_HANDOFF_STATUSES.NEEDS_INFO, "Needs more information before Tower handoff.")}>
                    Needs more info
                  </button>
                  <button type="button" onClick={() => updatePacketStatus(packet.packetId, TOWER_HANDOFF_STATUSES.REVIEWED, "Reviewed locally inside Tower Backup Viewer.")}>
                    Reviewed locally
                  </button>
                  <button type="button" onClick={() => updatePacketStatus(packet.packetId, TOWER_HANDOFF_STATUSES.DENIED, "Denied or blocked locally.")}>
                    Deny / block
                  </button>
                </div>
              </article>
            );
          }) : (
            <article className="tower-empty-card">
              <p className="tower-kicker">No packets yet</p>
              <strong>Create employee/manager activity first.</strong>
              <p>Formal packets appear once Tower backup records exist.</p>
            </article>
          )}
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
