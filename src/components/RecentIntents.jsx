import { formatIntentTime } from "../lib/workflowIntents.js";

export default function RecentIntents({ intents }) {
  if (!intents?.length) return null;

  return (
    <section className="recent-intents">
      <p className="eyebrow">Recent Actions</p>
      <div>
        {intents.slice(0, 4).map((intent) => (
          <article className={intent.tone || ""} key={intent.id}>
            <strong>{intent.actionLabel}</strong>
            <span>{intent.intentTypeLabel} • {intent.severity}</span>
            <small>{intent.entityLabel} • {intent.drawer} • {formatIntentTime(intent.createdAt)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
