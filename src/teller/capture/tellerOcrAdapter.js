import {
  normalizeTellerExtractionResult,
} from "./tellerExtractionNormalize.js";


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

    provider:
      null,

    status:
      TELLER_OCR_STATUS.NOT_CONNECTED,

    extracted_fields:
      [],

    raw_text:
      null,

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

    async extractFields() {
      return {
        status:
          TELLER_OCR_STATUS.NOT_CONNECTED,

        provider_id:
          "unconfigured",

        fields:
          [],

        raw_text:
          null,

        sent_to_provider:
          false,
      };
    },
  };
}


export async function runTellerOcr(
  request,
  adapter =
    createUnconfiguredTellerOcrAdapter(),
  file = null
) {
  if (!adapter?.configured) {
    return {
      ...request,

      provider:
        null,

      status:
        TELLER_OCR_STATUS.NOT_CONNECTED,

      extracted_fields:
        [],

      raw_text:
        null,

      sent_to_provider:
        false,
    };
  }


  if (
    typeof adapter.extractFields !==
    "function"
  ) {
    throw new Error(
      "Configured Teller OCR adapter must implement extractFields()."
    );
  }


  const providerResult =
    await adapter.extractFields({
      request,
      file,
    });


  const normalized =
    normalizeTellerExtractionResult({
      document_type:
        request.document_type,

      provider_id:
        adapter.provider_id ||
        providerResult?.provider_id ||
        "configured_provider",

      fields:
        providerResult?.fields ||
        [],
    });


  return {
    ...request,

    provider:
      normalized.provider_id,

    status:
      TELLER_OCR_STATUS.COMPLETE,

    extracted_fields:
      normalized.fields,

    raw_text:
      null,

    sent_to_provider:
      true,

    human_review_required:
      true,

    auto_accept_allowed:
      false,
  };
}
