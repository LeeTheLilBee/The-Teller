export default function TopBar({
  room = {},
  role = {},
  entities = [],
  activeEntity = "world",
  setActiveEntity = () => {},
  saveStatus = {},
  settingsOpen = false,
  setSettingsOpen = () => {},
}) {
  const safeEntities = Array.isArray(entities) && entities.length ? entities : [{ key: "world", label: "Simplee World" }];
  const activeCompany = safeEntities.find((entity) => entity.key === activeEntity) || safeEntities[0];

  return (
    <header className="top-bar command-topbar">
      <div className="top-title">
        <p className="eyebrow">The Teller</p>
        <h1>{room.label || "Command"}</h1>
        <span>{room.description || "People, pay, proof, debt, giving, and control flow."}</span>
      </div>

      <div className="top-context-cluster">
        <label className="context-pill context-select">
          <span>Company</span>
          <select value={activeCompany.key} onChange={(event) => setActiveEntity(event.target.value)}>
            {safeEntities.map((entity) => (
              <option key={entity.key} value={entity.key}>
                {entity.label}
              </option>
            ))}
          </select>
        </label>

        <div className="context-pill">
          <span>PayRole</span>
          <strong>{role.label || "Owner"}</strong>
        </div>

        <div className="context-pill save-pill">
          <span>Saved</span>
          <strong>{saveStatus.label || saveStatus.status || "Ready"}</strong>
        </div>

        <button
          type="button"
          className={settingsOpen ? "settings-button active" : "settings-button"}
          onClick={() => setSettingsOpen((current) => !current)}
        >
          Settings
        </button>
      </div>
    </header>
  );
}
