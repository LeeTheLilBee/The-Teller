function DebtSection({ title, cards }) {
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

export default function DebtDetailPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Debt Detail Layer</p>
          <h2>{entity.label} debt catalog</h2>
        </div>

        <div className="workflow-stats">
          <span>${summary.totalBalance.toLocaleString()} tracked</span>
          <span>{summary.highPriority} high priority</span>
          <span>{summary.watchCount} watch</span>
          <span>{summary.proofNeeded} proof needed</span>
        </div>
      </div>

      <div className="payflow-split">
        <DebtSection title="Debt Details" cards={summary.detailCards} />
        <DebtSection title="Payment Proof" cards={summary.paymentCards} />
      </div>

      <DebtSection title="Debt Catalog" cards={summary.catalogCards} />
    </section>
  );
}
