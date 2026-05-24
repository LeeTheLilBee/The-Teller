export default function BatchSummaryPanel({ summary }) {
  return (
    <section className="batch-summary-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Checkpoint Summary</p>
          <h2>{summary.product} is at {summary.checkpoint}</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.pendingPacks.length} packs in batch</span>
          <span>{summary.capabilityCount} capabilities</span>
        </div>
      </div>

      <div className="batch-summary-grid">
        <div>
          <strong>Saved through</strong>
          <span>{summary.savedThrough}</span>
        </div>
        <div>
          <strong>Pending save batch</strong>
          <span>{summary.pendingSaveBatch}</span>
        </div>
        <div>
          <strong>Next likely pack</strong>
          <span>{summary.nextLikelyPack}</span>
        </div>
      </div>

      <div className="batch-pack-list">
        {summary.pendingPacks.map((pack) => (
          <span key={pack}>{pack}</span>
        ))}
      </div>
    </section>
  );
}
