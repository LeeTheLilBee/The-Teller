
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
