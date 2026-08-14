/*
 * THE TELLER / SIMPLEEPAY
 * GP451–GP460
 * ARCHIVE VAULT — TELLER TO TOWER REQUEST HANDOFF LAYER
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
 * This module intentionally does NOT call Vault.
 * It creates workflow-safe request packets for Tower review.
 */

export const TELLER_TOWER_HANDOFF_PACK = Object.freeze({
  pack_id: "GP451-GP460",
  title: "ARCHIVE VAULT — TELLER TO TOWER REQUEST HANDOFF LAYER",
  source_app: "teller",
  target_app: "tower",
  vault_direct_access_allowed: false,
  tower_approval_required: true,
  doctrine: "Teller can ask. Tower must decide. Vault only answers Tower.",
});

export const TELLER_WORKFLOW_TYPES = Object.freeze([
  "employee_document_request",
  "vendor_document_request",
  "payroll_proof_request",
  "onboarding_packet_request",
  "agreement_proof_request",
  "payment_receipt_request",
  "rent_payment_receipt_request",
  "direct_deposit_change_request",
  "policy_acknowledgment_request",
  "workflow_status_request",
]);

export const TELLER_REQUESTED_OUTPUT_TYPES = Object.freeze([
  "status",
  "proof",
  "receipt",
  "preview",
  "download",
]);

export const TELLER_SENSITIVITY_LEVELS = Object.freeze([
  "low",
  "internal",
  "restricted",
  "sensitive",
  "owner_only",
]);

export const TELLER_TOWER_HANDOFF_STATUSES = Object.freeze({
  DRAFT: "draft",
  PENDING_TOWER_REVIEW: "pending_tower_review",
  NEEDS_STEP_UP: "needs_step_up",
  NEEDS_OWNER_APPROVAL: "needs_owner_approval",
  TOWER_APPROVED: "tower_approved",
  TOWER_BLOCKED: "tower_blocked",
  TOWER_RETURNED_SAFE_RESULT: "tower_returned_safe_result",
  CLOSED: "closed",
});

export const TELLER_FORBIDDEN_VAULT_ACTIONS = Object.freeze([
  "direct_vault_browsing",
  "direct_vault_download",
  "direct_vault_preview",
  "direct_vault_upload",
  "direct_vault_restore",
  "direct_vault_delete",
  "public_link_creation",
  "raw_file_url_display",
  "shared_folder_access",
  "external_collaborator_access",
]);

export const TELLER_FORBIDDEN_RAW_FIELDS = Object.freeze([
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
]);

const REQUIRED_PACKET_FIELDS = Object.freeze([
  "workflow_type",
  "requester_role",
  "requester_entity",
  "subject_person_or_vendor",
  "document_or_proof_type",
  "reason_for_request",
  "deadline",
  "sensitivity_level",
  "requested_output_type",
  "business_context",
]);

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = normalizeText(value, fallback);
  return allowed.includes(normalized) ? normalized : fallback;
}

function createStableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(createStableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${createStableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

/*
 * Browser-safe deterministic hash.
 * This is a workflow receipt hash for local/demo integrity tracking.
 * Production can replace this with Tower-issued cryptographic receipts.
 */
export function createTellerWorkflowReceiptHash(packetLike) {
  const stable = createStableJson(packetLike);
  let hash = 2166136261;

  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `teller-fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createTellerRequestId(prefix = "teller_tower_request") {
  const timestamp = nowIso().replace(/[-:.TZ]/g, "").slice(0, 14);
  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${timestamp}_${randomPart}`;
}

export function getTellerForbiddenVaultFieldHits(value) {
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
          lowered.includes("raw.githubusercontent.com") ||
          lowered.includes("public-link") ||
          lowered.includes("download_url") ||
          lowered.includes("preview_url")
        ) {
          hits.push(path || "value");
        }
      }
      return;
    }

    Object.entries(node).forEach(([key, child]) => {
      const loweredKey = key.toLowerCase();
      if (TELLER_FORBIDDEN_RAW_FIELDS.includes(loweredKey)) {
        hits.push(path ? `${path}.${key}` : key);
      }
      scan(child, path ? `${path}.${key}` : key);
    });
  }

  scan(value);
  return Array.from(new Set(hits));
}

export function assertNoDirectVaultAccess(payload, label = "payload") {
  const hits = getTellerForbiddenVaultFieldHits(payload);

  if (hits.length > 0) {
    throw new Error(
      `${label} contains forbidden direct Vault fields or links: ${hits.join(", ")}`
    );
  }

  return true;
}

export function validateTellerTowerRequestInput(input = {}) {
  const missing = REQUIRED_PACKET_FIELDS.filter((field) => !normalizeText(input[field]));
  const problems = [];

  if (missing.length > 0) {
    problems.push(`Missing required fields: ${missing.join(", ")}`);
  }

  if (
    input.workflow_type &&
    !TELLER_WORKFLOW_TYPES.includes(normalizeText(input.workflow_type))
  ) {
    problems.push(`Unsupported workflow_type: ${input.workflow_type}`);
  }

  if (
    input.requested_output_type &&
    !TELLER_REQUESTED_OUTPUT_TYPES.includes(normalizeText(input.requested_output_type))
  ) {
    problems.push(`Unsupported requested_output_type: ${input.requested_output_type}`);
  }

  if (
    input.sensitivity_level &&
    !TELLER_SENSITIVITY_LEVELS.includes(normalizeText(input.sensitivity_level))
  ) {
    problems.push(`Unsupported sensitivity_level: ${input.sensitivity_level}`);
  }

  const forbiddenHits = getTellerForbiddenVaultFieldHits(input);
  if (forbiddenHits.length > 0) {
    problems.push(
      `Direct Vault access is forbidden in Teller packets: ${forbiddenHits.join(", ")}`
    );
  }

  return {
    valid: problems.length === 0,
    problems,
    missing,
    forbiddenHits,
  };
}

export function createTellerTowerRequestPacket(input = {}) {
  const validation = validateTellerTowerRequestInput(input);

  if (!validation.valid) {
    throw new Error(validation.problems.join(" | "));
  }

  const createdAt = nowIso();

  const packetBase = {
    request_id: normalizeText(input.request_id) || createTellerRequestId(),
    source_app: "teller",
    target_app: "tower",
    workflow_type: normalizeEnum(
      input.workflow_type,
      TELLER_WORKFLOW_TYPES,
      "workflow_status_request"
    ),
    requester_role: normalizeText(input.requester_role),
    requester_entity: normalizeText(input.requester_entity),
    subject_person_or_vendor: normalizeText(input.subject_person_or_vendor),
    document_or_proof_type: normalizeText(input.document_or_proof_type),
    reason_for_request: normalizeText(input.reason_for_request),
    deadline: normalizeText(input.deadline),
    sensitivity_level: normalizeEnum(
      input.sensitivity_level,
      TELLER_SENSITIVITY_LEVELS,
      "restricted"
    ),
    requested_output_type: normalizeEnum(
      input.requested_output_type,
      TELLER_REQUESTED_OUTPUT_TYPES,
      "status"
    ),
    business_context: normalizeText(input.business_context),
    workflow_notes: normalizeText(input.workflow_notes),
    workflow_state: normalizeText(input.workflow_state, "request_created"),
    requester_role_context: normalizeText(input.requester_role_context),
    business_entity_context: normalizeText(input.business_entity_context),
    source_confidence: normalizeText(input.source_confidence, "owner_entered"),
    freshness_state: normalizeText(input.freshness_state, "pending_confirmation"),

    tower_approval_required: true,
    tower_decides_permission: true,
    tower_step_up_may_be_required: true,
    tower_redaction_required: true,
    tower_owner_admin_override_required_for_sensitive_output:
      normalizeEnum(input.sensitivity_level, TELLER_SENSITIVITY_LEVELS, "restricted") ===
      "owner_only",

    vault_direct_access_allowed: false,
    vault_answers_tower_only: true,
    vault_raw_links_allowed: false,
    vault_public_links_allowed: false,
    vault_preview_allowed_from_teller: false,
    vault_download_allowed_from_teller: false,
    vault_upload_allowed_from_teller: false,
    vault_restore_delete_allowed_from_teller: false,

    requested_tower_decision: {
      can_open_request: "tower_must_decide",
      can_view_sensitive_data: "tower_must_decide",
      can_request_vault_status: "tower_must_decide",
      can_request_vault_proof: "tower_must_decide",
      can_request_vault_preview: "tower_must_decide",
      can_request_vault_download: "tower_must_decide",
      redaction_scope: "tower_must_decide",
      owner_or_admin_approval: "tower_must_decide",
    },

    forbidden_actions: [...TELLER_FORBIDDEN_VAULT_ACTIONS],
    status: TELLER_TOWER_HANDOFF_STATUSES.PENDING_TOWER_REVIEW,
    created_at: createdAt,
    updated_at: createdAt,
    tower_result_status: "waiting_on_tower",
    final_workflow_safe_output: null,
  };

  const tellerWorkflowReceiptHash = createTellerWorkflowReceiptHash({
    request_id: packetBase.request_id,
    source_app: packetBase.source_app,
    target_app: packetBase.target_app,
    workflow_type: packetBase.workflow_type,
    requester_role: packetBase.requester_role,
    requester_entity: packetBase.requester_entity,
    subject_person_or_vendor: packetBase.subject_person_or_vendor,
    document_or_proof_type: packetBase.document_or_proof_type,
    reason_for_request: packetBase.reason_for_request,
    deadline: packetBase.deadline,
    sensitivity_level: packetBase.sensitivity_level,
    requested_output_type: packetBase.requested_output_type,
    business_context: packetBase.business_context,
    created_at: packetBase.created_at,
    tower_approval_required: packetBase.tower_approval_required,
    vault_direct_access_allowed: packetBase.vault_direct_access_allowed,
  });

  const packet = Object.freeze({
    ...packetBase,
    teller_workflow_receipt_hash: tellerWorkflowReceiptHash,
  });

  assertNoDirectVaultAccess(packet, "Teller Tower request packet");

  return packet;
}

export function createTellerToTowerHandoffEnvelope(packet, options = {}) {
  assertNoDirectVaultAccess(packet, "Teller Tower handoff packet");

  if (!packet || packet.source_app !== "teller" || packet.target_app !== "tower") {
    throw new Error("Invalid Teller to Tower packet.");
  }

  if (packet.vault_direct_access_allowed !== false) {
    throw new Error("Teller packet attempted to allow direct Vault access.");
  }

  const envelope = Object.freeze({
    envelope_id: createTellerRequestId("teller_tower_handoff"),
    pack_id: TELLER_TOWER_HANDOFF_PACK.pack_id,
    source_app: "teller",
    target_app: "tower",
    handoff_type: "workflow_request_for_tower_review",
    tower_approval_required: true,
    vault_direct_access_allowed: false,
    vault_answers_tower_only: true,
    packet,
    local_queue_status: normalizeText(options.local_queue_status, "queued_for_tower"),
    created_at: nowIso(),
  });

  assertNoDirectVaultAccess(envelope, "Teller Tower handoff envelope");

  return envelope;
}

export function createWaitingOnTowerStatus(packet) {
  return Object.freeze({
    request_id: packet.request_id,
    status: TELLER_TOWER_HANDOFF_STATUSES.PENDING_TOWER_REVIEW,
    display_status: "Waiting on Tower review",
    workflow_safe_message:
      "The Teller created the workflow request and sent it to Tower for permission review.",
    next_actor: "tower",
    teller_can_continue: false,
    vault_direct_access_allowed: false,
    safe_to_display_to_requester: true,
    updated_at: nowIso(),
  });
}

export function sanitizeTowerWorkflowResultForTeller(towerResult = {}) {
  assertNoDirectVaultAccess(towerResult, "Tower workflow result before Teller display");

  const status = normalizeText(towerResult.status, "tower_returned_safe_result");
  const allowedOutputType = normalizeText(towerResult.allowed_output_type, "status");

  const safeResult = Object.freeze({
    request_id: normalizeText(towerResult.request_id),
    status,
    allowed_output_type: allowedOutputType,
    display_status: normalizeText(towerResult.display_status, "Tower returned a workflow update"),
    workflow_safe_summary: normalizeText(towerResult.workflow_safe_summary),
    workflow_safe_receipt_id: normalizeText(towerResult.workflow_safe_receipt_id),
    redaction_applied: Boolean(towerResult.redaction_applied ?? true),
    tower_decision_receipt_id: normalizeText(towerResult.tower_decision_receipt_id),
    vault_proof_reference_safe_label: normalizeText(
      towerResult.vault_proof_reference_safe_label
    ),
    next_teller_action: normalizeText(towerResult.next_teller_action, "review_status"),
    final_for_teller: Boolean(towerResult.final_for_teller ?? false),
    vault_direct_access_allowed: false,
    raw_files_included: false,
    raw_links_included: false,
    safe_to_display_to_requester: Boolean(
      towerResult.safe_to_display_to_requester ?? true
    ),
    returned_at: normalizeText(towerResult.returned_at, nowIso()),
  });

  assertNoDirectVaultAccess(safeResult, "Sanitized Tower workflow result");

  return safeResult;
}

export function attachTowerWorkflowSafeResult(packet, towerResult = {}) {
  const safeResult = sanitizeTowerWorkflowResultForTeller({
    ...towerResult,
    request_id: towerResult.request_id || packet.request_id,
  });

  return Object.freeze({
    ...packet,
    status: safeResult.final_for_teller
      ? TELLER_TOWER_HANDOFF_STATUSES.CLOSED
      : TELLER_TOWER_HANDOFF_STATUSES.TOWER_RETURNED_SAFE_RESULT,
    tower_result_status: safeResult.status,
    final_workflow_safe_output: safeResult,
    updated_at: nowIso(),
    vault_direct_access_allowed: false,
  });
}

export function getTellerTowerHandoffReadiness() {
  return Object.freeze({
    pack_id: TELLER_TOWER_HANDOFF_PACK.pack_id,
    title: TELLER_TOWER_HANDOFF_PACK.title,
    teller_can_create_structured_request_packets: true,
    teller_sends_requests_to_tower: true,
    tower_approval_required: true,
    vault_direct_access_allowed: false,
    vault_answers_tower_only: true,
    direct_vault_browsing_prevented: true,
    direct_vault_preview_prevented: true,
    direct_vault_download_prevented: true,
    direct_vault_upload_prevented: true,
    raw_vault_links_prevented: true,
    workflow_safe_output_only: true,
    ready_for_next_corridor:
      "GP461-GP470 — Tower Vault Request Protocol Gate",
  });
}

export function buildTellerTowerRequestSummary(packet) {
  return Object.freeze({
    request_id: packet.request_id,
    workflow_type: packet.workflow_type,
    requester_role: packet.requester_role,
    requester_entity: packet.requester_entity,
    subject_person_or_vendor: packet.subject_person_or_vendor,
    document_or_proof_type: packet.document_or_proof_type,
    requested_output_type: packet.requested_output_type,
    sensitivity_level: packet.sensitivity_level,
    business_context: packet.business_context,
    status: packet.status,
    tower_approval_required: packet.tower_approval_required,
    vault_direct_access_allowed: packet.vault_direct_access_allowed,
    teller_workflow_receipt_hash: packet.teller_workflow_receipt_hash,
    safe_message: "Request prepared for Tower review. Teller has no direct Vault access.",
  });
}
