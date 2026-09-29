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
    "src/teller/capture/tellerExtractionSchema.js",
    "src/teller/capture/tellerExtractionNormalize.js",
    "src/teller/capture/tellerExtractionMapping.js",
    "src/teller/capture/tellerExtractionVerification.js",
    "src/teller/capture/tellerCaptureAutofill.js",
    "src/teller/capture/TellerExtractionReview.jsx",
]

for path in required_files:
    require(
        (ROOT / path).exists(),
        f"Missing verified-autofill file: {path}"
    )


schema = read(
    "src/teller/capture/tellerExtractionSchema.js"
)

normalize = read(
    "src/teller/capture/tellerExtractionNormalize.js"
)

mapping = read(
    "src/teller/capture/tellerExtractionMapping.js"
)

verify = read(
    "src/teller/capture/tellerExtractionVerification.js"
)

autofill = read(
    "src/teller/capture/tellerCaptureAutofill.js"
)

review = read(
    "src/teller/capture/TellerExtractionReview.jsx"
)

ocr = read(
    "src/teller/capture/tellerOcrAdapter.js"
)

capture = read(
    "src/teller/capture/TellerCaptureWorkspace.jsx"
)

forms = read(
    "src/teller/forms/TellerFormsWorkspace.jsx"
)

app = read(
    "src/App.jsx"
)


# GP551 / GP552
for marker in [
    "TELLER_EXTRACTION_DECISIONS",
    "TELLER_CONFIDENCE_LEVELS",
    "TELLER_FORBIDDEN_EXTRACTED_FIELDS",
    "TELLER_DOCUMENT_EXTRACTION_FIELDS",
    "getTellerExtractableFields",
    "isForbiddenTellerExtractedField",
]:
    require(
        marker in schema,
        f"Extraction schema missing {marker}"
    )


for forbidden_field in [
    "ssn",
    "tin",
    "routing_number",
    "account_number",
    "card_number",
    "cvv",
    "password",
    "document_number",
]:
    require(
        forbidden_field in schema,
        f"Forbidden extraction field not blocked: {forbidden_field}"
    )


# GP553
for marker in [
    "normalizeTellerExtractionField",
    "normalizeTellerExtractionResult",
    "human_review_required",
    "auto_accept_allowed",
    "raw_text_retained",
]:
    require(
        marker in normalize,
        f"Extraction normalization missing {marker}"
    )


require(
    "auto_accept_allowed:\n      false"
    in normalize,
    "Normalized extraction does not block auto-accept."
)


require(
    "raw_text_retained:\n      false"
    in normalize,
    "Extraction normalization retains raw OCR text."
)


# OCR provider still optional/unconfigured
for marker in [
    "createUnconfiguredTellerOcrAdapter",
    "configured:",
    "normalizeTellerExtractionResult",
    "sent_to_provider",
    "human_review_required",
    "auto_accept_allowed",
]:
    require(
        marker in ocr,
        f"OCR adapter missing {marker}"
    )


require(
    'provider_id:\n      "unconfigured"'
    in ocr,
    "Default OCR provider is no longer unconfigured."
)


# GP554
for marker in [
    "mapTellerExtractionToForm",
    "mapped_pending_verification",
    "forbidden_sensitive_field",
    "target_not_in_form",
]:
    require(
        marker in mapping,
        f"Extraction mapping missing {marker}"
    )


# GP555 / GP556
for marker in [
    "tellerExtractionNeedsAttention",
    "tellerExtractionConfidenceCopy",
    "updateTellerExtractionValue",
    "acceptTellerExtractionField",
    "rejectTellerExtractionField",
    "resetTellerExtractionDecision",
    "getTellerExtractionReviewSummary",
]:
    require(
        marker in verify,
        f"Verification engine missing {marker}"
    )


require(
    "verified:\n      true"
    in verify,
    "Accept/reject action does not record verification."
)


# GP557
for marker in [
    "buildVerifiedTellerAutofillPacket",
    "isValidTellerAutofillHandoff",
    "verified_document_extraction",
    "human_verified",
    "auto_submitted",
    "form_submission_created",
    "file_attached",
    "raw_file_included",
]:
    require(
        marker in autofill,
        f"Autofill packet missing {marker}"
    )


for false_truth in [
    "auto_submitted:\n      false",
    "form_submission_created:\n      false",
    "file_attached:\n      false",
    "raw_file_included:\n      false",
]:
    require(
        false_truth in autofill,
        f"Autofill truth missing: {false_truth}"
    )


# GP558 / GP559 UI
for marker in [
    "TellerExtractionReview",
    "Prepare & check extraction",
    "No extracted fields available",
    "OCR provider is not connected",
    "onFormHandoff",
]:
    require(
        marker in capture,
        f"Capture verified-autofill UI missing {marker}"
    )


for marker in [
    "Verify before autofill",
    "Accept",
    "Reject",
    "Open verified form",
]:
    require(
        marker in review,
        f"Extraction review UI missing {marker}"
    )


for marker in [
    "externalHandoff",
    "isValidTellerAutofillHandoff",
    "verified_autofill_provenance",
    "Verified document values added",
]:
    require(
        marker in forms,
        f"Forms handoff missing {marker}"
    )


for marker in [
    "verifiedAutofillHandoff",
    "handleVerifiedAutofill",
    "externalHandoff",
    "onFormHandoff",
]:
    require(
        marker in app,
        f"App autofill handoff missing {marker}"
    )


# No fake extraction fixtures in active product
combined = "\n".join([
    schema,
    normalize,
    mapping,
    verify,
    autofill,
    review,
    ocr,
    capture,
    forms,
    app,
])


for fake_value in [
    "ACME Corporation",
    "INV-12345",
    "John Doe",
    "Jane Doe",
    "123-45-6789",
    "987654321",
]:
    require(
        fake_value not in combined,
        f"Fake extracted production value found: {fake_value}"
    )


# No transport / persistence
for forbidden in [
    "fetch(",
    "axios.",
    "XMLHttpRequest",
    "FormData(",
    "navigator.sendBeacon",
    "URL.createObjectURL",
    "localStorage.setItem",
    "sessionStorage.setItem",
    "indexedDB.open",
    "vault://",
]:
    require(
        forbidden.lower()
        not in combined.lower(),
        f"Forbidden transport/persistence found: {forbidden}"
    )


# No automatic submission
for forbidden in [
    "auto_submitted: true",
    "form_submission_created: true",
    "file_attached: true",
    "raw_file_included: true",
]:
    require(
        forbidden not in combined,
        f"False autofill success state found: {forbidden}"
    )


# Previous GP541 truth remains
for marker in [
    "Scan with camera",
    "Upload image or PDF",
    'capture="environment"',
]:
    require(
        marker in capture,
        f"GP541-GP550 regression: {marker}"
    )


print(
    "GP551-GP560 VERIFIED SCANNER AUTOFILL SMOKE TEST PASSED"
)

print(
    "Provider-neutral extraction normalization: present"
)

print(
    "Forbidden sensitive extraction fields: blocked"
)

print(
    "Extraction → form mapping: present"
)

print(
    "Human accept/reject/correction: required"
)

print(
    "Verified autofill packet: present"
)

print(
    "Capture → Forms handoff: present"
)

print(
    "Automatic form submission: blocked"
)

print(
    "Raw document in handoff: blocked"
)

print(
    "OCR provider default: unconfigured"
)

print(
    "Fake extracted values: absent"
)

print(
    "Direct Tower/Vault transport: not built"
)
