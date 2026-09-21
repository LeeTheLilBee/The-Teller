import {
  readTellerLiveTowerSession,
  readTellerPersistenceAccessToken,
} from "../tellerRuntimeSession.js";

import {
  describeTellerHostedPersistenceActivation,
} from "./tellerHostedPersistenceGate.js";


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function trimSlash(
  value
) {
  return clean(
    value
  )
    .replace(
      /\/+$/,
      ""
    );
}


function isLoopbackHost(
  hostname
) {
  return (
    hostname ===
      "127.0.0.1" ||
    hostname ===
      "localhost" ||
    hostname ===
      "::1"
  );
}


export function normalizeTellerPersistenceApiUrl({
  value,
  devMode = false,
} = {}) {
  const candidate =
    trimSlash(
      value
    );


  if (!candidate) {
    return "";
  }


  let parsed = null;


  try {
    parsed =
      new URL(
        candidate
      );

  } catch {
    return "";
  }


  if (
    parsed.protocol ===
    "https:"
  ) {
    return candidate;
  }


  if (
    devMode &&
    parsed.protocol ===
      "http:" &&
    isLoopbackHost(
      parsed.hostname
    )
  ) {
    return candidate;
  }


  return "";
}


export function readTellerPersistenceApiUrlFromRuntime() {
  return normalizeTellerPersistenceApiUrl({
    value:
      import.meta
        ?.env
        ?.VITE_TELLER_PERSISTENCE_API_URL ||
      "",

    devMode:
      Boolean(
        import.meta
          ?.env
          ?.DEV
      ),
  });
}


export class TellerPersistenceTransportError
  extends Error {
  constructor(
    message,
    {
      status = 0,
      requestId = "",
    } = {}
  ) {
    super(
      message
    );

    this.name =
      "TellerPersistenceTransportError";

    this.status =
      status;

    this.requestId =
      requestId;
  }
}


export function createTellerPersistenceTransport({
  baseUrl,
  accessToken,
  fetchImpl = globalThis.fetch,
  devMode = false,
  activation = null,
} = {}) {
  const resolvedBaseUrl =
    normalizeTellerPersistenceApiUrl({
      value:
        baseUrl,

      devMode,
    });


  const resolvedToken =
    clean(
      accessToken
    );


  const connected =
    Boolean(
      resolvedBaseUrl &&
      resolvedToken &&
      typeof fetchImpl ===
        "function"
    );


  async function request(
    path,
    {
      method = "GET",
      body = undefined,
    } = {}
  ) {
    if (!connected) {
      throw new TellerPersistenceTransportError(
        "Teller persistence transport is not connected."
      );
    }


    const response =
      await fetchImpl(
        `${resolvedBaseUrl}${path}`,
        {
          method,

          credentials:
            "omit",

          referrerPolicy:
            "no-referrer",

          headers: {
            "Authorization":
              `Bearer ${resolvedToken}`,

            "Content-Type":
              "application/json",
          },

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


    if (!response.ok) {
      throw new TellerPersistenceTransportError(
        payload?.error ||
        "Teller persistence request failed.",
        {
          status:
            response.status,

          requestId:
            payload
              ?.request_id ||
            "",
        }
      );
    }


    return payload;
  }


  return Object.freeze({
    connected,

    baseUrl:
      resolvedBaseUrl,

    identityKey:
      [
        resolvedBaseUrl,
        activation?.identityKey || "",
        connected
          ? "authenticated"
          : "disconnected",
      ].join("|"),

    activation:
      activation ||
      Object.freeze({
        ready:
          connected,

        blockers:
          Object.freeze([]),
      }),


    async searchRecords(
      query = {}
    ) {
      const params =
        new URLSearchParams();


      for (
        const [
          key,
          value,
        ]
        of Object.entries({
          text:
            query.text || "",

          category:
            query.category || "",

          status:
            query.status || "",

          limit:
            query.limit || 100,
        })
      ) {
        if (
          value !== "" &&
          value !== null &&
          value !== undefined
        ) {
          params.set(
            key,
            String(
              value
            )
          );
        }
      }


      return request(
        `/v1/records?${params.toString()}`
      );
    },


    async saveRecord(
      record
    ) {
      return request(
        "/v1/records",
        {
          method:
            "POST",

          body: {
            record,
          },
        }
      );
    },


    async getRecord(
      recordId
    ) {
      return request(
        `/v1/records/${encodeURIComponent(
          recordId
        )}`
      );
    },


    async updateRecord(
      record,
      expectedRevision
    ) {
      return request(
        `/v1/records/${encodeURIComponent(
          record.record_id
        )}`,
        {
          method:
            "PATCH",

          body: {
            record,

            expected_revision:
              expectedRevision,
          },
        }
      );
    },
  });
}


export function createTellerPersistenceTransportFromRuntime() {
  const devMode =
    Boolean(
      import.meta
        ?.env
        ?.DEV
    );


  const baseUrl =
    readTellerPersistenceApiUrlFromRuntime();


  const accessToken =
    readTellerPersistenceAccessToken();


  const session =
    readTellerLiveTowerSession();


  const activation =
    describeTellerHostedPersistenceActivation({
      session,

      accessToken,

      apiUrl:
        baseUrl,

      devMode,
    });


  return createTellerPersistenceTransport({
    baseUrl:
      activation.ready
        ? activation.apiUrl
        : "",

    accessToken:
      activation.ready
        ? accessToken
        : "",

    devMode,

    activation,
  });
}
