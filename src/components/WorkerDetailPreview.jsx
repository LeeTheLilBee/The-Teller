export default function WorkerDetailPreview({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Worker Detail Preview</p>
          <h2>{entity.label} worker records</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.total} workers</span>
          <span>{summary.cleared} cleared</span>
          <span>{summary.blocked} blocked</span>
        </div>
      </div>

      <div className="detail-preview-grid">
        {summary.cards.map((item) => (
          <article className={`detail-preview-card ${item.tone}`} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
