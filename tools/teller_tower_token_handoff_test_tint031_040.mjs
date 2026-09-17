import assert
  from "node:assert/strict";

import {
  readFile,
} from "node:fs/promises";

import {
  signTellerPersistenceAccessToken,
  verifyTellerPersistenceAccessToken,
} from "../server/teller/transport/tellerPersistenceAccessToken.js";


const contract =
  JSON.parse(
    await readFile(
      new URL(
        "../contracts/teller/teller_persistence_token_contract_v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );


assert.equal(
  contract.contract_id,
  "teller-persistence-token-v1"
);


assert.equal(
  contract.issuer,
  "tower"
);


assert.equal(
  contract.audience,
  "teller-persistence"
);


assert.equal(
  contract.maximum_lifetime_seconds,
  600
);


const secret =
  "teller-handoff-contract-test-0123456789abcdef";


const now =
  Math.floor(
    Date.now() /
    1000
  );


const claims = {
  iss:
    contract.issuer,

  aud:
    contract.audience,

  iat:
    now,

  exp:
    now + 600,

  jti:
    "handoff_test_jti",

  tower_session_id:
    "tower_session_handoff_test",

  tower_receipt_id:
    "tower_receipt_handoff_test",

  actor_id:
    "owner_handoff_test",

  actor_role:
    "owner",

  business_key:
    "simplee_world_staging",
};


const token =
  signTellerPersistenceAccessToken({
    claims,
    secret,
  });


const verified =
  verifyTellerPersistenceAccessToken({
    token,
    secret,

    issuer:
      contract.issuer,

    audience:
      contract.audience,

    maxLifetimeSeconds:
      contract.maximum_lifetime_seconds,
  });


assert.equal(
  verified.actor_id,
  claims.actor_id
);


assert.equal(
  verified.business_key,
  claims.business_key
);


assert.equal(
  verified.tower_session_id,
  claims.tower_session_id
);


assert.equal(
  verified.tower_receipt_id,
  claims.tower_receipt_id
);


assert.throws(
  () =>
    signTellerPersistenceAccessToken({
      secret,

      claims: {
        ...claims,

        tower_receipt_id:
          "",
      },
    }),
  /tower_receipt_id/
);


const tooLongToken =
  signTellerPersistenceAccessToken({
    secret,

    claims: {
      ...claims,

      jti:
        "handoff_test_too_long",

      exp:
        now + 601,
    },
  });


assert.throws(
  () =>
    verifyTellerPersistenceAccessToken({
      token:
        tooLongToken,

      secret,

      issuer:
        contract.issuer,

      audience:
        contract.audience,

      maxLifetimeSeconds:
        600,
    }),
  /lifetime/
);


console.log(
  "TINT035 TOWER PERSISTENCE TOKEN HANDOFF CONTRACT PASSED"
);

console.log(
  "Required Tower receipt: passed"
);

console.log(
  "Issuer: passed"
);

console.log(
  "Audience: passed"
);

console.log(
  "600-second lifetime ceiling: passed"
);

console.log(
  "Actor/business/session claims: passed"
);
