import { approvals } from "../data/approvalsSeed.js";
import { exportRequests } from "../data/payProofSeed.js";
import { stepUpRequests } from "../data/payGuardSeed.js";
import { payrollExceptions } from "../data/payrollSeed.js";
import { filterRecordsByEntity } from "./companyScope.js";

function card(title, detail, meta = "", tone = "steady") {
  return { title, detail, meta, tone };
}

export function getApprovalQueue(entityKey) {
  const approvalRecords = filterRecordsByEntity(approvals, entityKey).map((item) => ({
    id: item.id,
    entityKey: item.entityKey,
    source: "Approval",
    title: item.title,
    status: item.status,
    riskLevel: item.riskLevel,
    assignedRoleKey: item.assignedRoleKey,
    noSelfApproval: item.noSelfApproval,
    nextAction: item.nextAction,
  }));

  const exportRecords = filterRecordsByEntity(exportRequests, entityKey).map((item) => ({
    id: item.id,
    entityKey: item.entityKey,
    source: "Export",
    title: item.title,
    status: item.status,
    riskLevel: item.riskLevel,
    assignedRoleKey: "owner",
    noSelfApproval: true,
    nextAction: item.nextAction,
  }));

  const stepUpRecords = filterRecordsByEntity(stepUpRequests, entityKey).map((item) => ({
    id: item.id,
    entityKey: item.entityKey,
    source: "Step-Up",
    title: item.title,
    status: item.status,
    riskLevel: item.status === "Protected" ? "Protected" : "High",
    assignedRoleKey: item.requiredRole,
    noSelfApproval: item.reasonRequired,
    nextAction: item.nextAction,
  }));

  const exceptionRecords = filterRecordsByEntity(payrollExceptions, entityKey)
    .filter((item) => item.exceptionType === "Approval needed")
    .map((item) => ({
      id: item.id,
      entityKey: item.entityKey,
      source: "Payroll Exception",
      title: item.title,
      status: item.status,
      riskLevel: item.severity,
      assignedRoleKey: item.severity === "High" ? "owner" : "manager",
      noSelfApproval: true,
      nextAction: item.nextAction,
    }));

  return [...approvalRecords, ...exportRecords, ...stepUpRecords, ...exceptionRecords];
}

export function getApprovalSummary(entityKey) {
  const queue = getApprovalQueue(entityKey);

  const pending = queue.filter((item) => ["Pending", "Open", "Needs owner review", "Review", "Protected"].includes(item.status)).length;
  const highRisk = queue.filter((item) => ["High", "Protected", "Recipient-sensitive"].includes(item.riskLevel)).length;
  const noSelfApproval = queue.filter((item) => item.noSelfApproval).length;

  return {
    queue,
    total: queue.length,
    pending,
    highRisk,
    noSelfApproval,
    cards: queue.length
      ? queue.map((item) =>
          card(
            item.title,
            `${item.source} • ${item.status} • ${item.riskLevel}`,
            `Assigned to ${item.assignedRoleKey}. ${item.noSelfApproval ? "No self-approval." : "Self-approval not restricted."} ${item.nextAction}`,
            ["High", "Protected", "Recipient-sensitive"].includes(item.riskLevel) ? "guarded" : "steady"
          )
        )
      : [card("No approvals queued", "This company has no approval queue records.", "Clear", "steady")],
  };
}
