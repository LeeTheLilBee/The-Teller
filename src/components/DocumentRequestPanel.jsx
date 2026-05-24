export default function DocumentRequestPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Document Requests</p>
          <h2>{entity.label} request queue</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.total} requests</span>
          <span>{summary.open} open</span>
          <span>{summary.highPriority} high priority</span>
          <span>{summary.missingDocs} doc blocks</span>
        </div>
      </div>

      <div className="approval-grid">
        {summary.cards.map((item) => (
          <article className={`approval-card ${item.tone}`} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
