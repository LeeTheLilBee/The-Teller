/*
 * THE TELLER / SIMPLEEPAY
 * GP471–GP480
 * TELLER — WORKFLOW-SAFE REQUEST STATUS WIRING
 *
 * Teller-only layer:
 *   - no Tower API call
 *   - no Vault API call
 *   - no raw links/files
 *   - no visible UI clutter
 *
 * This module converts Teller queue items into workflow-safe display/status
 * objects that Employee, Manager, Owner, and future Clouds snapshots can use.
 */

import {
  assertTowerResultWorkflowSafe,
  getTellerTowerQueueDisplayStatus,
  TELLER_TOWER_QUEUE_STATUSES,
} from "./tellerTowerRequestQueue.js";

export const TELLER_STATUS_WIRING_PACK = Object.freeze({
  pack_id: "GP471-GP480",
  title: "TELLER — WORKFLOW-SAFE REQUEST STATUS WIRING",
  source_app: "teller",
  target_app: "tower",
  direct_tower_call_allowed: false,
  direct_vault_access_allowed: false,
  visible_ui_added: false,
  workflow_safe_status_only: true,
  doctrine: "Teller can ask. Tower must decide. Vault only answers Tower.",
});

export const TELLER_WORKFLOW_SAFE_STATUS_TONE = Object.freeze({
  WAITING: "waiting",
  ATTENTION: "attention",
  BLOCKED: "blocked",
  READY: "ready",
  CLOSED: "closed",
  INFO: "info",
});

export const TELLER_WORKFLOW_SAFE_STATUS_PRIORITY = Object.freeze({
  NOW: "now",
  NEXT: "next",
  SOON: "soon",
  LATER: "later",
  DONE: "done",
});

export const TELLER_STATUS_ROLE_VISIBILITY = Object.freeze({
  employee: Object.freeze({
    show_sensitive_subject: false,
    show_tower_receipts: false,
    show_owner_approval_reason: false,
    show_safe_summary: true,
    show_next_action: true,
  }),
  manager: Object.freeze({
    show_sensitive_subject: true,
    show_tower_receipts: false,
    show_owner_approval_reason: true,
    show_safe_summary: true,
    show_next_action: true,
  }),
  owner: Object.freeze({
    show_sensitive_subject: true,
    show_tower_receipts: true,
    show_owner_approval_reason: true,
    show_safe_summary: true,
    show_next_action: true,
  }),
  payroll_admin: Object.freeze({
    show_sensitive_subject: true,
    show_tower_receipts: true,
    show_owner_approval_reason: true,
    show_safe_summary: true,
    show_next_action: true,
  }),
  vendor: Object.freeze({
    show_sensitive_subject: false,
    show_tower_receipts: false,
    show_owner_approval_reason: false,
    show_safe_summary: true,
    show_next_action: true,
  }),
  tenant: Object.freeze({
    show_sensitive_subject: false,
    show_tower_receipts: false,
    show_owner_approval_reason: false,
    show_safe_summary: true,
    show_next_action: true,
  }),
});

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }
  const text = String(value).trim();
  return text || fallback;
}

function rolePolicy(role = "employee") {
  return (
    TELLER_STATUS_ROLE_VISIBILITY[role] ||
    TELLER_STATUS_ROLE_VISIBILITY.employee
  );
}

function safeRedactedSubject(queueItem, viewerRole) {
  const policy = rolePolicy(viewerRole);
  if (policy.show_sensitive_subject) {
    return normalizeText(
      queueItem.request_summary?.subject_person_or_vendor ||
        queueItem.handoff_envelope?.packet?.subject_person_or_vendor ||
        queueItem.request_id,
      "Workflow request"
    );
  }

  return "Protected workflow request";
}

export function getWorkflowSafeTone(queueStatus, latestSafeResult = null) {
  const latestStatus = latestSafeResult?.status || "";

  if (
    queueStatus === TELLER_TOWER_QUEUE_STATUSES.CLOSED ||
    latestSafeResult?.final_for_teller
  ) {
    return TELLER_WORKFLOW_SAFE_STATUS_TONE.CLOSED;
  }

  if (
    queueStatus === TELLER_TOWER_QUEUE_STATUSES.NEEDS_STEP_UP ||
    latestStatus === "needs_step_up" ||
    latestStatus === "step_up_required"
  ) {
    return TELLER_WORKFLOW_SAFE_STATUS_TONE.ATTENTION;
  }

  if (
    queueStatus === TELLER_TOWER_QUEUE_STATUSES.NEEDS_OWNER_APPROVAL ||
    latestStatus === "needs_owner_approval" ||
    latestStatus === "owner_approval_required"
  ) {
    return TELLER_WORKFLOW_SAFE_STATUS_TONE.ATTENTION;
  }

  if (
    queueStatus === TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED ||
    [
      "blocked",
      "expired_clearance",
      "role_mismatch",
      "lane_mismatch",
      "invalid_packet",
      "download_not_allowed_in_view_protocol",
      "redaction_required_download_blocked",
    ].includes(latestStatus)
  ) {
    return TELLER_WORKFLOW_SAFE_STATUS_TONE.BLOCKED;
  }

  if (
    queueStatus === TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT ||
    [
      "allowed",
      "redacted",
      "view_prepared",
      "view_prepared_redacted",
      "download_protocol_prepared",
      "tower_returned_safe_result",
    ].includes(latestStatus)
  ) {
    return TELLER_WORKFLOW_SAFE_STATUS_TONE.READY;
  }

  if (
    queueStatus === TELLER_TOWER_QUEUE_STATUSES.QUEUED_FOR_TOWER ||
    queueStatus === TELLER_TOWER_QUEUE_STATUSES.WAITING_ON_TOWER
  ) {
    return TELLER_WORKFLOW_SAFE_STATUS_TONE.WAITING;
  }

  return TELLER_WORKFLOW_SAFE_STATUS_TONE.INFO;
}

export function getWorkflowSafePriority(queueStatus, latestSafeResult = null) {
  const tone = getWorkflowSafeTone(queueStatus, latestSafeResult);

  if (tone === TELLER_WORKFLOW_SAFE_STATUS_TONE.ATTENTION) {
    return TELLER_WORKFLOW_SAFE_STATUS_PRIORITY.NOW;
  }

  if (tone === TELLER_WORKFLOW_SAFE_STATUS_TONE.BLOCKED) {
    return TELLER_WORKFLOW_SAFE_STATUS_PRIORITY.NEXT;
  }

  if (tone === TELLER_WORKFLOW_SAFE_STATUS_TONE.READY) {
    return TELLER_WORKFLOW_SAFE_STATUS_PRIORITY.NEXT;
  }

  if (tone === TELLER_WORKFLOW_SAFE_STATUS_TONE.WAITING) {
    return TELLER_WORKFLOW_SAFE_STATUS_PRIORITY.LATER;
  }

  if (tone === TELLER_WORKFLOW_SAFE_STATUS_TONE.CLOSED) {
    return TELLER_WORKFLOW_SAFE_STATUS_PRIORITY.DONE;
  }

  return TELLER_WORKFLOW_SAFE_STATUS_PRIORITY.SOON;
}

export function getWorkflowSafeHumanLabel(queueItem) {
  const status = queueItem.queue_status;
  const latestStatus = queueItem.latest_safe_result?.status || "";

  if (status === TELLER_TOWER_QUEUE_STATUSES.QUEUED_FOR_TOWER) {
    return "Queued for Tower";
  }

  if (status === TELLER_TOWER_QUEUE_STATUSES.WAITING_ON_TOWER) {
    return "Waiting on Tower";
  }

  if (
    status === TELLER_TOWER_QUEUE_STATUSES.NEEDS_STEP_UP ||
    latestStatus === "step_up_required"
  ) {
    return "Tower step-up needed";
  }

  if (
    status === TELLER_TOWER_QUEUE_STATUSES.NEEDS_OWNER_APPROVAL ||
    latestStatus === "owner_approval_required"
  ) {
    return "Owner/admin approval needed";
  }

  if (status === TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED) {
    return "Tower blocked this request";
  }

  if (latestStatus === "view_prepared" || latestStatus === "view_prepared_redacted") {
    return "Tower prepared safe view status";
  }

  if (latestStatus === "download_protocol_prepared") {
    return "Tower prepared download protocol status";
  }

  if (status === TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT) {
    return "Tower returned safe status";
  }

  if (status === TELLER_TOWER_QUEUE_STATUSES.CLOSED) {
    return "Closed";
  }

  return "Workflow request";
}

export function getWorkflowSafeNextAction(queueItem, viewerRole = "employee") {
  const latest = queueItem.latest_safe_result;
  const status = queueItem.queue_status;
  const latestStatus = latest?.status || "";

  if (status === TELLER_TOWER_QUEUE_STATUSES.QUEUED_FOR_TOWER) {
    return "Wait for Tower to review the request.";
  }

  if (status === TELLER_TOWER_QUEUE_STATUSES.WAITING_ON_TOWER) {
    return "No Teller action yet. Tower still has to decide.";
  }

  if (latestStatus === "step_up_required" || status === TELLER_TOWER_QUEUE_STATUSES.NEEDS_STEP_UP) {
    return viewerRole === "owner"
      ? "Complete Tower step-up before this workflow can continue."
      : "Tower step-up is needed before this can continue.";
  }

  if (
    latestStatus === "owner_approval_required" ||
    status === TELLER_TOWER_QUEUE_STATUSES.NEEDS_OWNER_APPROVAL
  ) {
    return viewerRole === "owner"
      ? "Review owner/admin approval in Tower."
      : "Waiting for owner/admin approval.";
  }

  if (status === TELLER_TOWER_QUEUE_STATUSES.TOWER_BLOCKED) {
    return "Review the Tower-safe reason and update the Teller workflow if needed.";
  }

  if (latest?.next_teller_action) {
    return latest.next_teller_action;
  }

  if (status === TELLER_TOWER_QUEUE_STATUSES.TOWER_RETURNED_SAFE_RESULT) {
    return "Continue the Teller workflow using the safe status only.";
  }

  if (status === TELLER_TOWER_QUEUE_STATUSES.CLOSED) {
    return "No action needed.";
  }

  return "Review the Teller workflow.";
}

export function buildWorkflowSafeStatusCard(queueItem, viewerRole = "employee") {
  assertTowerResultWorkflowSafe(queueItem, "Queue item before status card");

  const base = getTellerTowerQueueDisplayStatus(queueItem);
  const latest = queueItem.latest_safe_result || null;
  const policy = rolePolicy(viewerRole);
  const tone = getWorkflowSafeTone(queueItem.queue_status, latest);
  const priority = getWorkflowSafePriority(queueItem.queue_status, latest);

  const card = Object.freeze({
    request_id: queueItem.request_id,
    queue_item_id: queueItem.queue_item_id,
    viewer_role: viewerRole,
    workflow_type: queueItem.workflow_type,
    requester_entity: queueItem.requester_entity,
    business_context: queueItem.business_context,
    requested_output_type: queueItem.requested_output_type,
    sensitivity_level: queueItem.sensitivity_level,

    subject_label: safeRedactedSubject(queueItem, viewerRole),
    display_label: getWorkflowSafeHumanLabel(queueItem),
    queue_status: queueItem.queue_status,
    tone,
    priority,

    safe_summary: policy.show_safe_summary
      ? normalizeText(
          latest?.workflow_safe_summary || base.safe_summary,
          "Teller is tracking this request without direct Vault access."
        )
      : "Status is protected.",

    next_action: policy.show_next_action
      ? getWorkflowSafeNextAction(queueItem, viewerRole)
      : "Protected.",

    tower_receipts: policy.show_tower_receipts
      ? Object.freeze({
          teller_workflow_receipt_hash: queueItem.teller_workflow_receipt_hash,
          teller_queue_receipt_hash: queueItem.teller_queue_receipt_hash,
          tower_decision_receipt_id: latest?.tower_decision_receipt_id || "",
          workflow_safe_receipt_id: latest?.workflow_safe_receipt_id || "",
          authorized_view_receipt_id: latest?.authorized_view_receipt_id || "",
          authorized_download_receipt_id: latest?.authorized_download_receipt_id || "",
        })
      : null,

    redaction_applied: Boolean(latest?.redaction_applied ?? true),
    vault_proof_reference_safe_label: normalizeText(
      latest?.vault_proof_reference_safe_label,
      "Vault access remains Tower-controlled."
    ),

    vault_direct_access_allowed: false,
    raw_files_included: false,
    raw_links_included: false,
    download_link_included: false,
    direct_tower_call_allowed: false,
    direct_vault_access_allowed: false,
    generated_at: nowIso(),
  });

  assertTowerResultWorkflowSafe(card, "Workflow-safe status card");

  return card;
}

export function buildWorkflowSafeStatusList(queueItems = [], viewerRole = "employee") {
  const cards = queueItems.map((item) => buildWorkflowSafeStatusCard(item, viewerRole));

  const sortedCards = [...cards].sort((a, b) => {
    const priorityRank = {
      now: 0,
      next: 1,
      soon: 2,
      later: 3,
      done: 4,
    };

    return (
      (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99) ||
      a.display_label.localeCompare(b.display_label) ||
      a.request_id.localeCompare(b.request_id)
    );
  });

  const list = Object.freeze({
    pack_id: TELLER_STATUS_WIRING_PACK.pack_id,
    viewer_role: viewerRole,
    total: sortedCards.length,
    open: sortedCards.filter((card) => card.priority !== "done").length,
    cards: Object.freeze(sortedCards),
    direct_tower_call_allowed: false,
    direct_vault_access_allowed: false,
    workflow_safe_status_only: true,
    generated_at: nowIso(),
  });

  assertTowerResultWorkflowSafe(list, "Workflow-safe status list");

  return list;
}

export function buildWorkflowSafeStatusSummary(queueItems = [], viewerRole = "employee") {
  const statusList = buildWorkflowSafeStatusList(queueItems, viewerRole);

  const counts = statusList.cards.reduce(
    (acc, card) => {
      acc.by_tone[card.tone] = (acc.by_tone[card.tone] || 0) + 1;
      acc.by_priority[card.priority] = (acc.by_priority[card.priority] || 0) + 1;
      return acc;
    },
    { by_tone: {}, by_priority: {} }
  );

  const nextCard =
    statusList.cards.find((card) => card.priority === "now") ||
    statusList.cards.find((card) => card.priority === "next") ||
    statusList.cards.find((card) => card.priority === "soon") ||
    statusList.cards[0] ||
    null;

  const summary = Object.freeze({
    pack_id: TELLER_STATUS_WIRING_PACK.pack_id,
    viewer_role: viewerRole,
    total: statusList.total,
    open: statusList.open,
    counts,
    next_safe_status_card: nextCard,
    summary_label:
      statusList.open === 0
        ? "No open Tower workflow requests."
        : `${statusList.open} Tower workflow request${statusList.open === 1 ? "" : "s"} open.`,
    direct_tower_call_allowed: false,
    direct_vault_access_allowed: false,
    workflow_safe_status_only: true,
    generated_at: nowIso(),
  });

  assertTowerResultWorkflowSafe(summary, "Workflow-safe status summary");

  return summary;
}

export function getWorkflowSafeStatusWiringReadiness() {
  return Object.freeze({
    pack_id: TELLER_STATUS_WIRING_PACK.pack_id,
    title: TELLER_STATUS_WIRING_PACK.title,
    teller_can_render_safe_status_cards_later: true,
    employee_redaction_policy_ready: true,
    manager_status_policy_ready: true,
    owner_receipt_policy_ready: true,
    no_visible_ui_added: true,
    no_tower_api_call: true,
    no_vault_api_call: true,
    no_raw_vault_links: true,
    no_raw_vault_files: true,
    workflow_safe_status_only: true,
    ready_for_next_corridor:
      "TELLER GP481-GP490 — Workflow-Safe Status Drawer Wiring",
  });
}
