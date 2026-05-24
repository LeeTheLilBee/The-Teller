export const workflowActions = {
  review: {
    key: "review",
    label: "Review",
    tone: "steady",
    description: "Open a focused review state for the selected item.",
  },
  approve: {
    key: "approve",
    label: "Approve",
    tone: "positive",
    description: "Mark this item as ready for approval flow. Backend approval comes later.",
  },
  requestDocument: {
    key: "requestDocument",
    label: "Request Doc",
    tone: "watch",
    description: "Create a document request intent for this worker or record.",
  },
  addNote: {
    key: "addNote",
    label: "Add Note",
    tone: "steady",
    description: "Attach an internal note intent to this item.",
  },
  resolve: {
    key: "resolve",
    label: "Resolve",
    tone: "positive",
    description: "Mark this item for resolution flow.",
  },
  escalate: {
    key: "escalate",
    label: "Escalate",
    tone: "guarded",
    description: "Send this item to owner/admin review.",
  },
  sealPacket: {
    key: "sealPacket",
    label: "Seal Packet",
    tone: "guarded",
    description: "Prepare a proof packet for sealing.",
  },
  stepUp: {
    key: "stepUp",
    label: "Step-Up",
    tone: "guarded",
    description: "Request stronger clearance before sensitive action.",
  },
};

export const drawerActionMap = {
  workerLanes: ["review", "requestDocument", "addNote", "escalate"],
  onboarding: ["review", "requestDocument", "addNote"],
  docs: ["review", "requestDocument", "addNote", "escalate"],
  issues: ["review", "resolve", "addNote", "escalate"],
  payRun: ["review", "approve", "addNote", "escalate"],
  exceptions: ["review", "resolve", "addNote", "escalate"],
  approvals: ["review", "approve", "addNote", "escalate"],
  cashFlow: ["review", "approve", "addNote", "escalate"],
  restricted: ["review", "stepUp", "addNote", "escalate"],
  proof: ["review", "sealPacket", "addNote", "escalate"],
  foundationDocs: ["review", "stepUp", "addNote", "escalate"],
  giving: ["review", "approve", "addNote"],
  doors: ["review", "stepUp", "addNote"],
  stepUp: ["review", "approve", "addNote", "escalate"],
  redaction: ["review", "stepUp", "addNote"],
  audit: ["review", "addNote"],
  calendar: ["review", "addNote"],
  rollup: ["review", "addNote"],
  debt: ["review", "addNote", "escalate"],
};

export function getActionsForDrawer(drawerKey) {
  const actionKeys = drawerActionMap[drawerKey] || ["review", "addNote"];
  return actionKeys.map((key) => workflowActions[key]).filter(Boolean);
}
