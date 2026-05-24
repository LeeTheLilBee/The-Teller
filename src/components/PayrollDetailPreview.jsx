export default function PayrollDetailPreview({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Payroll Detail Preview</p>
          <h2>{entity.label} payroll records</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.total} runs</span>
          <span>{summary.ready} ready</span>
          <span>{summary.blocked} blocked</span>
          <span>{summary.exceptionCount} exceptions</span>
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
