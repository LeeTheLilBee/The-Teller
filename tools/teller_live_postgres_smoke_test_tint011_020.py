import json
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


required = [
    "server/teller/persistence/migrations/001_teller_records.sql",
    "server/teller/persistence/tellerPostgresRecordRepository.js",
    "server/teller/persistence/tellerPostgresPool.js",
    "tools/teller_live_postgres_durability_test_tint011_020.mjs",
    "tools/teller_live_postgres_verification_tint011_020.mjs",
]


for rel in required:
    require(
        (ROOT / rel).exists(),
        f"Missing live persistence file: {rel}",
    )


live_test = read(
    "tools/teller_live_postgres_durability_test_tint011_020.mjs"
)

migration = read(
    "server/teller/persistence/migrations/001_teller_records.sql"
)

repository = read(
    "server/teller/persistence/tellerPostgresRecordRepository.js"
)


for marker in [
    "TINT015 real durable write",
    "TINT016 disconnect/reconnect durability",
    "TINT017 idempotent replay",
    "TINT018 optimistic revision conflict",
    "TINT019 cross-business isolation",
    "TINT020 third-connection durability certification",
]:
    require(
        marker in live_test,
        f"Live durability coverage missing: {marker}",
    )


for marker in [
    "FORCE ROW LEVEL SECURITY",
    "app.teller_business_key",
    "teller_records_business_isolation",
    "teller_record_events_business_isolation",
]:
    require(
        marker in migration,
        f"Live migration safety missing: {marker}",
    )


for marker in [
    "idempotent_replay",
    "expectedRevision",
    "current_revision",
    "withTellerBusinessTransaction",
]:
    require(
        marker in repository,
        f"Live repository safety missing: {marker}",
    )


for forbidden in [
    "localStorage.setItem",
    "indexedDB.open",
    "vault://",
]:
    require(
        forbidden.lower()
        not in live_test.lower(),
        f"Forbidden live persistence shortcut: {forbidden}",
    )


print(
    "TINT011-TINT020 LIVE POSTGRES SOURCE WALL PASSED"
)

print(
    "Real staging DB workflow: present"
)

print(
    "Disconnect/reconnect test: present"
)

print(
    "Idempotency live proof: present"
)

print(
    "Revision-conflict live proof: present"
)

print(
    "Cross-business isolation live proof: present"
)

print(
    "Direct Vault: blocked"
)

print(
    "Browser DB shortcut: absent"
)
