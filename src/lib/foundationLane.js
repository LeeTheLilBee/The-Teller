import { restrictedFunds } from "../data/payFlowSeed.js";
import { foundationDocs, givingPrograms } from "../data/tellerSeed.js";
import { businessGivingBridge, foundationAidPackets, foundationGovernanceItems } from "../data/foundationLaneSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function card(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getFoundationLaneSummary(entityKey) {
  const canViewFoundation = entityKey === "world" || entityKey === "safehaven";
  const aidPackets = canViewFoundation ? foundationAidPackets : [];
  const governance = canViewFoundation ? foundationGovernanceItems : [];
  const funds = canViewFoundation ? restrictedFunds : [];
  const docs = canViewFoundation ? foundationDocs : [];
  const giving = filterRecordsByEntity(givingPrograms, entityKey);
  const bridges = entityKey === "world" ? businessGivingBridge : filterRecordsByEntity(businessGivingBridge, entityKey);

  const protectedAid = aidPackets.filter((item) => ["Recipient-sensitive", "Protected"].includes(item.sensitivity)).length;
  const restrictedCount = funds.filter((item) => item.status === "Restricted").length;
  const proofNeeded = [...aidPackets, ...bridges].filter((item) => item.status === "Proof needed").length;

  return {
    canViewFoundation,
    aidPackets,
    governance,
    funds,
    docs,
    giving,
    bridges,
    protectedAid,
    restrictedCount,
    proofNeeded,
    aidCards: aidPackets.length
      ? aidPackets.map((item) =>
          card(
            item.title,
            `${item.aidType} • ${item.status} • ${item.sensitivity}`,
            `${item.restrictedFund}. ${item.nextAction}`,
            "guarded"
          )
        )
      : [
          card(
            "Foundation aid packets hidden",
            "Aid packets only show from Simplee World or SimpleeSafeHaven.",
            "Recipient-sensitive by default.",
            "guarded"
          ),
        ],
    governanceCards: governance.length
      ? governance.map((item) =>
          card(
            item.title,
            `${item.itemType} • ${item.status} • ${item.sensitivity}`,
            item.nextAction,
            "guarded"
          )
        )
      : [
          card(
            "Foundation governance hidden",
            "Governance records only show from Simplee World or SimpleeSafeHaven.",
            "Protected lane.",
            "guarded"
          ),
        ],
    fundCards: funds.length
      ? funds.map((item) =>
          card(
            item.label,
            `${item.restrictionType} • ${item.amount} • ${item.status}`,
            item.nextAction,
            "guarded"
          )
        )
      : [
          card(
            "No restricted funds visible",
            "Restricted funds only show in parent or foundation view.",
            "Protected lane.",
            "guarded"
          ),
        ],
    bridgeCards: bridges.length
      ? bridges.map((item) =>
          card(
            item.title,
            `${item.bridgeType} • Connects to ${item.connectsTo} • ${item.status}`,
            item.nextAction,
            item.status === "Proof needed" ? "watch" : "steady"
          )
        )
      : [
          card(
            "No giving bridge scoped",
            "This company does not have a foundation bridge configured yet.",
            "Ready for giving bridge setup."
          ),
        ],
    givingCards: giving.length
      ? giving.map((item) =>
          card(
            item.program,
            `${item.entity} • ${item.budget} • ${item.status}`,
            item.nextAction || "Review giving connection.",
            item.status === "Proof needed" ? "watch" : "steady"
          )
        )
      : [
          card(
            "No giving program scoped",
            "This company has no giving program in this lane yet.",
            "Ready for setup."
          ),
        ],
  };
}
