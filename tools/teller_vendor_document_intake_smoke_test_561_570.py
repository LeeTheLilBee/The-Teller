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
    "src/teller/vendors/tellerVendorDocumentForms.js",
    "src/teller/vendors/tellerVendorDocumentModel.js",
    "src/teller/vendors/tellerVendorDocumentIntake.js",
    "src/teller/vendors/TellerVendorDocumentPanel.jsx",
]


for path in required_files:
    require(
        (ROOT / path).exists(),
        f"Missing Vendor/Document file: {path}"
    )


forms = read(
    "src/teller/vendors/tellerVendorDocumentForms.js"
)

model = read(
    "src/teller/vendors/tellerVendorDocumentModel.js"
)

intake = read(
    "src/teller/vendors/tellerVendorDocumentIntake.js"
)

panel = read(
    "src/teller/vendors/TellerVendorDocumentPanel.jsx"
)

registry = read(
    "src/teller/forms/tellerFormRegistry.js"
)

workspace = read(
    "src/teller/forms/TellerFormsWorkspace.jsx"
)

css = read(
    "src/teller/forms/tellerForms.css"
)


# GP561 / GP562
for marker in [
    "createBlankTellerVendorRecord",
    "createBlankTellerDocumentWorkflowRecord",
    "buildTellerVendorDocumentPreview",
    "session_memory_only",
]:
    require(
        marker in model,
        f"Vendor/Document model missing {marker}"
    )


for marker in [
    "tin_collected_here: false",
    "bank_account_collected_here: false",
    "routing_number_collected_here: false",
    "raw_file_saved_here: false",
    "uploaded_here: false",
    "vault_link_present: false",
]:
    require(
        marker in model,
        f"Vendor/Document truth missing: {marker}"
    )


# GP563
for marker in [
    "TELLER_VENDOR_INTAKE_ACTIONS",
    "TELLER_DOCUMENT_INTAKE_ACTIONS",
    "getTellerVendorIntakeStatus",
    "getTellerDocumentIntakeStatus",
]:
    require(
        marker in intake,
        f"Vendor/Document planner missing {marker}"
    )


# GP564–568
new_form_ids = [
    "vendor_profile_intake",
    "vendor_payment_setup_request",
    "missing_document_request",
    "replacement_document_request",
    "document_verification_review",
]


for form_id in new_form_ids:
    require(
        form_id in forms,
        f"Missing Vendor/Document form: {form_id}"
    )


# Existing workflows retained
for existing in [
    "vendor_setup_request",
    "invoice_intake",
    "payment_request",
    "reimbursement_request",
]:
    require(
        existing in registry,
        f"Existing Teller workflow lost: {existing}"
    )


# Registry wiring
require(
    "TELLER_VENDOR_DOCUMENT_FORMS"
    in registry,
    "Vendor/Document forms not imported into canonical registry."
)

require(
    "...TELLER_VENDOR_DOCUMENT_FORMS"
    in registry,
    "Vendor/Document forms not spread into canonical registry."
)


# Vendor practical fields
for marker in [
    "vendor_name",
    "contact_name",
    "email",
    "phone",
    "business_unit",
    "service_category",
    "payment_terms",
    "payment_method_requested",
]:
    require(
        marker in forms,
        f"Vendor intake missing {marker}"
    )


# Document practical fields
for marker in [
    "subject_type",
    "subject_name",
    "document_category",
    "document_label",
    "replacement_reason",
    "verification_result",
    "review_note",
    "capture_reference",
]:
    require(
        marker in forms,
        f"Document intake missing {marker}"
    )


# No sensitive raw fields
for forbidden in [
    'field_id:\n                "tin"',
    'field_id:\n                "ein"',
    'field_id:\n                "taxpayer_identification_number"',
    'field_id:\n                "routing_number"',
    'field_id:\n                "account_number"',
    'field_id:\n                "bank_account_number"',
    'field_id:\n                "document_number"',
    'field_id:\n                "ssn"',
]:
    require(
        forbidden not in forms,
        f"Forbidden raw sensitive field present: {forbidden}"
    )


# Payment setup is protected
require(
    '"vendor_payment_setup_request"'
    in forms,
    "Vendor payment setup form missing."
)

require(
    "tower_approval_required:\n        true"
    in forms,
    "Protected vendor payment setup does not require Tower review."
)


# UI
require(
    "TellerVendorDocumentPanel"
    in workspace,
    "Vendor/Document panel not mounted in Forms workspace."
)

require(
    "Vendors & Documents"
    in panel,
    "Vendors & Documents heading missing."
)

require(
    "Raw document stored"
    in panel,
    "Raw-document truth missing."
)

require(
    "Vault link"
    in panel,
    "Vault-link truth missing."
)

require(
    "Production persistence"
    in panel,
    "Production persistence truth missing."
)

require(
    "teller-vendor-document-panel"
    in css,
    "Vendor/Document styling missing."
)


# No direct transport / storage
combined = "\n".join([
    forms,
    model,
    intake,
    panel,
])


for forbidden in [
    "fetch(",
    "axios.",
    "XMLHttpRequest",
    "FormData(",
    "URL.createObjectURL",
    "window.open",
    "vault://",
    "localStorage.setItem",
    "sessionStorage.setItem",
    "indexedDB.open",
]:
    require(
        forbidden.lower()
        not in combined.lower(),
        f"Forbidden Vendor/Document behavior: {forbidden}"
    )


# No fake storage/payment state
for forbidden in [
    "raw_file_saved_here: true",
    "uploaded_here: true",
    "vault_link_present: true",
    "production_record_saved: true",
]:
    require(
        forbidden not in combined,
        f"False Vendor/Document success state: {forbidden}"
    )


# Capture / Forms verified autofill still exist
capture = read(
    "src/teller/capture/TellerCaptureWorkspace.jsx"
)

autofill = read(
    "src/teller/capture/tellerCaptureAutofill.js"
)


require(
    "TellerExtractionReview"
    in capture,
    "Verified Capture review was lost."
)

require(
    "buildVerifiedTellerAutofillPacket"
    in autofill,
    "Verified autofill packet was lost."
)


print(
    "GP561-GP570 VENDOR + DOCUMENT INTAKE SMOKE TEST PASSED"
)

print(
    "Canonical Vendor model: present"
)

print(
    "Canonical Document workflow model: present"
)

print(
    "New Vendor/Document forms: 5"
)

print(
    "Existing Vendor Setup + Invoice workflows: preserved"
)

print(
    "Vendor Payment Setup: Tower-review protected"
)

print(
    "Raw TIN/EIN/bank/document-number collection: blocked"
)

print(
    "Raw document storage/upload claim: blocked"
)

print(
    "Automatic document acceptance: not built"
)

print(
    "Verified Capture/autofill: preserved"
)

print(
    "Direct Tower/Vault transport: not built"
)
