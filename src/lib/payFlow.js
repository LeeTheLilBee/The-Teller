import { debtCatalog, givingPrograms } from "../data/tellerSeed.js";
import { reserveBuckets, restrictedFunds, cashMovementRules, moneyMovements } from "../data/payFlowSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeCard(title, detail, meta = "") {
  return { title, detail, meta };
}

export function getScopedReserves(entityKey) {
  return filterRecordsByEntity(reserveBuckets, entityKey);
}

export function getScopedRestrictedFunds(entityKey) {
  if (entityKey === "world" || entityKey === "safehaven") return restrictedFunds;
  return [];
}

export function getScopedMoneyRules(entityKey) {
  return filterRecordsByEntity(cashMovementRules, entityKey);
}

export function getScopedMoneyMovements(entityKey) {
  return filterRecordsByEntity(moneyMovements, entityKey);
}

export function getScopedDebts(entityKey) {
  return filterRecordsByEntity(debtCatalog, entityKey);
}

export function getScopedGiving(entityKey) {
  return filterRecordsByEntity(givingPrograms, entityKey);
}

export function getPayFlowSummary(entityKey) {
  const reserves = getScopedReserves(entityKey);
  const restricted = getScopedRestrictedFunds(entityKey);
  const rules = getScopedMoneyRules(entityKey);
  const movements = getScopedMoneyMovements(entityKey);
  const debts = getScopedDebts(entityKey);
  const giving = getScopedGiving(entityKey);

  const blockedMovements = movements.filter((movement) => ["Blocked", "Protected review"].includes(movement.status)).length;
  const watchReserves = reserves.filter((reserve) => ["Watch", "Restricted"].includes(reserve.status)).length;
  const debtWatch = debts.filter((debt) => ["Watch", "Review", "Planning"].includes(debt.status)).length;

  return {
    reserves,
    restricted,
    rules,
    movements,
    debts,
    giving,
    movementCount: movements.length,
    blockedMovements,
    watchReserves,
    debtWatch,
    reserveCards: reserves.length
      ? reserves.map((reserve) =>
          makeCard(reserve.label, `${reserve.status} • ${reserve.current} of ${reserve.target}`, reserve.purpose)
        )
      : [makeCard("No reserve bucket scoped", "This company does not have a reserve bucket yet.", "Ready for reserve setup")],
    movementCards: movements.length
      ? movements.map((movement) =>
          makeCard(movement.title, `${movement.movementType} • ${movement.amount} • ${movement.status}`, movement.nextAction)
        )
      : [makeCard("No money movement pending", "This company has no active money movement records.", "Quiet")],
    ruleCards: rules.length
      ? rules.map((rule) =>
          makeCard(rule.label, `${rule.ruleType} • ${rule.status}`, rule.detail)
        )
      : [makeCard("No money movement rules yet", "This company has no scoped movement rules.", "Ready for setup")],
    restrictedCards: restricted.length
      ? restricted.map((fund) =>
          makeCard(fund.label, `${fund.restrictionType} • ${fund.amount} • ${fund.status}`, fund.nextAction)
        )
      : [makeCard("No restricted funds visible", "Restricted funds are only visible from Simplee World or SimpleeSafeHaven.", "Protected")],
  };
}
