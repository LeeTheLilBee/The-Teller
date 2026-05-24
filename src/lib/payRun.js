import { approvals } from "../data/approvalsSeed.js";
import { fundingSources, payrollExceptions, payrollRuns, payPeriods } from "../data/payrollSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeCard(title, detail, meta = "") {
  return { title, detail, meta };
}

export function getScopedPayRuns(entityKey) {
  return filterRecordsByEntity(payrollRuns, entityKey);
}

export function getScopedPayrollExceptions(entityKey) {
  return filterRecordsByEntity(payrollExceptions, entityKey);
}

export function getScopedFundingSources(entityKey) {
  return filterRecordsByEntity(fundingSources, entityKey);
}

export function getScopedPayPeriods(entityKey) {
  return filterRecordsByEntity(payPeriods, entityKey);
}

export function getPayrollRunExceptions(payRunId) {
  return payrollExceptions.filter((exception) => exception.payRunId === payRunId);
}

export function getPayrollRunPeriod(payRun) {
  return payPeriods.find((period) => period.id === payRun.payPeriodId) || null;
}

export function getPayrollRunReadiness(payRun) {
  const exceptions = getPayrollRunExceptions(payRun.id);
  const blockingExceptions = exceptions.filter((exception) => exception.blocksRelease && exception.status !== "Resolved");
  const period = getPayrollRunPeriod(payRun);
  const funding = fundingSources.find((source) => source.entityKey === payRun.entityKey) || null;
  const runApprovals = approvals.filter((approval) => approval.entityKey === payRun.entityKey);

  const fundingReady = ["Verified", "Restricted"].includes(funding?.status);
  const approvalsPending = runApprovals.filter((approval) => approval.status === "Pending");
  const canRelease = blockingExceptions.length === 0 && fundingReady && approvalsPending.length === 0;

  let readiness = "Needs Review";
  if (canRelease) readiness = "Ready to Release";
  if (blockingExceptions.length > 0) readiness = "Blocked";
  if (!fundingReady) readiness = "Funding Watch";

  return {
    payRunId: payRun.id,
    readiness,
    canRelease,
    period,
    funding,
    exceptions,
    blockingExceptions,
    approvalsPending,
    fundingReady,
  };
}

export function getPayRunSummary(entityKey) {
  const runs = getScopedPayRuns(entityKey);
  const exceptions = getScopedPayrollExceptions(entityKey);
  const funding = getScopedFundingSources(entityKey);
  const periods = getScopedPayPeriods(entityKey);

  const readinessRows = runs.map((run) => ({
    run,
    readiness: getPayrollRunReadiness(run),
  }));

  const blockedRuns = readinessRows.filter((item) => item.readiness.readiness === "Blocked").length;
  const readyRuns = readinessRows.filter((item) => item.readiness.canRelease).length;
  const openExceptions = exceptions.filter((exception) => exception.status !== "Resolved").length;

  return {
    runs,
    readinessRows,
    exceptions,
    funding,
    periods,
    totalRuns: runs.length,
    readyRuns,
    blockedRuns,
    openExceptions,
    exceptionCards: exceptions.length
      ? exceptions.map((exception) =>
          makeCard(exception.title, `${exception.exceptionType} • ${exception.status}`, exception.nextAction)
        )
      : [makeCard("No payroll exceptions", "This company has no payroll exceptions in this lane.", "Clear")],
    fundingCards: funding.length
      ? funding.map((source) =>
          makeCard(source.label, `${source.status} • ${source.maskedAccount}`, `Available: ${source.availableForPayroll}`)
        )
      : [makeCard("No funding source scoped", "This company has no funding source attached yet.", "Setup needed")],
  };
}
