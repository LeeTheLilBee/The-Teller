/*
 * Teller Pack 060A
 *
 * Frontend half of protected Tower -> Teller launch.
 *
 * Hosted query parameters NEVER grant clearance.
 * Query role shortcuts exist only in explicit local Vite development.
 */

export const TELLER_APP_ID = "teller";
export const TELLER_OWNER_ENTRY_PATH = "/teller";

export const TOWER_TELLER_EXCHANGE_VERSION =
  "tower-teller-exchange.v1";

export const TOWER_HANDOFF_FRAGMENT_KEY =
  "tower_handoff";

const LEGACY_CLEARANCE_QUERY_KEY =
  "tower_clearance";

const DEV_ENABLED_VALUES = new Set([
  "1",
  "true",
  "yes",
  "on",
]);

const DEV_CLEARANCES = new Set([
  "employee",
  "manager",
  "owner",
  "tower",
]);


const HOSTED_NAVIGATION_SOURCE_APPS = new Set([
  "tower",
  "clouds",
]);

const HOSTED_NAVIGATION_RETURN_APPS = new Set([
  "tower",
  "clouds",
]);

const OWNER_DESTINATIONS = new Set([
  "owner_money_workspace",
  "payroll_review",
]);

const SAFE_NAVIGATION_TOKEN =
  /^[A-Za-z0-9._:-]+$/;


function clean(value) {
  return String(
    value ?? ""
  ).trim();
}


function lower(value) {
  return clean(
    value
  ).toLowerCase();
}


export function tellerDevShortcutsEnabled(
  env = {}
) {
  return Boolean(
    env?.DEV === true &&
    DEV_ENABLED_VALUES.has(
      lower(
        env?.VITE_TELLER_DEV_CLEARANCE_ENABLED
      )
    )
  );
}


export function readLegacyQueryClearance(
  locationLike
) {
  const params =
    new URLSearchParams(
      clean(
        locationLike?.search
      )
    );

  return lower(
    params.get(
      LEGACY_CLEARANCE_QUERY_KEY
    )
  );
}


export function readTowerHandoffCode(
  locationLike
) {
  const rawHash = clean(
    locationLike?.hash
  );

  const hash =
    rawHash.startsWith("#")
      ? rawHash.slice(1)
      : rawHash;

  if (!hash) {
    return "";
  }

  const params =
    new URLSearchParams(
      hash
    );

  return clean(
    params.get(
      TOWER_HANDOFF_FRAGMENT_KEY
    )
  );
}


function locked(reason) {
  return {
    status: "locked",
    clearance: "",
    source: "none",
    reason,
    receiptId: "",
    expiresAtEpoch: null,
  };
}


function granted({
  clearance,
  source,
  receiptId = "",
  expiresAtEpoch = null,
  navigationContext = null,
}) {
  return {
    status: "granted",
    clearance,
    source,
    reason: "",
    receiptId,
    expiresAtEpoch,
    navigationContext,
  };
}


function safeNavigationToken(
  value,
  {
    required = false,
    maximumLength = 96,
  } = {}
) {
  const text = clean(
    value
  );

  if (!text) {
    return required
      ? null
      : "";
  }

  if (
    text.length > maximumLength ||
    !SAFE_NAVIGATION_TOKEN.test(
      text
    )
  ) {
    return null;
  }

  return text;
}


export function normalizeTowerNavigationContext(
  value
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const sourceApp =
    safeNavigationToken(
      value.source_app,
      {
        required: true,
        maximumLength: 32,
      }
    );

  const destinationApp =
    safeNavigationToken(
      value.destination_app,
      {
        required: true,
        maximumLength: 32,
      }
    );

  const destination =
    safeNavigationToken(
      value.destination,
      {
        required: true,
        maximumLength: 96,
      }
    );

  const itemId =
    safeNavigationToken(
      value.item_id,
      {
        required: false,
        maximumLength: 128,
      }
    );

  const returnApp =
    safeNavigationToken(
      value.return_app,
      {
        required: true,
        maximumLength: 32,
      }
    );

  const returnDestination =
    safeNavigationToken(
      value.return_destination,
      {
        required: true,
        maximumLength: 96,
      }
    );

  const correlationId =
    safeNavigationToken(
      value.correlation_id,
      {
        required: true,
        maximumLength: 96,
      }
    );

  if (
    !sourceApp ||
    !destinationApp ||
    !destination ||
    itemId === null ||
    !returnApp ||
    !returnDestination ||
    !correlationId
  ) {
    return null;
  }

  if (
    !HOSTED_NAVIGATION_SOURCE_APPS.has(
      sourceApp
    )
  ) {
    return null;
  }

  if (
    destinationApp
    !== TELLER_APP_ID
  ) {
    return null;
  }

  /*
   * Tower may safely transport a destination token.
   * Teller decides whether that destination
   * actually exists inside Teller.
   */
  if (
    !OWNER_DESTINATIONS.has(
      destination
    )
  ) {
    return null;
  }

  if (
    !HOSTED_NAVIGATION_RETURN_APPS.has(
      returnApp
    )
  ) {
    return null;
  }

  return {
    source_app:
      sourceApp,

    destination_app:
      destinationApp,

    destination,

    item_id:
      itemId,

    return_app:
      returnApp,

    return_destination:
      returnDestination,

    correlation_id:
      correlationId,
  };
}


export function sanitizeTowerLaunchLocation({
  locationLike,
  historyLike,
}) {
  if (
    !historyLike ||
    typeof historyLike.replaceState
      !== "function"
  ) {
    return;
  }

  const pathname =
    clean(
      locationLike?.pathname
    )
    || "/";

  const query =
    new URLSearchParams(
      clean(
        locationLike?.search
      )
    );

  query.delete(
    "tower_clearance"
  );

  query.delete(
    "teller_view"
  );

  const remaining =
    query.toString();

  historyLike.replaceState(
    null,
    "",
    pathname
    + (
      remaining
        ? `?${remaining}`
        : ""
    )
  );
}


export async function resolveTellerAccess({
  locationLike,
  historyLike,
  fetchImpl,
  env = {},
  nowEpoch = Date.now() / 1000,
} = {}) {

  const devEnabled =
    tellerDevShortcutsEnabled(
      env
    );

  const legacyClearance =
    readLegacyQueryClearance(
      locationLike
    );

  if (
    devEnabled &&
    DEV_CLEARANCES.has(
      legacyClearance
    )
  ) {
    return granted({
      clearance:
        legacyClearance,

      source:
        "explicit_local_development",
    });
  }

  const handoffCode =
    readTowerHandoffCode(
      locationLike
    );

  if (!handoffCode) {

    if (legacyClearance) {
      return locked(
        "legacy_query_clearance_rejected"
      );
    }

    return locked(
      "tower_handoff_required"
    );
  }

  const exchangeUrl =
    clean(
      env?.VITE_TOWER_TELLER_EXCHANGE_URL
    );

  if (!exchangeUrl) {
    return locked(
      "tower_exchange_not_configured"
    );
  }

  if (
    env?.PROD === true &&
    !exchangeUrl.startsWith(
      "https://"
    )
  ) {
    return locked(
      "tower_exchange_https_required"
    );
  }

  if (
    typeof fetchImpl
    !== "function"
  ) {
    return locked(
      "tower_exchange_transport_unavailable"
    );
  }

  let response;

  try {
    response = await fetchImpl(
      exchangeUrl,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          "Accept":
            "application/json",

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            handoff_code:
              handoffCode,

            client:
              "the-teller",

            exchange_version:
              TOWER_TELLER_EXCHANGE_VERSION,
          }),
      }
    );
  } catch {
    return locked(
      "tower_exchange_request_failed"
    );
  }

  if (
    !response ||
    response.ok !== true
  ) {
    return locked(
      "tower_exchange_denied"
    );
  }

  let payload;

  try {
    payload =
      await response.json();
  } catch {
    return locked(
      "tower_exchange_response_invalid"
    );
  }

  if (
    payload?.exchange_version
      !== TOWER_TELLER_EXCHANGE_VERSION ||

    payload?.access_verified
      !== true ||

    payload?.app_id
      !== TELLER_APP_ID ||

    payload?.role
      !== "owner" ||

    payload?.target_path
      !== TELLER_OWNER_ENTRY_PATH
  ) {
    return locked(
      "tower_exchange_claims_invalid"
    );
  }

  const receiptId =
    clean(
      payload?.receipt_id
    );

  const expiresAtEpoch =
    Number(
      payload?.expires_at_epoch
    );

  if (
    !receiptId ||
    !Number.isFinite(
      expiresAtEpoch
    ) ||
    expiresAtEpoch <= Number(
      nowEpoch
    )
  ) {
    return locked(
      "tower_exchange_receipt_invalid"
    );
  }

  const navigationContext =
    normalizeTowerNavigationContext(
      payload?.navigation_context
    );

  if (!navigationContext) {
    return locked(
      "tower_exchange_navigation_invalid"
    );
  }

  sanitizeTowerLaunchLocation({
    locationLike,
    historyLike,
  });

  return granted({
    clearance:
      "owner",

    source:
      "tower_handoff_exchange",

    receiptId,

    expiresAtEpoch,

    navigationContext,
  });
}
