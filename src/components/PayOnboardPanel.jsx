export default function PayOnboardPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PayOnboard Workflow</p>
          <h2>{entity.label} worker readiness</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.total} total</span>
          <span>{summary.cleared} cleared</span>
          <span>{summary.needsDocs} doc blocks</span>
          <span>{summary.openIssues} open issues</span>
        </div>
      </div>

      <div className="workflow-list">
        {summary.queue.length > 0 ? (
          summary.queue.map(({ worker, readiness }) => (
            <article className="workflow-row" key={worker.id}>
              <div>
                <strong>{worker.displayName}</strong>
                <small>{readiness.workerTypeLabel} • {worker.status}</small>
              </div>

              <div className="workflow-meta">
                <span>{worker.onboardingStatus}</span>
                <span>{worker.clearanceStatus}</span>
                <span>{readiness.readiness}</span>
              </div>

              <p>{worker.nextAction}</p>

              {readiness.track && (
                <div className="workflow-steps">
                  {readiness.track.steps.map((step) => (
                    <span key={`${worker.id}-${step}`}>{step}</span>
                  ))}
                </div>
              )}
            </article>
          ))
        ) : (
          <article className="workflow-row">
            <div>
              <strong>No worker records in this lane yet</strong>
              <small>{entity.label}</small>
            </div>
            <p>This company is ready for its first worker onboarding setup.</p>
          </article>
        )}
      </div>
    </section>
  );
}
