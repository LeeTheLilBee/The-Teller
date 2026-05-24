import { motion } from "framer-motion";
import { calendarItems } from "../data/tellerSeed.js";
import { simpleDrawerContent } from "../config/drawerProfiles.js";
import DevChecks from "./DevChecks.jsx";
import PayOnboardPanel from "./PayOnboardPanel.jsx";
import PayRunPanel from "./PayRunPanel.jsx";
import PayFlowPanel from "./PayFlowPanel.jsx";
import RestrictedFundsPanel from "./RestrictedFundsPanel.jsx";
import PayProofPanel from "./PayProofPanel.jsx";
import PayProofDetailGrid from "./PayProofDetailGrid.jsx";
import PayGuardPanel from "./PayGuardPanel.jsx";
import PayGuardDetailGrid from "./PayGuardDetailGrid.jsx";
import PaySkyPanel from "./PaySkyPanel.jsx";
import PayCalendarPanel from "./PayCalendarPanel.jsx";
import ActionBar from "./ActionBar.jsx";
import IntentStatus from "./IntentStatus.jsx";
import SelectedIntentPanel from "./SelectedIntentPanel.jsx";
import RecentIntents from "./RecentIntents.jsx";
import NotesPanel from "./NotesPanel.jsx";
import ActivityTimeline from "./ActivityTimeline.jsx";
import ApprovalCenterPanel from "./ApprovalCenterPanel.jsx";
import DocumentRequestPanel from "./DocumentRequestPanel.jsx";
import ProofSealPanel from "./ProofSealPanel.jsx";
import StepUpFlowPanel from "./StepUpFlowPanel.jsx";
import CompanyScopePanel from "./CompanyScopePanel.jsx";
import RoleSafetyPanel from "./RoleSafetyPanel.jsx";
import BatchSummaryPanel from "./BatchSummaryPanel.jsx";

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
  payRunSummary,
  payFlowSummary,
  payProofSummary,
  payGuardSummary,
  paySkySummary,
  calendarSummary,
  workflowIntents,
  onWorkflowAction,
  localNotes,
  noteDraft,
  setNoteDraft,
  onAddNote,
  activityTimeline,
  approvalSummary,
  documentRequestSummary,
  sealWorkflowSummary,
  stepUpFlowSummary,
  stepUpReason,
  setStepUpReason,
  onCreateStepUp,
  latestStepUp,
  companyScopeSummary,
  setActiveEntity,
  roleSafetySummary,
  allRoleCards,
  batchSummary,
}) {
  const modelCards = modelSummaries?.[activeDrawer] || [];
  const latestIntent = workflowIntents?.[0] || null;

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

      <div className="drawer-action-zone">
        <ActionBar drawerKey={activeDrawer} onAction={onWorkflowAction} />
        <IntentStatus latestIntent={latestIntent} />
      </div>

      <CompanyScopePanel summary={companyScopeSummary} activeEntity={entity.key} setActiveEntity={setActiveEntity} />
      <RoleSafetyPanel summary={roleSafetySummary} allRoleCards={allRoleCards} />
      <BatchSummaryPanel summary={batchSummary} />
      <SelectedIntentPanel latestIntent={latestIntent} intentCount={workflowIntents?.length || 0} />
      <RecentIntents intents={workflowIntents} />
      <div className="support-grid">
        <NotesPanel notes={localNotes} noteDraft={noteDraft} setNoteDraft={setNoteDraft} onAddNote={onAddNote} entity={entity} />
        <ActivityTimeline items={activityTimeline} />
      </div>

      <motion.div key={activeDrawer} className="drawer-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

        {activeDrawer === "workerLanes" && (
          <PayOnboardPanel summary={payOnboardSummary} entity={entity} />
        )}



        {activeDrawer === "docs" && (
          <DocumentRequestPanel summary={documentRequestSummary} entity={entity} />
        )}

        {activeDrawer === "approvals" && (
          <ApprovalCenterPanel summary={approvalSummary} entity={entity} />
        )}

        {activeDrawer === "payRun" && (
          <PayRunPanel summary={payRunSummary} entity={entity} />
        )}




        {activeDrawer === "calendar" && (
          <PayCalendarPanel summary={calendarSummary} entity={entity} />
        )}

        {activeDrawer === "doors" && (
          <PayGuardPanel summary={payGuardSummary} entity={entity} />
        )}

        {activeDrawer === "stepUp" && (
          <StepUpFlowPanel
            summary={stepUpFlowSummary}
            entity={entity}
            stepUpReason={stepUpReason}
            setStepUpReason={setStepUpReason}
            onCreateStepUp={onCreateStepUp}
            latestStepUp={latestStepUp}
          />
        )}

        {activeDrawer === "redaction" && (
          <StepUpFlowPanel
            summary={stepUpFlowSummary}
            entity={entity}
            stepUpReason={stepUpReason}
            setStepUpReason={setStepUpReason}
            onCreateStepUp={onCreateStepUp}
            latestStepUp={latestStepUp}
          />
        )}

        {activeDrawer === "proof" && (
          <>
            <PayProofPanel summary={payProofSummary} entity={entity} />
            <ProofSealPanel summary={sealWorkflowSummary} entity={entity} />
          </>
        )}

        {activeDrawer === "docs" && (
          <PayProofDetailGrid title={`${entity.label} document proof`} cards={payProofSummary.documentCards} />
        )}

        {activeDrawer === "foundationDocs" && (
          <PayProofDetailGrid title={`${entity.label} foundation documents`} cards={payProofSummary.foundationCards} dark />
        )}

        {activeDrawer === "cashFlow" && (
          <PayFlowPanel summary={payFlowSummary} entity={entity} />
        )}

        {activeDrawer === "restricted" && (
          <RestrictedFundsPanel summary={payFlowSummary} entity={entity} />
        )}


        {activeDrawer === "exceptions" &&
          payRunSummary.exceptionCards.map((item) => (
            <div className="info-tile" key={`${activeDrawer}-${item.title}`}>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
              {item.meta && <div className="tile-note">{item.meta}</div>}
            </div>
          ))}



        {activeDrawer === "rollup" && (
          <PaySkyPanel summary={paySkySummary} entity={entity} />
        )}

        {false && activeDrawer === "rollup" &&
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

        {false && activeDrawer === "calendar" &&
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

        {!["rollup", "workerLanes", "payRun", "exceptions", "approvals", "cashFlow", "restricted", "proof", "docs", "foundationDocs", "doors", "stepUp", "redaction", "calendar"].includes(activeDrawer) && modelCards.length > 0 &&
          modelCards.map((item) => (
            <div className="info-tile" key={`${activeDrawer}-${item.title}`}>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
              {item.meta && <div className="tile-note">{item.meta}</div>}
            </div>
          ))}

        {!["rollup", "workerLanes", "payRun", "exceptions", "approvals", "cashFlow", "restricted", "proof", "docs", "foundationDocs", "doors", "stepUp", "redaction", "calendar"].includes(activeDrawer) && modelCards.length === 0 &&
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
