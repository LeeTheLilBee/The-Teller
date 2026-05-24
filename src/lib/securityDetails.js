import { deniedActions, redactionRules, revealRequests, securityDoors, stepUpRequests } from "../data/payGuardSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeDetailCard(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getSecurityDetailSummary(entityKey) {
  const doors = filterRecordsByEntity(securityDoors, entityKey);
  const stepUps = filterRecordsByEntity(stepUpRequests, entityKey);
  const redactions = filterRecordsByEntity(redactionRules, entityKey);
  const denied = filterRecordsByEntity(deniedActions, entityKey);
  const reveals = filterRecordsByEntity(revealRequests, entityKey);

  const guardedDoors = doors.filter((item) => ["Guarded", "Locked"].includes(item.status)).length;
  const pendingStepUps = stepUps.filter((item) => ["Pending", "Protected"].includes(item.status)).length;
  const activeRedactions = redactions.filter((item) => ["Active", "Locked"].includes(item.status)).length;
  const revealCount = reveals.length;
  const deniedCount = denied.length;

  const doorCards = doors.length
    ? doors.map((item) =>
        makeDetailCard(
          item.title,
          `${item.doorType} • ${item.status} • ${item.sensitivity}`,
          item.nextAction,
          ["Guarded", "Locked"].includes(item.status) ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("No special doors", "This company has no custom security doors.", "Default PayGuard rules apply")];

  const stepUpCards = stepUps.length
    ? stepUps.map((item) =>
        makeDetailCard(
          item.title,
          `${item.requestType} • ${item.status} • Required role: ${item.requiredRole}`,
          `${item.reasonRequired ? "Reason required." : "Reason optional."} ${item.nextAction}`,
          item.status === "Protected" ? "guarded" : "watch"
        )
      )
    : [makeDetailCard("No step-up requests", "No step-up requests are scoped here.", "Clear")];

  const redactionCards = redactions.length
    ? redactions.map((item) =>
        makeDetailCard(
          item.fieldGroup,
          `${item.defaultState} • ${item.status}`,
          `Reveal rule: ${item.revealRule}`,
          item.status === "Locked" ? "guarded" : "steady"
        )
      )
    : [makeDetailCard("No redaction rules", "Default masking applies.", "Protected by default")];

  const revealCards = reveals.length
    ? reveals.map((item) =>
        makeDetailCard(
          item.title,
          `${item.fieldGroup} • ${item.status} • ${item.sensitivity}`,
          item.nextAction,
          item.sensitivity === "Recipient-sensitive" ? "guarded" : "watch"
        )
      )
    : [makeDetailCard("No reveal requests", "No sensitive reveal requests are pending.", "Clear")];

  const deniedCards = denied.length
    ? denied.map((item) =>
        makeDetailCard(
          item.attemptedAction,
          `${item.actorRole} • ${item.status}`,
          item.reason,
          "guarded"
        )
      )
    : [makeDetailCard("No denied actions", "No denied actions are recorded for this company.", "Quiet")];

  return {
    doors,
    stepUps,
    redactions,
    denied,
    reveals,
    guardedDoors,
    pendingStepUps,
    activeRedactions,
    revealCount,
    deniedCount,
    doorCards,
    stepUpCards,
    redactionCards,
    revealCards,
    deniedCards,
  };
}
