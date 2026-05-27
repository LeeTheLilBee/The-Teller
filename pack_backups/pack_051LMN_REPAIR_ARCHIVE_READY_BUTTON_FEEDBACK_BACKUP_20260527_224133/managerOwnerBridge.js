
const MANAGER_SUBMISSIONS_KEY = "the_teller_manager_submissions_v1";
const MANAGER_RETURN_QUEUE_KEY = "the_teller_manager_return_queue_v1";

function safeRead(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("the-teller-bridge-updated", { detail: { key } }));
  } catch {
    return false;
  }
  return true;
}

export function readManagerSubmissions() {
  if (typeof window === "undefined") return [];
  return safeRead(MANAGER_SUBMISSIONS_KEY);
}

export function saveManagerSubmission(item) {
  if (typeof window === "undefined") return [];
  const current = safeRead(MANAGER_SUBMISSIONS_KEY);
  const next = [item, ...current].slice(0, 50);
  safeWrite(MANAGER_SUBMISSIONS_KEY, next);
  return next;
}

export function readManagerReturnQueue() {
  if (typeof window === "undefined") return [];
  return safeRead(MANAGER_RETURN_QUEUE_KEY);
}

export function saveManagerReturnItem(item) {
  if (typeof window === "undefined") return [];
  const current = safeRead(MANAGER_RETURN_QUEUE_KEY);
  const next = [item, ...current].slice(0, 50);
  safeWrite(MANAGER_RETURN_QUEUE_KEY, next);
  return next;
}

export function updateManagerReturnItem(id, patch) {
  if (typeof window === "undefined") return [];
  const current = safeRead(MANAGER_RETURN_QUEUE_KEY);
  const next = current.map((item) => item.id === id ? { ...item, ...patch } : item);
  safeWrite(MANAGER_RETURN_QUEUE_KEY, next);
  return next;
}

export function createBridgeId(prefix) {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}


export function createManagerReReviewSubmission(returnItem, response) {
  const id = createBridgeId("MGR-REREVIEW");
  const createdAt = new Date().toISOString();

  const item = {
    id,
    key: id,
    businessKey: returnItem.businessKey || returnItem.activeBusiness || "simpleepay",
    source: "manager_return_response",
    label: "Manager re-review response",
    title: `Re-review · ${returnItem.title || "Returned manager item"}`,
    detail: response.managerResponse || "Manager responded to an owner send-back.",
    money: returnItem.money || "Needs owner re-review",
    status: response.proofStatus || "Ready for owner re-review",
    risk: response.risk || returnItem.risk || "Medium",
    proof: response.proofStatus || "Manager response proof",
    tower: Boolean(returnItem.tower || response.towerSensitive),
    person: returnItem.person || "Manager return item",
    submittedAt: createdAt,
    returnItemId: returnItem.id,
    managerBridge: {
      submittedBy: "Manager return queue",
      submittedAt: new Date(createdAt).toLocaleString(),
      managerDecision: response.correctionStatus || "Ready for owner re-review",
      managerRiskFlag: response.risk || returnItem.risk || "Medium",
      managerNote: response.managerResponse || "Manager responded and sent this item back to owner.",
      recommendation: response.recommendation || "Owner should re-review the manager response.",
      ownerDefault: "Owner re-review",
      disagreementRisk: Boolean(response.risk === "High" || response.towerSensitive),
      towerRequired: Boolean(returnItem.tower || response.towerSensitive),
    },
  };

  saveManagerSubmission(item);
  updateManagerReturnItem(returnItem.id, {
    managerStatus: "Sent back to owner",
    managerResponse: response.managerResponse,
    proofStatus: response.proofStatus,
    correctionStatus: response.correctionStatus,
    managerUpdatedAt: createdAt,
    reReviewSubmissionId: id,
  });

  return item;
}


const EMPLOYEE_MANAGER_QUEUE_KEY = "the_teller_employee_manager_queue_v1";
const TOWER_BACKUP_QUEUE_KEY = "the_teller_tower_backup_queue_v1";

export function readEmployeeManagerQueue() {
  if (typeof window === "undefined") return [];
  return safeRead(EMPLOYEE_MANAGER_QUEUE_KEY);
}

export function saveEmployeeManagerItem(item) {
  if (typeof window === "undefined") return [];
  const current = safeRead(EMPLOYEE_MANAGER_QUEUE_KEY);
  const next = [item, ...current].slice(0, 75);
  safeWrite(EMPLOYEE_MANAGER_QUEUE_KEY, next);
  return next;
}

export function updateEmployeeManagerItem(id, patch) {
  if (typeof window === "undefined") return [];
  const current = safeRead(EMPLOYEE_MANAGER_QUEUE_KEY);
  const next = current.map((item) => item.id === id ? { ...item, ...patch } : item);
  safeWrite(EMPLOYEE_MANAGER_QUEUE_KEY, next);
  return next;
}

export function readTowerBackupQueue() {
  if (typeof window === "undefined") return [];
  return safeRead(TOWER_BACKUP_QUEUE_KEY);
}

export function saveTowerBackupItem(item) {
  if (typeof window === "undefined") return [];
  const current = safeRead(TOWER_BACKUP_QUEUE_KEY);
  const next = [item, ...current].slice(0, 100);
  safeWrite(TOWER_BACKUP_QUEUE_KEY, next);
  return next;
}

export function createTowerBackupItem({ source = "unknown", action = "Recorded action", target = "Unknown target", summary = "", payload = {} }) {
  const id = createBridgeId("TOWER-BACKUP");
  const createdAt = new Date().toISOString();

  return {
    id,
    source,
    action,
    target,
    summary,
    payload,
    createdAt,
    status: "Backed up locally for Tower",
    deliveryMode: "local_handoff_until_tower_api",
  };
}


const EMPLOYEE_RESPONSE_QUEUE_KEY = "the_teller_employee_response_queue_v1";

export function readEmployeeResponseQueue() {
  if (typeof window === "undefined") return [];
  return safeRead(EMPLOYEE_RESPONSE_QUEUE_KEY);
}

export function saveEmployeeResponseItem(item) {
  if (typeof window === "undefined") return [];
  const current = safeRead(EMPLOYEE_RESPONSE_QUEUE_KEY);
  const next = [item, ...current].slice(0, 75);
  safeWrite(EMPLOYEE_RESPONSE_QUEUE_KEY, next);
  return next;
}

export function createEmployeeResponseItem(request, response) {
  const id = createBridgeId("EMP-RESPONSE");
  const createdAt = new Date().toISOString();

  return {
    id,
    requestId: request.id,
    employeeName: request.employeeName || "Employee",
    businessKey: request.businessKey || "simpleepay",
    title: response.title || `Manager response · ${request.title}`,
    body: response.body || "Manager responded to your request.",
    responseStatus: response.responseStatus || "Manager responded",
    proofStatus: response.proofStatus || request.proofStatus || "Manager reviewed",
    managerName: response.managerName || "Manager Portal",
    towerBackedUp: true,
    createdAt,
  };
}


export function createEmployeeDecisionResponseItem(request, decision) {
  const id = createBridgeId("EMP-DECISION");
  const createdAt = new Date().toISOString();

  const decisionLabel = decision?.decisionStatus || "Manager reviewed";
  const managerNote = decision?.managerNote || "Manager reviewed your request.";

  return {
    id,
    requestId: request.id,
    employeeName: request.employeeName || "Employee",
    businessKey: request.businessKey || "simpleepay",
    title: `${decisionLabel} · ${request.title}`,
    body: managerNote,
    responseStatus: decisionLabel,
    proofStatus: decision?.proofStatus || request.proofStatus || "Manager reviewed",
    managerName: decision?.managerName || "Manager Portal",
    towerBackedUp: true,
    createdAt,
  };
}


export function createEmployeeTowerDecisionResponseItem(requestPayload, decision) {
  const id = createBridgeId("EMP-TOWER-DECISION");
  const createdAt = new Date().toISOString();

  const employeeName =
    requestPayload?.employeeName ||
    requestPayload?.payload?.employeeName ||
    requestPayload?.request?.employeeName ||
    "Employee";

  const businessKey =
    requestPayload?.businessKey ||
    requestPayload?.payload?.businessKey ||
    requestPayload?.request?.businessKey ||
    "simpleepay";

  const sourceTitle =
    requestPayload?.title ||
    requestPayload?.target ||
    requestPayload?.action ||
    "Tower record request";

  const decisionStatus = decision?.decisionStatus || "Manager reviewed Tower request";
  const managerNote = decision?.managerNote || "Manager reviewed your Tower request.";

  return {
    id,
    requestId: requestPayload?.id || requestPayload?.requestId || "unknown",
    employeeName,
    businessKey,
    title: `${decisionStatus} · ${sourceTitle}`,
    body: managerNote,
    responseStatus: decisionStatus,
    proofStatus: decision?.proofStatus || "Tower request reviewed",
    managerName: decision?.managerName || "Manager Tower View",
    towerBackedUp: true,
    createdAt,
  };
}


const OWNER_ESCALATION_QUEUE_KEY = "the_teller_owner_escalation_queue_v1";
const FINAL_RESOLUTION_PACKET_KEY = "the_teller_final_resolution_packets_v1";

export function readOwnerEscalationQueue() {
  if (typeof window === "undefined") return [];
  return safeRead(OWNER_ESCALATION_QUEUE_KEY);
}

export function saveOwnerEscalationItem(item) {
  if (typeof window === "undefined") return [];
  const current = safeRead(OWNER_ESCALATION_QUEUE_KEY);
  const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 100);
  safeWrite(OWNER_ESCALATION_QUEUE_KEY, next);
  return next;
}

export function updateOwnerEscalationItem(id, patch) {
  if (typeof window === "undefined") return [];
  const current = safeRead(OWNER_ESCALATION_QUEUE_KEY);
  const next = current.map((item) =>
    item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
  );
  safeWrite(OWNER_ESCALATION_QUEUE_KEY, next);
  return next;
}

export function createOwnerEscalationItem(sourceRequest, escalation = {}) {
  const id = createBridgeId("OWNER-ESCALATION");
  const createdAt = new Date().toISOString();

  return {
    id,
    source: "manager_board",
    sourceRequestId: sourceRequest?.id || "unknown",
    employeeName: sourceRequest?.employeeName || "Employee",
    businessKey: sourceRequest?.businessKey || "simpleepay",
    title: escalation.title || `Owner review · ${sourceRequest?.title || "Employee request"}`,
    body: escalation.body || sourceRequest?.body || "Manager escalated this item for owner/Tower review.",
    requestType: sourceRequest?.requestType || "manager_escalation",
    proofStatus: sourceRequest?.proofStatus || "Manager reviewed",
    urgency: sourceRequest?.urgency || "Normal",
    managerStatus: sourceRequest?.managerStatus || "Sent upward",
    ownerStatus: "Needs owner review",
    escalationReason: escalation.reason || "Manager sent this item upward for owner/Tower review.",
    managerNote: escalation.managerNote || "",
    sourceRequest,
    towerBackedUp: true,
    createdAt,
    updatedAt: createdAt,
  };
}

export function readFinalResolutionPackets() {
  if (typeof window === "undefined") return [];
  return safeRead(FINAL_RESOLUTION_PACKET_KEY);
}

export function saveFinalResolutionPacket(packet) {
  if (typeof window === "undefined") return [];
  const current = safeRead(FINAL_RESOLUTION_PACKET_KEY);
  const next = [packet, ...current.filter((entry) => entry.id !== packet.id)].slice(0, 150);
  safeWrite(FINAL_RESOLUTION_PACKET_KEY, next);
  return next;
}

export function createFinalResolutionPacket(item, resolution = {}) {
  const id = createBridgeId("FINAL-RECEIPT");
  const createdAt = new Date().toISOString();

  return {
    id,
    source: "owner_dashboard",
    sourceEscalationId: item?.id || "unknown",
    sourceRequestId: item?.sourceRequestId || item?.sourceRequest?.id || "unknown",
    employeeName: item?.employeeName || "Employee",
    businessKey: item?.businessKey || "simpleepay",
    title: `${resolution.status || "Resolved"} · ${item?.title || "Owner escalation"}`,
    body: resolution.note || "Owner reviewed and resolved this escalated item.",
    resolutionStatus: resolution.status || "Resolved",
    ownerNote: resolution.note || "",
    towerBackedUp: true,
    createdAt,
    payload: {
      escalation: item,
      resolution,
    },
  };
}


export function updateFinalResolutionPacket(id, patch = {}) {
  if (typeof window === "undefined") return [];
  const current = readFinalResolutionPackets();
  const next = current.map((packet) =>
    packet.id === id ? { ...packet, ...patch, updatedAt: new Date().toISOString() } : packet
  );
  safeWrite("the_teller_final_resolution_packets_v1", next);
  return next;
}

export function getFinalReceiptArchiveStatus(packet = {}) {
  if (packet.archiveReady) {
    return {
      status: "Archive Vault ready",
      tone: "ready",
      summary: "This receipt has enough structure to be handed to Archive Vault later.",
    };
  }

  if (packet.towerBackedUp) {
    return {
      status: "Tower-backed, archive prep pending",
      tone: "pending",
      summary: "This receipt is Tower-backed and can be prepared for Archive Vault.",
    };
  }

  return {
    status: "Needs Tower backup",
    tone: "warning",
    summary: "This receipt should not be treated as complete until a Tower backup exists.",
  };
}
