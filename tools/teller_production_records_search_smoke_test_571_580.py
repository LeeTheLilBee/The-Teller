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
    "src/teller/records/tellerRecordSchema.js",
    "src/teller/records/tellerRecordRepository.js",
    "src/teller/records/tellerRecordProjection.js",
    "src/teller/records/tellerRecordSearch.js",
    "src/teller/records/tellerRecordHistory.js",
    "src/teller/records/tellerRecordQuery.js",
    "src/teller/records/TellerRecordsWorkspace.jsx",
    "src/teller/records/tellerRecords.css",
]


for path in required_files:
    require(
        (ROOT / path).exists(),
        f"Missing Records file: {path}"
    )


schema = read(
    "src/teller/records/tellerRecordSchema.js"
)

repository = read(
    "src/teller/records/tellerRecordRepository.js"
)

projection = read(
    "src/teller/records/tellerRecordProjection.js"
)

search = read(
    "src/teller/records/tellerRecordSearch.js"
)

history = read(
    "src/teller/records/tellerRecordHistory.js"
)

query = read(
    "src/teller/records/tellerRecordQuery.js"
)

workspace = read(
    "src/teller/records/TellerRecordsWorkspace.jsx"
)

forms = read(
    "src/teller/forms/TellerFormsWorkspace.jsx"
)

app = read(
    "src/App.jsx"
)


# GP571
for marker in [
    "TELLER_RECORD_VERSION",
    "TELLER_RECORD_STATUS",
    "TELLER_FORBIDDEN_RECORD_KEYS",
    "sanitizeTellerRecordPayload",
    "createTellerRecordEnvelope",
    "search_projection",
    "audit_history",
]:
    require(
        marker in schema,
        f"Record schema missing {marker}"
    )


for forbidden_key in [
    "ssn",
    "tin",
    "ein",
    "routing_number",
    "account_number",
    "card_number",
    "cvv",
    "password",
    "document_number",
]:
    require(
        forbidden_key in schema,
        f"Forbidden record key not blocked: {forbidden_key}"
    )


# GP572
for marker in [
    "createUnconfiguredTellerRecordRepository",
    "NOT_CONNECTED",
    "saveRecord",
    "getRecord",
    "searchRecords",
    "updateRecord",
    "persistent:",
]:
    require(
        marker in repository,
        f"Repository boundary missing {marker}"
    )


require(
    "configured:\n      false"
    in repository,
    "Default record repository is not explicitly unconfigured."
)


require(
    "persistent:\n      false"
    in repository,
    "Default record repository falsely claims persistence."
)


# GP573
for marker in [
    "buildTellerRecordFromPreparedPacket",
    "getTellerFormDefinition",
    "createTellerRecordEnvelope",
    "verified_autofill_provenance",
]:
    require(
        marker in projection,
        f"Record projection missing {marker}"
    )


# GP574
for marker in [
    "buildTellerRecordSearchIndex",
    "searchTellerRecords",
    "getTellerRecordSearchFacets",
    "search_projection",
]:
    require(
        marker in search,
        f"Search engine missing {marker}"
    )


require(
    "record?.payload"
    not in search,
    "Search engine must not index raw record payload."
)


require(
    "record.payload"
    not in search,
    "Search engine must not index raw record payload."
)


# GP575
for marker in [
    "createTellerRecordHistoryEvent",
    "appendTellerRecordHistory",
    "audit_history",
]:
    require(
        marker in history,
        f"Record history missing {marker}"
    )


# GP576
for marker in [
    "EMPTY_TELLER_RECORD_QUERY",
    "normalizeTellerRecordQuery",
    "hasActiveTellerRecordFilters",
    "clearTellerRecordQuery",
]:
    require(
        marker in query,
        f"Record query model missing {marker}"
    )


# GP577
for marker in [
    "buildTellerRecordFromPreparedPacket",
    "onRecordPrepared",
    "sessionRecord",
]:
    require(
        marker in forms,
        f"Forms→Records handoff missing {marker}"
    )


# GP578
for marker in [
    "Records & Search",
    "Search records",
    "Production repository",
    "Session records",
    "Search results",
    "Production record storage is not connected yet.",
]:
    require(
        marker in workspace,
        f"Records workspace missing {marker}"
    )


require(
    "Search indexes safe record metadata"
    in workspace,
    "Search privacy explanation missing."
)


# GP579
for marker in [
    "TellerRecordsWorkspace",
    "sessionRecords",
    "handleRecordPrepared",
    "openRecords",
    "onRecordPrepared",
]:
    require(
        marker in app,
        f"Global Records wiring missing {marker}"
    )


require(
    ">Search"
    in app.replace("\n", "").replace(" ", ""),
    "Global Search action missing."
)


# No fake persistent database
combined = "\n".join([
    schema,
    repository,
    projection,
    search,
    history,
    query,
    workspace,
])


for forbidden in [
    "fetch(",
    "axios.",
    "XMLHttpRequest",
    "localStorage.setItem",
    "sessionStorage.setItem",
    "indexedDB.open",
    "vault://",
]:
    require(
        forbidden.lower()
        not in combined.lower(),
        f"Forbidden Records behavior found: {forbidden}"
    )


# No false persistence
for forbidden in [
    "production_persisted:\n        true",
    "production_repository_connected:\n        true",
    "persistent:\n      true",
]:
    require(
        forbidden not in combined,
        f"False record-persistence state found: {forbidden}"
    )


# Prior systems preserved
for marker in [
    "TellerCaptureWorkspace",
    "TellerFormsWorkspace",
]:
    require(
        marker in app,
        f"Previous Teller surface lost: {marker}"
    )


require(
    "TellerVendorDocumentPanel"
    in forms,
    "Vendor/Document panel was lost."
)


require(
    "TellerPayrollPaymentPanel"
    in forms,
    "Payroll/Payment panel was lost."
)


require(
    "TellerPeopleIntakePanel"
    in forms,
    "People Intake panel was lost."
)


print(
    "GP571-GP580 PRODUCTION RECORDS + SEARCH SMOKE TEST PASSED"
)

print(
    "Canonical Teller record envelope: present"
)

print(
    "Forbidden credential sanitizer: present"
)

print(
    "Production repository boundary: present"
)

print(
    "Production repository: not connected"
)

print(
    "Prepared workflow → session record: present"
)

print(
    "Safe metadata-only search: present"
)

print(
    "Record history model: present"
)

print(
    "Record query / filters: present"
)

print(
    "Records & Search workspace: present"
)

print(
    "Global Search doorway: present"
)

print(
    "Fake persistence/database: absent"
)

print(
    "Direct Tower/Vault access: not built"
)
