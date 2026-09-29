function bytesToHex(buffer) {
  return Array.from(
    new Uint8Array(buffer)
  )
    .map(
      (byte) =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


export async function fingerprintTellerFile(
  file
) {
  if (!file) {
    throw new Error(
      "A file is required for fingerprinting."
    );
  }

  if (
    typeof crypto === "undefined" ||
    !crypto.subtle
  ) {
    throw new Error(
      "Secure browser fingerprinting is not available."
    );
  }

  const bytes =
    await file.arrayBuffer();

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      bytes
    );

  return bytesToHex(
    digest
  );
}


export function isDuplicateTellerCapture(
  fingerprint,
  existingFingerprints = []
) {
  if (!fingerprint) {
    return false;
  }

  return existingFingerprints.includes(
    fingerprint
  );
}


export function shortTellerFingerprint(
  fingerprint
) {
  if (!fingerprint) {
    return "";
  }

  return (
    fingerprint.slice(0, 12)
    + "…"
    + fingerprint.slice(-8)
  );
}
