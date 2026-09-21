
import assert
  from "node:assert/strict";

import {
  bootstrapTellerFromTower,
  readTowerHandoffCode,
} from "../src/teller/towerAccess.js";


const TOKEN =
  "tpt1.eyJ0ZXN0Ijp0cnVlfQ.bootstrap_signature";


function makeLocation() {
  return {
    pathname:
      "/teller",

    search:
      "",

    hash:
      "#tower_handoff=opaque_twr188_code",
  };
}


function makeHistory() {
  const calls = [];


  return {
    calls,

    replaceState(
      state,
      title,
      url
    ) {
      calls.push({
        state,
        title,
        url,
      });
    },
  };
}


function makeWindow() {
  return {};
}


function goodPayload() {
  return {
    exchange_version:
      "tower-teller-exchange.v1",

    access_verified:
      true,

    app_id:
      "teller",

    role:
      "owner",

    target_path:
      "/teller",

    receipt_id:
      "tower_receipt_060",

    tower_session_id:
      "tower_session_060",

    actor_id:
      "owner_actor_060",

    business_key:
      "simplee_world_staging",

    expires_at_epoch:
      2000000000,

    persistence_access_token:
      TOKEN,

    navigation_context: {
      source_app:
        "tower",

      destination_app:
        "teller",

      destination:
        "owner_money_workspace",

      item_id:
        "",

      return_app:
        "tower",

      return_destination:
        "access_home",

      correlation_id:
        "corr_060",
    },
  };
}


const location =
  makeLocation();

const history =
  makeHistory();

const windowLike =
  makeWindow();


assert.equal(
  readTowerHandoffCode(
    location
  ),
  "opaque_twr188_code"
);


let capturedRequest = null;


const result =
  await bootstrapTellerFromTower({
    windowLike,

    locationLike:
      location,

    historyLike:
      history,

    env: {
      PROD:
        true,

      VITE_TOWER_TELLER_EXCHANGE_URL:
        "https://simplee-tower-ob.onrender.com/tower/teller/exchange",
    },

    nowEpoch:
      1900000000,

    fetchImpl:
      async (
        url,
        options
      ) => {
        capturedRequest = {
          url,
          options,
        };


        return {
          ok:
            true,

          async json() {
            return goodPayload();
          },
        };
      },
  });


assert.equal(
  result.status,
  "granted"
);


assert.equal(
  Object.prototype.hasOwnProperty.call(
    result,
    "persistence_access_token"
  ),
  false
);


assert.equal(
  result.receiptId,
  "tower_receipt_060"
);


assert.equal(
  capturedRequest.url,
  "https://simplee-tower-ob.onrender.com/tower/teller/exchange"
);


assert.equal(
  capturedRequest.options.method,
  "POST"
);


assert.equal(
  capturedRequest.options.credentials,
  "include"
);


assert.equal(
  capturedRequest.options.referrerPolicy,
  "no-referrer"
);


const requestBody =
  JSON.parse(
    capturedRequest.options.body
  );


assert.deepEqual(
  requestBody,
  {
    handoff_code:
      "opaque_twr188_code",

    client:
      "the-teller",

    exchange_version:
      "tower-teller-exchange.v1",
  }
);


assert.equal(
  Object.prototype.hasOwnProperty.call(
    requestBody,
    "persistence_access_token"
  ),
  false
);


assert.equal(
  history.calls.length,
  1
);


assert.equal(
  history.calls[0].state,
  null
);


assert.equal(
  history.calls[0].url,
  "/teller"
);


assert.equal(
  history.calls[0].url.includes(
    "tower_handoff"
  ),
  false
);


/*
 * Existing hosted launch hardening must survive
 * the new persistence bootstrap receiver.
 */
const cleanupHistory =
  makeHistory();


const cleanupResult =
  await bootstrapTellerFromTower({
    windowLike:
      makeWindow(),

    locationLike: {
      pathname:
        "/teller",

      search:
        "?tower_clearance=owner&teller_view=legacy&keep=safe",

      hash:
        "#tower_handoff=opaque_cleanup_code",
    },

    historyLike:
      cleanupHistory,

    env: {
      PROD:
        true,

      VITE_TOWER_TELLER_EXCHANGE_URL:
        "https://simplee-tower-ob.onrender.com/tower/teller/exchange",
    },

    nowEpoch:
      1900000000,

    fetchImpl:
      async () => ({
        ok:
          true,

        async json() {
          return goodPayload();
        },
      }),
  });


assert.equal(
  cleanupResult.status,
  "granted"
);


assert.equal(
  cleanupHistory.calls.length,
  1
);


assert.equal(
  cleanupHistory.calls[0].url,
  "/teller?keep=safe"
);


const invalidDestination =
  await bootstrapTellerFromTower({
    windowLike:
      makeWindow(),

    locationLike:
      makeLocation(),

    historyLike:
      makeHistory(),

    env: {
      PROD:
        true,

      VITE_TOWER_TELLER_EXCHANGE_URL:
        "https://simplee-tower-ob.onrender.com/tower/teller/exchange",
    },

    nowEpoch:
      1900000000,

    fetchImpl:
      async () => ({
        ok:
          true,

        async json() {
          return {
            ...goodPayload(),

            navigation_context: {
              ...goodPayload()
                .navigation_context,

              destination:
                "unknown_hosted_destination",
            },
          };
        },
      }),
  });


assert.equal(
  invalidDestination.status,
  "locked"
);


assert.equal(
  invalidDestination.reason,
  "tower_exchange_claims_invalid"
);


assert.equal(
  history.calls[0].url.includes(
    "tower_handoff"
  ),
  false
);


assert.equal(
  history.calls[0].url.includes(
    TOKEN
  ),
  false
);


const live =
  windowLike
    .__TELLER_TOWER_SESSION__;


assert.ok(
  live
);


assert.equal(
  live.role,
  "owner"
);


assert.equal(
  live.session_id,
  "tower_session_060"
);


assert.equal(
  live.tower_session_id,
  "tower_session_060"
);


assert.equal(
  live.tower_receipt_id,
  "tower_receipt_060"
);


assert.equal(
  live.actor.id,
  "owner_actor_060"
);


assert.equal(
  live.business.key,
  "simplee_world_staging"
);


assert.equal(
  live.persistence_access_token,
  TOKEN
);


assert.equal(
  JSON.stringify(
    result
  ).includes(
    TOKEN
  ),
  false
);


assert.equal(
  JSON.stringify(
    history.calls
  ).includes(
    TOKEN
  ),
  false
);


const missingTokenWindow = {};


const missingToken =
  await bootstrapTellerFromTower({
    windowLike:
      missingTokenWindow,

    locationLike:
      makeLocation(),

    historyLike:
      makeHistory(),

    env: {
      PROD:
        true,

      VITE_TOWER_TELLER_EXCHANGE_URL:
        "https://simplee-tower-ob.onrender.com/tower/teller/exchange",
    },

    nowEpoch:
      1900000000,

    fetchImpl:
      async () => ({
        ok:
          true,

        async json() {
          const payload =
            goodPayload();

          delete payload
            .persistence_access_token;

          return payload;
        },
      }),
  });


assert.equal(
  missingToken.status,
  "locked"
);


assert.equal(
  missingTokenWindow
    .__TELLER_TOWER_SESSION__,
  undefined
);


const noHandoff =
  await bootstrapTellerFromTower({
    windowLike:
      {},

    locationLike: {
      pathname:
        "/teller",

      search:
        "",

      hash:
        "",
    },

    historyLike:
      makeHistory(),

    env: {
      PROD:
        true,

      VITE_TOWER_TELLER_EXCHANGE_URL:
        "https://simplee-tower-ob.onrender.com/tower/teller/exchange",
    },

    fetchImpl:
      async () => {
        throw new Error(
          "fetch must not run"
        );
      },
  });


assert.equal(
  noHandoff.status,
  "not_requested"
);


const insecure =
  await bootstrapTellerFromTower({
    windowLike:
      {},

    locationLike:
      makeLocation(),

    historyLike:
      makeHistory(),

    env: {
      PROD:
        true,

      VITE_TOWER_TELLER_EXCHANGE_URL:
        "http://simplee-tower-ob.onrender.com/tower/teller/exchange",
    },
  });


assert.equal(
  insecure.status,
  "locked"
);


assert.equal(
  insecure.reason,
  "tower_exchange_not_configured"
);


console.log(
  "TINT051-TINT060 HOSTED TOWER BOOTSTRAP CONTRACT PASSED"
);

console.log(
  "Opaque one-time tower_handoff fragment: accepted"
);

console.log(
  "Tower HTTPS exchange: required"
);

console.log(
  "persistence_access_token response field: required"
);

console.log(
  "Persistence token in exchange request: NO"
);

console.log(
  "Persistence token in returned bootstrap result: NO"
);

console.log(
  "Persistence token in history state: NO"
);

console.log(
  "Persistence token in sanitized URL: NO"
);

console.log(
  "Persistence token live memory install: YES"
);

console.log(
  "Missing persistence token: fail closed"
);

console.log(
  "Reload without fresh handoff: no token recovery path"
);
