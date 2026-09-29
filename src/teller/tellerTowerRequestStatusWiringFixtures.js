/*
 * GP471–GP480 Teller status wiring fixtures.
 * These are local-only demo objects. No Tower/Vault calls.
 */

import {
  buildDemoQueueItemWithSafeTowerResult,
  buildDemoTellerQueueItem,
  buildDemoWaitingQueueItem,
} from "./tellerTowerRequestQueueFixtures.js";

import {
  attachTowerSafeResultToQueueItem,
} from "./tellerTowerRequestQueue.js";

import {
  buildWorkflowSafeStatusCard,
  buildWorkflowSafeStatusList,
  buildWorkflowSafeStatusSummary,
} from "./tellerTowerRequestStatusWiring.js";

export function buildDemoNeedsOwnerApprovalItem() {
  const waiting = buildDemoWaitingQueueItem();

  return attachTowerSafeResultToQueueItem(waiting, {
    request_id: waiting.request_id,
    status: "owner_approval_required",
    display_status: "Owner/admin approval needed",
    workflow_safe_summary:
      "Tower requires owner/admin approval before this Teller workflow can continue.",
    workflow_safe_receipt_id: "tower-owner-needed-demo-471",
    tower_decision_receipt_id: "tower-decision-owner-needed-demo-471",
    vault_proof_reference_safe_label: "No Vault access has been granted to Teller.",
    redaction_applied: true,
    next_teller_action: "wait_for_owner_admin_approval",
    final_for_teller: false,
    safe_to_display_to_requester: true,
  });
}

export function buildDemoBlockedItem() {
  const waiting = buildDemoWaitingQueueItem();

  return attachTowerSafeResultToQueueItem(waiting, {
    request_id: waiting.request_id,
    status: "lane_mismatch",
    display_status: "Tower blocked this request",
    workflow_safe_summary:
      "Tower blocked the request because the business lane did not match the requester context.",
    workflow_safe_receipt_id: "tower-blocked-demo-471",
    tower_decision_receipt_id: "tower-decision-blocked-demo-471",
    vault_proof_reference_safe_label: "No Vault request was created.",
    redaction_applied: true,
    next_teller_action: "review_teller_business_context",
    final_for_teller: false,
    safe_to_display_to_requester: true,
  });
}

export function buildDemoStatusCards(viewerRole = "employee") {
  return [
    buildWorkflowSafeStatusCard(buildDemoTellerQueueItem(), viewerRole),
    buildWorkflowSafeStatusCard(buildDemoWaitingQueueItem(), viewerRole),
    buildWorkflowSafeStatusCard(buildDemoQueueItemWithSafeTowerResult(), viewerRole),
    buildWorkflowSafeStatusCard(buildDemoNeedsOwnerApprovalItem(), viewerRole),
    buildWorkflowSafeStatusCard(buildDemoBlockedItem(), viewerRole),
  ];
}

export function buildDemoStatusList(viewerRole = "employee") {
  return buildWorkflowSafeStatusList(
    [
      buildDemoTellerQueueItem(),
      buildDemoWaitingQueueItem(),
      buildDemoQueueItemWithSafeTowerResult(),
      buildDemoNeedsOwnerApprovalItem(),
      buildDemoBlockedItem(),
    ],
    viewerRole
  );
}

export function buildDemoStatusSummary(viewerRole = "employee") {
  return buildWorkflowSafeStatusSummary(
    [
      buildDemoTellerQueueItem(),
      buildDemoWaitingQueueItem(),
      buildDemoQueueItemWithSafeTowerResult(),
      buildDemoNeedsOwnerApprovalItem(),
      buildDemoBlockedItem(),
    ],
    viewerRole
  );
}
