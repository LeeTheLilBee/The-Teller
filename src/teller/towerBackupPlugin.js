
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
