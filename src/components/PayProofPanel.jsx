export default function PayProofPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PayProof Workflow</p>
          <h2>{entity.label} proof readiness</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.totalPackets} packets</span>
          <span>{summary.sealedPackets} sealed</span>
          <span>{summary.openRequirements} proof needs</span>
          <span>{summary.protectedExports} protected exports</span>
        </div>
      </div>

      <div className="workflow-list">
        {summary.packetCards.map((item) => (
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
          <p className="eyebrow">Proof Requirements</p>
          <div className="mini-stack">
            {summary.requirementCards.map((item) => (
              <div className="info-tile" key={item.title}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                <div className="tile-note">{item.meta}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Seal Rules</p>
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
