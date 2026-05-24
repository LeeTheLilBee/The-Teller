export default function SystemStatusStrip({ status }) {
  return (
    <section className={status.status === "Healthy" ? "system-status healthy" : "system-status warning"}>
      <div>
        <span>System Status</span>
        <strong>{status.headline}</strong>
      </div>
      <p>{status.detail}</p>
    </section>
  );
}
