export default function PayFlowPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PayFlow Workflow</p>
          <h2>{entity.label} money movement readiness</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.movementCount} movements</span>
          <span>{summary.blockedMovements} blocked</span>
          <span>{summary.watchReserves} reserve watch</span>
          <span>{summary.debtWatch} debt watch</span>
        </div>
      </div>

      <div className="workflow-list">
        {summary.movementCards.map((item) => (
          <article className="workflow-row" key={item.title}>
            <div>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </div>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>

      <div className="payflow-split">
        <div>
          <p className="eyebrow">Reserve Buckets</p>
          <div className="mini-stack">
            {summary.reserveCards.map((item) => (
              <div className="info-tile" key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <div className="tile-note">{item.meta}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Movement Rules</p>
          <div className="mini-stack">
            {summary.ruleCards.map((item) => (
              <div className="info-tile" key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <div className="tile-note">{item.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
