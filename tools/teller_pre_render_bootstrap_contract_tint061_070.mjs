
import assert
  from "node:assert/strict";

import {
  prepareTellerBeforeReactMount,
} from "../src/teller/tellerPreRenderBootstrap.js";

import {
  bootstrapTellerFromTower,
  TOWER_TELLER_EXCHANGE_V1,
  TOWER_TELLER_EXCHANGE_V2,
  TOWER_TELLER_EXCHANGE_VERSION,
  TOWER_TELLER_PERSISTENCE_EXCHANGE_VERSION,
} from "../src/teller/towerAccess.js";


const TOKEN =
  "tpt1.eyJ0ZXN0Ijp0cnVlfQ.pre_render_signature";


function locationWithHandoff() {
  return {
    pathname:
      "/teller",

    search:
      "",

    hash:
      "#tower_handoff=opaque_twr_v2_code",
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


function v2Payload() {
  return {
    exchange_version:
      "tower-teller-exchange.v2",

    access_verified:
      true,

    app_id:
      "teller",

    role:
      "owner",

    target_path:
      "/teller",

    receipt_id:
      "tower_receipt_070",

    tower_session_id:
      "tower_session_070",

    actor_id:
      "owner_actor_070",

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
        "corr_070",
    },
  };
}


assert.equal(
  TOWER_TELLER_EXCHANGE_V1,
  "tower-teller-exchange.v1"
);


assert.equal(
  TOWER_TELLER_EXCHANGE_V2,
  "tower-teller-exchange.v2"
);


assert.equal(
  TOWER_TELLER_EXCHANGE_VERSION,
  TOWER_TELLER_EXCHANGE_V1
);


assert.equal(
  TOWER_TELLER_PERSISTENCE_EXCHANGE_VERSION,
  TOWER_TELLER_EXCHANGE_V2
);


let requestBody = null;

const windowLike = {};

const history =
  makeHistory();


const result =
  await prepareTellerBeforeReactMount({
    windowLike,

    locationLike:
      locationWithHandoff(),

    historyLike:
      history,

    env: {
      PROD:
        true,

      DEV:
        false,

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
        assert.equal(
          url,
          "https://simplee-tower-ob.onrender.com/tower/teller/exchange"
        );


        requestBody =
          JSON.parse(
            options.body
          );


        return {
          ok:
            true,

          async json() {
            return v2Payload();
          },
        };
      },
  });


assert.equal(
  result.ready,
  true
);


assert.equal(
  result.status,
  "ready"
);


assert.equal(
  result.source,
  "tower_exchange_v2"
);


assert.equal(
  result.exchangeVersion,
  "tower-teller-exchange.v2"
);


assert.equal(
  requestBody.exchange_version,
  "tower-teller-exchange.v2"
);


assert.equal(
  requestBody.handoff_code,
  "opaque_twr_v2_code"
);


assert.equal(
  requestBody.client,
  "the-teller"
);


assert.equal(
  Object.prototype.hasOwnProperty.call(
    requestBody,
    "persistence_access_token"
  ),
  false
);


assert.ok(
  windowLike
    .__TELLER_TOWER_SESSION__
);


assert.equal(
  windowLike
    .__TELLER_TOWER_SESSION__
    .tower_session_id,
  "tower_session_070"
);


assert.equal(
  windowLike
    .__TELLER_TOWER_SESSION__
    .tower_receipt_id,
  "tower_receipt_070"
);


assert.equal(
  windowLike
    .__TELLER_TOWER_SESSION__
    .actor
    .id,
  "owner_actor_070"
);


assert.equal(
  windowLike
    .__TELLER_TOWER_SESSION__
    .business
    .key,
  "simplee_world_staging"
);


assert.equal(
  windowLike
    .__TELLER_TOWER_SESSION__
    .persistence_access_token,
  TOKEN
);


assert.equal(
  Object.prototype.hasOwnProperty.call(
    result,
    "persistence_access_token"
  ),
  false
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


/*
 * A v1 response cannot satisfy a v2 pre-render request.
 */
const wrongVersion =
  await prepareTellerBeforeReactMount({
    windowLike:
      {},

    locationLike:
      locationWithHandoff(),

    historyLike:
      makeHistory(),

    env: {
      PROD:
        true,

      DEV:
        false,

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
            ...v2Payload(),

            exchange_version:
              "tower-teller-exchange.v1",
          };
        },
      }),
  });


assert.equal(
  wrongVersion.ready,
  false
);


assert.equal(
  wrongVersion.status,
  "locked"
);


/*
 * Production direct-open fails closed.
 */
const noHandoff =
  await prepareTellerBeforeReactMount({
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

      DEV:
        false,
    },

    fetchImpl:
      async () => {
        throw new Error(
          "fetch must not run"
        );
      },
  });


assert.equal(
  noHandoff.ready,
  false
);


assert.equal(
  noHandoff.reason,
  "tower_handoff_required"
);


/*
 * DEV remains UI-only without persistence authority.
 */
const devOnly =
  await prepareTellerBeforeReactMount({
    windowLike:
      {},

    locationLike: {
      pathname:
        "/teller",

      search:
        "?tower_clearance=owner",

      hash:
        "",
    },

    historyLike:
      makeHistory(),

    env: {
      PROD:
        false,

      DEV:
        true,
    },

    fetchImpl:
      async () => {
        throw new Error(
          "fetch must not run"
        );
      },
  });


assert.equal(
  devOnly.ready,
  true
);


assert.equal(
  devOnly.source,
  "development_ui_only"
);


/*
 * Historical low-level v1 remains reproducible.
 */
const legacy =
  await bootstrapTellerFromTower({
    windowLike:
      {},

    locationLike:
      locationWithHandoff(),

    historyLike:
      makeHistory(),

    env: {
      PROD:
        true,

      VITE_TOWER_TELLER_EXCHANGE_URL:
        "https://simplee-tower-ob.onrender.com/tower/teller/exchange",
    },

    exchangeVersion:
      TOWER_TELLER_EXCHANGE_V1,

    nowEpoch:
      1900000000,

    fetchImpl:
      async () => ({
        ok:
          true,

        async json() {
          return {
            ...v2Payload(),

            exchange_version:
              "tower-teller-exchange.v1",
          };
        },
      }),
  });


assert.equal(
  legacy.status,
  "granted"
);


console.log(
  "TINT061-TINT070 PRE-RENDER BOOTSTRAP CONTRACT PASSED"
);

console.log(
  "Historical exchange v1: preserved"
);

console.log(
  "Persistence exchange v2: explicit"
);

console.log(
  "Production pre-render version: v2"
);

console.log(
  "v1 response to v2 request: blocked"
);

console.log(
  "Production direct-open without Tower handoff: blocked"
);

console.log(
  "Persistence token returned into bootstrap result: NO"
);

console.log(
  "Persistence token in history: NO"
);

console.log(
  "DEV UI-only fallback: preserved"
);
