import { documents } from "../data/documentsSeed.js";
import { auditReceipts, proofPackets } from "../data/proofSeed.js";
import { exportRequests, proofRequirements, sealedPacketRules } from "../data/payProofSeed.js";
import { foundationDocs, givingPrograms } from "../data/tellerSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";
import { getSealReadinessForPacket } from "./proofSeal.js";

function makeDetailCard(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getProofPacketDetailSummary(entityKey) {
  const packets = filterRecordsByEntity(proofPackets, entityKey);
  const requirements = filterRecordsByEntity(proofRequirements, entityKey);
  const exports = filterRecordsByEntity(exportRequests, entityKey);
  const rules = filterRecordsByEntity(sealedPacketRules, entityKey);
  const docs = filterRecordsByEntity(documents, entityKey);
  const receipts = filterRecordsByEntity(auditReceipts, entityKey);
  const giving = filterRecordsByEntity(givingPrograms, entityKey);
  const foundation = entityKey === "world" || entityKey === "safehaven" ? foundationDocs : [];

  const packetCards = packets.length
    ? packets.map((packet) => {
        const readiness = getSealReadinessForPacket(packet);
        return makeDetailCard(
          packet.title,
          `${packet.packetType} • ${packet.status} • ${readiness.readiness}`,
          `${packet.receiptCount} receipt(s) • ${readiness.blockers.length ? readiness.blockers.join(" | ") : packet.nextAction}`,
          readiness.blocked ? "guarded" : "steady"
        );
      })
    : [makeDetailCard("No proof packets", "This company has no proof packets yet.", "Ready for packet creation")];

  const requirementCards = requirements.length
    ? requirements.map((item) =>
        makeDetailCard(
          item.title,
          `${item.requirementType} • ${item.status}`,
          `${item.requiredItems.length} required item(s): ${item.requiredItems.join(", ")}. ${item.nextAction}`,
          ["Blocked", "Protected"].includes(item.status) ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("No proof requirements", "This company has no scoped proof requirements.", "Clear")];

  const exportCards = exports.length
    ? exports.map((item) =>
        makeDetailCard(
          item.title,
          `${item.exportType} • ${item.status} • ${item.riskLevel}`,
          `${item.redactionStatus}. ${item.nextAction}`,
          ["High", "Recipient-sensitive"].includes(item.riskLevel) ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("No export requests", "This company has no proof export requests.", "Clear")];

  const documentCards = docs.length
    ? docs.map((item) =>
        makeDetailCard(
          item.title,
          `${item.documentType} • ${item.status} • ${item.sensitivity}`,
          item.nextAction,
          ["Sensitive", "Recipient-sensitive", "Restricted"].includes(item.sensitivity) ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("No proof documents", "This company has no documents in the proof lane.", "Ready for upload")];

  const foundationCards = foundation.length
    ? foundation.map((item) =>
        makeDetailCard(
          item.title,
          `${item.category} • ${item.status}`,
          "Foundation lane only. Sensitive records stay protected.",
          "guarded"
        )
      )
    : [makeDetailCard("Foundation records hidden", "Foundation documents only show from Simplee World or SimpleeSafeHaven.", "Protected")];

  const receiptCards = receipts.length
    ? receipts.map((item) =>
        makeDetailCard(
          item.title,
          `${item.actionType} • ${item.status}`,
          item.sensitivity,
          ["Medium", "Recipient-sensitive"].includes(item.sensitivity) ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("No audit receipts", "No proof audit receipts are scoped here yet.", "Quiet")];

  const givingCards = giving.length
    ? giving.map((item) =>
        makeDetailCard(
          item.program,
          `${item.entity} • ${item.budget} • ${item.status}`,
          item.nextAction || "Review giving proof.",
          item.status === "Proof needed" ? "watch" : "steady"
        )
      )
    : [makeDetailCard("No giving proof", "No giving proof lane is scoped here yet.", "Ready for setup")];

  const ruleCards = rules.length
    ? rules.map((item) =>
        makeDetailCard(
          item.title,
          item.status,
          item.detail,
          item.status === "Locked" ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("Default seal rules", "No custom seal rules are scoped here.", "Default packet rules apply")];

  const blockedPackets = packetCards.filter((item) => item.tone === "guarded").length;
  const protectedExports = exports.filter((item) => ["High", "Recipient-sensitive"].includes(item.riskLevel)).length;

  return {
    packets,
    requirements,
    exports,
    docs,
    foundation,
    receipts,
    giving,
    rules,
    totalPackets: packets.length,
    blockedPackets,
    protectedExports,
    receiptCount: receipts.length,
    packetCards,
    requirementCards,
    exportCards,
    documentCards,
    foundationCards,
    receiptCards,
    givingCards,
    ruleCards,
  };
}
