import assert
  from "node:assert/strict";

import {
  randomUUID,
} from "node:crypto";

import {
  createTellerPostgresPool,
} from "../server/teller/persistence/tellerPostgresPool.js";

import {
  createTellerPersistenceHttpServer,
} from "../server/teller/transport/tellerPersistenceHttpServer.js";

import {
  signTellerPersistenceAccessToken,
} from "../server/teller/transport/tellerPersistenceAccessToken.js";

import {
  createTellerRecordEnvelope,
} from "../src/teller/records/tellerRecordSchema.js";


const secret =
  process.env
    .TELLER_TOWER_TOKEN_SECRET;


if (
  !secret ||
  secret.length < 32
) {
  throw new Error(
    "TELLER_TOWER_TOKEN_SECRET is required."
  );
}


const proofId =
  randomUUID()
    .replaceAll(
      "-",
      ""
    )
    .slice(
      0,
      18
    );


const businessKey =
  "simplee_world_staging";


const actorA =
  `manager_transport_a_${proofId}`;


const actorB =
  `manager_transport_b_${proofId}`;


const ownerActor =
  `owner_transport_${proofId}`;


const recordId =
  `teller_transport_proof_${proofId}`;


const now =
  Math.floor(
    Date.now() /
    1000
  );


function tokenFor({
  actorId,
  actorRole,
  business = businessKey,
}) {
  return signTellerPersistenceAccessToken({
    secret,

    claims: {
      iss:
        "tower",

      aud:
        "teller-persistence",

      iat:
        now,

      exp:
        now + 600,

      jti:
        randomUUID(),

      tower_session_id:
        `tower_transport_${actorId}`,

      tower_receipt_id:
        `tower_receipt_${proofId}`,

      actor_id:
        actorId,

      actor_role:
        actorRole,

      business_key:
        business,
    },
  });
}


const managerAToken =
  tokenFor({
    actorId:
      actorA,

    actorRole:
      "manager",
  });


const managerBToken =
  tokenFor({
    actorId:
      actorB,

    actorRole:
      "manager",
  });


const ownerToken =
  tokenFor({
    actorId:
      ownerActor,

    actorRole:
      "owner",
  });


async function startServer() {
  const pool =
    createTellerPostgresPool();


  const server =
    createTellerPersistenceHttpServer({
      pool,
    });


  await new Promise(
    (resolve, reject) => {
      server.once(
        "error",
        reject
      );


      server.listen(
        0,
        "127.0.0.1",
        resolve
      );
    }
  );


  const address =
    server.address();


  return {
    pool,

    server,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}


async function stopServer(
  runtime
) {
  if (!runtime) {
    return;
  }


  await new Promise(
    (resolve) => {
      runtime.server.close(
        resolve
      );
    }
  );


  await runtime.pool.end();
}


async function api(
  baseUrl,
  path,
  {
    token = "",
    method = "GET",
    body = undefined,
    origin = "http://127.0.0.1",
  } = {}
) {
  const headers = {
    Origin:
      origin,
  };


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  if (
    body !== undefined
  ) {
    headers[
      "Content-Type"
    ] = "application/json";
  }


  const response =
    await fetch(
      `${baseUrl}${path}`,
      {
        method,

        headers,

        body:
          body === undefined
            ? undefined
            : JSON.stringify(
                body
              ),
      }
    );


  let payload = {};


  try {
    payload =
      await response.json();

  } catch {
    payload = {};
  }


  return {
    status:
      response.status,

    payload,
  };
}


const record =
  createTellerRecordEnvelope({
    record_id:
      recordId,

    source:
      "system",

    source_id:
      `transport_submission_${proofId}`,

    form_id:
      "authenticated_transport_certification",

    workflow_type:
      "authenticated_transport_certification",

    category:
      "integration_test",

    title:
      "Authenticated Teller Transport Certification",

    business_key:
      businessKey,

    actor_role:
      "manager",

    payload: {
      certification: {
        pack:
          "TINT021-TINT030",

        proof_id:
          proofId,

        staging_only:
          true,
      },
    },
  });


let first =
  null;

let second =
  null;


try {
  first =
    await startServer();


  const health =
    await api(
      first.baseUrl,
      "/healthz"
    );


  assert.equal(
    health.status,
    200
  );


  const anonymous =
    await api(
      first.baseUrl,
      "/v1/records"
    );


  assert.equal(
    anonymous.status,
    401
  );


  const tampered =
    `${managerAToken.slice(
      0,
      -1
    )}x`;


  const badToken =
    await api(
      first.baseUrl,
      "/v1/records",
      {
        token:
          tampered,
      }
    );


  assert.equal(
    badToken.status,
    401
  );


  const badOrigin =
    await api(
      first.baseUrl,
      "/v1/records",
      {
        token:
          managerAToken,

        origin:
          "https://evil.example",
      }
    );


  assert.equal(
    badOrigin.status,
    403
  );


  console.log(
    "TINT021-TINT024 authentication/authority wall: PASSED"
  );


  const saved =
    await api(
      first.baseUrl,
      "/v1/records",
      {
        token:
          managerAToken,

        method:
          "POST",

        body: {
          record,
        },
      }
    );


  assert.equal(
    saved.status,
    201
  );


  assert.equal(
    saved.payload.persisted,
    true
  );


  assert.equal(
    saved.payload.created,
    true
  );


  console.log(
    "TINT025 authenticated HTTP durable write: PASSED"
  );


  const replay =
    await api(
      first.baseUrl,
      "/v1/records",
      {
        token:
          managerAToken,

        method:
          "POST",

        body: {
          record,
        },
      }
    );


  assert.equal(
    replay.status,
    201
  );


  assert.equal(
    replay.payload
      .idempotent_replay,
    true
  );


  console.log(
    "TINT025 authenticated HTTP idempotency: PASSED"
  );


  const ownRead =
    await api(
      first.baseUrl,
      `/v1/records/${recordId}`,
      {
        token:
          managerAToken,
      }
    );


  assert.equal(
    ownRead.status,
    200
  );


  const otherActorRead =
    await api(
      first.baseUrl,
      `/v1/records/${recordId}`,
      {
        token:
          managerBToken,
      }
    );


  assert.equal(
    otherActorRead.status,
    404
  );


  const otherActorSearch =
    await api(
      first.baseUrl,
      "/v1/records?limit=100",
      {
        token:
          managerBToken,
      }
    );


  assert.equal(
    otherActorSearch.status,
    200
  );


  assert.equal(
    otherActorSearch.payload
      .records
      .some(
        (item) =>
          item.record_id ===
          recordId
      ),
    false
  );


  console.log(
    "TINT023 actor-scoped RLS: PASSED"
  );


  const ownerRead =
    await api(
      first.baseUrl,
      `/v1/records/${recordId}`,
      {
        token:
          ownerToken,
      }
    );


  assert.equal(
    ownerRead.status,
    200
  );


  console.log(
    "TINT024 owner business visibility: PASSED"
  );


  const wrongBusinessRecord = {
    ...record,

    record_id:
      `wrong_business_${proofId}`,

    source_id:
      `wrong_business_submission_${proofId}`,

    business_key:
      "another_business",
  };


  const wrongBusiness =
    await api(
      first.baseUrl,
      "/v1/records",
      {
        token:
          managerAToken,

        method:
          "POST",

        body: {
          record:
            wrongBusinessRecord,
        },
      }
    );


  assert.equal(
    wrongBusiness.status,
    403
  );


  console.log(
    "TINT024 request-body scope escalation blocked: PASSED"
  );


  await stopServer(
    first
  );

  first =
    null;


  second =
    await startServer();


  const afterRestart =
    await api(
      second.baseUrl,
      `/v1/records/${recordId}`,
      {
        token:
          managerAToken,
      }
    );


  assert.equal(
    afterRestart.status,
    200
  );


  assert.equal(
    afterRestart.payload
      .record
      .record_id,
    recordId
  );


  console.log(
    "TINT027 authenticated reload hydration storage path: PASSED"
  );


  const searchAfterRestart =
    await api(
      second.baseUrl,
      "/v1/records?limit=100",
      {
        token:
          managerAToken,
      }
    );


  assert.equal(
    searchAfterRestart.status,
    200
  );


  assert.ok(
    searchAfterRestart.payload
      .records
      .some(
        (item) =>
          item.record_id ===
          recordId
      )
  );


  console.log(
    "TINT028 prepared-record persistence transport path: PASSED"
  );


  console.log(
    JSON.stringify({
      proof_id:
        proofId,

      record_id:
        recordId,

      business_key:
        businessKey,

      actor_id:
        actorA,

      authentication:
        true,

      token_signature:
        true,

      anonymous_blocked:
        true,

      tamper_blocked:
        true,

      cors_blocked:
        true,

      actor_scope:
        true,

      owner_business_visibility:
        true,

      request_scope_escalation_blocked:
        true,

      durable_http_write:
        true,

      idempotent_http_replay:
        true,

      restart_reload:
        true,
    })
  );

} finally {

  await stopServer(
    first
  );

  await stopServer(
    second
  );
}
