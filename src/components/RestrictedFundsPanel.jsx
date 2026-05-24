export default function RestrictedFundsPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Restricted Funds</p>
          <h2>{entity.label} protected fund lanes</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.restricted.length} funds</span>
          <span>{summary.restricted.filter((item) => item.status === "Restricted").length} restricted</span>
        </div>
      </div>

      <div className="drawer-content flat-content">
        {summary.restrictedCards.map((item) => (
          <div className="dark-tile" key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <div className="tile-note dark-note">{item.meta}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
