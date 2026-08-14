/*
 * GP451–GP460 fixtures.
 * These are local/demo examples of Teller workflow requests sent to Tower.
 * They intentionally contain no raw Vault links, no direct Vault paths,
 * and no preview/download URLs.
 */

import {
  createTellerTowerRequestPacket,
  createTellerToTowerHandoffEnvelope,
  createWaitingOnTowerStatus,
  attachTowerWorkflowSafeResult,
} from "./tellerTowerRequestHandoff.js";

export const tellerTowerRequestFixtureInputs = Object.freeze([
  {
    workflow_type: "payroll_proof_request",
    requester_role: "manager",
    requester_entity: "SimpleePay",
    subject_person_or_vendor: "Payroll Run — Demo Week",
    document_or_proof_type: "payroll_run_receipt",
    reason_for_request: "Manager needs workflow-safe payroll proof status for review.",
    deadline: "2026-08-21",
    sensitivity_level: "sensitive",
    requested_output_type: "receipt",
    business_context: "Simplee World / Payroll",
    workflow_notes: "No direct Vault access. Tower must decide.",
    requester_role_context: "manager_payroll_review",
    business_entity_context: "simplee_world",
    source_confidence: "owner_entered",
    freshness_state: "pending_confirmation",
  },
  {
    workflow_type: "onboarding_packet_request",
    requester_role: "manager",
    requester_entity: "SimpleePay",
    subject_person_or_vendor: "New Employee — Demo",
    document_or_proof_type: "onboarding_packet_status",
    reason_for_request: "Manager needs onboarding packet completion status.",
    deadline: "2026-08-22",
    sensitivity_level: "restricted",
    requested_output_type: "status",
    business_context: "SimpleePay / Employee Onboarding",
    workflow_notes: "Status only unless Tower approves more.",
    requester_role_context: "manager_onboarding_review",
    business_entity_context: "simpleepay",
    source_confidence: "owner_entered",
    freshness_state: "pending_confirmation",
  },
  {
    workflow_type: "vendor_document_request",
    requester_role: "owner",
    requester_entity: "Simplee World",
    subject_person_or_vendor: "Vendor — Demo Contractor",
    document_or_proof_type: "vendor_invoice_receipt",
    reason_for_request: "Owner needs workflow-safe vendor payment proof.",
    deadline: "2026-08-23",
    sensitivity_level: "owner_only",
    requested_output_type: "proof",
    business_context: "SimpleeOnTheGo / Vendor Payment",
    workflow_notes: "Owner-only request. Tower approval required.",
    requester_role_context: "owner_vendor_review",
    business_entity_context: "simpleeonthego",
    source_confidence: "vendor_provided",
    freshness_state: "needs_review",
  },
  {
    workflow_type: "rent_payment_receipt_request",
    requester_role: "tenant",
    requester_entity: "SimpleePay",
    subject_person_or_vendor: "Tenant Rent Payment — Demo Unit",
    document_or_proof_type: "rent_payment_receipt",
    reason_for_request: "Tenant needs workflow-safe rent payment receipt status.",
    deadline: "2026-08-24",
    sensitivity_level: "restricted",
    requested_output_type: "receipt",
    business_context: "The Grounds / Rent Payment",
    workflow_notes: "SimpleePay handles rent payment workflow. Tower gates access.",
    requester_role_context: "tenant_payment_portal",
    business_entity_context: "the_grounds",
    source_confidence: "pending_confirmation",
    freshness_state: "pending_confirmation",
  },
]);

export function buildDemoTellerTowerPackets() {
  return tellerTowerRequestFixtureInputs.map((input) =>
    createTellerTowerRequestPacket(input)
  );
}

export function buildDemoTellerTowerEnvelopes() {
  return buildDemoTellerTowerPackets().map((packet) =>
    createTellerToTowerHandoffEnvelope(packet)
  );
}

export function buildDemoWaitingOnTowerStatuses() {
  return buildDemoTellerTowerPackets().map((packet) =>
    createWaitingOnTowerStatus(packet)
  );
}

export function buildDemoTowerSafeReturn() {
  const [packet] = buildDemoTellerTowerPackets();

  return attachTowerWorkflowSafeResult(packet, {
    status: "tower_returned_safe_result",
    allowed_output_type: "receipt",
    display_status: "Tower returned workflow-safe receipt status",
    workflow_safe_summary:
      "Tower approved a workflow-safe receipt status. No raw Vault file or link is exposed.",
    workflow_safe_receipt_id: "safe_receipt_demo_001",
    redaction_applied: true,
    tower_decision_receipt_id: "tower_decision_demo_001",
    vault_proof_reference_safe_label: "Vault proof packet exists; access remains Tower-controlled.",
    next_teller_action: "show_safe_receipt_status",
    final_for_teller: true,
    safe_to_display_to_requester: true,
  });
}
