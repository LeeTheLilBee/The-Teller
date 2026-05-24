import { proofPackets } from "../data/proofSeed.js";
import { proofRequirements, sealedPacketRules } from "../data/payProofSeed.js";
import { approvals } from "../data/approvalsSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function card(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getSealReadinessForPacket(packet) {
  const requirements = proofRequirements.filter((item) => item.entityKey === packet.entityKey);
  const rules = sealedPacketRules.filter((item) => item.entityKey === packet.entityKey);
  const pendingApprovals = approvals.filter((item) => item.entityKey === packet.entityKey && item.status === "Pending");

  const openRequirements = requirements.filter((item) => !["Complete", "Sealed"].includes(item.status));
  const lockedRules = rules.filter((item) => ["Locked", "Active"].includes(item.status));
  const blocked = packet.status === "Protected" || openRequirements.some((item) => ["Blocked", "Protected"].includes(item.status)) || pendingApprovals.length > 0;

  let readiness = "Ready for Review";
  if (packet.status === "Sealed") readiness = "Already Sealed";
  if (blocked) readiness = "Blocked Before Seal";
  if (!blocked && packet.status !== "Sealed") readiness = "Ready to Seal";

  return {
    packetId: packet.id,
    readiness,
    blocked,
    openRequirementCount: openRequirements.length,
    pendingApprovalCount: pendingApprovals.length,
    ruleCount: lockedRules.length,
    blockers: [
      ...openRequirements.map((item) => `${item.title}: ${item.status}`),
      ...pendingApprovals.map((item) => `${item.title}: approval pending`),
    ],
  };
}

export function getSealWorkflowSummary(entityKey) {
  const packets = filterRecordsByEntity(proofPackets, entityKey);
  const readinessRows = packets.map((packet) => ({
    packet,
    readiness: getSealReadinessForPacket(packet),
  }));

  const ready = readinessRows.filter((item) => item.readiness.readiness === "Ready to Seal").length;
  const blocked = readinessRows.filter((item) => item.readiness.blocked).length;
  const sealed = readinessRows.filter((item) => item.packet.status === "Sealed").length;

  return {
    packets,
    readinessRows,
    ready,
    blocked,
    sealed,
    total: packets.length,
    cards: readinessRows.length
      ? readinessRows.map(({ packet, readiness }) =>
          card(
            packet.title,
            `${packet.packetType} • ${packet.status} • ${readiness.readiness}`,
            readiness.blockers.length ? readiness.blockers.join(" | ") : `${packet.receiptCount} receipt(s) attached`,
            readiness.blocked ? "guarded" : "steady"
          )
        )
      : [card("No proof packets", "This company has no proof packets to seal.", "Ready for packet creation")],
  };
}
