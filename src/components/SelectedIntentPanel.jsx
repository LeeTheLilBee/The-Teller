import { formatIntentTime } from "../lib/workflowIntents.js";

export default function SelectedIntentPanel({ latestIntent, intentCount }) {
  if (!latestIntent) {
    return (
      <section className="selected-intent-panel empty">
        <div>
          <p className="eyebrow">Action Preview</p>
          <h2>No workflow action selected yet.</h2>
          <p>Choose an action above to preview the safe mock workflow intent before we wire real backend actions.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`selected-intent-panel ${latestIntent.tone || ""}`}>
      <div className="selected-intent-main">
        <p className="eyebrow">Selected Workflow Intent</p>
        <h2>{latestIntent.actionLabel}</h2>
        <p>{latestIntent.detail}</p>
      </div>

      <div className="selected-intent-grid">
        <div>
          <span>Intent Type</span>
          <strong>{latestIntent.intentTypeLabel}</strong>
        </div>
        <div>
          <span>Severity</span>
          <strong>{latestIntent.severity}</strong>
        </div>
        <div>
          <span>Reason</span>
          <strong>{latestIntent.requiresReason ? "Required" : "Not required"}</strong>
        </div>
        <div>
          <span>Reason Captured</span>
          <strong>{latestIntent.reason ? "Yes" : "No"}</strong>
        </div>
        <div>
          <span>Backend</span>
          <strong>{latestIntent.backendReady ? "Ready" : "Mock only"}</strong>
        </div>
        <div>
          <span>Company</span>
          <strong>{latestIntent.entityLabel}</strong>
        </div>
        <div>
          <span>Drawer</span>
          <strong>{latestIntent.drawer}</strong>
        </div>
        <div>
          <span>Record</span>
          <strong>{latestIntent.recordTitle}</strong>
        </div>
        <div>
          <span>Captured</span>
          <strong>{formatIntentTime(latestIntent.createdAt)}</strong>
        </div>
      </div>

      {latestIntent.reason && (
        <div className="intent-reason-preview">
          <span>Captured Reason</span>
          <p>{latestIntent.reason}</p>
        </div>
      )}

      <div className="selected-intent-footer">
        <span>{intentCount} recent mock intent(s) held in local UI state</span>
        <strong>{latestIntent.status}</strong>
      </div>
    </section>
  );
}
