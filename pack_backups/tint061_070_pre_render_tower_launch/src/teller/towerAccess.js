
/*
 * The Teller — Hosted Tower Bootstrap
 * TINT051–TINT060
 *
 * SECURITY MODEL
 * --------------
 *
 * Tower sends only an opaque one-time handoff code through
 * the launch fragment.
 *
 * Teller exchanges that code directly with Tower over HTTPS.
 *
 * The short-lived Teller persistence bearer token is returned
 * only inside the successful Tower exchange response.
 *
 * That bearer token is installed only into the live in-memory
 * Tower session object:
 *
 *   window.__TELLER_TOWER_SESSION__.persistence_access_token
 *
 * It is never written to:
 *
 *   - query parameters
 *   - URL fragments
 *   - localStorage
 *   - sessionStorage
 *   - history state
 *   - HTML
 *   - logs
 */


export const TELLER_APP_ID =
  "teller";


export const TELLER_ENTRY_PATH =
  "/teller";


export const TOWER_TELLER_EXCHANGE_VERSION =
  "tower-teller-exchange.v1";


export const TOWER_HANDOFF_FRAGMENT_KEY =
  "tower_handoff";


const ALLOWED_TELLER_ROLES =
  new Set([
    "employee",
    "manager",
    "owner",
  ]);


const HOSTED_NAVIGATION_SOURCE_APPS =
  new Set([
    "tower",
    "clouds",
  ]);


const HOSTED_NAVIGATION_RETURN_APPS =
  new Set([
    "tower",
    "clouds",
  ]);


const OWNER_DESTINATIONS =
  new Set([
    "owner_money_workspace",
    "payroll_review",
  ]);


const SAFE_NAVIGATION_TOKEN =
  /^[A-Za-z0-9._:-]+$/;


const TPT1_TOKEN_SHAPE =
  /^tpt1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;


function clean(
  value
) {
  return String(
    value ?? ""
  ).trim();
}


function lower(
  value
) {
  return clean(
    value
  ).toLowerCase();
}


function safeNavigationToken(
  value,
  {
    required = false,
    maximumLength = 128,
  } = {}
) {
  const text =
    clean(
      value
    );


  if (!text) {
    return required
      ? null
      : "";
  }


  if (
    text.length >
      maximumLength ||
    !SAFE_NAVIGATION_TOKEN.test(
      text
    )
  ) {
    return null;
  }


  return text;
}


export function readTowerHandoffCode(
  locationLike
) {
  const rawHash =
    clean(
      locationLike?.hash
    );


  const hash =
    rawHash.startsWith(
      "#"
    )
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


export function sanitizeTowerLaunchLocation({
  locationLike,
  historyLike,
} = {}) {
  if (
    !historyLike ||
    typeof historyLike.replaceState
      !== "function"
  ) {
    return false;
  }


  const pathname =
    clean(
      locationLike?.pathname
    ) ||
    "/";


  const query =
    new URLSearchParams(
      clean(
        locationLike?.search
      )
    );


  /*
   * Preserve the old hosted launch cleanup.
   *
   * Neither legacy query value is allowed to linger
   * after a verified Tower exchange.
   */
  query.delete(
    "tower_clearance"
  );

  query.delete(
    "teller_view"
  );


  const remaining =
    query.toString();


  /*
   * IMPORTANT:
   *
   * No hash is carried forward.
   * No persistence token enters history state.
   *
   * History state itself remains null.
   */
  historyLike.replaceState(
    null,
    "",
    pathname +
    (
      remaining
        ? `?${remaining}`
        : ""
    )
  );


  return true;
}


export function normalizeTowerNavigationContext(
  value
) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return null;
  }


  const sourceApp =
    safeNavigationToken(
      value.source_app,
      {
        required:
          true,

        maximumLength:
          32,
      }
    );


  const destinationApp =
    safeNavigationToken(
      value.destination_app,
      {
        required:
          true,

        maximumLength:
          32,
      }
    );


  const destination =
    safeNavigationToken(
      value.destination,
      {
        required:
          true,

        maximumLength:
          96,
      }
    );


  const itemId =
    safeNavigationToken(
      value.item_id,
      {
        maximumLength:
          128,
      }
    );


  const returnApp =
    safeNavigationToken(
      value.return_app,
      {
        required:
          true,

        maximumLength:
          32,
      }
    );


  const returnDestination =
    safeNavigationToken(
      value.return_destination,
      {
        required:
          true,

        maximumLength:
          96,
      }
    );


  const correlationId =
    safeNavigationToken(
      value.correlation_id,
      {
        required:
          true,

        maximumLength:
          96,
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
    !HOSTED_NAVIGATION_SOURCE_APPS
      .has(
        sourceApp
      )
  ) {
    return null;
  }


  if (
    destinationApp !==
      TELLER_APP_ID
  ) {
    return null;
  }


  /*
   * Preserve the hosted Teller destination boundary
   * already enforced by the prior Tower handoff layer.
   *
   * A syntactically valid destination token is not
   * automatically an authorized Teller destination.
   */
  if (
    !OWNER_DESTINATIONS.has(
      destination
    )
  ) {
    return null;
  }


  if (
    !HOSTED_NAVIGATION_RETURN_APPS
      .has(
        returnApp
      )
  ) {
    return null;
  }


  return Object.freeze({
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
  });
}


function notRequested() {
  return Object.freeze({
    status:
      "not_requested",

    reason:
      "",

    receiptId:
      "",

    navigationContext:
      null,
  });
}


function locked(
  reason
) {
  return Object.freeze({
    status:
      "locked",

    reason:
      clean(
        reason
      ) ||
      "tower_bootstrap_failed",

    receiptId:
      "",

    navigationContext:
      null,
  });
}


function granted({
  receiptId,
  navigationContext,
}) {
  /*
   * DO NOT return the persistence token from this function.
   *
   * React state may hold this result.
   * The token belongs only in the live Tower window session.
   */
  return Object.freeze({
    status:
      "granted",

    reason:
      "",

    receiptId:
      clean(
        receiptId
      ),

    navigationContext,
  });
}


function normalizeExchangeUrl({
  value,
  prod = false,
} = {}) {
  const candidate =
    clean(
      value
    );


  if (!candidate) {
    return "";
  }


  let parsed;


  try {
    parsed =
      new URL(
        candidate
      );

  } catch {
    return "";
  }


  if (
    parsed.protocol ===
      "https:"
  ) {
    return candidate;
  }


  const loopback =
    parsed.hostname ===
      "localhost" ||
    parsed.hostname ===
      "127.0.0.1" ||
    parsed.hostname ===
      "::1";


  if (
    prod !== true &&
    parsed.protocol ===
      "http:" &&
    loopback
  ) {
    return candidate;
  }


  return "";
}


function normalizeExchangePayload(
  payload,
  {
    nowEpoch,
  }
) {
  if (
    !payload ||
    typeof payload !==
      "object" ||
    Array.isArray(
      payload
    )
  ) {
    return null;
  }


  if (
    payload.exchange_version !==
      TOWER_TELLER_EXCHANGE_VERSION ||
    payload.access_verified !==
      true ||
    payload.app_id !==
      TELLER_APP_ID ||
    payload.target_path !==
      TELLER_ENTRY_PATH
  ) {
    return null;
  }


  const role =
    lower(
      payload.role
    );


  if (
    !ALLOWED_TELLER_ROLES.has(
      role
    )
  ) {
    return null;
  }


  /*
   * Existing Tower exchange field.
   *
   * We intentionally preserve receipt_id here because
   * Tower already issues it in the TWR189 bootstrap response.
   */
  const receiptId =
    clean(
      payload.receipt_id
    );


  /*
   * New fields Tower must return to the hosted Teller receiver.
   */
  const towerSessionId =
    clean(
      payload.tower_session_id
    );


  const actorId =
    clean(
      payload.actor_id
    );


  const businessKey =
    clean(
      payload.business_key
    );


  const persistenceAccessToken =
    clean(
      payload.persistence_access_token
    );


  const expiresAtEpoch =
    Number(
      payload.expires_at_epoch
    );


  if (
    !receiptId ||
    !towerSessionId ||
    !actorId ||
    !businessKey ||
    !persistenceAccessToken
  ) {
    return null;
  }


  if (
    !TPT1_TOKEN_SHAPE.test(
      persistenceAccessToken
    )
  ) {
    return null;
  }


  if (
    !Number.isFinite(
      expiresAtEpoch
    ) ||
    expiresAtEpoch <=
      Number(
        nowEpoch
      )
  ) {
    return null;
  }


  const navigationContext =
    normalizeTowerNavigationContext(
      payload.navigation_context
    );


  if (!navigationContext) {
    return null;
  }


  return Object.freeze({
    role,

    receiptId,

    towerSessionId,

    actorId,

    businessKey,

    persistenceAccessToken,

    expiresAtEpoch,

    navigationContext,
  });
}


function installLiveTowerSession({
  windowLike,
  verified,
}) {
  if (
    !windowLike ||
    typeof windowLike !==
      "object"
  ) {
    return false;
  }


  const expiresAt =
    new Date(
      verified.expiresAtEpoch *
      1000
    ).toISOString();


  /*
   * MEMORY ONLY.
   *
   * This is the one approved browser location for the
   * short-lived persistence credential.
   *
   * No storage APIs are called here.
   */
  windowLike.__TELLER_TOWER_SESSION__ =
    Object.freeze({
      role:
        verified.role,

      session_id:
        verified.towerSessionId,

      tower_session_id:
        verified.towerSessionId,

      tower_receipt_id:
        verified.receiptId,

      actor: Object.freeze({
        id:
          verified.actorId,
      }),

      business: Object.freeze({
        key:
          verified.businessKey,
      }),

      navigation_context:
        verified.navigationContext,

      expires_at:
        expiresAt,

      persistence_access_token:
        verified.persistenceAccessToken,
    });


  return true;
}


export async function bootstrapTellerFromTower({
  windowLike =
    globalThis.window,

  locationLike =
    globalThis.window?.location,

  historyLike =
    globalThis.window?.history,

  fetchImpl =
    globalThis.fetch,

  env = {},

  nowEpoch =
    Date.now() /
    1000,
} = {}) {
  const handoffCode =
    readTowerHandoffCode(
      locationLike
    );


  if (!handoffCode) {
    return notRequested();
  }


  const exchangeUrl =
    normalizeExchangeUrl({
      value:
        env
          ?.VITE_TOWER_TELLER_EXCHANGE_URL,

      prod:
        env?.PROD ===
        true,
    });


  if (!exchangeUrl) {
    return locked(
      "tower_exchange_not_configured"
    );
  }


  if (
    typeof fetchImpl !==
      "function"
  ) {
    return locked(
      "tower_exchange_transport_unavailable"
    );
  }


  let response;


  try {
    response =
      await fetchImpl(
        exchangeUrl,
        {
          method:
            "POST",

          credentials:
            "include",

          referrerPolicy:
            "no-referrer",

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
    response.ok !==
      true
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


  const verified =
    normalizeExchangePayload(
      payload,
      {
        nowEpoch,
      }
    );


  if (!verified) {
    return locked(
      "tower_exchange_claims_invalid"
    );
  }


  /*
   * The one-time handoff code has now been consumed
   * successfully and the full exchange response has
   * passed Teller validation.
   *
   * Remove the opaque launch fragment BEFORE continuing.
   */
  if (
    !sanitizeTowerLaunchLocation({
      locationLike,
      historyLike,
    })
  ) {
    return locked(
      "tower_launch_fragment_cleanup_failed"
    );
  }


  if (
    !installLiveTowerSession({
      windowLike,
      verified,
    })
  ) {
    return locked(
      "tower_live_session_install_failed"
    );
  }


  return granted({
    receiptId:
      verified.receiptId,

    navigationContext:
      verified.navigationContext,
  });
}
