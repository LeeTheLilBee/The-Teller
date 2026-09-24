
import {
  bootstrapTellerFromTower,
  readTowerHandoffCode,
  TOWER_TELLER_PERSISTENCE_EXCHANGE_VERSION,
} from "./towerAccess.js";


const TPT1_TOKEN_SHAPE =
  /^tpt1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;


function clean(
  value
) {
  return String(
    value ?? ""
  ).trim();
}


function liveTowerPersistenceSession(
  windowLike
) {
  const raw =
    windowLike
      ?.__TELLER_TOWER_SESSION__;


  if (
    !raw ||
    typeof raw !==
      "object"
  ) {
    return false;
  }


  const sessionId =
    clean(
      raw.tower_session_id ||
      raw.session_id ||
      raw.sessionId
    );


  const receiptId =
    clean(
      raw.tower_receipt_id ||
      raw.towerReceiptId
    );


  const actorId =
    clean(
      raw.actor?.id ||
      raw.actor?.actor_id ||
      raw.actor?.actorId
    );


  const businessKey =
    clean(
      raw.business?.key ||
      raw.business?.business_key ||
      raw.business?.businessKey
    );


  const role =
    clean(
      raw.role
    ).toLowerCase();


  const token =
    clean(
      raw.persistence_access_token ||
      raw.persistenceAccessToken
    );


  return Boolean(
    sessionId &&
    receiptId &&
    actorId &&
    businessKey &&
    (
      role === "employee" ||
      role === "manager" ||
      role === "owner"
    ) &&
    TPT1_TOKEN_SHAPE.test(
      token
    )
  );
}


function ready({
  source,
  receiptId = "",
  navigationContext = null,
} = {}) {
  /*
   * SAFE RESULT ONLY.
   *
   * Persistence bearer is intentionally absent.
   */
  return Object.freeze({
    ready:
      true,

    status:
      "ready",

    reason:
      "",

    source:
      clean(
        source
      ),

    receiptId:
      clean(
        receiptId
      ),

    navigationContext:
      navigationContext ||
      null,

    exchangeVersion:
      TOWER_TELLER_PERSISTENCE_EXCHANGE_VERSION,

    persistenceTokenReturned:
      false,
  });
}


function locked(
  reason
) {
  return Object.freeze({
    ready:
      false,

    status:
      "locked",

    reason:
      clean(
        reason
      ) ||
      "tower_pre_render_bootstrap_failed",

    source:
      "tower_pre_render",

    receiptId:
      "",

    navigationContext:
      null,

    exchangeVersion:
      TOWER_TELLER_PERSISTENCE_EXCHANGE_VERSION,

    persistenceTokenReturned:
      false,
  });
}


export async function prepareTellerBeforeReactMount({
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
  /*
   * Same-document continuation is allowed if a valid
   * live persistence session already exists.
   *
   * A page reload destroys this memory-only object.
   */
  if (
    liveTowerPersistenceSession(
      windowLike
    )
  ) {
    return ready({
      source:
        "existing_live_tower_session",
    });
  }


  const handoffCode =
    readTowerHandoffCode(
      locationLike
    );


  if (!handoffCode) {
    /*
     * Explicit Vite-development UI-only convenience.
     *
     * No persistence bearer is issued here.
     */
    if (
      env?.DEV ===
      true &&
      env?.PROD !==
      true
    ) {
      return ready({
        source:
          "development_ui_only",
      });
    }


    return locked(
      "tower_handoff_required"
    );
  }


  const exchange =
    await bootstrapTellerFromTower({
      windowLike,

      locationLike,

      historyLike,

      fetchImpl,

      env,

      exchangeVersion:
        TOWER_TELLER_PERSISTENCE_EXCHANGE_VERSION,

      nowEpoch,
    });


  if (
    exchange?.status !==
      "granted"
  ) {
    return locked(
      exchange?.reason ||
      "tower_exchange_denied"
    );
  }


  /*
   * Exchange success alone is not enough.
   *
   * The verified live persistence session must exist
   * before React is allowed to mount.
   */
  if (
    !liveTowerPersistenceSession(
      windowLike
    )
  ) {
    return locked(
      "tower_live_persistence_session_missing"
    );
  }


  return ready({
    source:
      "tower_exchange_v2",

    receiptId:
      exchange.receiptId,

    navigationContext:
      exchange.navigationContext,
  });
}


const PRE_MOUNT_MESSAGES =
  Object.freeze({
    tower_handoff_required:
      "The Teller must be opened through The Tower.",

    tower_exchange_not_configured:
      "The protected Tower connection is not configured.",

    tower_exchange_transport_unavailable:
      "The protected Tower connection is unavailable.",

    tower_exchange_request_failed:
      "The Tower handoff could not be verified.",

    tower_exchange_denied:
      "The Tower did not authorize this Teller launch.",

    tower_exchange_response_invalid:
      "The Tower returned an invalid Teller handoff.",

    tower_exchange_claims_invalid:
      "The Tower handoff did not contain valid Teller authority.",

    tower_exchange_version_unsupported:
      "The Tower and Teller exchange versions do not match.",

    tower_launch_fragment_cleanup_failed:
      "The protected launch could not be finalized safely.",

    tower_live_session_install_failed:
      "The protected Teller session could not be established.",

    tower_live_persistence_session_missing:
      "The Teller persistence session was not established.",

    tower_pre_render_bootstrap_failed:
      "The protected Teller launch could not be completed.",
  });


export function renderTellerPreMountSurface(
  rootElement,
  {
    state = "opening",
    reason = "",
  } = {}
) {
  if (
    !rootElement ||
    typeof rootElement.replaceChildren
      !== "function"
  ) {
    return false;
  }


  const documentLike =
    rootElement.ownerDocument ||
    globalThis.document;


  if (
    !documentLike ||
    typeof documentLike.createElement
      !== "function"
  ) {
    return false;
  }


  const shell =
    documentLike.createElement(
      "main"
    );


  shell.className =
    "teller-shell";


  const wrap =
    documentLike.createElement(
      "div"
    );


  wrap.className =
    "teller-lock-wrap";


  const card =
    documentLike.createElement(
      "section"
    );


  card.className =
    "teller-lock-card";


  const kicker =
    documentLike.createElement(
      "p"
    );


  kicker.className =
    "teller-kicker";


  const title =
    documentLike.createElement(
      "h1"
    );


  const body =
    documentLike.createElement(
      "p"
    );


  if (
    state ===
      "opening"
  ) {
    kicker.textContent =
      "Tower handoff";

    title.textContent =
      "Opening The Teller…";

    body.textContent =
      "The Teller is verifying the protected Tower launch before the application starts.";

  } else {
    kicker.textContent =
      "Tower clearance required";

    title.textContent =
      "The Teller opens from The Tower.";

    body.textContent =
      PRE_MOUNT_MESSAGES[
        clean(
          reason
        )
      ] ||
      PRE_MOUNT_MESSAGES
        .tower_pre_render_bootstrap_failed;
  }


  card.append(
    kicker,
    title,
    body
  );


  wrap.append(
    card
  );


  shell.append(
    wrap
  );


  rootElement.replaceChildren(
    shell
  );


  return true;
}


export function clearTellerPreMountSurface(
  rootElement
) {
  if (
    !rootElement ||
    typeof rootElement.replaceChildren
      !== "function"
  ) {
    return false;
  }


  rootElement.replaceChildren();


  return true;
}
