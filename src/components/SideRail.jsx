export default function SideRail({ rooms, activeRoom, openRoom, roles, activeRole, changeRole }) {
  return (
    <aside className="side-rail">
      <div className="brand-card">
        <div className="logo-slot">
          <span>SimpleePay presents</span>
          <strong>The Teller</strong>
        </div>
      </div>

      <div className="role-card">
        <span>Active PayRole</span>
        <select value={activeRole} onChange={(event) => changeRole(event.target.value)}>
          {roles.map((role) => (
            <option key={role.key} value={role.key}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <nav className="room-list">
        {rooms.map((room) => {
          const Icon = room.icon;
          const active = room.key === activeRoom;

          return (
            <button key={room.key} className={active ? "room-button active" : "room-button"} onClick={() => openRoom(room.key)}>
              <Icon size={18} />
              <span>
                <strong>{room.label}</strong>
                <small>{active ? room.system : room.eyebrow}</small>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
