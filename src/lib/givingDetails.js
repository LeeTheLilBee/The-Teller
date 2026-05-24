import { givingPrograms } from "../data/tellerSeed.js";
import { businessGivingBridge } from "../data/foundationLaneSeed.js";
import { givingDetailRecords, givingProofChecklist } from "../data/givingDetailSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function card(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getGivingDetailSummary(entityKey) {
  const basePrograms = filterRecordsByEntity(givingPrograms, entityKey);
  const details = filterRecordsByEntity(givingDetailRecords, entityKey);
  const proofs = filterRecordsByEntity(givingProofChecklist, entityKey);
  const bridges = entityKey === "world" ? businessGivingBridge : filterRecordsByEntity(businessGivingBridge, entityKey);

  const proofNeeded = [...details, ...proofs].filter((item) =>
    ["Proof needed", "Needed", "Protected review", "Protected"].includes(item.status)
  ).length;

  const protectedCount = [...details, ...proofs].filter((item) =>
    ["Protected review", "Protected"].includes(item.status)
  ).length;

  const totalBudget = details.reduce((sum, item) => {
    const number = Number(String(item.budget).replace(/[^0-9.-]/g, "")) || 0;
    return sum + number;
  }, 0);

  const detailCards = details.length
    ? details.map((item) =>
        card(
          item.program,
          `${item.givingType} • ${item.budget} budget • ${item.status}`,
          `${item.proofNeed}. ${item.nextAction}`,
          ["Proof needed", "Protected review"].includes(item.status) ? "guarded" : "steady"
        )
      )
    : [card("No giving detail records", "This company has no detailed giving record yet.", "Ready for giving setup")];

  const proofCards = proofs.length
    ? proofs.map((item) =>
        card(
          item.title,
          `${item.proofType} • ${item.status}`,
          "Attach this to PayProof before sealing the giving record.",
          ["Needed", "Protected"].includes(item.status) ? "watch" : "steady"
        )
      )
    : [card("No giving checklist items", "This company has no giving proof checklist yet.", "Clear")];

  const bridgeCards = bridges.length
    ? bridges.map((item) =>
        card(
          item.title,
          `${item.bridgeType} • ${item.status} • ${item.connectsTo}`,
          item.nextAction,
          item.status === "Proof needed" ? "watch" : "steady"
        )
      )
    : [card("No foundation bridge", "This company has no foundation bridge configured yet.", "Ready for setup")];

  const programCards = basePrograms.length
    ? basePrograms.map((item) =>
        card(
          item.program,
          `${item.entity} • ${item.budget} • ${item.status}`,
          item.nextAction || "Review program setup.",
          item.status === "Proof needed" ? "watch" : "steady"
        )
      )
    : [card("No giving program", "This company has no giving program record yet.", "Ready for setup")];

  return {
    basePrograms,
    details,
    proofs,
    bridges,
    proofNeeded,
    protectedCount,
    totalBudget,
    detailCards,
    proofCards,
    bridgeCards,
    programCards,
  };
}
