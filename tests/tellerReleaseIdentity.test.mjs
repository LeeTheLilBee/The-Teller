import assert from "node:assert/strict";
import test from "node:test";

import {
  readTellerReleaseIdentity,
  tellerReleaseIdentitySafeSummary,
} from "../server/teller/transport/tellerReleaseIdentity.js";

import {
  createTellerPersistenceHttpServer,
} from "../server/teller/transport/tellerPersistenceHttpServer.js";


const REVISION =
  "a8bf7ce150747de4b9475c81e468ac54a3c8c184";

const ALLOWED_ORIGIN =
  "https://simplee-teller.onrender.com";


function hostedEnv() {
  return {
    TELLER_HOSTED_RUNTIME:
      "staging",

    TELLER_TOWER_TOKEN_SECRET:
      "synthetic-release-test-secret-0123456789abcdef",

    TELLER_ALLOWED_ORIGINS:
      ALLOWED_ORIGIN,

    TELLER_SOURCE_REVISION:
      REVISION,

    TELLER_SOURCE_BRANCH:
      "teller-tower-request-handoff-dev",

    RENDER_SERVICE_ID:
      "synthetic-service-id",
  };
}


function fakePool() {
  return {
    connect() {
      throw new Error(
        "record route should not connect in release identity test"
      );
    },

    async query(sql) {
      assert.equal(
        sql,
        "SELECT 1 AS teller_ready"
      );

      return {
        rows: [
          {
            teller_ready:
              1,
          },
        ],
      };
    },
  };
}


async function withServer(
  env,
  callback
) {
  const server =
    createTellerPersistenceHttpServer({
      pool:
        fakePool(),

      env,
    });

  await new Promise(
    (resolve) => {
      server.listen(
        0,
        "127.0.0.1",
        resolve
      );
    }
  );

  try {
    const address =
      server.address();

    await callback(
      `http://127.0.0.1:${address.port}`
    );

  } finally {
    await new Promise(
      (resolve, reject) => {
        server.close(
          (error) =>
            error
              ? reject(error)
              : resolve()
        );
      }
    );
  }
}


test(
  "release identity exposes revision and contracts without secrets",
  () => {
    const env =
      hostedEnv();

    const identity =
      readTellerReleaseIdentity(
        env
      );

    const safe =
      tellerReleaseIdentitySafeSummary(
        identity
      );

    assert.equal(
      safe.source_revision,
      REVISION
    );

    assert.equal(
      safe.source_branch,
      "teller-tower-request-handoff-dev"
    );

    assert.equal(
      safe.api_contract,
      "teller-persistence-http.v1"
    );

    assert.equal(
      safe.persistence_token_contract,
      "teller-persistence-token-v1"
    );

    assert.equal(
      safe.tower_exchange_contract,
      "tower-teller-exchange.v2"
    );

    assert.equal(
      safe.secrets_exposed,
      false
    );

    assert.equal(
      safe.database_credentials_exposed,
      false
    );

    const serialized =
      JSON.stringify(
        safe
      );

    assert.equal(
      serialized.includes(
        env.TELLER_TOWER_TOKEN_SECRET
      ),
      false
    );
  }
);


test(
  "invalid release metadata fails closed to absent metadata",
  () => {
    const safe =
      tellerReleaseIdentitySafeSummary(
        readTellerReleaseIdentity({
          TELLER_SOURCE_REVISION:
            "bad revision with spaces",

          TELLER_SOURCE_BRANCH:
            "bad\nbranch",
        })
      );

    assert.equal(
      safe.source_revision,
      ""
    );

    assert.equal(
      safe.source_branch,
      ""
    );

    assert.equal(
      safe.source_revision_present,
      false
    );

    assert.equal(
      safe.source_branch_present,
      false
    );
  }
);


test(
  "versionz healthz and readyz expose the same safe release identity",
  async () => {
    const env =
      hostedEnv();

    await withServer(
      env,
      async (baseUrl) => {
        for (
          const path
          of [
            "/versionz",
            "/healthz",
            "/readyz",
          ]
        ) {
          const response =
            await fetch(
              baseUrl + path,
              {
                headers: {
                  Origin:
                    ALLOWED_ORIGIN,
                },
              }
            );

          assert.equal(
            response.status,
            200
          );

          assert.equal(
            response.headers.get(
              "access-control-allow-origin"
            ),
            ALLOWED_ORIGIN
          );

          const payload =
            await response.json();

          assert.equal(
            payload
              .release
              .source_revision,
            REVISION
          );

          assert.equal(
            payload
              .release
              .tower_exchange_contract,
            "tower-teller-exchange.v2"
          );

          assert.equal(
            payload
              .release
              .secrets_exposed,
            false
          );

          assert.equal(
            JSON.stringify(
              payload
            ).includes(
              env.TELLER_TOWER_TOKEN_SECRET
            ),
            false
          );
        }
      }
    );
  }
);


test(
  "version endpoint obeys the same exact-origin policy",
  async () => {
    await withServer(
      hostedEnv(),
      async (baseUrl) => {
        const response =
          await fetch(
            baseUrl +
              "/versionz",
            {
              headers: {
                Origin:
                  "https://not-the-teller.example",
              },
            }
          );

        assert.equal(
          response.status,
          403
        );

        const payload =
          await response.json();

        assert.equal(
          payload.error,
          "origin_not_allowed"
        );
      }
    );
  }
);
