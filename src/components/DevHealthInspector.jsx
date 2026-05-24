export default function DevHealthInspector({ health }) {
  return (
    <section className="dev-health-inspector">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Dev Health Inspector</p>
          <h2>{health.level} • {health.healthScore}%</h2>
        </div>

        <div className="workflow-stats">
          <span>{health.devSummary.passed} passed</span>
          <span>{health.devSummary.failed} failed</span>
          <span>{health.checkpoint}</span>
        </div>
      </div>

      <div className="dev-health-card-grid">
        {health.cards.map((item) => (
          <article className={`detail-preview-card ${item.tone}`} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>

      {health.failedChecks.length > 0 && (
        <div className="dev-fail-list">
          <p className="eyebrow">Failed Checks</p>
          {health.failedChecks.map((check) => (
            <span key={check.name}>{check.name}</span>
          ))}
        </div>
      )}

      <details className="dev-pass-details">
        <summary>Show passing checks</summary>
        <div>
          {health.passedChecks.map((check) => (
            <span key={check.name}>{check.name}</span>
          ))}
        </div>
      </details>
    </section>
  );
}
