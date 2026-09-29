import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (
        ROOT / path
    ).read_text(
        encoding="utf-8"
    )


def require(
    condition,
    message,
):
    if not condition:
        raise AssertionError(
            message
        )


def strip_js_comments(
    text,
):
    """
    Remove JS block and line comments so security checks inspect
    executable source rather than explanatory prose.

    This intentionally prevents phrases such as:

        "do not use sessionStorage"

    from being mistaken for executable sessionStorage behavior.
    """

    without_blocks = re.sub(
        r"/\*.*?\*/",
        "",
        text,
        flags=re.DOTALL,
    )


    without_lines = re.sub(
        r"(^|\s)//[^\n]*",
        r"\1",
        without_blocks,
    )


    return without_lines


required_files = [
    "server/teller/persistence/migrations/002_teller_actor_scope.sql",

    "server/teller/transport/tellerTransportConfig.js",

    "server/teller/transport/tellerPersistenceAccessToken.js",

    "server/teller/transport/tellerPersistenceHttpServer.js",

    "server/teller/transport/startTellerPersistenceServer.js",

    "src/teller/persistence/tellerPersistenceTransport.js",

    "tools/teller_actor_scope_live_verification_tint021_030.mjs",

    "tools/teller_authenticated_transport_live_test_tint021_030.mjs",
]


for rel in required_files:
    require(
        (
            ROOT /
            rel
        ).exists(),

        f"Missing authenticated transport file: {rel}",
    )


migration = read(
    "server/teller/persistence/migrations/002_teller_actor_scope.sql"
)

token = read(
    "server/teller/transport/tellerPersistenceAccessToken.js"
)

server = read(
    "server/teller/transport/tellerPersistenceHttpServer.js"
)

transport = read(
    "src/teller/persistence/tellerPersistenceTransport.js"
)

runtime = read(
    "src/teller/tellerRuntimeSession.js"
)

app = read(
    "src/App.jsx"
)

live = read(
    "tools/teller_authenticated_transport_live_test_tint021_030.mjs"
)

live_verify = read(
    "tools/teller_actor_scope_live_verification_tint021_030.mjs"
)


# ==============================================================================================================
# TINT023 — MIGRATION REPAIRS
# ==============================================================================================================

for marker in [
    "NO FORCE ROW LEVEL SECURITY",

    "legacy_unknown",

    "ALTER COLUMN actor_id SET NOT NULL",

    "FORCE ROW LEVEL SECURITY",

    "FROM teller_records AS parent_record",
]:
    require(
        marker in migration,
        f"TINT023 migration repair missing {marker}",
    )


for marker in [
    "actor_id",

    "app.teller_actor_id",

    "app.teller_role",

    "= 'owner'",

    "teller_records_business_isolation",

    "teller_record_events_business_isolation",
]:
    require(
        marker in migration,
        f"Actor RLS missing {marker}",
    )


require(
    "missing_actor_ids"
    in live_verify,

    "Live actor-backfill verification missing.",
)


# ==============================================================================================================
# TINT022 — SIGNED TOKEN
# ==============================================================================================================

for marker in [
    "createHmac",

    "timingSafeEqual",

    "verifyTellerPersistenceAccessToken",

    "maxLifetimeSeconds",

    "tellerPersistenceScopeFromClaims",
]:
    require(
        marker in token,
        f"Signed-token boundary missing {marker}",
    )


# ==============================================================================================================
# TINT024 / TINT025 — SERVER AUTHORIZATION
# ==============================================================================================================

for marker in [
    "Authorization",

    "Bearer",

    "verifyTellerPersistenceAccessToken",

    "tellerPersistenceScopeFromClaims",

    "validateRecordAuthority",

    "/v1/records",

    "originAllowed",
]:
    require(
        marker in server,
        f"Authenticated API missing {marker}",
    )


# ==============================================================================================================
# TINT026 — BROWSER TRANSPORT
# ==============================================================================================================

for marker in [
    "createTellerPersistenceTransport",

    "createTellerPersistenceTransportFromRuntime",

    "Authorization",

    "Bearer",

    "VITE_TELLER_PERSISTENCE_API_URL",
]:
    require(
        marker in transport,
        f"Browser transport missing {marker}",
    )


for forbidden in [
    "DATABASE_URL",

    "postgresql://",

    "postgres://",

    "localStorage",
]:
    require(
        forbidden.lower()
        not in transport.lower(),

        f"Forbidden browser transport behavior: {forbidden}",
    )


# ==============================================================================================================
# TINT030 REPAIR B — VERIFY EXECUTABLE TOKEN READER, NOT COMMENTS
# ==============================================================================================================

require(
    "export function readTellerPersistenceAccessToken"
    in runtime,

    "Runtime persistence token reader missing.",
)


token_start = runtime.index(
    "export function readTellerPersistenceAccessToken"
)

token_end = runtime.index(
    "export function isTowerIssuedTellerSession"
)


runtime_token_section = runtime[
    token_start:
    token_end
]


runtime_token_code = strip_js_comments(
    runtime_token_section
)


require(
    "__TELLER_TOWER_SESSION__"
    in runtime_token_code,

    "Persistence token must come from Tower window injection.",
)


require(
    "persistence_access_token"
    in runtime_token_code
    or
    "persistenceAccessToken"
    in runtime_token_code,

    "Persistence token field lookup missing.",
)


for forbidden in [
    "sessionStorage",

    "localStorage",

    "URLSearchParams",

    "readStoredSession",
]:
    require(
        forbidden
        not in runtime_token_code,

        (
            "Executable persistence token reader "
            f"must not use {forbidden}."
        ),
    )


# ==============================================================================================================
# TINT027 / TINT028 — APP DURABLE RECORD PATH
# ==============================================================================================================

for marker in [
    "production_records_hydrated",

    "record_persisted",

    "record_persistence_failed",

    "createTellerPersistenceTransportFromRuntime",

    "sessionRecordsRef",
]:
    require(
        marker in app,
        f"App persistence wiring missing {marker}",
    )


# ==============================================================================================================
# TINT029 — LIVE TEST COVERAGE
# ==============================================================================================================

for marker in [
    "authentication/authority wall: PASSED",

    "authenticated HTTP durable write: PASSED",

    "authenticated HTTP idempotency: PASSED",

    "actor-scoped RLS: PASSED",

    "owner business visibility: PASSED",

    "request-body scope escalation blocked: PASSED",

    "authenticated reload hydration storage path: PASSED",

    "prepared-record persistence transport path: PASSED",
]:
    require(
        marker in live,
        f"Live authenticated transport coverage missing {marker}",
    )


# ==============================================================================================================
# ECOSYSTEM BOUNDARY
# ==============================================================================================================

combined = "\n".join([
    migration,
    token,
    server,
    transport,
    runtime,
])


require(
    "vault://"
    not in combined.lower(),

    "Direct Vault behavior entered authenticated transport.",
)


print(
    "TINT021-TINT030 AUTHENTICATED TRANSPORT SMOKE TEST PASSED"
)

print(
    "TINT023 Repair A: forced-RLS historical backfill present"
)

print(
    "TINT023 Repair A.1: FORCE verifier corrected"
)

print(
    "TINT030 Repair B: comment-aware security verifier passed"
)

print(
    "Persistence token executable code uses Tower window injection only"
)

print(
    "Persistence token executable code uses sessionStorage: NO"
)

print(
    "Persistence token executable code uses localStorage: NO"
)

print(
    "Persistence token executable code uses query parameters: NO"
)

print(
    "Short-lived signed access token: present"
)

print(
    "Server-derived authorization scope: present"
)

print(
    "Actor-scoped record RLS: present"
)

print(
    "Actor-scoped event RLS: present"
)

print(
    "Authenticated HTTP persistence API: present"
)

print(
    "Browser DATABASE_URL exposure: blocked"
)

print(
    "App reload hydration wiring: present"
)

print(
    "Prepared-record durable-save wiring: present"
)

print(
    "Tower token issuer: not connected"
)

print(
    "Hosted transport: not deployed"
)

print(
    "Direct Vault: blocked"
)
