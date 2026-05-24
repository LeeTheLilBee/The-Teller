export default function PaySkyPanel({ summary, entity }) {
  return (
    <section className="workflow-panel command-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PaySky Command</p>
          <h2>{entity.label} command intelligence</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.commandStatus}</span>
          <span>{summary.pressureCount} pressure points</span>
        </div>
      </div>

      <div className="command-card-grid">
        {summary.cards.map((card) => (
          <article className={`command-card ${card.tone}`} key={card.title}>
            <strong>{card.title}</strong>
            <span>{card.detail}</span>
            <p>{card.meta}</p>
          </article>
        ))}
      </div>

      <div className="command-actions">
        <p className="eyebrow">Top command actions</p>
        <div>
          {summary.topActions.map((action) => (
            <span key={action}>{action}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
