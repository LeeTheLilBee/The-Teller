import assert from "node:assert/strict";

import {
  prepareTellerBeforeReactMount,
} from "../src/teller/tellerPreRenderBootstrap.js";

const NOW = 1_900_000_000;
const OLD_TOKEN = "tpt1.b2xk.c3RhbGU";
const NEW_TOKEN = "tpt1.bmV3.c2lnbmF0dXJl";
const EXCHANGE_URL =
  "https://simplee-tower-ob.onrender.com/tower/teller/exchange";

const PROD = Object.freeze({
  PROD: true,
  DEV: false,
  VITE_TOWER_TELLER_EXCHANGE_URL: EXCHANGE_URL,
});

function oldWindow() {
  return {
    __TELLER_TOWER_SESSION__: {
      role: "owner",
      session_id: "old_session",
      tower_receipt_id: "old_receipt",
      actor: { id: "old_actor" },
      business: { key: "old_business" },
      persistence_access_token: OLD_TOKEN,
    },
  };
}

function location(hash = "") {
  return {
    pathname: "/teller",
    search: "",
    hash,
  };
}

function history() {
  const calls = [];
  return {
    calls,
    replaceState(state, title, url) {
      calls.push({ state, title, url });
    },
  };
}

function responsePayload(overrides = {}) {
  return {
    exchange_version: "tower-teller-exchange.v2",
    access_verified: true,
    app_id: "teller",
    role: "owner",
    target_path: "/teller",
    receipt_id: "fresh_receipt",
    tower_session_id: "fresh_session",
    actor_id: "fresh_actor",
    business_key: "fresh_business",
    expires_at_epoch: 2_000_000_000,
    persistence_access_token: NEW_TOKEN,
    navigation_context: {
      source_app: "tower",
      destination_app: "teller",
      destination: "owner_money_workspace",
      item_id: "",
      return_app: "tower",
      return_destination: "access_home",
      correlation_id: "fresh_correlation",
    },
    ...overrides,
  };
}

async function start({ windowLike, hash = "", env = PROD, fetchImpl }) {
  const historyLike = history();
  const result = await prepareTellerBeforeReactMount({
    windowLike,
    locationLike: location(hash),
    historyLike,
    fetchImpl,
    env,
    nowEpoch: NOW,
  });
  return { result, historyLike };
}

// Production must NOT trust a stale/shape-valid in-memory session without
// a fresh Tower handoff, even when that session has every expected field.
{
  const windowLike = oldWindow();
  let requests = 0;
  const { result } = await start({
    windowLike,
    fetchImpl: async () => { requests++; throw new Error("unexpected fetch"); },
  });
  assert.equal(result.ready, false);
  assert.equal(result.reason, "tower_handoff_required");
  assert.equal(requests, 0);
  assert.equal(
    Object.hasOwn(windowLike, "__TELLER_TOWER_SESSION__"),
    false,
  );
}

// A fresh handoff MUST be exchanged even if an older browser-memory object
// was already present. The new token is the only one retained after success.
{
  const windowLike = oldWindow();
  let requests = 0;
  let body = null;
  const { result, historyLike } = await start({
    windowLike,
    hash: "#tower_handoff=fresh_code",
    fetchImpl: async (url, options) => {
      requests++;
      assert.equal(url, EXCHANGE_URL);
      body = JSON.parse(options.body);
      return {
        ok: true,
        async json() { return responsePayload(); },
      };
    },
  });
  assert.equal(requests, 1);
  assert.equal(body.exchange_version, "tower-teller-exchange.v2");
  assert.equal(body.handoff_code, "fresh_code");
  assert.equal(result.ready, true);
  assert.equal(result.source, "tower_exchange_v2");
  assert.equal(
    windowLike.__TELLER_TOWER_SESSION__.persistence_access_token,
    NEW_TOKEN,
  );
  assert.equal(windowLike.__TELLER_TOWER_SESSION__.tower_receipt_id, "fresh_receipt");
  assert.equal(windowLike.__TELLER_TOWER_SESSION__.actor.id, "fresh_actor");
  assert.equal(historyLike.calls.length, 1);
  assert.equal(historyLike.calls[0].state, null);
  assert.equal(historyLike.calls[0].url, "/teller");
  assert.equal(JSON.stringify(result).includes(NEW_TOKEN), false);
  assert.equal(JSON.stringify(historyLike.calls).includes(NEW_TOKEN), false);
  assert.equal(JSON.stringify(body).includes(OLD_TOKEN), false);
}

// A wrong-version response cannot revive stale browser authority.
{
  const windowLike = oldWindow();
  const { result } = await start({
    windowLike,
    hash: "#tower_handoff=fresh_code",
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return responsePayload({
          exchange_version: "tower-teller-exchange.v1",
        });
      },
    }),
  });
  assert.equal(result.ready, false);
  assert.equal(result.reason, "tower_exchange_claims_invalid");
  assert.equal(
    Object.hasOwn(windowLike, "__TELLER_TOWER_SESSION__"),
    false,
  );
}

// A denied Tower exchange cannot leave a previous bearer behind.
{
  const windowLike = oldWindow();
  const { result } = await start({
    windowLike,
    hash: "#tower_handoff=denied_code",
    fetchImpl: async () => ({ ok: false, status: 403 }),
  });
  assert.equal(result.ready, false);
  assert.equal(result.reason, "tower_exchange_denied");
  assert.equal(
    Object.hasOwn(windowLike, "__TELLER_TOWER_SESSION__"),
    false,
  );
}

// Development UI-only entry cannot inherit a previous persistence credential.
{
  const windowLike = oldWindow();
  const { result } = await start({
    windowLike,
    env: { PROD: false, DEV: true },
    fetchImpl: async () => { throw new Error("unexpected fetch"); },
  });
  assert.equal(result.ready, true);
  assert.equal(result.source, "development_ui_only");
  assert.equal(
    Object.hasOwn(windowLike, "__TELLER_TOWER_SESSION__"),
    false,
  );
}

// If stale authority cannot be removed, block the launch before any request.
{
  const windowLike = {};
  Object.defineProperty(windowLike, "__TELLER_TOWER_SESSION__", {
    value: oldWindow().__TELLER_TOWER_SESSION__,
    configurable: false,
    writable: false,
  });
  let requests = 0;
  const { result } = await start({
    windowLike,
    hash: "#tower_handoff=fresh_code",
    fetchImpl: async () => { requests++; throw new Error("unexpected fetch"); },
  });
  assert.equal(result.ready, false);
  assert.equal(result.reason, "tower_live_session_clear_failed");
  assert.equal(requests, 0);
}

console.log("TINT071–080 pre-render stale-session hardening: PASS");
console.log("Production fresh handoff: REQUIRED");
console.log("Stale browser authority after denial: ABSENT");
console.log("Persistence bearer in result/history: ABSENT");
