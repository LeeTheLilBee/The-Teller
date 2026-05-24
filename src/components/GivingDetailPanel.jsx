function GivingSection({ title, cards }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <div className="detail-preview-grid">
        {cards.map((item) => (
          <article className={`detail-preview-card ${item.tone || ""}`} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function GivingDetailPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Giving Detail Layer</p>
          <h2>{entity.label} giving programs</h2>
        </div>

        <div className="workflow-stats">
          <span>${summary.totalBudget.toLocaleString()} budget</span>
          <span>{summary.proofNeeded} proof needed</span>
          <span>{summary.protectedCount} protected</span>
          <span>{summary.bridges.length} bridges</span>
        </div>
      </div>

      <div className="foundation-warning">
        <strong>Business giving and foundation aid stay separate.</strong>
        <p>Business giving can connect to SimpleeSafeHaven, but recipient-specific aid belongs in the protected foundation lane.</p>
      </div>

      <div className="payflow-split">
        <GivingSection title="Giving Programs" cards={[...summary.detailCards, ...summary.programCards]} />
        <GivingSection title="Proof Checklist" cards={summary.proofCards} />
      </div>

      <GivingSection title="Foundation Bridges" cards={summary.bridgeCards} />
    </section>
  );
}
