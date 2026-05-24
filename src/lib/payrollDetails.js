import { approvals } from "../data/approvalsSeed.js";
import { fundingSources, payrollExceptions, payrollRuns, payPeriods } from "../data/payrollSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";
import { getPayrollRunReadiness } from "./payRun.js";

function makeDetailCard(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getPayrollDetailSummary(entityKey) {
  const runs = filterRecordsByEntity(payrollRuns, entityKey);

  const rows = runs.map((run) => {
    const readiness = getPayrollRunReadiness(run);
    const period = payPeriods.find((item) => item.id === run.payPeriodId);
    const funding = fundingSources.find((item) => item.entityKey === run.entityKey);
    const exceptions = payrollExceptions.filter((item) => item.payRunId === run.id);
    const runApprovals = approvals.filter((item) => item.entityKey === run.entityKey);

    return {
      run,
      readiness,
      period,
      funding,
      exceptions,
      approvals: runApprovals,
      tone: readiness.blockingExceptions.length > 0 ? "guarded" : "steady",
    };
  });

  const blocked = rows.filter((item) => item.readiness.blockingExceptions.length > 0).length;
  const ready = rows.filter((item) => item.readiness.canRelease).length;
  const exceptionCount = rows.reduce((total, item) => total + item.exceptions.length, 0);

  return {
    rows,
    total: rows.length,
    ready,
    blocked,
    exceptionCount,
    cards: rows.length
      ? rows.map(({ run, readiness, period, funding, exceptions, approvals, tone }) =>
          makeDetailCard(
            run.title,
            `${run.status} • ${readiness.readiness} • ${run.grossPay}`,
            `${period?.label || "No period"} • Funding ${funding?.status || "Unknown"} • ${exceptions.length} exception(s) • ${approvals.length} approval item(s)`,
            tone
          )
        )
      : [
          makeDetailCard(
            "No payroll runs yet",
            "This company has no payroll run records in this lane.",
            "Ready for first payroll draft."
          ),
        ],
  };
}
