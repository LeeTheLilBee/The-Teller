/*
 * THE TELLER / SIMPLEEPAY
 * GP461–GP470
 * TELLER — TOWER REQUEST QUEUE + SAFE RESULT INTAKE
 *
 * Locked doctrine:
 *   Tower is the face.
 *   Teller is the workflow.
 *   Vault is the sealed memory.
 *
 * Key rule:
 *   Teller can ask.
 *   Tower must decide.
 *   Vault only answers Tower.
 *
 * This module does NOT call Tower.
 * This module does NOT call Vault.
 * It tracks Teller-created packets and accepts only Tower workflow-safe results.
 */

import {
  assertNoDirectVaultAccess,
  buildTellerTowerRequestSummary,
  createTellerToTowerHandoffEnvelope,
} from "./tellerTowerRequestHandoff.js";

export const TELLER_TOWER_QUEUE_PACK = Object.freeze({
  pack_id: "GP461-GP470",
  title: "TELLER — TOWER REQUEST QUEUE + SAFE RESULT INTAKE",
  source_app: "teller",
  target_app: "tower",
  direct_tower_call_allowed: false,
  direct_vault_access_allowed: false,
  workflow_safe_result_only: true,
  doctrine: "Teller can ask. Tower must decide. Vault only answers Tower.",
});

export const TELLER_TOWER_QUEUE_STATUSES = Object.freeze({
  CREATED: "created",
  QUEUED_FOR_TOWER: "queued_for_tower",
  WAITING_ON_TOWER: "waiting_on_tower",
  NEEDS_STEP_UP: "needs_step_up",
  NEEDS_OWNER_APPROVAL: "needs_owner_approval",
  TOWER_BLOCKED: "tower_blocked",
  TOWER_RETURNED_SAFE_RESULT: "tower_returned_safe_result",
  CLOSED: "closed",
});

export const TELLER_ALLOWED_SAFE_TOWER_RESULT_STATUSES = Object.freeze([
  "allowed",
  "redacted",
  "needs_step_up",
  "needs_owner_approval",
  "blocked",
  "expired_clearance",
  "role_mismatch",
  "lane_mismatch",
  "invalid_packet",
  "tower_returned_safe_result",
  "view_prepared",
  "view_prepared_redacted",
  "download_protocol_prepared",
  "download_not_allowed_in_view_protocol",
  "step_up_required",
  "owner_approval_required",
  "redaction_required_download_blocked",
]);

export const TELLER_FORBIDDEN_RESULT_FIELDS = Object.freeze([
  "vault_url",
  "vault_link",
  "raw_vault_url",
  "raw_file_url",
  "download_url",
  "preview_url",
  "shared_folder_url",
  "external_collaborator_link",
  "vault_file_path",
  "vault_object_key",
  "vault_storage_bucket",
  "vault_raw_payload",
  "vault_secret",
  "vault_token",
  "public_link",
  "signed_url",
  "temporary_url",
  "download_link",
]);

const STORAGE_KEY = "simplee_teller_tower_request_queue_gp461_470";

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
}

function safeJsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function createTellerQueueReceiptHash(payload) {
  const stable = stableJson(payload);
  let hash = 2166136261;

  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `teller-queue-fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function getTellerForbiddenResultHits(value) {
  const hits = [];

  function scan(node, path = "") {
    if (Array.isArray(node)) {
      node.forEach((item, index) => scan(item, `${path}[${index}]`));
      return;
    }

    if (!node || typeof node !== "object") {
      if (typeof node === "string") {
        const lowered = node.toLowerCase();
        if (
          lowered.includes("vault://") ||
          lowered.includes("raw_file_url") ||
          lowered.includes("download_url") ||
          lowered.includes("preview_url") ||
          lowered.includes("signed_url") ||
          lowered.includes("temporary_url") ||
          lowered.includes("shared_folder") ||
          lowered.includes("public-link")
        ) {
          hits.push(path || "value");
        }
      }
      return;
    }

    Object.entries(node).forEach(([key, child]) => {
      const loweredKey = key.toLowerCase();
      if (TELLER_FORBIDDEN_RESULT_FIELDS.includes(loweredKey)) {
        hits.push(path ? `${path}.${key}` : key);
      }
      scan(child, path ? `${path}.${key}` : key);
    });
  }

  scan(value);
  return Array.from(new Set(hits));
}

export function assertTowerResultWorkflowSafe(value, label = "Tower result") {
  assertNoDirectVaultAccess(value, label);

  const hits = getTellerForbiddenResultHits(value);

  if (hits.length > 0) {
    throw new Error(
      `${label} contains forbidden raw Vault/Tower delivery fields: ${hits.join(", ")}`
    );
  }

  return true;
}

export function createTellerTowerQueueItem(packet, options = {}) {
  assertNoDirectVaultAccess(packet, "Teller packet before queue item");

  const envelope = createTellerToTowerHandoffEnvelope(packet, {
    local_queue_status: "queued_for_tower",
  });

  const createdAt = nowIso();

  const queueItemBase = {
    queue_item_id:
      normalizeText(options.queue_item_id) ||
      `teller_queue_${packet.request_id}`,
    source_app: "teller",
    target_app: "tower",
    queue_status: TELLER_TOWER_QUEUE_STATUSES.QUEUED_FOR_TOWER,
    request_id: packet.request_id,
    workflow_type: packet.workflow_type,
    requester_role: packet.requester_role,
    requester_entity: packet.requester_entity,
    business_context: packet.business_context,
    sensitivity_level: packet.sensitivity_level,
    requested_output_type: packet.requested_output_type,
    teller_workflow_receipt_hash: packet.teller_workflow_receipt_hash,
    tower_approval_required: true,
    tower_must_decide: true,
    vault_direct_access_allowed: false,
    direct_tower_call_allowed: false,
    handoff_envelope: envelope,
    request_summary: buildTellerTowerRequestSummary(packet),
    safe_result_history: [],
    latest_safe_result: null,
    created_at: createdAt,
    updated_at: createdAt,
  };

  const queueReceiptHash = createTellerQueueReceiptHash({
    queue_item_id: queueItemBase.queue_item_id,
    request_id: queueItemBase.request_id,
    queue_status: queueItemBase.queue_status,
    teller_workflow_receipt_hash: queueItemBase.teller_workflow_receipt_hash,
    created_at: queueItemBase.created_at,
  });

  const item = Object.freeze({
    ...queueItemBase,
    teller_queue_receipt_hash: queueReceiptHash,
  });

  assertTowerResultWorkflowSafe(item, "Teller Tower queue item");

  return item;
}

export function markTellerQueueItemWaitingOnTower(queueItem) {
  assertTowerResultWorkflowSafe(queueItem, "Queue item before waiting status");

  return Object.freeze({
    ...queueItem,
    queue_status: TELLER_TOWER_QUEUE_STATUSES.WAITING_ON_TOWER,
    updated_at: nowIso(),
  });
}

export function normalizeTowerSafeResult(rawResult = {}) {
  assertTowerResultWorkflowSafe(rawResult, "Raw Tower safe result before normalization");

  const status = normalizeText(rawResult.status, "tower_returned_safe_result");

  if (!TELLER_ALLOWED_SAFE_TOWER_RESULT_STATUSES.includes(status)) {
    throw new Error(`Unsupported Tower safe result status for Teller: ${status}`);
  }

  const safeResult = Object.freeze({
    request_id: normalizeText(rawResult.request_id),
    status,
    display_status: normalizeText(
      rawResult.display_status,
      "Tower returned a workflow-safe update"
    ),
    workflow_safe_summary: normalizeText(rawResult.workflow_safe_summary),
    workflow_safe_receipt_id: normalizeText(rawResult.workflow_safe_receipt_id),
    tower_decision_receipt_id: normalizeText(rawResult.tower_decision_receipt_id),
    authorized_view_receipt_id: normalizeText(rawResult.authorized_view_receipt_id),
    authorized_download_receipt_id: normalizeText(rawResult.authorized_download_receipt_id),
    vault_proof_reference_safe_label: normalizeText(
      rawResult.vault_proof_reference_safe_label
    ),
    redaction_applied: Boolean(rawResult.redaction_applied ?? true),
    next_teller_action: normalizeText(rawResult.next_teller_action, "review_status"),
    final_for_teller: Boolean(rawResult.final_for_teller ?? false),
    safe_to_display_to_requester: Boolean(
      rawResult.safe_to_display_to_requester ?? true
    ),
    vault_direct_access_allowed: false,
    raw_files_included: false,
    raw_links_included: false,
    download_link_included: false,
    received_at: normalizeText(rawResult.returned_at, nowIso()),
  });

  assertTowerResultWorkflowSafe(safeResult, "Normalized Tower safe result");

  return safeResult;
}

export function attachTowerSafeResultToQueueItem(queueItem, rawTowerResult = {}) {
  assertTowerResultWorkflowSafe(queueItem, "Queue item before safe result attach");

  const safeResult = normalizeTowerSafeResult({
    ...rawTowerResult,
    request_id: rawTowerResult.request_id || queueItem.request_id,
  });

  const resultStatusToQueueStatus = {
    allowed: TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT,
    redacted: TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT,
    tower_returned_safe_result: TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT,
    view_prepared: TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT,
    view_prepared_redacted: TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT,
    download_protocol_prepared: TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT,
    needs_step_up: TELLER_TOWER_QUEUE_STATUSES.NEEDS_STEP_UP,
    step_up_required: TELLER_TOWER_QUEUE_STATUSES.NEEDS_STEP_UP,
    needs_owner_approval: TELLER_TOWER_QUEUE_STATUSES.NEEDS_OWNER_APPROVAL,
    owner_approval_required: TELLER_TOWER_QUEUE_STATUSES.NEEDS_OWNER_APPROVAL,
    blocked: TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED,
    expired_clearance: TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED,
    role_mismatch: TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED,
    lane_mismatch: TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED,
    invalid_packet: TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED,
    download_not_allowed_in_view_protocol: TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED,
    redaction_required_download_blocked: TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED,
  };

  const nextStatus = safeResult.final_for_teller
    ? TELLER_TOWER_QUEUE_STATUSES.CLOSED
    : resultStatusToQueueStatus[safeResult.status] ||
      TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT;

  const updatedItem = Object.freeze({
    ...queueItem,
    queue_status: nextStatus,
    latest_safe_result: safeResult,
    safe_result_history: Object.freeze([
      ...(queueItem.safe_result_history || []),
      safeResult,
    ]),
    updated_at: nowIso(),
  });

  assertTowerResultWorkflowSafe(updatedItem, "Queue item after safe result attach");

  return updatedItem;
}

export function closeTellerTowerQueueItem(queueItem, reason = "workflow_safe_result_closed") {
  assertTowerResultWorkflowSafe(queueItem, "Queue item before close");

  return Object.freeze({
    ...queueItem,
    queue_status: TELLER_TOWER_QUEUE_STATUSES.CLOSED,
    close_reason: normalizeText(reason, "closed"),
    updated_at: nowIso(),
  });
}

export function getTellerTowerQueueDisplayStatus(queueItem) {
  const status = queueItem.queue_status;

  const labelMap = {
    created: "Created",
    queued_for_tower: "Queued for Tower",
    waiting_on_tower: "Waiting on Tower",
    needs_step_up: "Needs Tower step-up",
    needs_owner_approval: "Needs owner/admin approval",
    tower_blocked: "Tower blocked",
    tower_returned_safe_result: "Tower returned safe status",
    closed: "Closed",
  };

  const nextMap = {
    created: "Send packet to Tower queue",
    queued_for_tower: "Wait for Tower review",
    waiting_on_tower: "Wait for Tower decision",
    needs_step_up: "Tower step-up required",
    needs_owner_approval: "Owner/admin approval required",
    tower_blocked: "Review Tower-safe reason",
    tower_returned_safe_result: "Continue Teller workflow using safe status only",
    closed: "No action needed",
  };

  return Object.freeze({
    request_id: queueItem.request_id,
    queue_status: status,
    display_label: labelMap[status] || "Tower workflow update",
    next_action: nextMap[status] || "Review Teller workflow",
    safe_summary:
      queueItem.latest_safe_result?.workflow_safe_summary ||
      "Teller is tracking the workflow request without direct Vault access.",
    vault_direct_access_allowed: false,
    raw_links_included: false,
    raw_files_included: false,
  });
}

export function createTellerTowerQueueSnapshot(queueItems = []) {
  const items = queueItems.map((item) => {
    assertTowerResultWorkflowSafe(item, "Queue snapshot item");
    return item;
  });

  const counts = items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.by_status[item.queue_status] = (acc.by_status[item.queue_status] || 0) + 1;
      if (item.queue_status !== TELLER_TOWER_QUEUE_STATUSES.CLOSED) {
        acc.open += 1;
      }
      return acc;
    },
    { total: 0, open: 0, by_status: {} }
  );

  const snapshot = Object.freeze({
    pack_id: TELLER_TOWER_QUEUE_PACK.pack_id,
    source_app: "teller",
    target_app: "tower",
    direct_tower_call_allowed: false,
    direct_vault_access_allowed: false,
    workflow_safe_result_only: true,
    counts,
    items: Object.freeze(
      items.map((item) => Object.freeze(getTellerTowerQueueDisplayStatus(item)))
    ),
    updated_at: nowIso(),
  });

  assertTowerResultWorkflowSafe(snapshot, "Teller Tower queue snapshot");

  return snapshot;
}

export function readTellerTowerRequestQueue(storage = globalThis?.localStorage) {
  if (!storage) {
    return [];
  }

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    parsed.forEach((item) => assertTowerResultWorkflowSafe(item, "Stored queue item"));
    return parsed;
  } catch {
    return [];
  }
}

export function saveTellerTowerRequestQueue(queueItems = [], storage = globalThis?.localStorage) {
  if (!storage) {
    return false;
  }

  queueItems.forEach((item) => assertTowerResultWorkflowSafe(item, "Queue item before save"));
  storage.setItem(STORAGE_KEY, JSON.stringify(queueItems.map(safeJsonClone)));
  return true;
}

export function upsertTellerTowerQueueItem(queueItem, storage = globalThis?.localStorage) {
  assertTowerResultWorkflowSafe(queueItem, "Queue item before upsert");

  const current = readTellerTowerRequestQueue(storage);
  const withoutExisting = current.filter((item) => item.request_id !== queueItem.request_id);
  const next = [queueItem, ...withoutExisting];

  saveTellerTowerRequestQueue(next, storage);

  return next;
}

export function clearTellerTowerRequestQueue(storage = globalThis?.localStorage) {
  if (!storage) {
    return false;
  }

  storage.removeItem(STORAGE_KEY);
  return true;
}

export function getTellerTowerQueueReadiness() {
  return Object.freeze({
    pack_id: TELLER_TOWER_QUEUE_PACK.pack_id,
    title: TELLER_TOWER_QUEUE_PACK.title,
    teller_tracks_created_packets: true,
    teller_tracks_waiting_on_tower: true,
    teller_accepts_workflow_safe_tower_results: true,
    teller_rejects_raw_vault_links: true,
    teller_rejects_raw_vault_files: true,
    teller_direct_tower_call_allowed: false,
    teller_direct_vault_access_allowed: false,
    workflow_safe_result_only: true,
    ready_for_later_ui_wireup: true,
    ready_for_clouds_snapshot_later: true,
  });
}
