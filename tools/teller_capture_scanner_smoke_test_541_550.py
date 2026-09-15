from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (
        ROOT / path
    ).read_text(
        encoding="utf-8"
    )


def require(condition, message):
    if not condition:
        raise AssertionError(message)


required_files = [
    "src/teller/capture/tellerCaptureTypes.js",
    "src/teller/capture/tellerCaptureValidation.js",
    "src/teller/capture/tellerCaptureFingerprint.js",
    "src/teller/capture/tellerCaptureClassifier.js",
    "src/teller/capture/tellerOcrAdapter.js",
    "src/teller/capture/tellerCaptureReview.js",
    "src/teller/capture/tellerCaptureMapping.js",
    "src/teller/capture/TellerCaptureWorkspace.jsx",
    "src/teller/capture/tellerCapture.css",
]


for path in required_files:
    require(
        (ROOT / path).exists(),
        f"Missing Capture file: {path}"
    )


types = read(
    "src/teller/capture/tellerCaptureTypes.js"
)

validation = read(
    "src/teller/capture/tellerCaptureValidation.js"
)

fingerprint = read(
    "src/teller/capture/tellerCaptureFingerprint.js"
)

classifier = read(
    "src/teller/capture/tellerCaptureClassifier.js"
)

ocr = read(
    "src/teller/capture/tellerOcrAdapter.js"
)

review = read(
    "src/teller/capture/tellerCaptureReview.js"
)

mapping = read(
    "src/teller/capture/tellerCaptureMapping.js"
)

workspace = read(
    "src/teller/capture/TellerCaptureWorkspace.jsx"
)

css = read(
    "src/teller/capture/tellerCapture.css"
)

app = read(
    "src/App.jsx"
)


# GP541
for marker in [
    "TELLER_DOCUMENT_TYPES",
    "TELLER_CAPTURE_MIME_TYPES",
    "TELLER_CAPTURE_MAX_BYTES",
    "listTellerDocumentTypesForRole",
]:
    require(
        marker in types,
        f"GP541 missing {marker}"
    )


for marker in [
    "invoice",
    "receipt",
    "employee_document",
    "tax_document",
    "vendor_document",
    "payment_proof",
    "other",
]:
    require(
        marker in types,
        f"Document type missing: {marker}"
    )


# GP542
for marker in [
    "validateTellerCaptureFile",
    "buildTellerCaptureMetadata",
    "25 MB",
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
]:
    require(
        marker in validation or marker in types,
        f"GP542 missing {marker}"
    )


# GP543
for marker in [
    'crypto.subtle.digest',
    '"SHA-256"',
    "isDuplicateTellerCapture",
    "shortTellerFingerprint",
]:
    require(
        marker in fingerprint,
        f"GP543 missing {marker}"
    )


# GP544
for marker in [
    "classifyTellerCapture",
    "filename_heuristic",
    "human_review_required",
    "tellerClassificationConfidenceLabel",
]:
    require(
        marker in classifier,
        f"GP544 missing {marker}"
    )


require(
    "human_review_required:\n        true"
    in classifier
    or "human_review_required:\n      true"
    in classifier,
    "Classification is not review-gated."
)


# GP545
for marker in [
    "TELLER_OCR_STATUS",
    "NOT_CONNECTED",
    "createUnconfiguredTellerOcrAdapter",
    "runTellerOcr",
    "sent_to_provider",
]:
    require(
        marker in ocr,
        f"GP545 missing {marker}"
    )


require(
    "configured:\n      false"
    in ocr,
    "Default OCR adapter is not explicitly unconfigured."
)


# GP546 / GP547
for marker in [
    "normalizeTellerExtractedField",
    "provenance",
    "confidence",
    "verified",
    "createTellerCaptureReview",
    "reviewTellerCaptureDocumentType",
    "canPrepareTellerCapture",
    "human_verified",
]:
    require(
        marker in review,
        f"Capture review model missing {marker}"
    )


require(
    "raw_file_persisted:\n      false"
    in review,
    "Prepared capture does not explicitly block raw-file persistence."
)


require(
    "uploaded:\n        false"
    in review,
    "Prepared capture does not explicitly state uploaded=false."
)


# GP548
for marker in [
    "getTellerCaptureFormSuggestion",
    "invoice_intake",
    "reimbursement_request",
    "employment_document_checklist",
    "vendor_setup_request",
    "payment_exception_request",
    "autofill_applied",
    "attachment_applied",
]:
    require(
        marker in mapping,
        f"Capture→form mapping missing {marker}"
    )


require(
    "autofill_applied:\n      false"
    in mapping,
    "Capture mapping falsely claims autofill."
)


require(
    "attachment_applied:\n      false"
    in mapping,
    "Capture mapping falsely claims attachment."
)


# GP549
for marker in [
    "Scan with camera",
    "Upload image or PDF",
    'capture="environment"',
    "Prepare & check extraction",
    "OCR / extraction",
    "Not connected",
    "Teller suggestions are not accepted",
]:
    require(
        marker in workspace,
        f"Capture UI missing {marker}"
    )


require(
    "TellerCaptureWorkspace"
    in app,
    "Capture workspace is not mounted in App."
)


require(
    ">Scan<"
    in app.replace("\n", "").replace(" ", ""),
    "Global Scan button missing."
)


require(
    "teller-capture-overlay"
    in css,
    "Capture drawer styling missing."
)


# No network/file transport
combined = "\n".join([
    types,
    validation,
    fingerprint,
    classifier,
    ocr,
    review,
    mapping,
    workspace,
])


for forbidden in [
    "fetch(",
    "axios.",
    "XMLHttpRequest",
    "FormData(",
    "navigator.sendBeacon",
    "URL.createObjectURL",
    "window.open",
    "vault://",
]:
    require(
        forbidden.lower()
        not in combined.lower(),
        f"Forbidden transport behavior found: {forbidden}"
    )


# No raw-byte persistence
for forbidden in [
    "localStorage.setItem",
    "sessionStorage.setItem",
    "indexedDB.open",
]:
    require(
        forbidden not in combined,
        f"Raw persistence mechanism found: {forbidden}"
    )


# OCR must not fake extracted content
require(
    "raw_text:\n        null"
    in ocr
    or "raw_text:\n      null"
    in ocr,
    "OCR boundary does not preserve raw_text=null."
)


require(
    "extracted_fields:\n        []"
    in ocr
    or "extracted_fields:\n      []"
    in ocr,
    "OCR boundary does not preserve empty extraction."
)


# No provider hard-wiring
for provider in [
    "google vision",
    "aws textract",
    "azure document intelligence",
    "document ai",
    "tesseract",
]:
    require(
        provider not in combined.lower(),
        f"OCR provider hard-wired too early: {provider}"
    )


# Previous production boundary still holds
for forbidden in [
    "TowerBackupWorkspace",
    "EmployeeDocumentVaultPanel",
    "Dev test links",
    "teller_view",
]:
    require(
        forbidden not in app,
        f"Production boundary regression: {forbidden}"
    )


print(
    "GP541-GP550 TELLER CAPTURE / SCANNER SMOKE TEST PASSED"
)

print(
    "Camera/image/PDF selection: present"
)

print(
    "File validation: present"
)

print(
    "Local SHA-256 fingerprint: present"
)

print(
    "Session duplicate detection: present"
)

print(
    "Human document-type review: required"
)

print(
    "OCR adapter boundary: present"
)

print(
    "OCR provider: not connected"
)

print(
    "Raw document upload: blocked"
)

print(
    "Raw document persistence: blocked"
)

print(
    "Capture→form suggestion: present"
)

print(
    "Autofill/attachment: not applied"
)

print(
    "Direct Tower/Vault transport: not built"
)
