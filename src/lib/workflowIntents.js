export function createWorkflowIntent({ action, entity, drawer, recordTitle }) {
  const now = new Date().toISOString();

  return {
    id: `intent-${Date.now()}`,
    actionKey: action.key,
    actionLabel: action.label,
    entityKey: entity.key,
    entityLabel: entity.label,
    drawer,
    recordTitle: recordTitle || "Current drawer",
    status: "Mock intent captured",
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
