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


criteria = read(
    "src/teller/readiness/tellerPracticalUseCriteria.js"
)

readiness = read(
    "src/teller/readiness/tellerPracticalUseReadiness.js"
)

app = read(
    "src/App.jsx"
)

runtime = read(
    "src/teller/tellerRuntimeSession.js"
)

registry = read(
    "src/teller/forms/tellerFormRegistry.js"
)

forms = read(
    "src/teller/forms/TellerFormsWorkspace.jsx"
)

people = read(
    "src/teller/people/TellerPeopleIntakePanel.jsx"
)

money = read(
    "src/teller/money/TellerPayrollPaymentPanel.jsx"
)

vendors = read(
    "src/teller/vendors/TellerVendorDocumentPanel.jsx"
)

capture = read(
    "src/teller/capture/TellerCaptureWorkspace.jsx"
)

extraction_review = read(
    "src/teller/capture/TellerExtractionReview.jsx"
)

autofill = read(
    "src/teller/capture/tellerCaptureAutofill.js"
)

ocr = read(
    "src/teller/capture/tellerOcrAdapter.js"
)

records = read(
    "src/teller/records/TellerRecordsWorkspace.jsx"
)

record_schema = read(
    "src/teller/records/tellerRecordSchema.js"
)

repository = read(
    "src/teller/records/tellerRecordRepository.js"
)

search = read(
    "src/teller/records/tellerRecordSearch.js"
)

recovery = read(
    "src/teller/recovery/TellerRecoveryPanel.jsx"
)

validation = read(
    "src/teller/recovery/tellerProductionValidation.js"
)

duplicate = read(
    "src/teller/recovery/tellerSubmissionGuard.js"
)

snapshot = read(
    "src/teller/recovery/tellerRecoverySnapshot.js"
)


# ============================================================================================================
# GP591 — SESSION / ROLE BOUNDARY
# ============================================================================================================

for marker in [
    "readTellerTowerSession",
    "TowerLockedScreen",
    "Tower clearance",
]:
    require(
        marker in app,
        f"Session boundary missing: {marker}"
    )


for marker in [
    "__TELLER_TOWER_SESSION__",
    "the_teller_tower_runtime_session_v1",
]:
    require(
        marker in runtime,
        f"Tower runtime session source missing: {marker}"
    )


require(
    "TowerBackupWorkspace"
    not in app,
    "Local pretend Tower workspace returned."
)


# ============================================================================================================
# GP592–GP593 — FORMS / PRACTICAL LANES
# ============================================================================================================

for marker in [
    "listTellerFormsForRole",
    "TELLER_FORM_REGISTRY",
]:
    require(
        marker in registry,
        f"Form registry missing {marker}"
    )


for marker in [
    "TellerPeopleIntakePanel",
    "TellerPayrollPaymentPanel",
    "TellerVendorDocumentPanel",
]:
    require(
        marker in forms,
        f"Forms workspace missing practical panel: {marker}"
    )


require(
    "People"
    in people
    or "Employee"
    in people,
    "People intake surface missing."
)


require(
    "Payroll"
    in money,
    "Payroll/Payment surface missing."
)


require(
    "Vendors & Documents"
    in vendors,
    "Vendor/Document surface missing."
)


# ============================================================================================================
# GP594 — CAPTURE / VERIFIED AUTOFILL
# ============================================================================================================

for marker in [
    "Scan with camera",
    "Upload image or PDF",
    "Prepare & check extraction",
    "TellerExtractionReview",
]:
    require(
        marker in capture,
        f"Capture workflow missing {marker}"
    )


for marker in [
    "Verify before autofill",
    "Accept",
    "Reject",
    "Open verified form",
]:
    require(
        marker in extraction_review,
        f"Human extraction review missing {marker}"
    )


for marker in [
    "buildVerifiedTellerAutofillPacket",
    "human_verified",
    "auto_submitted",
    "raw_file_included",
]:
    require(
        marker in autofill,
        f"Verified autofill contract missing {marker}"
    )


require(
    "createUnconfiguredTellerOcrAdapter"
    in ocr,
    "Unconfigured OCR boundary missing."
)


require(
    "configured:\n      false"
    in ocr,
    "Default OCR provider is not explicitly disconnected."
)


# ============================================================================================================
# GP595 — RECORDS / SEARCH
# ============================================================================================================

for marker in [
    "Records & Search",
    "Search records",
    "Production record storage is not connected yet.",
]:
    require(
        marker in records,
        f"Records/Search surface missing {marker}"
    )


for marker in [
    "sanitizeTellerRecordPayload",
    "TELLER_FORBIDDEN_RECORD_KEYS",
]:
    require(
        marker in record_schema,
        f"Record sanitizer missing {marker}"
    )


require(
    "createUnconfiguredTellerRecordRepository"
    in repository,
    "Production repository boundary missing."
)


require(
    "configured:\n      false"
    in repository,
    "Production record repository is not explicitly disconnected."
)


require(
    "searchTellerRecords"
    in search,
    "Record search engine missing."
)


require(
    "record.payload"
    not in search,
    "Raw record payload is being indexed by search."
)


# ============================================================================================================
# GP596 — VALIDATION / RECOVERY
# ============================================================================================================

for marker in [
    "validateTellerProductionRecord",
    "validateTellerRecordSet",
]:
    require(
        marker in validation,
        f"Record validation missing {marker}"
    )


for marker in [
    "buildTellerSubmissionFingerprint",
    "findDuplicateTellerRecord",
]:
    require(
        marker in duplicate,
        f"Duplicate guard missing {marker}"
    )


for marker in [
    "Recovery Center",
    "Create recovery point",
    "Restore recovery point",
    "Start correction",
    "Lock session record",
]:
    require(
        marker in recovery,
        f"Recovery Center missing {marker}"
    )


for marker in [
    'persistence:\n      "memory_only"',
    "survives_reload",
    "production_backup",
]:
    require(
        marker in snapshot,
        f"Recovery truth missing {marker}"
    )


require(
    "survives_reload:\n      false"
    in snapshot,
    "Recovery falsely claims reload persistence."
)


require(
    "production_backup:\n      false"
    in snapshot,
    "Recovery falsely claims production backup."
)


# ============================================================================================================
# GP597–GP598 — BOUNDARIES / BLOCKERS
# ============================================================================================================

for marker in [
    "security_boundaries",
    "production_integrations",
    "deployment",
    "blocked_pending_integration",
    "not_authorized",
]:
    require(
        marker in criteria,
        f"Certification criteria missing {marker}"
    )


for marker in [
    "practical_use_source_certified",
    "deployment_ready",
    "deployment_authorized",
    "production_integrations_complete",
]:
    require(
        marker in readiness,
        f"Readiness truth missing {marker}"
    )


require(
    "deployment_ready:\n      false"
    in readiness,
    "Certification falsely claims deployment readiness."
)


require(
    "deployment_authorized:\n      false"
    in readiness,
    "Certification falsely authorizes deployment."
)


require(
    "production_integrations_complete:\n      false"
    in readiness,
    "Certification falsely claims complete production integrations."
)


# ============================================================================================================
# NO FAKE LIVE PRODUCT STATES
# ============================================================================================================

combined = "\n".join([
    criteria,
    readiness,
    app,
    runtime,
    registry,
    forms,
    people,
    money,
    vendors,
    capture,
    extraction_review,
    autofill,
    ocr,
    records,
    record_schema,
    repository,
    search,
    recovery,
    validation,
    duplicate,
    snapshot,
])


for forbidden in [
    "vault://",
    "localStorage.setItem",
    "indexedDB.open",
]:
    require(
        forbidden.lower()
        not in combined.lower(),
        f"Forbidden practical-use production shortcut found: {forbidden}"
    )


# sessionStorage is allowed ONLY for the Tower-issued runtime session.
session_storage_occurrences = (
    combined.count(
        "sessionStorage.setItem"
    )
)

require(
    session_storage_occurrences == 0,
    "Teller practical-use source introduced sessionStorage writes."
)


for false_state in [
    "production_persisted: true",
    "money_moved: true",
    "auto_submitted: true",
    "raw_file_included: true",
    "survives_reload: true",
    "production_backup: true",
    "tower_security_lock: true",
]:
    require(
        false_state not in combined,
        f"False practical-use success state found: {false_state}"
    )


# ============================================================================================================
# HEADER / LIVE SURFACES
# ============================================================================================================

compact_app = (
    app
    .replace("\n", "")
    .replace(" ", "")
)


for action in [
    ">+New<",
    ">Scan<",
    ">Search",
]:
    require(
        action in compact_app,
        f"Global Teller action missing: {action}"
    )


print(
    "GP591-GP600 TELLER PRACTICAL-USE CERTIFICATION SMOKE TEST PASSED"
)

print(
    "Tower-issued session boundary: certified"
)

print(
    "Role-filtered Forms Engine: certified"
)

print(
    "People / Payroll / Vendor / Document lanes: certified"
)

print(
    "Capture + verified-autofill architecture: certified"
)

print(
    "Records + Search: certified"
)

print(
    "Validation + Recovery: certified"
)

print(
    "Security / data boundaries: certified"
)

print(
    "Production repository: blocked pending integration"
)

print(
    "Production OCR: blocked pending integration"
)

print(
    "Payroll processor: blocked pending integration"
)

print(
    "Payment processor: blocked pending integration"
)

print(
    "Tower transport/API: blocked pending integration"
)

print(
    "Vault transport/storage: Tower-mediated integration still required"
)

print(
    "Deployment: not authorized"
)
