export const TELLER_OCR_STATUS =
  Object.freeze({
    NOT_CONNECTED: "not_connected",
    READY: "ready",
    PROCESSING: "processing",
    COMPLETE: "complete",
    FAILED: "failed",
  });


export function createTellerOcrRequest({
  capture_id,
  document_type,
  mime_type,
  fingerprint,
}) {
  return {
    capture_id,
    document_type,
    mime_type,
    fingerprint,

    requested_fields: [],

    provider:
      null,

    status:
      TELLER_OCR_STATUS.NOT_CONNECTED,

    raw_text:
      null,

    extracted_fields:
      [],

    sent_to_provider:
      false,
  };
}


export function createUnconfiguredTellerOcrAdapter() {
  return {
    provider_id:
      "unconfigured",

    configured:
      false,

    async classifyDocument() {
      return {
        status:
          TELLER_OCR_STATUS.NOT_CONNECTED,

        result:
          null,
      };
    },

    async extractFields() {
      return {
        status:
          TELLER_OCR_STATUS.NOT_CONNECTED,

        fields:
          [],
      };
    },
  };
}


export async function runTellerOcr(
  request,
  adapter =
    createUnconfiguredTellerOcrAdapter()
) {
  if (!adapter?.configured) {
    return {
      ...request,

      status:
        TELLER_OCR_STATUS.NOT_CONNECTED,

      raw_text:
        null,

      extracted_fields:
        [],

      sent_to_provider:
        false,
    };
  }

  throw new Error(
    "A production OCR adapter has not been authorized in this Teller build."
  );
}
