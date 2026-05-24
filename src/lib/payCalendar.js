import { approvals } from "../data/approvalsSeed.js";
import { documents } from "../data/documentsSeed.js";
import { payrollExceptions, payPeriods } from "../data/payrollSeed.js";
import { debtCatalog } from "../data/tellerSeed.js";
import { calendarItems } from "../data/tellerSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeCalendarItem(source, title, date, scope, status, detail) {
  return {
    source,
    title,
    date,
    scope,
    status,
    detail,
  };
}

export function buildCalendarItems(entityKey) {
  const baseItems = filterRecordsByEntity(calendarItems, entityKey).map((item) =>
    makeCalendarItem("Base", item.label, item.date, item.scope, "Scheduled", item.scope)
  );

  const payrollItems = filterRecordsByEntity(payPeriods, entityKey).flatMap((period) => [
    makeCalendarItem("Payroll", `${period.label} cutoff`, period.cutoffDate, period.entityKey, period.status, "Payroll cutoff date"),
    makeCalendarItem("Payroll", `${period.label} pay date`, period.payDate, period.entityKey, period.status, "Payroll pay date"),
  ]);

  const debtItems = filterRecordsByEntity(debtCatalog, entityKey).map((debt) =>
    makeCalendarItem("Debt", `${debt.entity} ${debt.type}`, debt.due, debt.entity, debt.status, `Balance ${debt.balance}`)
  );

  const docItems = filterRecordsByEntity(documents, entityKey)
    .filter((doc) => Boolean(doc.expiresOn))
    .map((doc) =>
      makeCalendarItem("Document", `${doc.title} expires/review`, doc.expiresOn, doc.entityKey, doc.status, doc.nextAction)
    );

  const approvalItems = filterRecordsByEntity(approvals, entityKey).map((approval) =>
    makeCalendarItem("Approval", approval.title, "Pending", approval.entityKey, approval.status, approval.nextAction)
  );

  const exceptionItems = filterRecordsByEntity(payrollExceptions, entityKey).map((exception) =>
    makeCalendarItem("Exception", exception.title, "Open", exception.entityKey, exception.status, exception.nextAction)
  );

  return [...baseItems, ...payrollItems, ...debtItems, ...docItems, ...approvalItems, ...exceptionItems];
}

export function getCalendarSummary(entityKey) {
  const items = buildCalendarItems(entityKey);
  const openItems = items.filter((item) => ["Pending", "Open", "Blocked", "Review"].includes(item.status)).length;
  const debtItems = items.filter((item) => item.source === "Debt").length;
  const payrollItems = items.filter((item) => item.source === "Payroll").length;
  const documentItems = items.filter((item) => item.source === "Document").length;

  return {
    items,
    total: items.length,
    openItems,
    debtItems,
    payrollItems,
    documentItems,
    cards: items.length
      ? items.map((item) => ({
          title: item.title,
          detail: `${item.source} • ${item.date} • ${item.status}`,
          meta: item.detail,
        }))
      : [
          {
            title: "No calendar items",
            detail: "This company has no scheduled deadlines in this lane.",
            meta: "Quiet",
          },
        ],
  };
}
