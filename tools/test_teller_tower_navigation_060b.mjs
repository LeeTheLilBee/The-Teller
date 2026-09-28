import assert from "node:assert/strict";
import fs from "node:fs";

import {
  normalizeTowerNavigationContext,
  resolveTellerAccess,
} from "../src/teller/towerAccess.js";


const validCloudsNavigation = {
  source_app:
    "clouds",

  destination_app:
    "teller",

  destination:
    "payroll_review",

  item_id:
    "jordan-edit",

  return_app:
    "clouds",

  return_destination:
    "attention_queue",

  correlation_id:
    "corr-clouds-jordan-edit",
};


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


function responseWith(
  navigationContext
) {
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
          "receipt-060b",

        expires_at_epoch:
          2000,

        navigation_context:
          navigationContext,
      };
    },
  };
}


function testValidCloudsNavigation() {
  const normalized =
    normalizeTowerNavigationContext(
      validCloudsNavigation
    );

  assert.deepEqual(
    normalized,
    validCloudsNavigation
  );
}


function testDefaultOwnerDestination() {
  const normalized =
    normalizeTowerNavigationContext({
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
        "corr-owner-entry",
    });

  assert.equal(
    normalized.destination,
    "owner_money_workspace"
  );
}


function testUnknownDestinationFailsClosed() {
  assert.equal(
    normalizeTowerNavigationContext({
      ...validCloudsNavigation,

      destination:
        "invented_super_admin",
    }),
    null
  );
}


function testRawUrlDestinationFailsClosed() {
  assert.equal(
    normalizeTowerNavigationContext({
      ...validCloudsNavigation,

      destination:
        "https://evil.example",
    }),
    null
  );
}


function testWrongDestinationAppFailsClosed() {
  assert.equal(
    normalizeTowerNavigationContext({
      ...validCloudsNavigation,

      destination_app:
        "observatory",
    }),
    null
  );
}


function testUnknownSourceFailsClosed() {
  assert.equal(
    normalizeTowerNavigationContext({
      ...validCloudsNavigation,

      source_app:
        "evil-app",
    }),
    null
  );
}


function testUnknownReturnAppFailsClosed() {
  assert.equal(
    normalizeTowerNavigationContext({
      ...validCloudsNavigation,

      return_app:
        "evil-app",
    }),
    null
  );
}


async function testExchangeCarriesNavigationIntoAccessState() {
  const result =
    await resolveTellerAccess({
      locationLike:
        locationOf({
          hash:
            "#tower_handoff=opaque-060b",
        }),

      historyLike: {
        replaceState() {},
      },

      fetchImpl:
        async () =>
          responseWith(
            validCloudsNavigation
          ),

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

  assert.deepEqual(
    result.navigationContext,
    validCloudsNavigation
  );
}


async function testUnknownExchangeDestinationDenied() {
  const result =
    await resolveTellerAccess({
      locationLike:
        locationOf({
          hash:
            "#tower_handoff=opaque-060b",
        }),

      fetchImpl:
        async () =>
          responseWith({
            ...validCloudsNavigation,

            destination:
              "does_not_exist",
          }),

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
    "locked"
  );

  assert.equal(
    result.reason,
    "tower_exchange_navigation_invalid"
  );
}


function testOwnerWorkspaceDestinationsExist() {
  const source =
    fs.readFileSync(
      new URL(
        "../src/teller/OwnerMoneyWorkspace.jsx",
        import.meta.url
      ),
      "utf8"
    );

  assert.match(
    source,
    /id="teller-owner-money-workspace"/
  );

  assert.match(
    source,
    /id="teller-owner-payroll-review"/
  );

  assert.match(
    source,
    /destination\s*===\s*"payroll_review"/
  );

  assert.match(
    source,
    /setActiveBusiness\(\s*"simpleepay"\s*\)/
  );

  assert.match(
    source,
    /setCalmMode\(\s*false\s*\)/
  );

  assert.match(
    source,
    /scrollIntoView/
  );

  assert.match(
    source,
    /Return path/
  );
}


function testAppPassesNavigationToOwner() {
  const source =
    fs.readFileSync(
      new URL(
        "../src/App.jsx",
        import.meta.url
      ),
      "utf8"
    );

  assert.match(
    source,
    /navigationContext:\s*access\.navigationContext/
  );

  assert.match(
    source,
    /<OwnerMoneyWorkspace/
  );

  assert.match(
    source,
    /navigationContext=\{/
  );
}


testValidCloudsNavigation();
testDefaultOwnerDestination();
testUnknownDestinationFailsClosed();
testRawUrlDestinationFailsClosed();
testWrongDestinationAppFailsClosed();
testUnknownSourceFailsClosed();
testUnknownReturnAppFailsClosed();

await testExchangeCarriesNavigationIntoAccessState();
await testUnknownExchangeDestinationDenied();

testOwnerWorkspaceDestinationsExist();
testAppPassesNavigationToOwner();

console.log(
  "PASS — Teller 060B destination + return context"
);
