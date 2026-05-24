import { profiles, simpleDrawerContent } from "../config/drawerProfiles.js";
import { rooms } from "../config/rooms.js";
import { payrollExceptions, payrollRuns, fundingSources } from "../data/payrollSeed.js";
import { reserveBuckets, restrictedFunds, cashMovementRules, moneyMovements } from "../data/payFlowSeed.js";
import { exportRequests, proofRequirements, sealedPacketRules } from "../data/payProofSeed.js";
import { securityDoors, stepUpRequests, redactionRules, deniedActions, revealRequests } from "../data/payGuardSeed.js";
import { documentRequests } from "../data/documentRequestsSeed.js";
import { proofPackets } from "../data/proofSeed.js";
import { calendarItems } from "../data/tellerSeed.js";
import {
  assignedEntityKeys,
  assignedRoleKeys,
  debtCatalog,
  entities,
  foundationDocs,
  givingPrograms,
  roles,
  snapshots,
  worldRollup,
} from "../data/tellerSeed.js";

const BUILT_IN_DRAWERS = ["rollup", "debt", "giving", "calendar", "foundationDocs"];

export function runDevChecks() {
  const roomKeys = rooms.map((room) => room.key);
  const entityKeys = entities.map((entity) => entity.key);
  const roleKeys = roles.map((role) => role.key);
  const profileDrawerKeys = Object.values(profiles).flatMap((profile) => profile.drawers.map(([key]) => key));

  return [
    { name: "Every room has a profile", pass: roomKeys.every((key) => Boolean(profiles[key])) },
    { name: "Every profile has at least four drawers", pass: Object.values(profiles).every((profile) => profile.drawers.length >= 4) },
    { name: "Every custom drawer has content", pass: profileDrawerKeys.every((key) => BUILT_IN_DRAWERS.includes(key) || Boolean(simpleDrawerContent[key])) },
    { name: "Assigned entities exist", pass: assignedEntityKeys.every((key) => entityKeys.includes(key)) },
    { name: "Assigned PayRoles exist", pass: assignedRoleKeys.every((key) => roleKeys.includes(key)) },
    { name: "Every visible entity has a snapshot", pass: assignedEntityKeys.every((key) => Boolean(snapshots[key])) },
    { name: "Role dashboards point to real rooms", pass: roles.every((role) => roomKeys.includes(role.dashboardRoom)) },
    { name: "Role entity scopes point to real entities", pass: roles.every((role) => role.entityKeys.every((key) => entityKeys.includes(key))) },
    { name: "Simplee World rollup includes SimpleeSafeHaven", pass: worldRollup.some((item) => item.key === "safehaven") },
    { name: "Debt catalog records are entity-scoped", pass: debtCatalog.every((item) => entityKeys.includes(item.entityKey) && item.balance && item.due && item.status) },
    { name: "Giving programs exist for each active entity except parent", pass: assignedEntityKeys.filter((key) => key !== "world").every((key) => givingPrograms.some((item) => item.entityKey === key)) },
    { name: "Foundation documents stay scoped to protected records", pass: foundationDocs.every((item) => item.id && item.category && item.status) },
    { name: "Payroll runs are entity-scoped", pass: payrollRuns.every((item) => entityKeys.includes(item.entityKey) && item.grossPay && item.status) },
    { name: "Payroll exceptions point to payroll runs", pass: payrollExceptions.every((item) => payrollRuns.some((run) => run.id === item.payRunId)) },
    { name: "Funding sources are entity-scoped", pass: fundingSources.every((item) => entityKeys.includes(item.entityKey) && item.maskedAccount) },
    { name: "Reserve buckets are entity-scoped", pass: reserveBuckets.every((item) => entityKeys.includes(item.entityKey) && item.current && item.target) },
    { name: "Restricted funds stay in foundation lane", pass: restrictedFunds.every((item) => item.entityKey === "safehaven" && item.amount && item.status) },
    { name: "Cash movement rules are entity-scoped", pass: cashMovementRules.every((item) => entityKeys.includes(item.entityKey) && item.ruleType && item.status) },
    { name: "Money movements are entity-scoped", pass: moneyMovements.every((item) => entityKeys.includes(item.entityKey) && item.amount && item.status) },
    { name: "Export requests are entity-scoped", pass: exportRequests.every((item) => entityKeys.includes(item.entityKey) && item.riskLevel && item.redactionStatus) },
    { name: "Proof requirements are entity-scoped", pass: proofRequirements.every((item) => entityKeys.includes(item.entityKey) && item.requiredItems.length > 0) },
    { name: "Sealed packet rules are entity-scoped", pass: sealedPacketRules.every((item) => entityKeys.includes(item.entityKey) && item.status && item.detail) },
    { name: "Security doors are entity-scoped", pass: securityDoors.every((item) => entityKeys.includes(item.entityKey) && item.status && item.sensitivity) },
    { name: "Step-up requests are entity-scoped", pass: stepUpRequests.every((item) => entityKeys.includes(item.entityKey) && item.requiredRole && item.status) },
    { name: "Redaction rules are entity-scoped", pass: redactionRules.every((item) => entityKeys.includes(item.entityKey) && item.defaultState && item.revealRule) },
    { name: "Denied actions are entity-scoped", pass: deniedActions.every((item) => entityKeys.includes(item.entityKey) && item.reason && item.status) },
    { name: "Reveal requests are entity-scoped", pass: revealRequests.every((item) => entityKeys.includes(item.entityKey) && item.sensitivity && item.status) },
    { name: "Calendar items have labels and dates", pass: calendarItems.every((item) => item.label && item.date && item.scope) },
    { name: "Document requests are entity-scoped", pass: documentRequests.every((item) => entityKeys.includes(item.entityKey) && item.requestType && item.status) },
    { name: "Proof packets have receipt counts", pass: proofPackets.every((item) => entityKeys.includes(item.entityKey) && typeof item.receiptCount === "number") },
    { name: "Step-up requests requiring reasons declare reasonRequired", pass: stepUpRequests.every((item) => typeof item.reasonRequired === "boolean") },
  ];
}

export function getDevCheckSummary(checks) {
  const failed = checks.filter((check) => !check.pass);

  return {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    healthy: failed.length === 0,
  };
}
