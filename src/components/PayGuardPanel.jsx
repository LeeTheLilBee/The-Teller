export default function PayGuardPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PayGuard Workflow</p>
          <h2>{entity.label} security readiness</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.lockedDoors} guarded doors</span>
          <span>{summary.pendingStepUps} step-ups</span>
          <span>{summary.activeRedactions} redactions</span>
          <span>{summary.deniedCount} denied</span>
        </div>
      </div>

      <div className="workflow-list">
        {summary.doorCards.map((item) => (
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
          <p className="eyebrow">Step-Up Requests</p>
          <div className="mini-stack">
            {summary.stepUpCards.map((item) => (
              <div className="info-tile" key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <div className="tile-note">{item.meta}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Sensitive Reveals</p>
          <div className="mini-stack">
            {summary.revealCards.map((item) => (
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
