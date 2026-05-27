
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
