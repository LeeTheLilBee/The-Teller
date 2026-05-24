export const intentTypes = {
  review: {
    label: "Review Intent",
    severity: "Low",
    requiresReason: false,
    backendReady: false,
  },
  approve: {
    label: "Approval Intent",
    severity: "Medium",
    requiresReason: true,
    backendReady: false,
  },
  requestDocument: {
    label: "Document Request Intent",
    severity: "Medium",
    requiresReason: false,
    backendReady: false,
  },
  addNote: {
    label: "Note Intent",
    severity: "Low",
    requiresReason: false,
    backendReady: false,
  },
  resolve: {
    label: "Resolution Intent",
    severity: "Medium",
    requiresReason: true,
    backendReady: false,
  },
  escalate: {
    label: "Escalation Intent",
    severity: "High",
    requiresReason: true,
    backendReady: false,
  },
  sealPacket: {
    label: "Seal Packet Intent",
    severity: "High",
    requiresReason: true,
    backendReady: false,
  },
  stepUp: {
    label: "Step-Up Intent",
    severity: "Protected",
    requiresReason: true,
    backendReady: false,
  },
};

export function getIntentType(actionKey) {
  return intentTypes[actionKey] || intentTypes.review;
}

export function getIntentTone(intentType) {
  if (intentType.severity === "Protected") return "blocked";
  if (intentType.severity === "High") return "guarded";
  if (intentType.severity === "Medium") return "watch";
  return "steady";
}

export function describeIntentType(actionKey) {
  const type = getIntentType(actionKey);
  return {
    ...type,
    tone: getIntentTone(type),
  };
}
