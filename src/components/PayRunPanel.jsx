export default function PayRunPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PayRun Workflow</p>
          <h2>{entity.label} payroll readiness</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.totalRuns} runs</span>
          <span>{summary.readyRuns} ready</span>
          <span>{summary.blockedRuns} blocked</span>
          <span>{summary.openExceptions} exceptions</span>
        </div>
      </div>

      <div className="workflow-list">
        {summary.readinessRows.length > 0 ? (
          summary.readinessRows.map(({ run, readiness }) => (
            <article className="workflow-row" key={run.id}>
              <div>
                <strong>{run.title}</strong>
                <small>{run.status} • {run.grossPay} • {run.workerCount} workers</small>
              </div>

              <div className="workflow-meta">
                <span>{readiness.readiness}</span>
                <span>{run.fundingStatus}</span>
                <span>{run.approvalStatus}</span>
                <span>{run.proofStatus}</span>
              </div>

              <p>{run.nextAction}</p>

              <div className="workflow-steps">
                <span>Pull workers</span>
                <span>Check clearance</span>
                <span>Resolve exceptions</span>
                <span>Approve</span>
                <span>Seal packet</span>
              </div>

              {readiness.blockingExceptions.length > 0 && (
                <div className="workflow-alert">
                  {readiness.blockingExceptions.length} blocking exception(s) must clear before release.
                </div>
              )}
            </article>
          ))
        ) : (
          <article className="workflow-row">
            <div>
              <strong>No payroll run in this lane yet</strong>
              <small>{entity.label}</small>
            </div>
            <p>This company is ready for its first payroll run draft.</p>
          </article>
        )}
      </div>
    </section>
  );
}
