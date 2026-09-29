const ALLOWED_TELLER_ROLES = Object.freeze([
  "employee",
  "manager",
  "owner",
]);

const SESSION_STORAGE_KEY = "the_teller_tower_runtime_session_v1";


function clean(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}


function normalizeRole(value) {
  const role = clean(value).toLowerCase();

  return ALLOWED_TELLER_ROLES.includes(role)
    ? role
    : "";
}


function readStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
}


function normalizeSession(raw, source) {
  if (!raw || typeof raw !== "object") return null;

  const role = normalizeRole(
    raw.role ||
    raw.clearance ||
    raw.teller_role ||
    raw.tellerRole
  );

  if (!role) return null;

  return Object.freeze({
    role,
    source,

    sessionId: clean(
      raw.session_id ||
      raw.sessionId ||
      raw.tower_session_id
    ),

    towerReceiptId: clean(
      raw.tower_receipt_id ||
      raw.towerReceiptId
    ),

    actor:
      raw.actor && typeof raw.actor === "object"
        ? raw.actor
        : {},

    business:
      raw.business && typeof raw.business === "object"
        ? raw.business
        : {},

    work:
      raw.work && typeof raw.work === "object"
        ? raw.work
        : {},

    pay:
      raw.pay && typeof raw.pay === "object"
        ? raw.pay
        : {},

    issuedAt: clean(raw.issued_at || raw.issuedAt),
    expiresAt: clean(raw.expires_at || raw.expiresAt),

    towerIssued: source !== "dev_query_override",
  });
}


export function readTellerTowerSession() {
  if (typeof window === "undefined") return null;

  const injected = normalizeSession(
    window.__TELLER_TOWER_SESSION__,
    "tower_window_injection"
  );

  if (injected) return injected;

  const stored = normalizeSession(
    readStoredSession(),
    "tower_session_storage"
  );

  if (stored) return stored;

  /*
   * Browser development convenience only.
   * Vite compiles import.meta.env.DEV to false for production builds.
   */
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    const role = normalizeRole(params.get("tower_clearance"));

    if (role) {
      return normalizeSession(
        {
          role,
          actor: {
            name:
              role === "owner"
                ? "Owner"
                : role === "manager"
                  ? "Manager"
                  : "Employee",
          },
        },
        "dev_query_override"
      );
    }
  }

  return null;
}


export function getTellerRuntimeActor(expectedRole = "") {
  const session = readTellerTowerSession();

  const role =
    session?.role ||
    normalizeRole(expectedRole) ||
    "employee";

  const actor = session?.actor || {};
  const business = session?.business || {};
  const work = session?.work || {};
  const pay = session?.pay || {};

  const defaultName =
    role === "owner"
      ? "Owner"
      : role === "manager"
        ? "Manager"
        : "Employee";

  return Object.freeze({
    actorId: clean(
      actor.id ||
      actor.actor_id ||
      actor.actorId
    ),

    name: clean(
      actor.display_name ||
      actor.displayName ||
      actor.name,
      defaultName
    ),

    businessKey: clean(
      business.key ||
      business.business_key ||
      business.businessKey
    ),

    businessLabel: clean(
      business.label ||
      business.name,
      "Assigned business"
    ),

    role: clean(
      actor.job_title ||
      actor.jobTitle ||
      actor.role_label ||
      actor.roleLabel,
      defaultName
    ),

    manager: clean(
      actor.manager_name ||
      actor.managerName,
      "Manager"
    ),

    hours:
      work.hours === null || work.hours === undefined
        ? "—"
        : String(work.hours),

    payStatus: clean(
      pay.status,
      "No current pay status"
    ),

    nextPayday: clean(
      pay.next_payday ||
      pay.nextPayday,
      "—"
    ),
  });
}


export function isTowerIssuedTellerSession() {
  return Boolean(
    readTellerTowerSession()?.towerIssued
  );
}


export {
  ALLOWED_TELLER_ROLES,
  SESSION_STORAGE_KEY,
};
