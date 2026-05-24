export default function ApprovalCenterPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Approval Center</p>
          <h2>{entity.label} approval queue</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.total} total</span>
          <span>{summary.pending} pending</span>
          <span>{summary.highRisk} high risk</span>
          <span>{summary.noSelfApproval} no self-approval</span>
        </div>
      </div>

      <div className="approval-grid">
        {summary.cards.map((item) => (
          <article className={`approval-card ${item.tone}`} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
