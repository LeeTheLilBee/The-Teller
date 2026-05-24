export default function RoleSafetyPanel({ summary, allRoleCards }) {
  return (
    <section className="role-safety-panel">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">PayRole Safety</p>
          <h2>{summary.role.label} view rules</h2>
        </div>

        <div className="workflow-stats">
          <span>{summary.scope.companyCount} lanes</span>
          <span>{summary.scope.canApprove ? "approval-capable" : "review-only"}</span>
          <span>{summary.scope.requiresStepUp ? "step-up" : "standard"}</span>
        </div>
      </div>

      <div className="role-safety-grid">
        {summary.cards.map((item) => (
          <article className={`role-safety-card ${item.tone}`} key={item.title}>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <p>{item.meta}</p>
          </article>
        ))}
      </div>

      <div className="role-directory">
        <p className="eyebrow">Available PayRoles</p>
        <div>
          {allRoleCards.map((item) => (
            <article className={`role-mini-card ${item.tone}`} key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
              <p>{item.meta}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
