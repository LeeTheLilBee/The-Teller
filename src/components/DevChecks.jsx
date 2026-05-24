import { getDevCheckSummary } from "../lib/devChecks.js";

export default function DevChecks({ checks }) {
  const summary = getDevCheckSummary(checks);

  return (
    <section className="dev-check-card">
      <div className="dev-check-header">
        <div>
          <p className="eyebrow">System Checks</p>
          <h2>{summary.healthy ? "The Teller scaffold is healthy." : "The Teller needs attention."}</h2>
        </div>
        <span className={summary.healthy ? "health-pill healthy" : "health-pill warning"}>
          {summary.passed}/{summary.total} passing
        </span>
      </div>

      <div className="dev-check-grid">
        {checks.map((check) => (
          <div key={check.name} className={check.pass ? "check-row pass" : "check-row fail"}>
            <span>{check.name}</span>
            <strong>{check.pass ? "PASS" : "FIX"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
