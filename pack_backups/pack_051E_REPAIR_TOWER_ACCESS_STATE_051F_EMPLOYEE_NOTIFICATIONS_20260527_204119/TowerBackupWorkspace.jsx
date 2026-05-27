
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
  readTowerAccessRequestInbox,
  updateTowerAccessRequestStatus,
  getTowerAccessRequestSummary,
  getTowerAuthorityRule,
  getSoulaanaAuthorityRead,
  TOWER_ACCESS_STATUSES,
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


function isOwnerTowerClearance(token, accessRequest) {
  const tokenLane = String(token?.sourceLane || "").toLowerCase();
  const requestLane = String(accessRequest?.sourceLane || "").toLowerCase();
  const requestedBy = String(token?.requestedBy || accessRequest?.requestedBy || "").toLowerCase();

  return tokenLane === "owner" || requestLane === "owner" || requestedBy.includes("owner");
}

function getSoulaanaClearanceGuidance(accessRequest, token) {
  if (token) {
    if (isOwnerTowerClearance(token, accessRequest)) {
      return {
        title: "Soulaana clearance read",
        body: `Owner Tower clearance is active for ${token.requestedBy}. This is root authority and should not be revocable from a lower dashboard control.`,
        next: "Review the evidence needed. Owner clearance remains locked until the real Tower authority system replaces this local simulation.",
      };
    }

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


function getTowerScope(accessRequest, token) {
  const lane = String(token?.sourceLane || accessRequest?.sourceLane || "").toLowerCase();
  const requestedBy = String(token?.requestedBy || accessRequest?.requestedBy || "").toLowerCase();

  if (lane === "owner" || requestedBy.includes("owner")) return "owner";
  if (lane === "manager" || requestedBy.includes("manager")) return "manager";
  if (lane === "employee" || requestedBy.includes("employee")) return "employee";
  return "direct";
}

function isManagerTowerScope(accessRequest, token) {
  return getTowerScope(accessRequest, token) === "manager";
}

function isOwnerTowerScope(accessRequest, token) {
  return getTowerScope(accessRequest, token) === "owner";
}

function isEmployeeTowerRequestItem(item) {
  const payload = item?.payload || {};
  const text = JSON.stringify(payload).toLowerCase();
  const source = String(item?.source || "").toLowerCase();
  const action = String(item?.action || "").toLowerCase();
  const target = String(item?.target || "").toLowerCase();
  const summary = String(item?.summary || "").toLowerCase();

  return (
    source.includes("employee") &&
    (
      text.includes("tower_record") ||
      text.includes("secure document") ||
      text.includes("tower record") ||
      action.includes("tower") ||
      target.includes("tower") ||
      summary.includes("tower") ||
      summary.includes("secure document")
    )
  );
}

function getManagerTowerRequestItems(items) {
  return items.filter((item) => isEmployeeTowerRequestItem(item));
}

function getSoulaanaManagerTowerGuidance(items) {
  const count = items.length;
  const urgentCount = items.filter((item) => JSON.stringify(item.payload || {}).toLowerCase().includes("payroll urgent")).length;
  const proofCount = items.filter((item) => JSON.stringify(item.payload || {}).toLowerCase().includes("proof")).length;

  if (!count) {
    return {
      title: "Soulaana manager Tower read",
      body: "No employee Tower record requests are waiting in this manager-limited view.",
      next: "Managers should only see employee-originated Tower requests here. Full evidence stays owner-scoped.",
    };
  }

  if (urgentCount) {
    return {
      title: "Soulaana manager Tower read",
      body: `${count} employee Tower request(s) are visible, including ${urgentCount} payroll-urgent item(s).`,
      next: "Review urgent employee requests first, then send only necessary items upward to owner/Tower.",
    };
  }

  if (proofCount) {
    return {
      title: "Soulaana manager Tower read",
      body: `${count} employee Tower request(s) are visible, and some involve proof or secure document handling.`,
      next: "Check whether the employee gave enough context before escalating.",
    };
  }

  return {
    title: "Soulaana manager Tower read",
    body: `${count} employee Tower request(s) are waiting for manager review.`,
    next: "Approve, reject, or request more information from the employee path before escalating.",
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

  const towerScope = getTowerScope(towerAccessRequest, towerClearanceToken);
  const managerTowerItems = getManagerTowerRequestItems(items);
  const managerGuidance = getSoulaanaManagerTowerGuidance(managerTowerItems);

  if (towerScope === "manager") {
    return (
      <main className="tower-backup-workspace tower-manager-scope-workspace">
        <section className="tower-manager-hero">
          <div>
            <p className="tower-kicker">The Tower · Manager-limited evidence</p>
            <h1>Employee Tower requests only.</h1>
            <p>
              Managers can review employee-originated Tower record and secure document requests here.
              Full Tower Evidence, raw packets, access authority controls, and owner-level evidence stay owner-scoped.
            </p>
            <div className="tower-badge-row">
              <TowerBadge tone="strong">Manager limited</TowerBadge>
              <TowerBadge tone="warn">{managerTowerItems.length} employee Tower request(s)</TowerBadge>
              <TowerBadge>No owner root controls</TowerBadge>
            </div>
          </div>

          <aside className="tower-manager-token-card">
            <p className="tower-kicker">Local clearance</p>
            <strong>{towerClearanceToken?.requestedBy || "Manager Dashboard"}</strong>
            <span>{towerClearanceToken?.tokenId || "Local token active"}</span>
            <small>Lane: {towerClearanceToken?.sourceLane || towerAccessRequest?.sourceLane || "manager"}</small>
            <small>Expires: {towerClearanceToken?.expiresAt ? new Date(towerClearanceToken.expiresAt).toLocaleString() : "No expiry"}</small>
            <button type="button" onClick={revokeTowerClearance}>
              Revoke manager clearance
            </button>
          </aside>
        </section>

        <section className="tower-manager-soulaana-panel">
          <div>
            <p className="tower-kicker">{managerGuidance.title}</p>
            <h2>Manager scope stays narrow.</h2>
            <p>{managerGuidance.body}</p>
            <strong>{managerGuidance.next}</strong>
          </div>
        </section>

        <section className="tower-manager-request-panel">
          <div className="tower-section-head">
            <div>
              <p className="tower-kicker">Employee Tower requests</p>
              <h2>What employees are asking Tower for.</h2>
              <p>These are filtered from Teller backup records and limited to employee-originated Tower/secure document requests.</p>
            </div>
            <TowerBadge tone="strong">{managerTowerItems.length} visible</TowerBadge>
          </div>

          <div className="tower-manager-request-grid">
            {managerTowerItems.length ? managerTowerItems.map((item) => (
              <article key={item.id} className="tower-manager-request-card">
                <div className="tower-card-top">
                  <span>{item.source}</span>
                  <small>{item.pluginStatus || item.status}</small>
                </div>

                <strong>{item.target || item.action}</strong>
                <p>{item.summary || "Employee requested Tower/secure document review."}</p>

                <div className="tower-manager-request-facts">
                  <small>{item.id}</small>
                  <small>{item.deliveryMode || "local handoff"}</small>
                  <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "No timestamp"}</small>
                </div>

                <div className="tower-manager-request-actions">
                  <button type="button" onClick={() => openItem(item)}>
                    Open limited evidence
                  </button>
                  <button type="button" onClick={() => markTowerBackupItemReviewed(item.id, { pluginStatus: "Manager reviewed employee Tower request", reviewedBy: "Manager Tower View" })}>
                    Mark manager reviewed
                  </button>
                </div>
              </article>
            )) : (
              <article className="tower-empty-card">
                <p className="tower-kicker">No employee Tower requests</p>
                <strong>No employee Tower record or secure document requests are waiting.</strong>
                <p>Employee requests of type Tower record / secure document request will appear here.</p>
              </article>
            )}
          </div>
        </section>

        {selectedItem ? (
          <div className="tower-detail-overlay" role="dialog" aria-modal="true">
            <section className="tower-detail-modal">
              <div className="tower-section-head">
                <div>
                  <p className="tower-kicker">Manager-limited evidence detail</p>
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
                  <span>Manager scope</span>
                  <strong>Employee request only</strong>
                </article>
              </div>

              <section className="tower-payload-box">
                <p className="tower-kicker">Limited payload summary</p>
                <p>{payloadSummary(selectedItem.payload)}</p>
              </section>
            </section>
          </div>
        ) : null}
      </main>
    );
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


const [accessRequests, setAccessRequests] = useState([]);
  const [accessSummary, setAccessSummary] = useState(getTowerAccessRequestSummary());
  const [items, setItems] = useState([]);
  const [handoffPackets, setHandoffPackets] = useState([]);
  const [summary, setSummary] = useState(getTowerBackupSummary());
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [pluginNotes, setPluginNotes] = useState("");

  function revokeTowerClearance() {
    if (towerAccessRequest?.id) {
      updateTowerAccessRequestStatus(towerAccessRequest.id, TOWER_ACCESS_STATUSES.REVOKED, {
        actor: "Tower Evidence",
        note: "Local non-owner Tower clearance was revoked.",
        tokenId: towerClearanceToken?.tokenId,
      });
    }

    clearTowerClearanceToken();
    const nextRequest = readTowerAccessRequest() || createFallbackTowerAccessRequest();
    setTowerAccessRequest(nextRequest);
    setTowerClearanceToken(null);
    setTowerClearanceGranted(false);
  }

  function refreshTowerItems() {
    setAccessRequests(readTowerAccessRequestInbox());
    setAccessSummary(getTowerAccessRequestSummary());
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
          if (towerAccessRequest?.id) {
            updateTowerAccessRequestStatus(towerAccessRequest.id, TOWER_ACCESS_STATUSES.GRANTED, {
              actor: "Tower Clearance Gate",
              note: "Local Tower clearance token issued.",
              tokenId: token?.tokenId,
            });
          }
          setTowerClearanceToken(token);
          setTowerClearanceGranted(true);
        }}
      />
    );
  }

  const towerScope = getTowerScope(towerAccessRequest, towerClearanceToken);
  const managerTowerItems = getManagerTowerRequestItems(items);
  const managerGuidance = getSoulaanaManagerTowerGuidance(managerTowerItems);

  if (towerScope === "manager") {
    return (
      <main className="tower-backup-workspace tower-manager-scope-workspace">
        <section className="tower-manager-hero">
          <div>
            <p className="tower-kicker">The Tower · Manager-limited evidence</p>
            <h1>Employee Tower requests only.</h1>
            <p>
              Managers can review employee-originated Tower record and secure document requests here.
              Full Tower Evidence, raw packets, access authority controls, and owner-level evidence stay owner-scoped.
            </p>
            <div className="tower-badge-row">
              <TowerBadge tone="strong">Manager limited</TowerBadge>
              <TowerBadge tone="warn">{managerTowerItems.length} employee Tower request(s)</TowerBadge>
              <TowerBadge>No owner root controls</TowerBadge>
            </div>
          </div>

          <aside className="tower-manager-token-card">
            <p className="tower-kicker">Local clearance</p>
            <strong>{towerClearanceToken?.requestedBy || "Manager Dashboard"}</strong>
            <span>{towerClearanceToken?.tokenId || "Local token active"}</span>
            <small>Lane: {towerClearanceToken?.sourceLane || towerAccessRequest?.sourceLane || "manager"}</small>
            <small>Expires: {towerClearanceToken?.expiresAt ? new Date(towerClearanceToken.expiresAt).toLocaleString() : "No expiry"}</small>
            <button type="button" onClick={revokeTowerClearance}>
              Revoke manager clearance
            </button>
          </aside>
        </section>

        <section className="tower-manager-soulaana-panel">
          <div>
            <p className="tower-kicker">{managerGuidance.title}</p>
            <h2>Manager scope stays narrow.</h2>
            <p>{managerGuidance.body}</p>
            <strong>{managerGuidance.next}</strong>
          </div>
        </section>

        <section className="tower-manager-request-panel">
          <div className="tower-section-head">
            <div>
              <p className="tower-kicker">Employee Tower requests</p>
              <h2>What employees are asking Tower for.</h2>
              <p>These are filtered from Teller backup records and limited to employee-originated Tower/secure document requests.</p>
            </div>
            <TowerBadge tone="strong">{managerTowerItems.length} visible</TowerBadge>
          </div>

          <div className="tower-manager-request-grid">
            {managerTowerItems.length ? managerTowerItems.map((item) => (
              <article key={item.id} className="tower-manager-request-card">
                <div className="tower-card-top">
                  <span>{item.source}</span>
                  <small>{item.pluginStatus || item.status}</small>
                </div>

                <strong>{item.target || item.action}</strong>
                <p>{item.summary || "Employee requested Tower/secure document review."}</p>

                <div className="tower-manager-request-facts">
                  <small>{item.id}</small>
                  <small>{item.deliveryMode || "local handoff"}</small>
                  <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "No timestamp"}</small>
                </div>

                <div className="tower-manager-request-actions">
                  <button type="button" onClick={() => openItem(item)}>
                    Open limited evidence
                  </button>
                  <button type="button" onClick={() => markTowerBackupItemReviewed(item.id, { pluginStatus: "Manager reviewed employee Tower request", reviewedBy: "Manager Tower View" })}>
                    Mark manager reviewed
                  </button>
                </div>
              </article>
            )) : (
              <article className="tower-empty-card">
                <p className="tower-kicker">No employee Tower requests</p>
                <strong>No employee Tower record or secure document requests are waiting.</strong>
                <p>Employee requests of type Tower record / secure document request will appear here.</p>
              </article>
            )}
          </div>
        </section>

        {selectedItem ? (
          <div className="tower-detail-overlay" role="dialog" aria-modal="true">
            <section className="tower-detail-modal">
              <div className="tower-section-head">
                <div>
                  <p className="tower-kicker">Manager-limited evidence detail</p>
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
                  <span>Manager scope</span>
                  <strong>Employee request only</strong>
                </article>
              </div>

              <section className="tower-payload-box">
                <p className="tower-kicker">Limited payload summary</p>
                <p>{payloadSummary(selectedItem.payload)}</p>
              </section>
            </section>
          </div>
        ) : null}
      </main>
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
          {isOwnerTowerClearance(towerClearanceToken, towerAccessRequest) ? (
            <div className="tower-owner-clearance-lock">
              Owner clearance locked
            </div>
          ) : (
            <button type="button" onClick={revokeTowerClearance}>
              Revoke Tower clearance
            </button>
          )}
        </div>

        <div className="tower-soulaana-clearance">
          <span>{getSoulaanaClearanceGuidance(towerAccessRequest, towerClearanceToken).title}</span>
          <p>{getSoulaanaClearanceGuidance(towerAccessRequest, towerClearanceToken).body}</p>
          <strong>{getSoulaanaClearanceGuidance(towerAccessRequest, towerClearanceToken).next}</strong>
        </div>
      </section>

      <section className="tower-access-inbox-panel">
        <div className="tower-section-head">
          <div>
            <p className="tower-kicker">Tower access request inbox</p>
            <h2>Who asked to enter The Tower?</h2>
            <p>Every Tower access request should be visible, explainable, and tied to an authority rule.</p>
          </div>
          <TowerBadge tone="strong">{accessSummary.total} requests</TowerBadge>
        </div>

        <div className="tower-access-summary-grid">
          <article>
            <span>Owner root</span>
            <strong>{accessSummary.ownerRoot}</strong>
          </article>
          <article>
            <span>Manager limited</span>
            <strong>{accessSummary.managerLimited}</strong>
          </article>
          <article>
            <span>Employee request-only</span>
            <strong>{accessSummary.employeeRequestOnly}</strong>
          </article>
          <article>
            <span>Direct / low context</span>
            <strong>{accessSummary.directLowContext}</strong>
          </article>
        </div>

        <div className="tower-access-request-grid">
          {accessRequests.length ? accessRequests.map((request) => {
            const authority = getTowerAuthorityRule(request);
            const read = getSoulaanaAuthorityRead(request);

            return (
              <article key={request.id} className={`tower-access-request-card severity-${authority.severity}`}>
                <div className="tower-card-top">
                  <span>{request.sourceLane}</span>
                  <small>{request.status}</small>
                </div>

                <strong>{request.requestedAccess}</strong>
                <p>{request.reason}</p>

                <div className="tower-access-request-facts">
                  <small>{request.id}</small>
                  <small>{request.requestedBy}</small>
                  <small>{authority.level}</small>
                  <small>{request.createdAt ? new Date(request.createdAt).toLocaleString() : "No timestamp"}</small>
                </div>

                <div className="tower-authority-read">
                  <span>{read.title}</span>
                  <p>{read.summary}</p>
                  <strong>{read.next}</strong>
                </div>

                <div className="tower-access-actions">
                  <button
                    type="button"
                    onClick={() => {
                      updateTowerAccessRequestStatus(request.id, TOWER_ACCESS_STATUSES.GRANTED, {
                        actor: "Tower Evidence",
                        note: "Access request marked granted from inbox.",
                      });
                      refreshTowerItems();
                    }}
                  >
                    Mark granted
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateTowerAccessRequestStatus(request.id, TOWER_ACCESS_STATUSES.DENIED, {
                        actor: "Tower Evidence",
                        note: "Access request denied or blocked from inbox.",
                      });
                      refreshTowerItems();
                    }}
                  >
                    Deny / block
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateTowerAccessRequestStatus(request.id, TOWER_ACCESS_STATUSES.OWNER_LOCKED, {
                        actor: "Tower Evidence",
                        note: "Owner authority marked locked/non-revocable.",
                      });
                      refreshTowerItems();
                    }}
                  >
                    Mark authority locked
                  </button>
                </div>
              </article>
            );
          }) : (
            <article className="tower-empty-card">
              <p className="tower-kicker">No access requests</p>
              <strong>No Tower access requests have been recorded yet.</strong>
              <p>Open Tower Evidence from the owner or manager dashboard to create one.</p>
            </article>
          )}
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
