import { useMemo, useState } from "react";
import { profiles } from "../config/drawerProfiles.js";
import { rooms } from "../config/rooms.js";
import {
  debtCatalog,
  foundationDocs,
  givingPrograms,
  worldRollup,
} from "../data/tellerSeed.js";
import { createLocalNote, getActivityTimeline } from "../lib/activityTimeline.js";
import { getApprovalSummary } from "../lib/approvalCenter.js";
import { useAutoSave } from "../lib/autoSave.js";
import { getBatchSummary } from "../lib/batchSummary.js";
import { buildCalmModeSummary } from "../lib/calmMode.js";
import { getCalendarSummary } from "../lib/payCalendar.js";
import { getCompanyScopeSummary } from "../lib/companyScopeSummary.js";
import { runDevChecks } from "../lib/devChecks.js";
import { getDocumentRequestSummary } from "../lib/documentRequests.js";
import { getDebtDetailSummary } from "../lib/debtDetails.js";
import { getEmptyState } from "../lib/emptyStates.js";
import { getFoundationLaneSummary } from "../lib/foundationLane.js";
import { getGivingDetailSummary } from "../lib/givingDetails.js";
import { getPayFlowSummary } from "../lib/payFlow.js";
import { getMoneyMovementDetailSummary } from "../lib/moneyMovementDetails.js";
import { getPayGuardSummary } from "../lib/payGuard.js";
import { getSecurityDetailSummary } from "../lib/securityDetails.js";
import { getPayOnboardSummary } from "../lib/payOnboard.js";
import { getPayProofSummary } from "../lib/payProof.js";
import { getProofPacketDetailSummary } from "../lib/proofPacketDetails.js";
import { getPayRunSummary } from "../lib/payRun.js";
import { getPayrollDetailSummary } from "../lib/payrollDetails.js";
import { getPaySkySummary } from "../lib/paySky.js";
import {
  getNextAllowedEntityKey,
  getVisibleEntities,
  getVisibleRoles,
  resolveEntity,
  resolveRole,
} from "../lib/permissions.js";
import { getSealWorkflowSummary } from "../lib/proofSeal.js";
import { buildModelSummaries } from "../lib/recordFilters.js";
import { getAllRoleCards, getRoleSafetySummary } from "../lib/roleSafety.js";
import { createStepUpMockRequest, getStepUpFlowSummary } from "../lib/stepUpFlow.js";
import { buildMetricRows, buildPriorities, getSnapshot } from "../lib/snapshotHelpers.js";
import { getSystemStatus } from "../lib/systemStatus.js";
import { getDensityClass, getFocusClass } from "../lib/uiPreferences.js";
import { createWorkflowIntent } from "../lib/workflowIntents.js";
import { getWorkerDetailSummary } from "../lib/workerDetails.js";
import DrawerPanel from "./DrawerPanel.jsx";
import FocusSnapshot from "./FocusSnapshot.jsx";
import PriorityQueue from "./PriorityQueue.jsx";
import SideRail from "./SideRail.jsx";
import SystemStatusStrip from "./SystemStatusStrip.jsx";
import TopBar from "./TopBar.jsx";
import UiControlPanel from "./UiControlPanel.jsx";

export default function AppShell() {
  const visibleEntities = useMemo(() => getVisibleEntities(), []);
  const visibleRoles = useMemo(() => getVisibleRoles(), []);
  const devChecks = useMemo(() => runDevChecks(), []);
  const allRoleCards = useMemo(() => getAllRoleCards(), []);
  const batchSummary = useMemo(() => getBatchSummary(), []);

  const [activeRoom, setActiveRoom] = useState("command");
  const [activeEntity, setActiveEntity] = useState("world");
  const [activeRole, setActiveRole] = useState("owner");
  const [activeDrawer, setActiveDrawer] = useState(profiles.command.drawers[0][0]);
  const [workflowIntents, setWorkflowIntents] = useState([]);
  const [localNotes, setLocalNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [stepUpReason, setStepUpReason] = useState("");
  const [stepUpMocks, setStepUpMocks] = useState([]);
  const [density, setDensity] = useState("balanced");
  const [focusMode, setFocusMode] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");

  const room = rooms.find((item) => item.key === activeRoom) || rooms[0];
  const profile = profiles[activeRoom] || profiles.command;
  const entity = resolveEntity(visibleEntities, activeEntity);
  const role = resolveRole(visibleRoles, activeRole);
  const snapshot = getSnapshot(entity.key);

  const metricRows = buildMetricRows(profile, snapshot);
  const priorities = buildPriorities(profile, snapshot, role);

  const saveStatus = useAutoSave(
    {
      activeRoom,
      activeEntity,
      activeRole,
      activeDrawer,
      density,
      focusMode,
    },
    {
      storageKey: "the-teller-ui-state",
      intervalMs: 15000,
    }
  );

  const paySkySummary = useMemo(() => getPaySkySummary(entity.key, snapshot), [entity.key, snapshot]);
  const calendarSummary = useMemo(() => getCalendarSummary(entity.key), [entity.key]);
  const activityTimeline = useMemo(() => getActivityTimeline(entity.key, workflowIntents), [entity.key, workflowIntents]);
  const approvalSummary = useMemo(() => getApprovalSummary(entity.key), [entity.key]);
  const documentRequestSummary = useMemo(() => getDocumentRequestSummary(entity.key), [entity.key]);
  const sealWorkflowSummary = useMemo(() => getSealWorkflowSummary(entity.key), [entity.key]);
  const stepUpFlowSummary = useMemo(() => getStepUpFlowSummary(entity.key), [entity.key]);
  const workerDetailSummary = useMemo(() => getWorkerDetailSummary(entity.key), [entity.key]);
  const payrollDetailSummary = useMemo(() => getPayrollDetailSummary(entity.key), [entity.key]);
  const moneyMovementDetailSummary = useMemo(() => getMoneyMovementDetailSummary(entity.key), [entity.key]);
  const proofPacketDetailSummary = useMemo(() => getProofPacketDetailSummary(entity.key), [entity.key]);
  const securityDetailSummary = useMemo(() => getSecurityDetailSummary(entity.key), [entity.key]);
  const foundationLaneSummary = useMemo(() => getFoundationLaneSummary(entity.key), [entity.key]);
  const debtDetailSummary = useMemo(() => getDebtDetailSummary(entity.key), [entity.key]);
  const givingDetailSummary = useMemo(() => getGivingDetailSummary(entity.key), [entity.key]);
  const payOnboardSummary = useMemo(() => getPayOnboardSummary(entity.key), [entity.key]);
  const payRunSummary = useMemo(() => getPayRunSummary(entity.key), [entity.key]);
  const payFlowSummary = useMemo(() => getPayFlowSummary(entity.key), [entity.key]);
  const payProofSummary = useMemo(() => getPayProofSummary(entity.key), [entity.key]);
  const payGuardSummary = useMemo(() => getPayGuardSummary(entity.key), [entity.key]);
  const modelSummaries = useMemo(() => buildModelSummaries(entity.key), [entity.key]);
  const emptyState = useMemo(() => getEmptyState(entity.key, activeDrawer), [entity.key, activeDrawer]);

  const roleSafetySummary = useMemo(() => getRoleSafetySummary(role, entity.key), [role, entity.key]);

  const companyScopeSummary = useMemo(
    () => getCompanyScopeSummary({ visibleEntities, activeEntity: entity.key, role }),
    [visibleEntities, entity.key, role]
  );


  const calmModeSummary = useMemo(
    () =>
      buildCalmModeSummary({
        entity,
        snapshot,
        paySkySummary,
        approvalSummary,
        documentRequestSummary,
        sealWorkflowSummary,
        stepUpFlowSummary,
      }),
    [entity, snapshot, paySkySummary, approvalSummary, documentRequestSummary, sealWorkflowSummary, stepUpFlowSummary]
  );

  const systemStatus = useMemo(() => getSystemStatus(devChecks, saveStatus), [devChecks, saveStatus]);

  const appModeClass = `${getDensityClass(density)} ${getFocusClass(focusMode)}`;

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

  function handleCreateStepUpMock() {
    const mock = createStepUpMockRequest({
      entity,
      drawer: activeDrawer,
      reason: stepUpReason,
    });

    setStepUpMocks((current) => [mock, ...current].slice(0, 6));
    if (stepUpReason.trim()) setStepUpReason("");
  }

  function handleAddNote() {
    const cleanText = noteDraft.trim();
    if (!cleanText) return;

    const note = createLocalNote({
      entity,
      drawer: activeDrawer,
      text: cleanText,
    });

    setLocalNotes((current) => [note, ...current].slice(0, 10));
    setNoteDraft("");
  }

  function handleWorkflowAction(action) {
    const intent = createWorkflowIntent({
      action,
      entity,
      drawer: activeDrawer,
      recordTitle: `${room.label} / ${profile.drawerTitle}`,
    });

    setWorkflowIntents((current) => [intent, ...current].slice(0, 8));
  }

  return (
    <div className={`app-root ${appModeClass}`}>
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

          <UiControlPanel
            density={density}
            setDensity={setDensity}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
          />

          <SystemStatusStrip status={systemStatus} />

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
            payProofSummary={payProofSummary}
            payGuardSummary={payGuardSummary}
            paySkySummary={paySkySummary}
            calendarSummary={calendarSummary}
            workflowIntents={workflowIntents}
            onWorkflowAction={handleWorkflowAction}
            localNotes={localNotes}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            onAddNote={handleAddNote}
            activityTimeline={activityTimeline}
            approvalSummary={approvalSummary}
            documentRequestSummary={documentRequestSummary}
            sealWorkflowSummary={sealWorkflowSummary}
            stepUpFlowSummary={stepUpFlowSummary}
            stepUpReason={stepUpReason}
            setStepUpReason={setStepUpReason}
            onCreateStepUp={handleCreateStepUpMock}
            latestStepUp={stepUpMocks[0] || null}
            companyScopeSummary={companyScopeSummary}
            setActiveEntity={setActiveEntity}
            roleSafetySummary={roleSafetySummary}
            allRoleCards={allRoleCards}
            batchSummary={batchSummary}
            workerDetailSummary={workerDetailSummary}
            payrollDetailSummary={payrollDetailSummary}
            moneyMovementDetailSummary={moneyMovementDetailSummary}
            proofPacketDetailSummary={proofPacketDetailSummary}
            securityDetailSummary={securityDetailSummary}
            foundationLaneSummary={foundationLaneSummary}
            debtDetailSummary={debtDetailSummary}
            givingDetailSummary={givingDetailSummary}
            saveStatus={saveStatus}
            autoSaveRecoveryEnabled={true}
            calmModeSummary={calmModeSummary}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            utilitiesOpen={utilitiesOpen}
            setUtilitiesOpen={setUtilitiesOpen}
            emptyState={emptyState}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            quickFilter={quickFilter}
            setQuickFilter={setQuickFilter}
          />
        </main>
      </div>
    </div>
  );
}
