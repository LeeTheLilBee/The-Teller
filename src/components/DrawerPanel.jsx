import { motion } from "framer-motion";
import { calendarItems } from "../data/tellerSeed.js";
import { simpleDrawerContent } from "../config/drawerProfiles.js";
import DevChecks from "./DevChecks.jsx";
import PayOnboardPanel from "./PayOnboardPanel.jsx";

export default function DrawerPanel({
  profile,
  activeDrawer,
  setActiveDrawer,
  entity,
  snapshot,
  worldRollup,
  filteredDebt,
  filteredGiving,
  foundationDocs,
  showFoundationDocs,
  devChecks,
  modelSummaries,
  payOnboardSummary,
}) {
  const modelCards = modelSummaries?.[activeDrawer] || [];

  return (
    <section className="drawer-card">
      <div className="drawer-header">
        <div>
          <p className="eyebrow">{profile.drawerTitle}</p>
          <h2>Open one layer at a time.</h2>
        </div>

        <div className="drawer-tabs">
          {profile.drawers.map(([key, label]) => (
            <button key={key} className={activeDrawer === key ? "drawer-tab active" : "drawer-tab"} onClick={() => setActiveDrawer(key)}>
              {label}
              <span />
            </button>
          ))}
        </div>
      </div>

      <motion.div key={activeDrawer} className="drawer-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

        {activeDrawer === "workerLanes" && (
          <PayOnboardPanel summary={payOnboardSummary} entity={entity} />
        )}

        {activeDrawer === "rollup" &&
          (entity.key === "world"
            ? worldRollup
            : [{ key: entity.key, label: entity.label, kind: entity.type, cash: snapshot.balance, pay: snapshot.payrollDue, debt: snapshot.debt }]
          ).map((item) => (
            <div className="info-tile" key={item.key}>
              <strong>{item.label}</strong>
              <small>{item.kind}</small>
              <div className="mini-grid">
                <span>Cash {item.cash}</span>
                <span>Pay {item.pay}</span>
                <span>Debt {item.debt}</span>
              </div>
            </div>
          ))}

        {activeDrawer === "debt" &&
          (filteredDebt.length ? filteredDebt : [{ id: "none", entity: entity.label, type: "No catalogued debt", balance: "$0", due: "—", status: "Clear" }]).map((item) => (
            <div className="dark-tile" key={item.id}>
              <strong>{item.entity}</strong>
              <small>{item.type}</small>
              <div className="mini-grid">
                <span>{item.balance}</span>
                <span>{item.due}</span>
                <span>{item.status}</span>
              </div>
            </div>
          ))}

        {activeDrawer === "giving" &&
          filteredGiving.map((item) => (
            <div className="dark-tile" key={item.id}>
              <strong>{item.entity}</strong>
              <small>{item.program}</small>
              <div className="mini-grid">
                <span>{item.budget}</span>
                <span>{item.status}</span>
              </div>
            </div>
          ))}

        {activeDrawer === "foundationDocs" &&
          (showFoundationDocs ? foundationDocs : [{ id: "blocked", title: "Foundation documents hidden", category: "Protected", status: "Scoped" }]).map((item) => (
            <div className="dark-tile" key={item.id}>
              <strong>{item.title}</strong>
              <small>{item.category}</small>
              <div className="mini-grid">
                <span>{item.status}</span>
              </div>
            </div>
          ))}

        {activeDrawer === "calendar" &&
          calendarItems.map((item) => (
            <div className="dark-tile" key={`${item.label}-${item.date}`}>
              <strong>{item.label}</strong>
              <small>{item.scope}</small>
              <div className="mini-grid">
                <span>{item.date}</span>
              </div>
            </div>
          ))}

        {activeDrawer === "audit" && entity.key === "world" && <DevChecks checks={devChecks} />}

        {activeDrawer !== "workerLanes" && modelCards.length > 0 &&
          modelCards.map((item) => (
            <div className="info-tile" key={`${activeDrawer}-${item.title}`}>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
              {item.meta && <div className="tile-note">{item.meta}</div>}
            </div>
          ))}

        {activeDrawer !== "workerLanes" && modelCards.length === 0 &&
          simpleDrawerContent[activeDrawer]?.map((item) => (
            <div className="info-tile" key={item}>
              <strong>{item}</strong>
              <small>Scoped to {entity.label}</small>
            </div>
          ))}
      </motion.div>
    </section>
  );
}
