import { getPayFlowSummary } from "./payFlow.js";
import { getPayGuardSummary } from "./payGuard.js";
import { getPayOnboardSummary } from "./payOnboard.js";
import { getPayProofSummary } from "./payProof.js";
import { getPayRunSummary } from "./payRun.js";

function commandCard(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getPaySkySummary(entityKey, snapshot) {
  const onboard = getPayOnboardSummary(entityKey);
  const payroll = getPayRunSummary(entityKey);
  const money = getPayFlowSummary(entityKey);
  const proof = getPayProofSummary(entityKey);
  const guard = getPayGuardSummary(entityKey);

  const pressureCount =
    onboard.needsDocs +
    onboard.openIssues +
    payroll.blockedRuns +
    payroll.openExceptions +
    money.blockedMovements +
    money.debtWatch +
    proof.openRequirements +
    proof.protectedExports +
    guard.pendingStepUps +
    guard.deniedCount;

  let commandStatus = "Steady";
  if (pressureCount >= 8) commandStatus = "Needs Attention";
  if (pressureCount >= 14) commandStatus = "High Pressure";

  const cards = [
    commandCard(
      "People readiness",
      `${onboard.cleared}/${onboard.total} cleared`,
      onboard.needsDocs || onboard.openIssues ? `${onboard.needsDocs} doc block(s), ${onboard.openIssues} issue(s)` : "Worker lanes are calm",
      onboard.needsDocs || onboard.openIssues ? "watch" : "steady"
    ),
    commandCard(
      "Payroll readiness",
      `${payroll.readyRuns}/${payroll.totalRuns} run(s) ready`,
      payroll.openExceptions ? `${payroll.openExceptions} payroll exception(s)` : "No payroll exceptions",
      payroll.blockedRuns ? "blocked" : "steady"
    ),
    commandCard(
      "Money pressure",
      `${money.movementCount} movement(s) tracked`,
      money.blockedMovements || money.debtWatch ? `${money.blockedMovements} blocked, ${money.debtWatch} debt watch` : "Cash movement is controlled",
      money.blockedMovements || money.debtWatch ? "watch" : "steady"
    ),
    commandCard(
      "Proof readiness",
      `${proof.totalPackets} proof packet(s)`,
      proof.openRequirements || proof.protectedExports ? `${proof.openRequirements} proof need(s), ${proof.protectedExports} protected export(s)` : "Proof lanes are quiet",
      proof.protectedExports ? "guarded" : "steady"
    ),
    commandCard(
      "Security posture",
      `${guard.lockedDoors} guarded door(s)`,
      guard.pendingStepUps || guard.deniedCount ? `${guard.pendingStepUps} step-up(s), ${guard.deniedCount} denied action(s)` : "No active security friction",
      guard.pendingStepUps || guard.deniedCount ? "guarded" : "steady"
    ),
    commandCard(
      "Account snapshot",
      `${snapshot.balance} available`,
      `Payroll ${snapshot.payrollDue} • Debt ${snapshot.debt} • Reserve ${snapshot.reserve}`,
      "steady"
    ),
  ];

  const topActions = [
    snapshot.nextAction,
    snapshot.nextDebtAction,
    payroll.openExceptions ? "Clear payroll exceptions before release." : null,
    proof.protectedExports ? "Review protected export requests before release." : null,
    guard.pendingStepUps ? "Resolve pending step-up requests." : null,
    money.blockedMovements ? "Review blocked money movements." : null,
  ].filter(Boolean);

  return {
    commandStatus,
    pressureCount,
    cards,
    topActions,
  };
}
