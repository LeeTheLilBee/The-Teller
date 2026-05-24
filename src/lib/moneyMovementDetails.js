import { debtCatalog, givingPrograms } from "../data/tellerSeed.js";
import { cashMovementRules, moneyMovements, reserveBuckets, restrictedFunds } from "../data/payFlowSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeDetailCard(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getMoneyMovementDetailSummary(entityKey) {
  const movements = filterRecordsByEntity(moneyMovements, entityKey);
  const reserves = filterRecordsByEntity(reserveBuckets, entityKey);
  const rules = filterRecordsByEntity(cashMovementRules, entityKey);
  const debts = filterRecordsByEntity(debtCatalog, entityKey);
  const giving = filterRecordsByEntity(givingPrograms, entityKey);
  const restricted = entityKey === "world" || entityKey === "safehaven" ? restrictedFunds : [];

  const blockedMovements = movements.filter((item) => ["Blocked", "Protected review"].includes(item.status)).length;
  const watchReserves = reserves.filter((item) => ["Watch", "Restricted"].includes(item.status)).length;
  const debtWatch = debts.filter((item) => ["Watch", "Review", "Planning"].includes(item.status)).length;

  const movementCards = movements.length
    ? movements.map((item) =>
        makeDetailCard(
          item.title,
          `${item.movementType} • ${item.amount} • ${item.status}`,
          item.nextAction,
          ["Blocked", "Protected review"].includes(item.status) ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("No active money movements", "This company has no active movement records.", "Quiet")];

  const reserveCards = reserves.length
    ? reserves.map((item) =>
        makeDetailCard(
          item.label,
          `${item.current} of ${item.target} • ${item.status}`,
          item.purpose,
          ["Watch", "Restricted"].includes(item.status) ? "watch" : "steady"
        )
      )
    : [makeDetailCard("No reserve bucket", "This company has no reserve bucket scoped yet.", "Ready for reserve setup")];

  const debtCards = debts.length
    ? debts.map((item) =>
        makeDetailCard(
          `${item.entity} ${item.type}`,
          `${item.balance} • Due ${item.due} • ${item.status}`,
          item.nextAction || "Review debt catalog details.",
          ["Watch", "Review", "Planning"].includes(item.status) ? "watch" : "steady"
        )
      )
    : [makeDetailCard("No debt catalogued", "This company has no debt record in this lane.", "Clear")];

  const givingCards = giving.length
    ? giving.map((item) =>
        makeDetailCard(
          item.program,
          `${item.entity} • ${item.budget} • ${item.status}`,
          item.nextAction || "Review giving proof and budget alignment.",
          item.status === "Proof needed" ? "watch" : "steady"
        )
      )
    : [makeDetailCard("No giving lane scoped", "This company has no giving program record yet.", "Ready for setup")];

  const restrictedCards = restricted.length
    ? restricted.map((item) =>
        makeDetailCard(
          item.label,
          `${item.restrictionType} • ${item.amount} • ${item.status}`,
          item.nextAction,
          "guarded"
        )
      )
    : [makeDetailCard("No restricted funds visible", "Restricted funds show from Simplee World or SimpleeSafeHaven.", "Protected")];

  const ruleCards = rules.length
    ? rules.map((item) =>
        makeDetailCard(
          item.label,
          `${item.ruleType} • ${item.status}`,
          item.detail,
          item.status === "Locked" ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("No movement rules", "This company has no custom movement rules yet.", "Default rules apply")];

  return {
    movements,
    reserves,
    rules,
    debts,
    giving,
    restricted,
    movementCount: movements.length,
    blockedMovements,
    watchReserves,
    debtWatch,
    movementCards,
    reserveCards,
    debtCards,
    givingCards,
    restrictedCards,
    ruleCards,
  };
}
