export default function StepUpFlowPanel({
  summary,
  entity,
  stepUpReason,
  setStepUpReason,
  onCreateStepUp,
  latestStepUp,
}) {
  return (
    <section className="workflow-panel stepup-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Step-Up + Sensitive Reveal</p>
          <h2>{entity.label} protected action flow</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.total} requests</span>
          <span>{summary.reasonRequired} reason-required</span>
          <span>{summary.protectedReveals} protected</span>
          <span>{summary.lockedRedactions} redactions</span>
        </div>
      </div>

      <div className="stepup-reason-box">
        <div>
          <strong>Reason required before sensitive reveal</strong>
          <p>This is still mock-only. The real version will require authentication, role clearance, and a recorded audit receipt.</p>
        </div>

        <div className="stepup-input-row">
          <input
            value={stepUpReason}
            onChange={(event) => setStepUpReason(event.target.value)}
            placeholder="Type the reason for this sensitive action..."
          />
          <button type="button" onClick={onCreateStepUp}>Capture Reason</button>
        </div>

        {latestStepUp && (
          <div className="stepup-latest">
            <span>{latestStepUp.status}</span>
            <strong>{latestStepUp.reason || "No reason provided"}</strong>
          </div>
        )}
      </div>

      <div className="payflow-split">
        <div>
          <p className="eyebrow">Reveal Requests</p>
          <div className="mini-stack">
            {summary.revealCards.map((item) => (
              <div className={`approval-card ${item.tone}`} key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <p>{item.meta}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Redaction Rules</p>
          <div className="mini-stack">
            {summary.redactionCards.map((item) => (
              <div className={`approval-card ${item.tone}`} key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <p>{item.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
