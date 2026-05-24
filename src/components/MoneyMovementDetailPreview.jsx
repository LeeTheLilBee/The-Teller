export default function MoneyMovementDetailPreview({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Money Movement Detail Preview</p>
          <h2>{entity.label} money flow records</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.movementCount} movements</span>
          <span>{summary.blockedMovements} blocked</span>
          <span>{summary.watchReserves} reserve watch</span>
          <span>{summary.debtWatch} debt watch</span>
        </div>
      </div>

      <div className="payflow-split">
        <div>
          <p className="eyebrow">Movements</p>
          <div className="detail-preview-grid">
            {summary.movementCards.map((item) => (
              <article className={`detail-preview-card ${item.tone}`} key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <p>{item.meta}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Reserves</p>
          <div className="detail-preview-grid">
            {summary.reserveCards.map((item) => (
              <article className={`detail-preview-card ${item.tone}`} key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <p>{item.meta}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="payflow-split">
        <div>
          <p className="eyebrow">Debt Pressure</p>
          <div className="detail-preview-grid">
            {summary.debtCards.map((item) => (
              <article className={`detail-preview-card ${item.tone}`} key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <p>{item.meta}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Giving + Rules</p>
          <div className="detail-preview-grid">
            {[...summary.givingCards, ...summary.ruleCards].map((item) => (
              <article className={`detail-preview-card ${item.tone}`} key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <p>{item.meta}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
