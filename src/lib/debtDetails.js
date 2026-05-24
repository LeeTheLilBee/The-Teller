import { debtCatalog } from "../data/tellerSeed.js";
import { debtDetailRecords, debtPaymentHistory } from "../data/debtDetailSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function card(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getDebtDetailSummary(entityKey) {
  const catalog = filterRecordsByEntity(debtCatalog, entityKey);
  const details = filterRecordsByEntity(debtDetailRecords, entityKey);
  const payments = filterRecordsByEntity(debtPaymentHistory, entityKey);

  const totalBalance = details.reduce((sum, item) => {
    const number = Number(String(item.balance).replace(/[^0-9.-]/g, "")) || 0;
    return sum + number;
  }, 0);

  const highPriority = details.filter((item) => item.priorityScore >= 75).length;
  const watchCount = details.filter((item) => ["Watch", "Review", "Planning"].includes(item.status)).length;
  const proofNeeded = payments.filter((item) => ["Needs receipt", "Invoice needed"].includes(item.proofStatus)).length;

  const detailCards = details.length
    ? details.map((item) =>
        card(
          item.lender,
          `${item.debtType} • ${item.balance} • Due ${item.dueDate}`,
          `Priority ${item.priorityScore}. ${item.nextAction}`,
          item.priorityScore >= 75 ? "guarded" : item.status === "Planning" ? "watch" : "steady"
        )
      )
    : [card("No debt detail records", "No debt detail records are scoped here.", "Ready for debt setup")];

  const paymentCards = payments.length
    ? payments.map((item) =>
        card(
          item.title,
          `${item.amount} • ${item.status}`,
          item.proofStatus,
          ["Needs receipt", "Invoice needed"].includes(item.proofStatus) ? "watch" : "steady"
        )
      )
    : [card("No payment history", "No debt payment records are scoped here.", "Quiet")];

  const catalogCards = catalog.length
    ? catalog.map((item) =>
        card(
          `${item.entity} ${item.type}`,
          `${item.balance} • Due ${item.due} • ${item.status}`,
          item.nextAction || "Review debt catalog.",
          ["Watch", "Review", "Planning"].includes(item.status) ? "watch" : "steady"
        )
      )
    : [card("No catalog debt", "No debt catalog record is scoped here.", "Clear")];

  return {
    catalog,
    details,
    payments,
    totalBalance,
    highPriority,
    watchCount,
    proofNeeded,
    detailCards,
    paymentCards,
    catalogCards,
  };
}
