export default function CompanyScopePanel({ summary, activeEntity, setActiveEntity }) {
  return (
    <section className="company-scope-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Company Scope</p>
          <h2>Assigned company lanes</h2>
        </div>
        <div className="workflow-stats">
          <span>{summary.companies.length} visible</span>
          <span>{summary.hiddenCount} hidden</span>
          <span>{summary.roleLimitedCount} role-limited</span>
        </div>
      </div>

      <p className="scope-line">{summary.accessLine}</p>

      <div className="company-scope-grid">
        {summary.companies.map((company) => (
          <button
            type="button"
            key={company.key}
            className={company.key === activeEntity ? "company-scope-card active" : "company-scope-card"}
            onClick={() => setActiveEntity(company.key)}
            disabled={!company.allowedByRole}
          >
            <strong>{company.label}</strong>
            <small>{company.type}</small>
            <span>{company.allowedByRole ? "Role access allowed" : "Role-limited"}</span>
            <div>
              <em>Cash {company.cash}</em>
              <em>Pay {company.pay}</em>
              <em>Debt {company.debt}</em>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
