
import assert
  from "node:assert/strict";

import {
  describeTellerHostedPersistenceActivation,
} from "../src/teller/persistence/tellerHostedPersistenceGate.js";


const validSession = {
  source:
    "tower_window_injection",

  sessionId:
    "tower_session_041",

  towerReceiptId:
    "tower_receipt_041",

  role:
    "owner",

  actor: {
    id:
      "owner_041",
  },

  business: {
    key:
      "simplee_world_staging",
  },
};


const token =
  "tpt1.eyJ0ZXN0Ijp0cnVlfQ.signature041";


const ready =
  describeTellerHostedPersistenceActivation({
    session:
      validSession,

    accessToken:
      token,

    apiUrl:
      "https://simplee-teller-api-staging.onrender.com",
  });


assert.equal(
  ready.ready,
  true
);

assert.equal(
  ready.blockers.length,
  0
);

assert.equal(
  ready.source,
  "tower_window_injection"
);

assert.equal(
  ready.actorId,
  "owner_041"
);

assert.equal(
  ready.businessKey,
  "simplee_world_staging"
);


const storedSession =
  describeTellerHostedPersistenceActivation({
    session: {
      ...validSession,

      source:
        "tower_session_storage",
    },

    accessToken:
      token,

    apiUrl:
      "https://simplee-teller-api-staging.onrender.com",
  });


assert.equal(
  storedSession.ready,
  false
);

assert.ok(
  storedSession.blockers.includes(
    "live_tower_window_injection_required"
  )
);


const missingToken =
  describeTellerHostedPersistenceActivation({
    session:
      validSession,

    accessToken:
      "",

    apiUrl:
      "https://simplee-teller-api-staging.onrender.com",
  });


assert.equal(
  missingToken.ready,
  false
);

assert.ok(
  missingToken.blockers.includes(
    "persistence_access_token_missing"
  )
);


const malformedToken =
  describeTellerHostedPersistenceActivation({
    session:
      validSession,

    accessToken:
      "hello-world",

    apiUrl:
      "https://simplee-teller-api-staging.onrender.com",
  });


assert.equal(
  malformedToken.ready,
  false
);

assert.ok(
  malformedToken.blockers.includes(
    "persistence_access_token_format_invalid"
  )
);


const insecureApi =
  describeTellerHostedPersistenceActivation({
    session:
      validSession,

    accessToken:
      token,

    apiUrl:
      "http://example.com",
  });


assert.equal(
  insecureApi.ready,
  false
);

assert.ok(
  insecureApi.blockers.includes(
    "hosted_api_url_missing_or_invalid"
  )
);


const missingReceipt =
  describeTellerHostedPersistenceActivation({
    session: {
      ...validSession,

      towerReceiptId:
        "",
    },

    accessToken:
      token,

    apiUrl:
      "https://simplee-teller-api-staging.onrender.com",
  });


assert.equal(
  missingReceipt.ready,
  false
);

assert.ok(
  missingReceipt.blockers.includes(
    "tower_receipt_id_missing"
  )
);


const missingActor =
  describeTellerHostedPersistenceActivation({
    session: {
      ...validSession,

      actor: {},
    },

    accessToken:
      token,

    apiUrl:
      "https://simplee-teller-api-staging.onrender.com",
  });


assert.equal(
  missingActor.ready,
  false
);

assert.ok(
  missingActor.blockers.includes(
    "actor_id_missing"
  )
);


const missingBusiness =
  describeTellerHostedPersistenceActivation({
    session: {
      ...validSession,

      business: {},
    },

    accessToken:
      token,

    apiUrl:
      "https://simplee-teller-api-staging.onrender.com",
  });


assert.equal(
  missingBusiness.ready,
  false
);

assert.ok(
  missingBusiness.blockers.includes(
    "business_key_missing"
  )
);


assert.equal(
  ready.browserDatabaseCredentials,
  false
);

assert.equal(
  ready.browserSigningSecret,
  false
);

assert.equal(
  ready.tokenStorageAllowed,
  false
);

assert.equal(
  ready.bodyAuthorityAllowed,
  false
);

assert.equal(
  ready.directVaultAllowed,
  false
);


console.log(
  "TINT041-TINT050 HOSTED BROWSER ACTIVATION CONTRACT PASSED"
);

console.log(
  "Live Tower window injection: required"
);

console.log(
  "Tower session ID: required"
);

console.log(
  "Tower receipt ID: required"
);

console.log(
  "Actor ID: required"
);

console.log(
  "Business key: required"
);

console.log(
  "Allowed Teller role: required"
);

console.log(
  "HTTPS hosted API: required"
);

console.log(
  "tpt1 persistence token shape: required"
);

console.log(
  "Stored-session persistence activation: blocked"
);

console.log(
  "Browser DB credentials: blocked"
);

console.log(
  "Browser signing secret: blocked"
);

console.log(
  "Direct Vault: blocked"
);
