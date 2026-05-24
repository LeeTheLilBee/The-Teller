export default function CalmModePanel({ summary, focusMode, setFocusMode }) {
  return (
    <section className="calm-mode-panel">
      <div className="calm-copy">
        <p className="eyebrow">Calm Dashboard</p>
        <h2>{summary.entityLabel}: {summary.mood}</h2>
        <p>{summary.quietLine}</p>
      </div>

      <div className="calm-stats">
        <span>{summary.commandStatus}</span>
        <span>{summary.pressureCount} pressure points</span>
        <button type="button" onClick={() => setFocusMode(!focusMode)}>
          {focusMode ? "Turn Focus Off" : "Turn Focus On"}
        </button>
      </div>

      <div className="calm-actions">
        {summary.topThree.length > 0 ? (
          summary.topThree.map((item) => <strong key={item}>{item}</strong>)
        ) : (
          <strong>No urgent next action found.</strong>
        )}
      </div>
    </section>
  );
}
