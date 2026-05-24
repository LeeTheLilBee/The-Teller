import { securityDoors, stepUpRequests, redactionRules, deniedActions, revealRequests } from "../data/payGuardSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function makeCard(title, detail, meta = "") {
  return { title, detail, meta };
}

export function getScopedSecurityDoors(entityKey) {
  return filterRecordsByEntity(securityDoors, entityKey);
}

export function getScopedStepUpRequests(entityKey) {
  return filterRecordsByEntity(stepUpRequests, entityKey);
}

export function getScopedRedactionRules(entityKey) {
  return filterRecordsByEntity(redactionRules, entityKey);
}

export function getScopedDeniedActions(entityKey) {
  return filterRecordsByEntity(deniedActions, entityKey);
}

export function getScopedRevealRequests(entityKey) {
  return filterRecordsByEntity(revealRequests, entityKey);
}

export function getPayGuardSummary(entityKey) {
  const doors = getScopedSecurityDoors(entityKey);
  const stepUps = getScopedStepUpRequests(entityKey);
  const redactions = getScopedRedactionRules(entityKey);
  const denied = getScopedDeniedActions(entityKey);
  const reveals = getScopedRevealRequests(entityKey);

  const lockedDoors = doors.filter((item) => ["Locked", "Guarded"].includes(item.status)).length;
  const pendingStepUps = stepUps.filter((item) => item.status === "Pending").length;
  const activeRedactions = redactions.filter((item) => ["Active", "Locked"].includes(item.status)).length;
  const deniedCount = denied.length;

  return {
    doors,
    stepUps,
    redactions,
    denied,
    reveals,
    lockedDoors,
    pendingStepUps,
    activeRedactions,
    deniedCount,
    doorCards: doors.length
      ? doors.map((door) =>
          makeCard(door.title, `${door.doorType} • ${door.status}`, `${door.sensitivity} • ${door.nextAction}`)
        )
      : [makeCard("No doors scoped", "This company has no special security doors yet.", "Default security still applies")],
    stepUpCards: stepUps.length
      ? stepUps.map((request) =>
          makeCard(request.title, `${request.requestType} • ${request.status}`, request.nextAction)
        )
      : [makeCard("No step-up requests", "This company has no pending step-up requests.", "Clear")],
    redactionCards: redactions.length
      ? redactions.map((rule) =>
          makeCard(rule.fieldGroup, `${rule.defaultState} • ${rule.status}`, `Reveal rule: ${rule.revealRule}`)
        )
      : [makeCard("No redaction rules scoped", "This company has no custom redaction rules yet.", "Default masking applies")],
    deniedCards: denied.length
      ? denied.map((item) =>
          makeCard(item.attemptedAction, `${item.actorRole} • ${item.status}`, item.reason)
        )
      : [makeCard("No denied actions", "No denied actions recorded for this company.", "Quiet")],
    revealCards: reveals.length
      ? reveals.map((item) =>
          makeCard(item.title, `${item.fieldGroup} • ${item.status}`, item.nextAction)
        )
      : [makeCard("No reveal requests", "This company has no sensitive reveal requests pending.", "Clear")],
  };
}
