export default function UtilityToggle({ utilitiesOpen, setUtilitiesOpen }) {
  return (
    <section className="utility-toggle-panel">
      <div>
        <p className="eyebrow">Utility Panels</p>
        <h2>{utilitiesOpen ? "Support panels are open." : "Support panels are tucked away."}</h2>
      </div>

      <button type="button" onClick={() => setUtilitiesOpen(!utilitiesOpen)}>
        {utilitiesOpen ? "Hide Support Panels" : "Show Support Panels"}
      </button>
    </section>
  );
}
