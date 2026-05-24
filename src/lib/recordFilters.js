import { approvals } from "../data/approvalsSeed.js";
import { documents } from "../data/documentsSeed.js";
import { issues } from "../data/issuesSeed.js";
import { auditReceipts, proofPackets } from "../data/proofSeed.js";
import { onboardingTracks, workers } from "../data/workersSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeSummaryCard(title, detail, meta = "") {
  return {
    title,
    detail,
    meta,
  };
}

export function getScopedWorkers(entityKey) {
  return filterRecordsByEntity(workers, entityKey);
}

export function getScopedDocuments(entityKey) {
  return filterRecordsByEntity(documents, entityKey);
}

export function getScopedApprovals(entityKey) {
  return filterRecordsByEntity(approvals, entityKey);
}

export function getScopedProofPackets(entityKey) {
  return filterRecordsByEntity(proofPackets, entityKey);
}

export function getScopedIssues(entityKey) {
  return filterRecordsByEntity(issues, entityKey);
}

export function getScopedAuditReceipts(entityKey) {
  return filterRecordsByEntity(auditReceipts, entityKey);
}

export function buildModelSummaries(entityKey) {
  const scopedWorkers = getScopedWorkers(entityKey);
  const scopedDocuments = getScopedDocuments(entityKey);
  const scopedApprovals = getScopedApprovals(entityKey);
  const scopedProofPackets = getScopedProofPackets(entityKey);
  const scopedIssues = getScopedIssues(entityKey);
  const scopedAuditReceipts = getScopedAuditReceipts(entityKey);

  return {
    workerLanes: scopedWorkers.length
      ? scopedWorkers.map((worker) =>
          makeSummaryCard(worker.displayName, `${worker.status} • ${worker.clearanceStatus}`, worker.nextAction)
        )
      : [makeSummaryCard("No workers in this lane", "This company has no scoped worker records yet.", "Ready for setup")],

    onboarding: onboardingTracks.map((track) =>
      makeSummaryCard(track.title, track.steps.join(" → "), `${track.steps.length} steps`)
    ),

    docs: scopedDocuments.length
      ? scopedDocuments.map((document) =>
          makeSummaryCard(document.title, `${document.documentType} • ${document.status}`, document.nextAction)
        )
      : [makeSummaryCard("No documents in this lane", "This company has no scoped document records yet.", "Ready for upload")],

    approvals: scopedApprovals.length
      ? scopedApprovals.map((approval) =>
          makeSummaryCard(approval.title, `${approval.approvalType} • ${approval.status}`, approval.nextAction)
        )
      : [makeSummaryCard("No approvals pending", "This company has no active approval records.", "Clear")],

    proof: scopedProofPackets.length
      ? scopedProofPackets.map((packet) =>
          makeSummaryCard(packet.title, `${packet.packetType} • ${packet.status}`, `${packet.receiptCount} receipts`)
        )
      : [makeSummaryCard("No proof packets yet", "This company has no proof packets in this lane.", "Ready for packet creation")],

    issues: scopedIssues.length
      ? scopedIssues.map((issue) =>
          makeSummaryCard(issue.title, `${issue.issueType} • ${issue.status}`, issue.nextAction)
        )
      : [makeSummaryCard("No open issues", "This company has no active worker issue records.", "Clear")],

    audit: scopedAuditReceipts.length
      ? scopedAuditReceipts.map((receipt) =>
          makeSummaryCard(receipt.title, `${receipt.actionType} • ${receipt.status}`, receipt.sensitivity)
        )
      : [makeSummaryCard("No audit receipts yet", "This company has no audit receipts in this lane.", "Quiet")],
  };
}
