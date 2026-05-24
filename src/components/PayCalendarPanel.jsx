export default function PayCalendarPanel({ summary, entity }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PayCalendar</p>
          <h2>{entity.label} deadline view</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.total} total</span>
          <span>{summary.openItems} open</span>
          <span>{summary.payrollItems} payroll</span>
          <span>{summary.debtItems} debt</span>
          <span>{summary.documentItems} docs</span>
        </div>
      </div>

      <div className="calendar-lane">
        {summary.cards.map((item) => (
          <article className="calendar-card" key={`${item.title}-${item.detail}`}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
