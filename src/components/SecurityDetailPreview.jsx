function DetailSection({ title, cards }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <div className="detail-preview-grid">
        {cards.map((item) => (
          <article className={`detail-preview-card ${item.tone}`} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function SecurityDetailPreview({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Security Detail Preview</p>
          <h2>{entity.label} PayGuard records</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.guardedDoors} doors</span>
          <span>{summary.pendingStepUps} step-ups</span>
          <span>{summary.activeRedactions} redactions</span>
          <span>{summary.revealCount} reveals</span>
          <span>{summary.deniedCount} denied</span>
        </div>
      </div>

      <div className="payflow-split">
        <DetailSection title="Doors" cards={summary.doorCards} />
        <DetailSection title="Step-Up" cards={summary.stepUpCards} />
      </div>

      <div className="payflow-split">
        <DetailSection title="Redaction Rules" cards={summary.redactionCards} />
        <DetailSection title="Sensitive Reveals + Denied Actions" cards={[...summary.revealCards, ...summary.deniedCards]} />
      </div>
    </section>
  );
}
