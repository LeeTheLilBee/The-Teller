import json
import re
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
    "server/teller/persistence/tellerPersistenceConfig.js",
    "server/teller/persistence/tellerPersistenceScope.js",
    "server/teller/persistence/tellerPostgresPool.js",
    "server/teller/persistence/tellerRecordPersistenceSerializer.js",
    "server/teller/persistence/tellerPostgresRecordRepository.js",
    "server/teller/persistence/tellerRecordPersistenceService.js",
    "server/teller/persistence/runTellerPersistenceMigrations.js",
    "server/teller/persistence/tellerPersistenceHealth.js",
    "server/teller/persistence/migrations/001_teller_records.sql",
    "src/teller/persistence/tellerPersistenceHydration.js",
    "tools/teller_persistence_contract_test_tint001_010.mjs",
]


for rel in required_files:
    require(
        (ROOT / rel).exists(),
        f"Missing persistence foundation file: {rel}",
    )


config = read(
    "server/teller/persistence/tellerPersistenceConfig.js"
)

scope = read(
    "server/teller/persistence/tellerPersistenceScope.js"
)

serializer = read(
    "server/teller/persistence/tellerRecordPersistenceSerializer.js"
)

repository = read(
    "server/teller/persistence/tellerPostgresRecordRepository.js"
)

service = read(
    "server/teller/persistence/tellerRecordPersistenceService.js"
)

migration = read(
    "server/teller/persistence/migrations/001_teller_records.sql"
)

hydration = read(
    "src/teller/persistence/tellerPersistenceHydration.js"
)


# TINT001
for marker in [
    "TELLER_PERSISTENCE_ENABLED",
    "DATABASE_URL",
    "TELLER_DATABASE_SSL_MODE",
    "MISCONFIGURED",
    "credentialsExposed",
]:
    require(
        marker in config,
        f"Persistence config missing {marker}",
    )


# TINT002
for marker in [
    "CREATE TABLE IF NOT EXISTS teller_records",
    "payload JSONB",
    "search_projection JSONB",
    "revision BIGINT",
    "idempotency_key TEXT",
    "CREATE TABLE IF NOT EXISTS teller_record_events",
]:
    require(
        marker in migration,
        f"Durable SQL schema missing {marker}",
    )


# TINT003
for marker in [
    "ENABLE ROW LEVEL SECURITY",
    "FORCE ROW LEVEL SECURITY",
    "app.teller_business_key",
    "teller_records_business_isolation",
    "teller_record_events_business_isolation",
]:
    require(
        marker in migration,
        f"RLS boundary missing {marker}",
    )


for marker in [
    "actorId",
    "actorRole",
    "towerSessionId",
    "businessKey",
    "set_config",
]:
    require(
        marker in scope,
        f"Persistence scope missing {marker}",
    )


# TINT004
for marker in [
    "idempotency_key",
    "ON CONFLICT",
    "idempotent_replay",
]:
    require(
        marker in repository,
        f"Idempotency contract missing {marker}",
    )


# TINT005
for marker in [
    "expectedRevision",
    "revision = revision + 1",
    "current_revision",
    "CONFLICT",
]:
    require(
        marker in repository,
        f"Revision protection missing {marker}",
    )


# TINT006
require(
    "search_text LIKE"
    in repository,
    "Server-side safe search missing.",
)

search_section = repository[
    repository.index("async searchRecords"):
    repository.index("async updateRecord")
]

require(
    "payload"
    not in search_section,
    "Server-side search must not search raw payload.",
)


# TINT007
for marker in [
    "teller_record_events",
    "persistHistory",
    "loadHistory",
    "appendHistoryEvent",
]:
    require(
        marker in repository,
        f"Durable audit history missing {marker}",
    )


# TINT008
for marker in [
    "createPostgresTellerRecordRepository",
    "configured:",
    "persistent:",
    "saveRecord",
    "getRecord",
    "searchRecords",
    "updateRecord",
]:
    require(
        marker in repository,
        f"PostgreSQL repository missing {marker}",
    )


require(
    "createTellerRecordPersistenceService"
    in service,
    "Persistence service boundary missing.",
)


# TINT009
for marker in [
    "TELLER_HYDRATION_STATUS",
    "NOT_CONNECTED",
    "BLOCKED",
    "READY",
    "ERROR",
    "hydrateTellerRecords",
]:
    require(
        marker in hydration,
        f"Hydration contract missing {marker}",
    )


# Browser persistence shortcuts remain forbidden.
combined_browser = "\n".join([
    hydration,
])

for forbidden in [
    "localStorage.setItem",
    "sessionStorage.setItem",
    "indexedDB.open",
    "vault://",
]:
    require(
        forbidden.lower()
        not in combined_browser.lower(),
        f"Forbidden browser persistence shortcut found: {forbidden}",
    )


# Server persistence must never contain direct Vault behavior.
combined_server = "\n".join([
    config,
    scope,
    serializer,
    repository,
    service,
    migration,
])

require(
    "vault://"
    not in combined_server.lower(),
    "Direct Vault behavior entered Teller persistence.",
)


# Sensitive record protection remains explicit.
for marker in [
    "sanitizeTellerRecordPayload",
    "Forbidden sensitive fields",
]:
    require(
        marker in serializer,
        f"Persistence sensitive-field protection missing {marker}",
    )


# PostgreSQL dependency must be exact.
package = json.loads(
    read(
        "package.json"
    )
)

pg_version = (
    package
    .get(
        "dependencies",
        {}
    )
    .get(
        "pg"
    )
)

require(
    bool(pg_version),
    "pg dependency missing.",
)

require(
    not pg_version.startswith(("^", "~")),
    "pg dependency is not exact.",
)


# Existing browser repository remains fail-closed until real transport activation.
legacy_repository = read(
    "src/teller/records/tellerRecordRepository.js"
)

require(
    "configured:\n      false"
    in legacy_repository,
    "Existing browser repository was prematurely activated.",
)

require(
    "persistent:\n      false"
    in legacy_repository,
    "Existing browser repository prematurely claims persistence.",
)


print(
    "TINT001-TINT010 PERSISTENCE FOUNDATION SMOKE TEST PASSED"
)

print(
    f"PostgreSQL client: pg {pg_version}"
)

print(
    "Fail-closed persistence config: present"
)

print(
    "Durable PostgreSQL schema: present"
)

print(
    "Business/entity RLS: present"
)

print(
    "Idempotent create contract: present"
)

print(
    "Optimistic revision protection: present"
)

print(
    "Safe server-side metadata search: present"
)

print(
    "Durable audit-history contract: present"
)

print(
    "PostgreSQL repository adapter: present"
)

print(
    "Reload hydration contract: present"
)

print(
    "Live production database: not connected"
)

print(
    "Migration applied to production: no"
)

print(
    "Browser persistence activation: blocked"
)

print(
    "Direct Vault: blocked"
)
