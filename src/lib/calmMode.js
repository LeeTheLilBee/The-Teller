export function buildCalmModeSummary({
  entity,
  snapshot,
  paySkySummary,
  approvalSummary,
  documentRequestSummary,
  sealWorkflowSummary,
  stepUpFlowSummary,
}) {
  const priorities = [
    snapshot.nextAction,
    snapshot.nextDebtAction,
    approvalSummary.pending ? `${approvalSummary.pending} approval item(s) need review.` : null,
    documentRequestSummary.open ? `${documentRequestSummary.open} document request(s) are open.` : null,
    sealWorkflowSummary.blocked ? `${sealWorkflowSummary.blocked} proof packet(s) are blocked before seal.` : null,
    stepUpFlowSummary.reasonRequired ? `${stepUpFlowSummary.reasonRequired} step-up request(s) require a reason.` : null,
  ].filter(Boolean);

  const topThree = priorities.slice(0, 3);

  let mood = "Calm";
  if (paySkySummary.pressureCount >= 8) mood = "Needs Review";
  if (paySkySummary.pressureCount >= 14) mood = "High Pressure";

  return {
    entityLabel: entity.label,
    mood,
    pressureCount: paySkySummary.pressureCount,
    commandStatus: paySkySummary.commandStatus,
    topThree,
    quietLine:
      mood === "Calm"
        ? "No need to chase everything at once. The next actions are contained."
        : "The system found pressure, but it is grouped into a short action list.",
  };
}
