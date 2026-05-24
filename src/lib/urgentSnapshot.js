function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function makePill(label, value, tone = "steady") {
  return {
    label,
    value: safeNumber(value),
    tone,
  };
}

function makeAction(title, detail, tone = "steady") {
  return {
    title,
    detail,
    tone,
  };
}

export function buildUrgentSnapshot({
  entity,
  role,
  paySkySummary,
  approvalSummary,
  documentRequestSummary,
  sealWorkflowSummary,
  stepUpFlowSummary,
  payrollDetailSummary,
  moneyMovementDetailSummary,
  debtDetailSummary,
  givingDetailSummary,
  foundationLaneSummary,
  securityDetailSummary,
}) {
  const approvals = safeNumber(approvalSummary?.pending);
  const docs = safeNumber(documentRequestSummary?.open);
  const proofBlocked = safeNumber(sealWorkflowSummary?.blocked);
  const stepUps = safeNumber(stepUpFlowSummary?.reasonRequired);
  const payrollBlocked = safeNumber(payrollDetailSummary?.blocked);
  const moneyBlocked = safeNumber(moneyMovementDetailSummary?.blockedMovements);
  const debtPriority = safeNumber(debtDetailSummary?.highPriority);
  const givingProof = safeNumber(givingDetailSummary?.proofNeeded);
  const protectedAid = safeNumber(foundationLaneSummary?.protectedAid);
  const securityStepUps = safeNumber(securityDetailSummary?.pendingStepUps);
  const pressure = safeNumber(paySkySummary?.pressureCount);

  const urgentTotal =
    approvals +
    docs +
    proofBlocked +
    stepUps +
    payrollBlocked +
    moneyBlocked +
    debtPriority +
    givingProof +
    protectedAid +
    securityStepUps;

  const pills = [
    makePill("Urgent", urgentTotal, urgentTotal > 0 ? "guarded" : "steady"),
    makePill("Approvals", approvals, approvals > 0 ? "watch" : "steady"),
    makePill("Docs", docs, docs > 0 ? "watch" : "steady"),
    makePill("Protected", protectedAid + stepUps + securityStepUps, protectedAid + stepUps + securityStepUps > 0 ? "guarded" : "steady"),
    makePill("Proof", proofBlocked + givingProof, proofBlocked + givingProof > 0 ? "watch" : "steady"),
    makePill("Debt", debtPriority, debtPriority > 0 ? "watch" : "steady"),
  ];

  const actions = [
    approvals > 0 && makeAction("Review approvals", `${approvals} approval item(s) need attention.`, "watch"),
    docs > 0 && makeAction("Request missing documents", `${docs} document request(s) are open.`, "watch"),
    payrollBlocked > 0 && makeAction("Clear payroll blockers", `${payrollBlocked} payroll run(s) are blocked.`, "guarded"),
    proofBlocked > 0 && makeAction("Resolve proof blockers", `${proofBlocked} proof packet(s) cannot seal yet.`, "guarded"),
    stepUps + securityStepUps > 0 && makeAction("Handle step-up requests", `${stepUps + securityStepUps} sensitive action(s) need stronger review.`, "guarded"),
    moneyBlocked > 0 && makeAction("Review blocked money movement", `${moneyBlocked} movement(s) are blocked or protected.`, "guarded"),
    debtPriority > 0 && makeAction("Check debt priority", `${debtPriority} debt item(s) are high-priority.`, "watch"),
    givingProof > 0 && makeAction("Attach giving proof", `${givingProof} giving proof item(s) need support.`, "watch"),
  ].filter(Boolean);

  const headline =
    urgentTotal > 0
      ? `${entity?.label || "Current company"} has ${urgentTotal} item(s) needing attention.`
      : `${entity?.label || "Current company"} is calm right now.`;

  const subline =
    urgentTotal > 0
      ? "The Teller grouped the pressure points so you can handle the important things first."
      : "No major blockers are showing in the current command view.";

  return {
    entityLabel: entity?.label || "Current company",
    roleLabel: role?.label || "Current PayRole",
    commandStatus: paySkySummary?.commandStatus || "Command status ready",
    pressure,
    urgentTotal,
    headline,
    subline,
    pills,
    actions: actions.length
      ? actions.slice(0, 4)
      : [makeAction("No urgent action", "The workspace is clear enough to continue calmly.", "steady")],
  };
}
