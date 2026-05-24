export default function EntityEmptyState({ emptyState }) {
  return (
    <section className="entity-empty-state">
      <div>
        <p className="eyebrow">Empty State</p>
        <h2>{emptyState.title}</h2>
        <p>{emptyState.detail}</p>
      </div>

      <strong>{emptyState.action}</strong>
    </section>
  );
}
