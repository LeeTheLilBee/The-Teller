export default function ActivityTimeline({ items }) {
  return (
    <section className="activity-panel">
      <div className="notes-header">
        <div>
          <p className="eyebrow">Activity Timeline</p>
          <h2>Recent system movement</h2>
        </div>
      </div>

      <div className="activity-list">
        {items.map((item) => (
          <article className={`activity-item ${item.tone}`} key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.source} • {item.timestampLabel}</span>
            </div>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
