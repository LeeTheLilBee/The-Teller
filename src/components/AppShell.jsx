import { useMemo, useState } from "react";
import { profiles } from "../config/drawerProfiles.js";
import { rooms } from "../config/rooms.js";
import {
  debtCatalog,
  foundationDocs,
  givingPrograms,
  worldRollup,
} from "../data/tellerSeed.js";
import { useAutoSave } from "../lib/autoSave.js";
import { getPayOnboardSummary } from "../lib/payOnboard.js";
import { getPayRunSummary } from "../lib/payRun.js";
import { getPayFlowSummary } from "../lib/payFlow.js";
import { runDevChecks } from "../lib/devChecks.js";
import {
  getNextAllowedEntityKey,
  getVisibleEntities,
  getVisibleRoles,
  resolveEntity,
  resolveRole,
} from "../lib/permissions.js";
import { buildModelSummaries } from "../lib/recordFilters.js";
import { buildMetricRows, buildPriorities, getSnapshot } from "../lib/snapshotHelpers.js";
import DrawerPanel from "./DrawerPanel.jsx";
import FocusSnapshot from "./FocusSnapshot.jsx";
import PriorityQueue from "./PriorityQueue.jsx";
import SideRail from "./SideRail.jsx";
import TopBar from "./TopBar.jsx";

export default function AppShell() {
  const visibleEntities = useMemo(() => getVisibleEntities(), []);
  const visibleRoles = useMemo(() => getVisibleRoles(), []);
  const devChecks = useMemo(() => runDevChecks(), []);

  const [activeRoom, setActiveRoom] = useState("command");
  const [activeEntity, setActiveEntity] = useState("world");
  const [activeRole, setActiveRole] = useState("owner");
  const [activeDrawer, setActiveDrawer] = useState(profiles.command.drawers[0][0]);

  const room = rooms.find((item) => item.key === activeRoom) || rooms[0];
  const profile = profiles[activeRoom] || profiles.command;
  const entity = resolveEntity(visibleEntities, activeEntity);
  const role = resolveRole(visibleRoles, activeRole);
  const snapshot = getSnapshot(entity.key);
  const metricRows = buildMetricRows(profile, snapshot);
  const priorities = buildPriorities(profile, snapshot, role);
  const modelSummaries = useMemo(() => buildModelSummaries(entity.key), [entity.key]);
  const payOnboardSummary = useMemo(() => getPayOnboardSummary(entity.key), [entity.key]);
  const payRunSummary = useMemo(() => getPayRunSummary(entity.key), [entity.key]);
  const payFlowSummary = useMemo(() => getPayFlowSummary(entity.key), [entity.key]);

  const saveStatus = useAutoSave(
    {
      activeRoom,
      activeEntity,
      activeRole,
      activeDrawer,
    },
    {
      storageKey: "the-teller-ui-state",
      intervalMs: 15000,
    }
  );

  const filteredDebt = entity.key === "world" ? debtCatalog : debtCatalog.filter((item) => item.entityKey === entity.key);
  const filteredGiving = entity.key === "world" ? givingPrograms : givingPrograms.filter((item) => item.entityKey === entity.key);
  const showFoundationDocs = entity.key === "world" || entity.key === "safehaven";

  function openRoom(roomKey) {
    const nextProfile = profiles[roomKey] || profiles.command;
    setActiveRoom(roomKey);
    setActiveDrawer(nextProfile.drawers[0][0]);
  }

  function changeRole(roleKey) {
    const nextRole = resolveRole(visibleRoles, roleKey);
    const nextEntityKey = getNextAllowedEntityKey(nextRole, activeEntity, visibleEntities);

    setActiveRole(nextRole.key);
    setActiveEntity(nextEntityKey);
    openRoom(nextRole.dashboardRoom);
  }

  return (
    <div className="app-root">
      <div className="app-frame">
        <SideRail
          rooms={rooms}
          activeRoom={activeRoom}
          openRoom={openRoom}
          roles={visibleRoles}
          activeRole={activeRole}
          changeRole={changeRole}
        />

        <main className="main-area">
          <TopBar
            room={room}
            role={role}
            entities={visibleEntities}
            activeEntity={activeEntity}
            setActiveEntity={setActiveEntity}
            saveStatus={saveStatus}
          />

          <section className="hero-grid">
            <FocusSnapshot room={room} profile={profile} entity={entity} snapshot={snapshot} metricRows={metricRows} />
            <PriorityQueue priorities={priorities} />
          </section>

          <DrawerPanel
            profile={profile}
            activeDrawer={activeDrawer}
            setActiveDrawer={setActiveDrawer}
            entity={entity}
            snapshot={snapshot}
            worldRollup={worldRollup}
            filteredDebt={filteredDebt}
            filteredGiving={filteredGiving}
            foundationDocs={foundationDocs}
            showFoundationDocs={showFoundationDocs}
            devChecks={devChecks}
            modelSummaries={modelSummaries}
            payOnboardSummary={payOnboardSummary}
            payRunSummary={payRunSummary}
            payFlowSummary={payFlowSummary}
          />
        </main>
      </div>
    </div>
  );
}
