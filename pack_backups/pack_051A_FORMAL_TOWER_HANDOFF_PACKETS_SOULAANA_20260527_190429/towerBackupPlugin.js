
import {
  createBridgeId,
  createTowerBackupItem,
  readTowerBackupQueue,
  saveTowerBackupItem,
} from "./managerOwnerBridge";

const TOWER_PLUGIN_REVIEW_KEY = "the_teller_tower_plugin_review_state_v1";

function safeRead(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("the-teller-bridge-updated", { detail: { key } }));
    window.dispatchEvent(new CustomEvent("the-teller-tower-plugin-updated", { detail: { key } }));
  } catch {
    return false;
  }

  return true;
}

export function getTowerBackupItems() {
  if (typeof window === "undefined") return [];

  const reviewed = safeRead(TOWER_PLUGIN_REVIEW_KEY);
  const reviewedMap = new Map(reviewed.map((item) => [item.id, item]));

  return readTowerBackupQueue().map((item) => {
    const reviewState = reviewedMap.get(item.id);

    return {
      ...item,
      pluginStatus: reviewState?.pluginStatus || item.pluginStatus || "Awaiting Tower review",
      reviewedAt: reviewState?.reviewedAt || item.reviewedAt || null,
      reviewedBy: reviewState?.reviewedBy || item.reviewedBy || null,
      pluginNotes: reviewState?.pluginNotes || item.pluginNotes || "",
    };
  });
}

export function saveTowerBackupPluginItem({ source, action, target, summary, payload }) {
  const item = createTowerBackupItem({
    source,
    action,
    target,
    summary,
    payload,
  });

  return saveTowerBackupItem(item);
}

export function markTowerBackupItemReviewed(id, patch = {}) {
  if (typeof window === "undefined") return [];

  const current = safeRead(TOWER_PLUGIN_REVIEW_KEY);
  const existing = current.find((item) => item.id === id);

  const nextItem = {
    ...(existing || { id }),
    pluginStatus: patch.pluginStatus || "Reviewed locally",
    reviewedAt: new Date().toISOString(),
    reviewedBy: patch.reviewedBy || "Tower Plugin",
    pluginNotes: patch.pluginNotes || existing?.pluginNotes || "",
  };

  const next = [nextItem, ...current.filter((item) => item.id !== id)].slice(0, 100);
  safeWrite(TOWER_PLUGIN_REVIEW_KEY, next);

  return getTowerBackupItems();
}

export function createTowerPluginPacket(item) {
  return {
    packetId: createBridgeId("TOWER-PACKET"),
    source: "the_teller",
    plugin: "towerBackupPlugin",
    packetStatus: "local_plugin_packet_ready",
    createdAt: new Date().toISOString(),
    evidence: {
      id: item.id,
      source: item.source,
      action: item.action,
      target: item.target,
      summary: item.summary,
      status: item.status,
      deliveryMode: item.deliveryMode,
      createdAt: item.createdAt,
      pluginStatus: item.pluginStatus,
    },
    payload: item.payload || {},
  };
}

export function getTowerBackupSummary() {
  const items = getTowerBackupItems();

  return {
    total: items.length,
    awaitingReview: items.filter((item) => String(item.pluginStatus || "").toLowerCase().includes("awaiting")).length,
    reviewed: items.filter((item) => String(item.pluginStatus || "").toLowerCase().includes("reviewed")).length,
    employeePortal: items.filter((item) => item.source === "employee_portal").length,
    managerBoard: items.filter((item) => item.source === "manager_board").length,
    localHandoff: items.filter((item) => item.deliveryMode === "local_handoff_until_tower_api").length,
    latestCreatedAt: items[0]?.createdAt || null,
  };
}


const TOWER_HANDOFF_PACKET_STATE_KEY = "the_teller_tower_handoff_packet_state_v1";

export const TOWER_HANDOFF_STATUSES = {
  PENDING: "Pending Tower",
  READY: "Ready for Tower API",
  NEEDS_INFO: "Needs More Info",
  REVIEWED: "Reviewed Locally",
  DENIED: "Denied / Blocked",
};

function inferTowerActionNeeded(item) {
  const source = String(item?.source || "").toLowerCase();
  const action = String(item?.action || "").toLowerCase();
  const target = String(item?.target || "").toLowerCase();
  const payloadText = JSON.stringify(item?.payload || {}).toLowerCase();

  if (payloadText.includes("direct deposit") || target.includes("direct deposit")) {
    return "Secure payment-destination review";
  }

  if (payloadText.includes("tower_record") || target.includes("tower") || action.includes("tower")) {
    return "Tower record request review";
  }

  if (source.includes("employee")) {
    return "Employee request evidence review";
  }

  if (source.includes("manager")) {
    return "Manager response evidence review";
  }

  if (action.includes("owner") || payloadText.includes("owner")) {
    return "Owner review evidence check";
  }

  return "General Tower evidence review";
}

function inferTowerEvidenceType(item) {
  const source = String(item?.source || "").toLowerCase();
  const action = String(item?.action || "").toLowerCase();
  const payloadText = JSON.stringify(item?.payload || {}).toLowerCase();

  if (payloadText.includes("tax") || payloadText.includes("w-2")) return "Secure tax/document request";
  if (payloadText.includes("direct deposit")) return "Payment setup / direct deposit";
  if (payloadText.includes("missing_punch") || payloadText.includes("clock")) return "Payroll/time issue";
  if (payloadText.includes("proof")) return "Proof / evidence item";
  if (source.includes("employee")) return "Employee request";
  if (source.includes("manager")) return "Manager response";
  if (action.includes("owner")) return "Owner review action";

  return "Tower backup record";
}

function inferTowerRiskLevel(item) {
  const payloadText = JSON.stringify(item?.payload || {}).toLowerCase();
  const action = String(item?.action || "").toLowerCase();
  const summary = String(item?.summary || "").toLowerCase();

  if (
    payloadText.includes("direct deposit") ||
    payloadText.includes("payment destination") ||
    payloadText.includes("tax") ||
    payloadText.includes("ssn") ||
    payloadText.includes("bank")
  ) {
    return "High";
  }

  if (
    payloadText.includes("payroll urgent") ||
    payloadText.includes("tower") ||
    action.includes("tower") ||
    summary.includes("secure")
  ) {
    return "Medium";
  }

  return "Low";
}

export function getTowerHandoffPacketState() {
  if (typeof window === "undefined") return [];
  return safeRead(TOWER_HANDOFF_PACKET_STATE_KEY);
}

export function saveTowerHandoffPacketState(packetId, patch = {}) {
  if (typeof window === "undefined") return [];

  const current = safeRead(TOWER_HANDOFF_PACKET_STATE_KEY);
  const existing = current.find((item) => item.packetId === packetId);

  const nextItem = {
    ...(existing || { packetId }),
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const next = [nextItem, ...current.filter((item) => item.packetId !== packetId)].slice(0, 150);
  safeWrite(TOWER_HANDOFF_PACKET_STATE_KEY, next);

  return next;
}

export function createFormalTowerHandoffPacket(item) {
  const packetId = item?.packetId || `TOWER-HANDOFF-${item?.id || createBridgeId("LOCAL")}`;
  const state = getTowerHandoffPacketState().find((entry) => entry.packetId === packetId) || {};

  const riskLevel = inferTowerRiskLevel(item);
  const evidenceType = inferTowerEvidenceType(item);
  const actionNeeded = inferTowerActionNeeded(item);

  return {
    packetId,
    sourceApp: "The Teller",
    sourceLane: item?.source || "unknown",
    sourceRecordId: item?.id || "unknown",
    evidenceType,
    actionNeeded,
    packetStatus: state.packetStatus || TOWER_HANDOFF_STATUSES.PENDING,
    requestedBy: state.requestedBy || item?.payload?.employeeName || item?.payload?.managerName || item?.source || "The Teller",
    target: item?.target || item?.action || "Tower evidence item",
    summary: item?.summary || item?.target || "Tower handoff packet generated from a Teller backup record.",
    riskLevel,
    createdAt: item?.createdAt || new Date().toISOString(),
    updatedAt: state.updatedAt || null,
    reviewedBy: state.reviewedBy || null,
    notes: state.notes || "",
    towerActionHistory: state.towerActionHistory || [],
    payloadSummary: {
      backupStatus: item?.status || "Backed up locally",
      deliveryMode: item?.deliveryMode || "local_handoff_until_tower_api",
      pluginStatus: item?.pluginStatus || "Awaiting Tower review",
    },
    sourcePayload: item?.payload || {},
  };
}

export function getFormalTowerHandoffPackets() {
  return getTowerBackupItems().map((item) => createFormalTowerHandoffPacket(item));
}

export function updateFormalTowerHandoffPacket(packetId, patch = {}) {
  const currentState = getTowerHandoffPacketState().find((item) => item.packetId === packetId);
  const historyItem = {
    status: patch.packetStatus || currentState?.packetStatus || TOWER_HANDOFF_STATUSES.PENDING,
    note: patch.notes || "",
    timestamp: new Date().toISOString(),
    actor: patch.reviewedBy || "Tower Backup Viewer",
  };

  saveTowerHandoffPacketState(packetId, {
    ...patch,
    towerActionHistory: [historyItem, ...(currentState?.towerActionHistory || [])].slice(0, 20),
  });

  return getFormalTowerHandoffPackets();
}

export function getSoulaanaTowerGuidance(packet) {
  const status = packet?.packetStatus || TOWER_HANDOFF_STATUSES.PENDING;
  const risk = packet?.riskLevel || "Low";
  const evidenceType = packet?.evidenceType || "Tower backup record";
  const actionNeeded = packet?.actionNeeded || "General Tower evidence review";

  let plainSummary = `This packet came from ${packet?.sourceApp || "The Teller"} and is tied to ${evidenceType.toLowerCase()}.`;
  let riskRead = "This looks routine, but it should still stay inside the Tower evidence trail.";
  let nextStep = "Review the packet, confirm the payload makes sense, then mark it reviewed or ready for the future Tower API.";

  if (risk === "High") {
    riskRead = "This touches sensitive payroll, tax, banking, identity, or payment-related territory. Treat it as protected.";
    nextStep = "Do not casually approve. Review the payload, require stronger clearance later, and only mark ready when the Tower has enough context.";
  } else if (risk === "Medium") {
    riskRead = "This may affect payroll, secure documents, Tower records, or proof handling. It deserves a careful check.";
    nextStep = "Check whether the manager or employee provided enough context. If not, mark Needs More Info.";
  }

  if (status === TOWER_HANDOFF_STATUSES.READY) {
    nextStep = "This is ready for the future Tower API handoff. Keep it visible as a prepared packet.";
  }

  if (status === TOWER_HANDOFF_STATUSES.NEEDS_INFO) {
    nextStep = "This packet should be sent back for more detail before it is trusted as complete evidence.";
  }

  if (status === TOWER_HANDOFF_STATUSES.DENIED) {
    nextStep = "This packet is blocked locally. Do not send it forward without a new reason or owner-level review.";
  }

  if (status === TOWER_HANDOFF_STATUSES.REVIEWED) {
    nextStep = "This packet has been reviewed locally. Keep it in the evidence trail for audit visibility.";
  }

  return {
    voice: "Soulaana",
    plainSummary,
    riskRead,
    nextStep,
    actionNeeded,
    confidence: risk === "High" ? "Cautious" : "Steady",
  };
}
