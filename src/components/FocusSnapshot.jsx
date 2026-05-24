import { motion } from "framer-motion";

export default function FocusSnapshot({ room, profile, entity, snapshot, metricRows }) {
  const RoomIcon = room.icon;

  return (
    <motion.section className="focus-card" key={`${room.key}-${entity.key}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="focus-heading">
        <div>
          <p className="eyebrow">{profile.eyebrow}</p>
          <h2>{entity.label}</h2>
          <p>{snapshot.headline}</p>
        </div>
        <RoomIcon size={42} />
      </div>

      <div className="metric-grid">
        {metricRows.map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
