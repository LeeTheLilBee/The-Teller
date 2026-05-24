import { documents } from "../data/documentsSeed.js";
import { auditReceipts, proofPackets } from "../data/proofSeed.js";
import { foundationDocs, givingPrograms } from "../data/tellerSeed.js";
import { exportRequests, proofRequirements, sealedPacketRules } from "../data/payProofSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeCard(title, detail, meta = "") {
  return { title, detail, meta };
}

export function getScopedProofPackets(entityKey) {
  return filterRecordsByEntity(proofPackets, entityKey);
}

export function getScopedAuditReceipts(entityKey) {
  return filterRecordsByEntity(auditReceipts, entityKey);
}

export function getScopedExportRequests(entityKey) {
  return filterRecordsByEntity(exportRequests, entityKey);
}

export function getScopedProofRequirements(entityKey) {
  return filterRecordsByEntity(proofRequirements, entityKey);
}

export function getScopedSealedPacketRules(entityKey) {
  return filterRecordsByEntity(sealedPacketRules, entityKey);
}

export function getScopedProofDocuments(entityKey) {
  return filterRecordsByEntity(documents, entityKey);
}

export function getScopedFoundationDocs(entityKey) {
  if (entityKey === "world" || entityKey === "safehaven") return foundationDocs;
  return [];
}

export function getScopedGivingProof(entityKey) {
  return filterRecordsByEntity(givingPrograms, entityKey);
}

export function getPayProofSummary(entityKey) {
  const packets = getScopedProofPackets(entityKey);
  const receipts = getScopedAuditReceipts(entityKey);
  const exports = getScopedExportRequests(entityKey);
  const requirements = getScopedProofRequirements(entityKey);
  const rules = getScopedSealedPacketRules(entityKey);
  const docs = getScopedProofDocuments(entityKey);
  const foundation = getScopedFoundationDocs(entityKey);
  const giving = getScopedGivingProof(entityKey);

  const protectedExports = exports.filter((item) => ["High", "Recipient-sensitive"].includes(item.riskLevel)).length;
  const openRequirements = requirements.filter((item) => item.status !== "Complete").length;
  const sealedPackets = packets.filter((item) => item.status === "Sealed").length;

  return {
    packets,
    receipts,
    exports,
    requirements,
    rules,
    docs,
    foundation,
    giving,
    totalPackets: packets.length,
    sealedPackets,
    protectedExports,
    openRequirements,
    packetCards: packets.length
      ? packets.map((packet) =>
          makeCard(packet.title, `${packet.packetType} • ${packet.status}`, `${packet.receiptCount} receipts`)
        )
      : [makeCard("No proof packets yet", "This company has no proof packets in this lane.", "Ready for packet creation")],
    requirementCards: requirements.length
      ? requirements.map((item) =>
          makeCard(item.title, `${item.requirementType} • ${item.status}`, item.nextAction)
        )
      : [makeCard("No proof requirements scoped", "This company has no active proof requirements.", "Clear")],
    exportCards: exports.length
      ? exports.map((item) =>
          makeCard(item.title, `${item.exportType} • ${item.status}`, `${item.redactionStatus} • ${item.nextAction}`)
        )
      : [makeCard("No export requests", "This company has no pending proof export requests.", "Clear")],
    ruleCards: rules.length
      ? rules.map((item) =>
          makeCard(item.title, item.status, item.detail)
        )
      : [makeCard("No seal rules scoped", "This company has no custom packet seal rules yet.", "Default rules active")],
    documentCards: docs.length
      ? docs.map((item) =>
          makeCard(item.title, `${item.documentType} • ${item.status}`, item.nextAction)
        )
      : [makeCard("No documents scoped", "This company has no document records in this lane.", "Ready for upload")],
    foundationCards: foundation.length
      ? foundation.map((item) =>
          makeCard(item.title, `${item.category} • ${item.status}`, "Foundation lane only")
        )
      : [makeCard("Foundation documents hidden", "Foundation documents are only visible from Simplee World or SimpleeSafeHaven.", "Protected")],
    givingCards: giving.length
      ? giving.map((item) =>
          makeCard(item.program, `${item.entity} • ${item.status}`, `Budget: ${item.budget}`)
        )
      : [makeCard("No giving proof scoped", "This company has no giving proof lane yet.", "Ready for setup")],
  };
}
