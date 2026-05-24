import { describeIntentType } from "./intentTypes.js";

export function buildActionConfirmation(action, entity, drawerContext) {
  const intentType = describeIntentType(action?.key);

  return {
    action,
    intentType,
    entityLabel: entity?.label || "Current company",
    drawerLabel: drawerContext?.label || "Current drawer",
    title: `Confirm ${action?.label || "Action"}`,
    detail: action?.description || "Confirm this mock workflow action before it is captured.",
    warning: intentType.requiresReason
      ? "This action requires a reason before it can be captured."
      : "This is still mock-only and safe to capture locally.",
    confirmLabel: `Capture ${action?.label || "Action"}`,
    cancelLabel: "Cancel",
    requiresReason: intentType.requiresReason,
    reasonPlaceholder: getReasonPlaceholder(action?.key),
  };
}

export function actionNeedsConfirmation(actionKey) {
  return ["approve", "resolve", "escalate", "sealPacket", "stepUp", "requestDocument"].includes(actionKey);
}

export function getReasonPlaceholder(actionKey) {
  const placeholders = {
    approve: "Example: Approval is needed because the record is complete and ready for review.",
    resolve: "Example: The issue is resolved because the missing document was received.",
    escalate: "Example: Escalating because this needs owner/admin review before moving forward.",
    sealPacket: "Example: Packet is ready to seal because required proof has been reviewed.",
    stepUp: "Example: Step-up requested because this reveals sensitive or protected information.",
    requestDocument: "Example: Requesting this document because it is required before clearance.",
  };

  return placeholders[actionKey] || "Type the reason for this action...";
}

export function validateConfirmationReason(confirmation, reason) {
  const cleanReason = String(reason || "").trim();

  if (!confirmation?.requiresReason) {
    return {
      ok: true,
      reason: cleanReason,
      message: "",
    };
  }

  if (cleanReason.length < 8) {
    return {
      ok: false,
      reason: cleanReason,
      message: "Add a short reason before capturing this action.",
    };
  }

  return {
    ok: true,
    reason: cleanReason,
    message: "",
  };
}
