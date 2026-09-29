/*
 * GP461–GP470 Teller queue fixtures.
 * These do not call Tower or Vault.
 */

import {
  createTellerTowerRequestPacket,
} from "./tellerTowerRequestHandoff.js";

import {
  attachTowerSafeResultToQueueItem,
  createTellerTowerQueueItem,
  createTellerTowerQueueSnapshot,
  markTellerQueueItemWaitingOnTower,
} from "./tellerTowerRequestQueue.js";

export function buildDemoTellerQueuePacket() {
  return createTellerTowerRequestPacket({
    workflow_type: "payment_receipt_request",
    requester_role: "manager",
    requester_entity: "SimpleePay",
    subject_person_or_vendor: "Demo Vendor",
    document_or_proof_type: "payment_receipt",
    reason_for_request: "Manager needs workflow-safe payment receipt status.",
    deadline: "2026-08-25",
    sensitivity_level: "sensitive",
    requested_output_type: "receipt",
    business_context: "SimpleePay / Vendor Payment",
    workflow_notes: "Teller creates request. Tower decides. Vault answers Tower only.",
    requester_role_context: "manager_payment_review",
    business_entity_context: "simpleepay",
    source_confidence: "owner_entered",
    freshness_state: "pending_confirmation",
  });
}

export function buildDemoTellerQueueItem() {
  const packet = buildDemoTellerQueuePacket();
  return createTellerTowerQueueItem(packet);
}

export function buildDemoWaitingQueueItem() {
  return markTellerQueueItemWaitingOnTower(buildDemoTellerQueueItem());
}

export function buildDemoQueueItemWithSafeTowerResult() {
  const waiting = buildDemoWaitingQueueItem();

  return attachTowerSafeResultToQueueItem(waiting, {
    request_id: waiting.request_id,
    status: "redacted",
    display_status: "Tower returned workflow-safe receipt status",
    workflow_safe_summary:
      "Tower approved a workflow-safe receipt status. No raw Vault file or link is exposed.",
    workflow_safe_receipt_id: "tower-safe-receipt-demo-461",
    tower_decision_receipt_id: "tower-decision-demo-461",
    vault_proof_reference_safe_label:
      "Vault proof exists; access remains Tower-controlled.",
    redaction_applied: true,
    next_teller_action: "continue_workflow_with_safe_status",
    final_for_teller: false,
    safe_to_display_to_requester: true,
  });
}

export function buildDemoTellerQueueSnapshot() {
  return createTellerTowerQueueSnapshot([
    buildDemoTellerQueueItem(),
    buildDemoWaitingQueueItem(),
    buildDemoQueueItemWithSafeTowerResult(),
  ]);
}
