export default function ProofSealPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Seal Workflow</p>
          <h2>{entity.label} proof packet seal readiness</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.total} packets</span>
          <span>{summary.ready} ready</span>
          <span>{summary.blocked} blocked</span>
          <span>{summary.sealed} sealed</span>
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
