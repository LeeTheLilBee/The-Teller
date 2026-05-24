import { revealRequests, stepUpRequests, redactionRules } from "../data/payGuardSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function card(title, detail, meta = "", tone = "guarded") {
  return { title, detail, meta, tone };
}

export function getStepUpFlowSummary(entityKey) {
  const reveals = filterRecordsByEntity(revealRequests, entityKey);
  const stepUps = filterRecordsByEntity(stepUpRequests, entityKey);
  const redactions = filterRecordsByEntity(redactionRules, entityKey);

  const reasonRequired = stepUps.filter((item) => item.reasonRequired).length;
  const protectedReveals = reveals.filter((item) => ["Protected", "Pending"].includes(item.status)).length;
  const lockedRedactions = redactions.filter((item) => ["Locked", "Active"].includes(item.status)).length;

  return {
    reveals,
    stepUps,
    redactions,
    total: reveals.length + stepUps.length,
    reasonRequired,
    protectedReveals,
    lockedRedactions,
    revealCards: reveals.length
      ? reveals.map((item) =>
          card(
            item.title,
            `${item.fieldGroup} • ${item.status} • ${item.sensitivity}`,
            item.nextAction,
            item.sensitivity === "Recipient-sensitive" ? "blocked" : "guarded"
          )
        )
      : [card("No reveal requests", "No sensitive reveal requests are pending.", "Clear", "steady")],
    stepUpCards: stepUps.length
      ? stepUps.map((item) =>
          card(
            item.title,
            `${item.requestType} • ${item.status} • ${item.requiredRole}`,
            `${item.reasonRequired ? "Reason required." : "Reason optional."} ${item.nextAction}`,
            item.status === "Protected" ? "blocked" : "guarded"
          )
        )
      : [card("No step-up requests", "No step-up requests are pending.", "Clear", "steady")],
    redactionCards: redactions.length
      ? redactions.map((item) =>
          card(
            item.fieldGroup,
            `${item.defaultState} • ${item.status}`,
            `Reveal rule: ${item.revealRule}`,
            item.status === "Locked" ? "blocked" : "guarded"
          )
        )
      : [card("No redaction rules scoped", "Default masking remains active.", "Protected", "steady")],
  };
}

export function createStepUpMockRequest({ entity, drawer, reason }) {
  return {
    id: `stepup-mock-${Date.now()}`,
    entityKey: entity.key,
    entityLabel: entity.label,
    drawer,
    reason: reason.trim(),
    status: reason.trim() ? "Reason captured" : "Reason missing",
    createdAt: new Date().toISOString(),
  };
}
