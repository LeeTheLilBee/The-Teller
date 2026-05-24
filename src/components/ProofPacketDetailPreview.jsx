function DetailSection({ title, cards }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <div className="detail-preview-grid">
        {cards.map((item) => (
          <article className={`detail-preview-card ${item.tone}`} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function ProofPacketDetailPreview({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Proof Packet Detail Preview</p>
          <h2>{entity.label} proof records</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.totalPackets} packets</span>
          <span>{summary.blockedPackets} blocked</span>
          <span>{summary.protectedExports} protected exports</span>
          <span>{summary.receiptCount} receipts</span>
        </div>
      </div>

      <div className="payflow-split">
        <DetailSection title="Packets" cards={summary.packetCards} />
        <DetailSection title="Requirements" cards={summary.requirementCards} />
      </div>

      <div className="payflow-split">
        <DetailSection title="Exports + Redaction" cards={summary.exportCards} />
        <DetailSection title="Documents" cards={summary.documentCards} />
      </div>

      <div className="payflow-split">
        <DetailSection title="Foundation + Giving" cards={[...summary.foundationCards, ...summary.givingCards]} />
        <DetailSection title="Receipts + Seal Rules" cards={[...summary.receiptCards, ...summary.ruleCards]} />
      </div>
    </section>
  );
}
