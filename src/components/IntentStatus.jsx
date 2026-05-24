import { formatIntentTime } from "../lib/workflowIntents.js";

export default function IntentStatus({ latestIntent }) {
  if (!latestIntent) {
    return (
      <div className="intent-status muted">
        <span>No action selected yet</span>
        <strong>Choose an action to capture a safe mock intent.</strong>
      </div>
    );
  }

  return (
    <div className="intent-status">
      <span>{latestIntent.actionLabel} captured</span>
      <strong>{latestIntent.recordTitle}</strong>
      <small>
        {latestIntent.entityLabel} • {latestIntent.drawer} • {formatIntentTime(latestIntent.createdAt)}
      </small>
    </div>
  );
}
