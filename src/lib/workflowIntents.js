import { describeIntentType } from "./intentTypes.js";

export function createWorkflowIntent({ action, entity, drawer, recordTitle, reason = "" }) {
  const now = new Date().toISOString();
  const intentType = describeIntentType(action.key);
  const cleanReason = String(reason || "").trim();

  return {
    id: `intent-${Date.now()}`,
    actionKey: action.key,
    actionLabel: action.label,
    intentTypeLabel: intentType.label,
    severity: intentType.severity,
    tone: intentType.tone,
    requiresReason: intentType.requiresReason,
    reason: cleanReason,
    backendReady: intentType.backendReady,
    entityKey: entity.key,
    entityLabel: entity.label,
    drawer,
    recordTitle: recordTitle || "Current drawer",
    status: cleanReason ? "Mock intent captured with reason" : "Mock intent captured",
    createdAt: now,
    detail: action.description,
  };
}

export function formatIntentTime(value) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return "just now";
  }
}
