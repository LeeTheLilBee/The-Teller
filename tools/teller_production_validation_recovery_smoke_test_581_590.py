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
    "src/teller/recovery/tellerProductionValidation.js",
    "src/teller/recovery/tellerSubmissionGuard.js",
    "src/teller/recovery/tellerRecordCorrection.js",
    "src/teller/recovery/tellerOperationRecovery.js",
    "src/teller/recovery/tellerRecordLock.js",
    "src/teller/recovery/tellerRecoverySnapshot.js",
    "src/teller/recovery/TellerRecoveryPanel.jsx",
    "src/teller/recovery/tellerRecovery.css",
]


for path in required_files:
    require(
        (ROOT / path).exists(),
        f"Missing recovery file: {path}"
    )


validation = read(
    "src/teller/recovery/tellerProductionValidation.js"
)

duplicate = read(
    "src/teller/recovery/tellerSubmissionGuard.js"
)

correction = read(
    "src/teller/recovery/tellerRecordCorrection.js"
)

operation = read(
    "src/teller/recovery/tellerOperationRecovery.js"
)

lock = read(
    "src/teller/recovery/tellerRecordLock.js"
)

snapshot = read(
    "src/teller/recovery/tellerRecoverySnapshot.js"
)

panel = read(
    "src/teller/recovery/TellerRecoveryPanel.jsx"
)

projection = read(
    "src/teller/records/tellerRecordProjection.js"
)

records = read(
    "src/teller/records/TellerRecordsWorkspace.jsx"
)

app = read(
    "src/App.jsx"
)


# GP581 / GP582
for marker in [
    "validateTellerProductionRecord",
    "validateTellerRecordSet",
    "forbidden_record_key",
    "false_production_persistence_claim",
]:
    require(
        marker in validation,
        f"Production validation missing {marker}"
    )


# GP583
for marker in [
    "buildTellerSubmissionFingerprint",
    "findDuplicateTellerRecord",
    "submission_fingerprint",
]:
    require(
        marker in duplicate + projection,
        f"Duplicate guard missing {marker}"
    )


require(
    "sanitizeTellerRecordPayload"
    in duplicate,
    "Submission fingerprint is not built from sanitized values."
)


# GP584
for marker in [
    "canStartTellerRecordCorrection",
    "startTellerRecordCorrection",
    "clearTellerRecordCorrection",
    "needs_correction",
    "correction_requested",
]:
    require(
        marker in correction,
        f"Correction workflow missing {marker}"
    )


# GP585
for marker in [
    "TELLER_OPERATION_STATUS",
    "RETRYABLE",
    "FAILED",
    "BLOCKED",
    "createTellerOperation",
    "failTellerOperation",
    "retryTellerOperation",
    "transport_connected",
]:
    require(
        marker in operation,
        f"Operation recovery missing {marker}"
    )


require(
    "transport_connected:\n      false"
    in operation,
    "Operation model falsely claims transport."
)


# GP586
for marker in [
    "isTellerRecordLocked",
    "lockTellerRecord",
    "unlockTellerRecord",
    "session_workflow_lock",
    "tower_security_lock",
]:
    require(
        marker in lock,
        f"Workflow lock missing {marker}"
    )


require(
    "tower_security_lock:\n          false"
    in lock,
    "Session lock falsely claims Tower security authority."
)


# GP587
for marker in [
    "createTellerRecoverySnapshot",
    "restoreTellerRecoverySnapshot",
    'persistence:\n      "memory_only"',
    "survives_reload",
    "production_backup",
]:
    require(
        marker in snapshot,
        f"Recovery snapshot missing {marker}"
    )


require(
    "survives_reload:\n      false"
    in snapshot,
    "Recovery snapshot falsely claims reload persistence."
)

require(
    "production_backup:\n      false"
    in snapshot,
    "Recovery snapshot falsely claims production backup."
)


# GP588
for marker in [
    "validateTellerProductionRecord",
    "findDuplicateTellerRecord",
    "recordRecoveryEvents",
    "duplicate_preparation_blocked",
    "record_validation_blocked",
    "session_records_recovered",
    "replaceSessionRecords",
]:
    require(
        marker in app,
        f"App reliability gate missing {marker}"
    )


# GP589
for marker in [
    "Recovery Center",
    "In-memory only",
    "Survives reload",
    "Production backup",
    "Network retry",
    "Create recovery point",
    "Restore recovery point",
    "Start correction",
    "Lock session record",
]:
    require(
        marker in panel,
        f"Recovery UI missing {marker}"
    )


require(
    "TellerRecoveryPanel"
    in records,
    "Recovery Center not mounted in Records & Search."
)


require(
    "This is a Teller workflow lock only."
    in panel,
    "Session lock authority disclaimer missing."
)


# No browser/database/network pretending
combined = "\n".join([
    validation,
    duplicate,
    correction,
    operation,
    lock,
    snapshot,
    panel,
    records,
])


for forbidden in [
    "fetch(",
    "axios.",
    "XMLHttpRequest",
    "localStorage.setItem",
    "sessionStorage.setItem",
    "indexedDB.open",
    "navigator.sendBeacon",
    "vault://",
]:
    require(
        forbidden.lower()
        not in combined.lower(),
        f"Forbidden recovery persistence/transport found: {forbidden}"
    )


# No fake recovery truth
for forbidden in [
    "survives_reload:\n      true",
    "production_backup:\n      true",
    "tower_security_lock:\n          true",
    "transport_connected:\n      true",
]:
    require(
        forbidden not in combined,
        f"False recovery truth found: {forbidden}"
    )


# Previous records/search surface remains
for marker in [
    "Records & Search",
    "Search records",
    "Production record storage is not connected yet.",
]:
    require(
        marker in records,
        f"Records/Search regression: {marker}"
    )


# Previous main product surfaces remain
for marker in [
    "TellerFormsWorkspace",
    "TellerCaptureWorkspace",
    "TellerRecordsWorkspace",
]:
    require(
        marker in app,
        f"Main Teller surface lost: {marker}"
    )


print(
    "GP581-GP590 PRODUCTION VALIDATION + RECOVERY SMOKE TEST PASSED"
)

print(
    "Production record validation: present"
)

print(
    "Forbidden-field deep validation: present"
)

print(
    "Duplicate prepared-workflow guard: present"
)

print(
    "Record correction workflow: present"
)

print(
    "Retryable operation-state contract: present"
)

print(
    "Network retry transport: not connected"
)

print(
    "Session workflow lock: present"
)

print(
    "Tower security lock claim: blocked"
)

print(
    "In-memory recovery snapshot: present"
)

print(
    "Reload persistence claim: blocked"
)

print(
    "Recovery Center: present"
)

print(
    "Direct Tower/Vault transport: not built"
)
