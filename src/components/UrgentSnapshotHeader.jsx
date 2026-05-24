export default function UrgentSnapshotHeader({ summary }) {
  return (
    <section className={summary.urgentTotal > 0 ? "urgent-snapshot-header active" : "urgent-snapshot-header calm"}>
      <div className="urgent-copy">
        <p className="eyebrow">Urgent Snapshot</p>
        <h2>{summary.headline}</h2>
        <span>{summary.subline}</span>
      </div>

      <div className="urgent-pill-row">
        {summary.pills.map((pill) => (
          <div className={`urgent-pill ${pill.tone}`} key={pill.label}>
            <span>{pill.label}</span>
            <strong>{pill.value}</strong>
          </div>
        ))}
      </div>

      <div className="urgent-action-row">
        {summary.actions.map((action) => (
          <article className={`urgent-action ${action.tone}`} key={action.title}>
            <strong>{action.title}</strong>
            <span>{action.detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
