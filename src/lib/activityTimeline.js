import { activitySeed } from "../data/activitySeed.js";
import { filterRecordsByEntity } from "./companyScope.js";
import { formatIntentTime } from "./workflowIntents.js";

export function buildActivityFromIntent(intent) {
  return {
    id: `activity-${intent.id}`,
    entityKey: intent.entityKey,
    title: `${intent.actionLabel} intent captured`,
    source: "Workflow Intent",
    detail: intent.detail,
    timestampLabel: formatIntentTime(intent.createdAt),
    tone: intent.actionKey === "escalate" || intent.actionKey === "stepUp" ? "guarded" : "steady",
  };
}

export function getActivityTimeline(entityKey, workflowIntents = []) {
  const seedItems = filterRecordsByEntity(activitySeed, entityKey);
  const intentItems = workflowIntents
    .filter((intent) => entityKey === "world" || intent.entityKey === entityKey)
    .map(buildActivityFromIntent);

  return [...intentItems, ...seedItems].slice(0, 12);
}

export function createLocalNote({ entity, drawer, text }) {
  return {
    id: `note-${Date.now()}`,
    entityKey: entity.key,
    entityLabel: entity.label,
    drawer,
    text,
    createdAt: new Date().toISOString(),
  };
}
