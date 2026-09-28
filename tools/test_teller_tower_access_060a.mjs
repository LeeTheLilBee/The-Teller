import assert from "node:assert/strict";

import {
  resolveTellerAccess,
  tellerDevShortcutsEnabled,
} from "../src/teller/towerAccess.js";


function locationOf({
  search = "",
  hash = "",
  pathname = "/teller",
} = {}) {
  return {
    search,
    hash,
    pathname,
  };
}


async function hostedQueryDenied() {
  const result =
    await resolveTellerAccess({
      locationLike:
        locationOf({
          search:
            "?tower_clearance=owner",
        }),

      env: {
        PROD: true,
        DEV: false,
      },
    });

  assert.equal(
    result.status,
    "locked"
  );

  assert.equal(
    result.reason,
    "legacy_query_clearance_rejected"
  );
}


function devRequiresExplicitFlag() {
  assert.equal(
    tellerDevShortcutsEnabled({
      DEV: true,
    }),
    false
  );

  assert.equal(
    tellerDevShortcutsEnabled({
      DEV: true,

      VITE_TELLER_DEV_CLEARANCE_ENABLED:
        "1",
    }),
    true
  );
}


async function localOwnerShortcutWorks() {
  const result =
    await resolveTellerAccess({
      locationLike:
        locationOf({
          search:
            "?tower_clearance=owner",
        }),

      env: {
        DEV: true,
        PROD: false,

        VITE_TELLER_DEV_CLEARANCE_ENABLED:
          "1",
      },
    });

  assert.equal(
    result.status,
    "granted"
  );

  assert.equal(
    result.clearance,
    "owner"
  );

  assert.equal(
    result.source,
    "explicit_local_development"
  );
}


async function secureExchangeBootstrapsOwner() {
  const requests = [];
  const replaced = [];

  const result =
    await resolveTellerAccess({
      locationLike:
        locationOf({
          search:
            "?tower_clearance=manager&teller_view=manager",

          hash:
            "#tower_handoff=opaque-test-code",
        }),

      historyLike: {
        replaceState(
          state,
          title,
          url
        ) {
          replaced.push(
            url
          );
        },
      },

      fetchImpl:
        async (
          url,
          options
        ) => {
          requests.push({
            url,
            options,
          });

          return {
            ok: true,

            async json() {
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
                  "receipt-test-001",

                expires_at_epoch:
                  2000,

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
                    "corr-test-060a",
                },
              };
            },
          };
        },

      env: {
        DEV: false,
        PROD: true,

        VITE_TOWER_TELLER_EXCHANGE_URL:
          "https://tower.example.test/tower/teller/exchange",
      },

      nowEpoch:
        1000,
    });

  assert.equal(
    result.status,
    "granted"
  );

  assert.equal(
    result.clearance,
    "owner"
  );

  assert.equal(
    result.source,
    "tower_handoff_exchange"
  );

  assert.equal(
    requests.length,
    1
  );

  const body =
    JSON.parse(
      requests[0]
        .options
        .body
    );

  assert.equal(
    body.handoff_code,
    "opaque-test-code"
  );

  assert.deepEqual(
    replaced,
    ["/teller"]
  );
}


async function httpsRequiredInProduction() {
  const result =
    await resolveTellerAccess({
      locationLike:
        locationOf({
          hash:
            "#tower_handoff=opaque",
        }),

      env: {
        PROD: true,
        DEV: false,

        VITE_TOWER_TELLER_EXCHANGE_URL:
          "http://tower.example.test/exchange",
      },
    });

  assert.equal(
    result.status,
    "locked"
  );

  assert.equal(
    result.reason,
    "tower_exchange_https_required"
  );
}


await hostedQueryDenied();
devRequiresExplicitFlag();
await localOwnerShortcutWorks();
await secureExchangeBootstrapsOwner();
await httpsRequiredInProduction();

console.log(
  "PASS — Teller 060A Tower access contract"
);
