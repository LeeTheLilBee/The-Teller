import {
  readTellerPersistenceAccessToken,
} from "../tellerRuntimeSession.js";


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


function runtimeApiUrl() {
  return trimSlash(
    import.meta
      ?.env
      ?.VITE_TELLER_PERSISTENCE_API_URL ||
    ""
  );
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
} = {}) {
  const resolvedBaseUrl =
    trimSlash(
      baseUrl
    );


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

    identityKey:
      `${resolvedBaseUrl}|${connected ? "authenticated" : "disconnected"}`,

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
  return createTellerPersistenceTransport({
    baseUrl:
      runtimeApiUrl(),

    accessToken:
      readTellerPersistenceAccessToken(),
  });
}
