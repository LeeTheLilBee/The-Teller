function FoundationSection({ title, cards }) {
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

export default function FoundationLanePanel({ summary, entity }) {
  return (
    <section className="workflow-panel foundation-lane-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Foundation Lane</p>
          <h2>{entity.label} foundation + giving protection</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.protectedAid} protected aid</span>
          <span>{summary.restrictedCount} restricted funds</span>
          <span>{summary.proofNeeded} proof needed</span>
          <span>{summary.canViewFoundation ? "foundation visible" : "foundation hidden"}</span>
        </div>
      </div>

      <div className="foundation-warning">
        <strong>Recipient-sensitive by default.</strong>
        <p>Foundation aid records should stay redacted unless the right role, reason, and audit receipt are present.</p>
      </div>

      <div className="payflow-split">
        <FoundationSection title="Aid Packets" cards={summary.aidCards} />
        <FoundationSection title="Restricted Funds" cards={summary.fundCards} />
      </div>

      <div className="payflow-split">
        <FoundationSection title="Governance" cards={summary.governanceCards} />
        <FoundationSection title="Business Giving Bridges" cards={[...summary.bridgeCards, ...summary.givingCards]} />
      </div>
    </section>
  );
}
