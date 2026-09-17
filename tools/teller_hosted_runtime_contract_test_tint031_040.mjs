import assert
  from "node:assert/strict";

import {
  createTellerPersistenceHttpServer,
} from "../server/teller/transport/tellerPersistenceHttpServer.js";

import {
  readTellerTransportConfig,
} from "../server/teller/transport/tellerTransportConfig.js";


class FakeClient {
  async query(
    text
  ) {
    if (
      String(
        text
      ) === "BEGIN" ||
      String(
        text
      ) === "COMMIT" ||
      String(
        text
      ) === "ROLLBACK" ||
      String(
        text
      ).startsWith(
        "SELECT set_config"
      )
    ) {
      return {
        rows:
          [],
      };
    }


    return {
      rows:
        [],
    };
  }


  release() {}
}


class FakePool {
  constructor({
    healthy = true,
  } = {}) {
    this.healthy =
      healthy;
  }


  async query(
    text
  ) {
    if (
      String(
        text
      ).includes(
        "SELECT 1 AS teller_ready"
      )
    ) {
      if (!this.healthy) {
        throw new Error(
          "fake database unavailable"
        );
      }


      return {
        rows: [
          {
            teller_ready:
              1,
          },
        ],
      };
    }


    return {
      rows:
        [],
    };
  }


  async connect() {
    return new FakeClient();
  }
}


async function start({
  env,
  pool,
}) {
  const server =
    createTellerPersistenceHttpServer({
      env,
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
    server,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}


async function stop(
  runtime
) {
  await new Promise(
    (resolve) =>
      runtime.server.close(
        resolve
      )
  );
}


async function get(
  baseUrl,
  path,
  origin = ""
) {
  const headers = {};


  if (origin) {
    headers.Origin =
      origin;
  }


  const response =
    await fetch(
      `${baseUrl}${path}`,
      {
        headers,
      }
    );


  return {
    status:
      response.status,

    payload:
      await response.json(),
  };
}


const secret =
  "teller-hosted-test-secret-0123456789-abcdef";


const hostedEnv = {
  TELLER_HOSTED_RUNTIME:
    "staging",

  TELLER_TOWER_TOKEN_SECRET:
    secret,

  TELLER_TRANSPORT_TOKEN_ISSUER:
    "tower",

  TELLER_TRANSPORT_TOKEN_AUDIENCE:
    "teller-persistence",

  TELLER_TRANSPORT_MAX_TOKEN_LIFETIME_SECONDS:
    "600",

  TELLER_ALLOWED_ORIGINS:
    (
      "https://simplee-teller.onrender.com,"
      +
      "https://simplee-tower-ob.onrender.com"
    ),

  PORT:
    "10000",
};


const config =
  readTellerTransportConfig(
    hostedEnv
  );


assert.equal(
  config.configured,
  true
);


assert.equal(
  config.hostedRuntime.runtime,
  "staging"
);


assert.equal(
  config.hostedRuntime.hosted,
  true
);


assert.equal(
  config.hostedOriginsValid,
  true
);


assert.equal(
  config.maxTokenLifetimeSeconds,
  600
);


const badHostedConfig =
  readTellerTransportConfig({
    ...hostedEnv,

    TELLER_ALLOWED_ORIGINS:
      "http://not-secure.example",
  });


assert.equal(
  badHostedConfig.configured,
  false
);


let healthyRuntime =
  null;

let unhealthyRuntime =
  null;


try {
  healthyRuntime =
    await start({
      env:
        hostedEnv,

      pool:
        new FakePool({
          healthy:
            true,
        }),
    });


  const health =
    await get(
      healthyRuntime.baseUrl,
      "/healthz"
    );


  assert.equal(
    health.status,
    200
  );


  assert.equal(
    health.payload.status,
    "ok"
  );


  assert.equal(
    health.payload.runtime,
    "staging"
  );


  assert.equal(
    health.payload
      .database_credentials_exposed,
    false
  );


  assert.equal(
    health.payload
      .token_secret_exposed,
    false
  );


  const ready =
    await get(
      healthyRuntime.baseUrl,
      "/readyz"
    );


  assert.equal(
    ready.status,
    200
  );


  assert.equal(
    ready.payload.ready,
    true
  );


  assert.equal(
    ready.payload.database,
    "ready"
  );


  const disallowedOrigin =
    await get(
      healthyRuntime.baseUrl,
      "/v1/records",
      "https://evil.example"
    );


  assert.equal(
    disallowedOrigin.status,
    403
  );


  await stop(
    healthyRuntime
  );

  healthyRuntime =
    null;


  unhealthyRuntime =
    await start({
      env:
        hostedEnv,

      pool:
        new FakePool({
          healthy:
            false,
        }),
    });


  const unavailable =
    await get(
      unhealthyRuntime.baseUrl,
      "/readyz"
    );


  assert.equal(
    unavailable.status,
    503
  );


  assert.equal(
    unavailable.payload.ready,
    false
  );


  assert.equal(
    unavailable.payload.database,
    "unavailable"
  );


  console.log(
    "TINT031-TINT038 HOSTED RUNTIME CONTRACT TEST PASSED"
  );

  console.log(
    "Hosted staging config: passed"
  );

  console.log(
    "HTTPS origin policy: passed"
  );

  console.log(
    "Liveness boundary: passed"
  );

  console.log(
    "Readiness healthy DB: passed"
  );

  console.log(
    "Readiness unavailable DB: passed"
  );

  console.log(
    "Hosted bad-origin block: passed"
  );

  console.log(
    "Credential-safe health responses: passed"
  );

} finally {

  if (healthyRuntime) {
    await stop(
      healthyRuntime
    );
  }


  if (unhealthyRuntime) {
    await stop(
      unhealthyRuntime
    );
  }
}
