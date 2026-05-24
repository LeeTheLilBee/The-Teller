export default function PayProofDetailGrid({ title, cards, dark = false }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PayProof Detail</p>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="drawer-content flat-content">
        {cards.map((item) => (
          <div className={dark ? "dark-tile" : "info-tile"} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            {item.meta && <div className={dark ? "tile-note dark-note" : "tile-note"}>{item.meta}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
