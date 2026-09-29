import {
  TELLER_CAPTURE_MAX_BYTES,
  TELLER_CAPTURE_MIME_TYPES,
  TELLER_CAPTURE_SOURCES,
} from "./tellerCaptureTypes.js";


function clean(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}


function extensionForName(name) {
  const cleaned =
    clean(name).toLowerCase();

  if (!cleaned.includes(".")) {
    return "";
  }

  return cleaned
    .split(".")
    .pop();
}


export function tellerCaptureSourceForFile(
  file,
  requestedSource
) {
  if (
    requestedSource ===
    TELLER_CAPTURE_SOURCES.CAMERA
  ) {
    return TELLER_CAPTURE_SOURCES.CAMERA;
  }

  if (
    file?.type ===
    "application/pdf"
  ) {
    return TELLER_CAPTURE_SOURCES.PDF_UPLOAD;
  }

  return TELLER_CAPTURE_SOURCES.IMAGE_UPLOAD;
}


export function buildTellerCaptureMetadata(
  file,
  requestedSource = ""
) {
  if (!file) {
    return null;
  }

  return {
    name:
      clean(file.name, "unnamed_document"),

    mime_type:
      clean(
        file.type,
        "application/octet-stream"
      ),

    size_bytes:
      Number(file.size || 0),

    extension:
      extensionForName(file.name),

    last_modified:
      Number(file.lastModified || 0),

    source:
      tellerCaptureSourceForFile(
        file,
        requestedSource
      ),

    raw_file_persisted:
      false,

    uploaded:
      false,
  };
}


export function validateTellerCaptureFile(
  file
) {
  const problems = [];

  if (!file) {
    problems.push(
      "Choose a document first."
    );

    return {
      valid: false,
      problems,
      metadata: null,
    };
  }


  if (
    !TELLER_CAPTURE_MIME_TYPES.includes(
      file.type
    )
  ) {
    problems.push(
      "Use a JPG, PNG, WEBP, or PDF file."
    );
  }


  if (
    Number(file.size || 0) <= 0
  ) {
    problems.push(
      "The selected file is empty."
    );
  }


  if (
    Number(file.size || 0) >
    TELLER_CAPTURE_MAX_BYTES
  ) {
    problems.push(
      "The selected file is larger than 25 MB."
    );
  }


  return {
    valid:
      problems.length === 0,

    problems,

    metadata:
      buildTellerCaptureMetadata(
        file
      ),
  };
}


export function formatTellerCaptureSize(
  bytes
) {
  const size =
    Number(bytes || 0);

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}
