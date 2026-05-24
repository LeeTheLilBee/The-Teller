import SaveStatus from "./SaveStatus.jsx";

export default function TopBar({ room, role, entities, activeEntity, setActiveEntity, saveStatus }) {
  return (
    <header className="top-bar">
      <div>
        <p className="eyebrow">The Teller Command Layer</p>
        <div className="title-line">
          <h1>{room.label}</h1>
          <span>{room.system}</span>
        </div>
        <p className="description">{room.copy}</p>
      </div>

      <div className="context-stack">
        <div className="context-grid">
          <label>
            <small>Current Company</small>
            <select value={activeEntity} onChange={(event) => setActiveEntity(event.target.value)}>
              {entities.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="context-card">
            <small>Current PayRole</small>
            <strong>{role.label}</strong>
            <span>{role.scope}</span>
          </div>
        </div>

        <SaveStatus saveStatus={saveStatus} />
      </div>
    </header>
  );
}
