
const TELLER_FEEDBACK_KEY = "the_teller_beta_feedback_v1";

function safeReadFeedback() {
  try {
    const raw = window.localStorage.getItem(TELLER_FEEDBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteFeedback(items) {
  try {
    window.localStorage.setItem(TELLER_FEEDBACK_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("the-teller-feedback-updated", { detail: { count: items.length } }));
  } catch {
    // local feedback is optional in demo mode
  }
}

export function readTellerBetaFeedback() {
  if (typeof window === "undefined") return [];
  return safeReadFeedback();
}

export function saveTellerBetaFeedback(entry = {}) {
  if (typeof window === "undefined") return [];

  const current = safeReadFeedback();
  const feedback = {
    id: entry.id || `FB-${Date.now()}`,
    role: entry.role || "unknown",
    screen: entry.screen || "unknown",
    rating: entry.rating || "",
    message: entry.message || "",
    createdAt: entry.createdAt || new Date().toISOString(),
    status: entry.status || "new",
  };

  const next = [feedback, ...current].slice(0, 200);
  safeWriteFeedback(next);
  return next;
}

export function clearTellerBetaFeedback() {
  if (typeof window === "undefined") return [];
  safeWriteFeedback([]);
  return [];
}

export function getTellerFeedbackSummary() {
  const items = readTellerBetaFeedback();
  const byRole = items.reduce((acc, item) => {
    const role = item.role || "unknown";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  return {
    total: items.length,
    byRole,
    latest: items[0] || null,
  };
}
