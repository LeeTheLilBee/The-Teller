import {
  createServer,
} from "node:http";

import {
  randomUUID,
} from "node:crypto";

import {
  createPostgresTellerRecordRepository,
} from "../persistence/tellerPostgresRecordRepository.js";

import {
  readTellerTransportConfig,
} from "./tellerTransportConfig.js";

import {
  tellerPersistenceScopeFromClaims,
  verifyTellerPersistenceAccessToken,
} from "./tellerPersistenceAccessToken.js";


function json(
  response,
  statusCode,
  payload,
  {
    origin = "",
    allowedOrigins = [],
    requestId = "",
  } = {}
) {
  const headers = {
    "Content-Type":
      "application/json; charset=utf-8",

    "Cache-Control":
      "no-store",

    "X-Content-Type-Options":
      "nosniff",

    "Referrer-Policy":
      "no-referrer",

    "X-Teller-Request-Id":
      requestId,
  };


  if (
    origin &&
    allowedOrigins.includes(
      origin
    )
  ) {
    headers[
      "Access-Control-Allow-Origin"
    ] = origin;

    headers[
      "Vary"
    ] = "Origin";
  }


  response.writeHead(
    statusCode,
    headers
  );


  response.end(
    JSON.stringify(
      payload
    )
  );
}


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function originAllowed(
  request,
  config
) {
  const origin =
    clean(
      request.headers.origin
    );


  if (!origin) {
    return true;
  }


  return config.allowedOrigins
    .includes(
      origin
    );
}


function readBearerToken(
  request
) {
  const authorization =
    clean(
      request.headers.authorization
    );


  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i
    );


  return match
    ? match[1].trim()
    : "";
}


async function readJsonBody(
  request,
  maxBodyBytes
) {
  let size = 0;

  const chunks = [];


  for await (
    const chunk
    of request
  ) {
    size +=
      chunk.length;


    if (
      size >
      maxBodyBytes
    ) {
      const error =
        new Error(
          "Request body too large."
        );

      error.statusCode =
        413;

      throw error;
    }


    chunks.push(
      chunk
    );
  }


  if (!chunks.length) {
    return {};
  }


  const text =
    Buffer
      .concat(
        chunks
      )
      .toString(
        "utf8"
      );


  try {
    return JSON.parse(
      text
    );

  } catch {
    const error =
      new Error(
        "Invalid JSON request body."
      );

    error.statusCode =
      400;

    throw error;
  }
}


function validateRecordAuthority(
  record,
  scope
) {
  if (!record?.record_id) {
    const error =
      new Error(
        "Teller record_id is required."
      );

    error.statusCode =
      400;

    throw error;
  }


  if (
    clean(
      record.business_key
    ) !==
    clean(
      scope.businessKey
    )
  ) {
    const error =
      new Error(
        "Record business does not match authenticated scope."
      );

    error.statusCode =
      403;

    throw error;
  }


  if (
    record.actor_role &&
    clean(
      record.actor_role
    ).toLowerCase() !==
    clean(
      scope.actorRole
    ).toLowerCase()
  ) {
    const error =
      new Error(
        "Record role does not match authenticated scope."
      );

    error.statusCode =
      403;

    throw error;
  }


  return true;
}


function safeErrorMessage(
  statusCode
) {
  if (statusCode === 400) {
    return "The Teller rejected this request.";
  }


  if (statusCode === 401) {
    return "Teller persistence authentication required.";
  }


  if (statusCode === 403) {
    return "Teller persistence permission denied.";
  }


  if (statusCode === 404) {
    return "Teller record not found.";
  }


  if (statusCode === 409) {
    return "Teller record changed before this update completed.";
  }


  if (statusCode === 413) {
    return "Teller request body is too large.";
  }


  return "Teller persistence request failed.";
}


export function createTellerPersistenceHttpServer({
  pool,
  env = process.env,
} = {}) {
  if (
    !pool ||
    typeof pool.connect !== "function"
  ) {
    throw new Error(
      "Teller persistence HTTP server requires a PostgreSQL pool."
    );
  }


  const config =
    readTellerTransportConfig(
      env
    );


  if (!config.configured) {
    throw new Error(
      "Teller persistence HTTP transport is not configured."
    );
  }


  const repository =
    createPostgresTellerRecordRepository({
      pool,
    });


  return createServer(
    async (
      request,
      response
    ) => {
      const requestId =
        randomUUID();


      const origin =
        clean(
          request.headers.origin
        );


      const responseContext = {
        origin,
        allowedOrigins:
          config.allowedOrigins,

        requestId,
      };


      try {
        if (
          !originAllowed(
            request,
            config
          )
        ) {
          json(
            response,
            403,
            {
              error:
                "origin_not_allowed",

              request_id:
                requestId,
            },
            responseContext
          );

          return;
        }


        if (
          request.method ===
          "OPTIONS"
        ) {
          response.writeHead(
            204,
            {
              "Access-Control-Allow-Origin":
                origin,

              "Access-Control-Allow-Headers":
                "Authorization, Content-Type",

              "Access-Control-Allow-Methods":
                "GET, POST, PATCH, OPTIONS",

              "Access-Control-Max-Age":
                "600",

              "Vary":
                "Origin",

              "X-Teller-Request-Id":
                requestId,
            }
          );

          response.end();

          return;
        }


        const url =
          new URL(
            request.url || "/",
            "http://teller.local"
          );


        if (
          request.method ===
            "GET" &&
          url.pathname ===
            "/healthz"
        ) {
          json(
            response,
            200,
            {
              status:
                "ok",

              service:
                "teller-persistence",

              database_credentials_exposed:
                false,

              request_id:
                requestId,
            },
            responseContext
          );

          return;
        }


        const accessToken =
          readBearerToken(
            request
          );


        if (!accessToken) {
          const error =
            new Error(
              "Persistence access token missing."
            );

          error.statusCode =
            401;

          throw error;
        }


        let claims = null;


        try {
          claims =
            verifyTellerPersistenceAccessToken({
              token:
                accessToken,

              secret:
                config.tokenSecret,

              issuer:
                config.issuer,

              audience:
                config.audience,
            });

        } catch {
          const error =
            new Error(
              "Persistence access token invalid."
            );

          error.statusCode =
            401;

          throw error;
        }


        const scope =
          tellerPersistenceScopeFromClaims(
            claims
          );


        if (
          request.method ===
            "GET" &&
          url.pathname ===
            "/v1/records"
        ) {
          const result =
            await repository.searchRecords({
              scope,

              query: {
                text:
                  url.searchParams.get(
                    "text"
                  ) ||
                  "",

                category:
                  url.searchParams.get(
                    "category"
                  ) ||
                  "",

                status:
                  url.searchParams.get(
                    "status"
                  ) ||
                  "",

                limit:
                  url.searchParams.get(
                    "limit"
                  ) ||
                  "100",
              },
            });


          json(
            response,
            200,
            {
              ...result,

              request_id:
                requestId,
            },
            responseContext
          );

          return;
        }


        if (
          request.method ===
            "POST" &&
          url.pathname ===
            "/v1/records"
        ) {
          const body =
            await readJsonBody(
              request,
              config.maxBodyBytes
            );


          validateRecordAuthority(
            body.record,
            scope
          );


          const result =
            await repository.saveRecord({
              scope,

              record:
                body.record,

              idempotencyKey:
                clean(
                  body.idempotency_key
                ),
            });


          json(
            response,
            201,
            {
              ...result,

              request_id:
                requestId,
            },
            responseContext
          );

          return;
        }


        const recordMatch =
          url.pathname.match(
            /^\/v1\/records\/([^/]+)$/
          );


        if (
          recordMatch &&
          request.method ===
            "GET"
        ) {
          const result =
            await repository.getRecord({
              scope,

              recordId:
                decodeURIComponent(
                  recordMatch[1]
                ),
            });


          const statusCode =
            result.status ===
            "not_found"
              ? 404
              : 200;


          json(
            response,
            statusCode,
            {
              ...result,

              request_id:
                requestId,
            },
            responseContext
          );

          return;
        }


        if (
          recordMatch &&
          request.method ===
            "PATCH"
        ) {
          const body =
            await readJsonBody(
              request,
              config.maxBodyBytes
            );


          validateRecordAuthority(
            body.record,
            scope
          );


          if (
            body.record.record_id !==
            decodeURIComponent(
              recordMatch[1]
            )
          ) {
            const error =
              new Error(
                "Record path and payload do not match."
              );

            error.statusCode =
              400;

            throw error;
          }


          const result =
            await repository.updateRecord({
              scope,

              record:
                body.record,

              expectedRevision:
                body.expected_revision,
            });


          const statusCode =
            result.status ===
            "conflict"
              ? 409
              : result.status ===
                  "not_found"
                ? 404
                : 200;


          json(
            response,
            statusCode,
            {
              ...result,

              request_id:
                requestId,
            },
            responseContext
          );

          return;
        }


        json(
          response,
          404,
          {
            error:
              "route_not_found",

            request_id:
              requestId,
          },
          responseContext
        );

      } catch (error) {

        const statusCode =
          Number(
            error?.statusCode
          ) ||
          500;


        json(
          response,
          statusCode,
          {
            error:
              safeErrorMessage(
                statusCode
              ),

            request_id:
              requestId,
          },
          responseContext
        );
      }
    }
  );
}
