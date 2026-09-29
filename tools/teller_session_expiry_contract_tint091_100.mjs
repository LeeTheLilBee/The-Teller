import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  isTellerSessionExpired,
  tellerSessionExpiryEpoch,
  readTellerLiveTowerSession,
  readTellerPersistenceAccessToken,
} from "../src/teller/tellerRuntimeSession.js";

import {
  createTellerPersistenceTransport,
} from "../src/teller/persistence/tellerPersistenceTransport.js";

import {
  prepareTellerBeforeReactMount,
} from "../src/teller/tellerPreRenderBootstrap.js";

const now = Math.floor(Date.now() / 1000);
const future = now + 200;
const past = now - 5;
const token = "tpt1.cGF5bG9hZA.c2lnbmF0dXJl";

assert.equal(tellerSessionExpiryEpoch({ expires_at_epoch: future }), future);
assert.equal(
  tellerSessionExpiryEpoch({ expires_at: new Date(future * 1000).toISOString() }),
  future,
);
assert.equal(isTellerSessionExpired({ expires_at_epoch: past }, now), true);
assert.equal(isTellerSessionExpired({ expires_at_epoch: future }, now), false);

const live = (exp) => ({
  role: "owner",
  session_id: "tower_session",
  tower_receipt_id: "tower_receipt",
  actor: { id: "actor" },
  business: { key: "business" },
  expires_at: new Date(exp * 1000).toISOString(),
  persistence_access_token: token,
});

const originalWindow = globalThis.window;
try {
  globalThis.window = { __TELLER_TOWER_SESSION__: live(past) };
  assert.equal(readTellerLiveTowerSession(), null);
  assert.equal(readTellerPersistenceAccessToken(), "");

  globalThis.window = { __TELLER_TOWER_SESSION__: live(future) };
  assert.equal(readTellerLiveTowerSession()?.role, "owner");
  assert.equal(readTellerPersistenceAccessToken(), token);
} finally {
  globalThis.window = originalWindow;
}

// Guard a transport object that was created while authorized: it cannot
// keep issuing requests when the runtime session expires or changes.
{
  let allowed = true;
  let fetchCount = 0;
  const transport = createTellerPersistenceTransport({
    baseUrl: "https://simplee-teller-api-staging.onrender.com",
    accessToken: token,
    requestGuard: () => allowed,
    fetchImpl: async () => {
      fetchCount++;
      return { ok: true, async json() { return { records: [] }; } };
    },
  });
  assert.equal(transport.connected, true);
  await transport.searchRecords();
  assert.equal(fetchCount, 1);
  allowed = false;
  await assert.rejects(
    transport.searchRecords(),
    (error) => error.status === 401 &&
      !String(error.message).includes(token),
  );
  assert.equal(fetchCount, 1);

  // A guard exception is also a fail-closed denial.
  const guarded = createTellerPersistenceTransport({
    baseUrl: "https://simplee-teller-api-staging.onrender.com",
    accessToken: token,
    requestGuard: () => { throw new Error("guard failed"); },
    fetchImpl: async () => { fetchCount++; return { ok: true }; },
  });
  await assert.rejects(guarded.searchRecords(), (error) => error.status === 401);
  assert.equal(fetchCount, 1);
}

// A v2 exchange response that has already expired cannot mount React,
// regardless of the syntactic shape of the persistence bearer.
{
  const windowLike = {};
  let calls = 0;
  const result = await prepareTellerBeforeReactMount({
    windowLike,
    locationLike: {
      pathname: "/teller",
      search: "",
      hash: "#tower_handoff=expired_handoff",
    },
    historyLike: { replaceState() {} },
    env: {
      PROD: true,
      DEV: false,
      VITE_TOWER_TELLER_EXCHANGE_URL:
        "https://simplee-tower-ob.onrender.com/tower/teller/exchange",
    },
    nowEpoch: now,
    fetchImpl: async () => {
      calls++;
      return {
        ok: true,
        async json() {
          return {
            exchange_version: "tower-teller-exchange.v2",
            access_verified: true,
            app_id: "teller",
            target_path: "/teller",
            role: "owner",
            receipt_id: "receipt",
            tower_session_id: "session",
            actor_id: "actor",
            business_key: "business",
            expires_at_epoch: past,
            persistence_access_token: token,
            navigation_context: {
              source_app: "tower",
              destination_app: "teller",
              destination: "owner_money_workspace",
              item_id: "",
              return_app: "tower",
              return_destination: "access_home",
              correlation_id: "expiry_case",
            },
          };
        },
      };
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.ready, false);
  assert.equal(result.status, "locked");
  assert.equal(Object.hasOwn(windowLike, "__TELLER_TOWER_SESSION__"), false);
}

// The actual hosted entrypoint must close the mounted React workspace at
// Tower's short-lived token expiry and show a safe non-React lock surface.
{
  const main = readFileSync(
    new URL("../src/main.jsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    main.indexOf("await prepareTellerBeforeReactMount") <
    main.indexOf("createRoot("),
  );
  assert.ok(main.includes("tellerSessionExpiryEpoch("));
  assert.ok(main.includes("window.setTimeout("));
  assert.ok(main.includes("reactRoot.unmount()"));
  assert.ok(main.includes('reason: "tower_session_expired"'));
}

console.log("TINT091–100 session-expiry contract: PASS");
console.log("Expired live session/token reads: BLOCKED");
console.log("Captured transport after session loss: BLOCKED before fetch");
console.log("Expired v2 launch: BLOCKED");
