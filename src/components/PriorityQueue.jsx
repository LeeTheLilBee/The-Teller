export default function PriorityQueue({ priorities }) {
  return (
    <section className="priority-card">
      <p className="eyebrow gold">Priority Queue</p>
      <h2>What matters now</h2>
      <div className="priority-list">
        {priorities.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </section>
  );
}
