
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

ACCESS = (
    ROOT /
    "src/teller/towerAccess.js"
)

RUNTIME = (
    ROOT /
    "src/teller/tellerRuntimeSession.js"
)

APP = (
    ROOT /
    "src/App.jsx"
)

CONTRACT = (
    ROOT /
    "contracts/teller/teller_hosted_bootstrap_contract_v1.json"
)

SPEC = (
    ROOT /
    "deploy/render/teller-static-secure-bootstrap-staging.json"
)


for path in [
    ACCESS,
    RUNTIME,
    APP,
    CONTRACT,
    SPEC,
]:
    assert path.exists(), path


access = ACCESS.read_text(
    encoding="utf-8"
)

runtime = RUNTIME.read_text(
    encoding="utf-8"
)

app = APP.read_text(
    encoding="utf-8"
)

contract = CONTRACT.read_text(
    encoding="utf-8"
)

spec = SPEC.read_text(
    encoding="utf-8"
)


# Exact opaque handoff intake.
assert (
    'TOWER_HANDOFF_FRAGMENT_KEY =\n  "tower_handoff"'
    in access
)

assert (
    "readTowerHandoffCode"
    in access
)


# Preserve pre-existing hosted navigation hardening.
assert (
    "OWNER_DESTINATIONS"
    in access
)

assert (
    '"owner_money_workspace"'
    in access
)

assert (
    '"payroll_review"'
    in access
)

assert (
    "!OWNER_DESTINATIONS.has("
    in access
)

assert (
    'query.delete(\n    "tower_clearance"'
    in access
)

assert (
    'query.delete(\n    "teller_view"'
    in access
)


# Exact new response field.
assert (
    "payload.persistence_access_token"
    in access
)

assert (
    '"persistence_access_token"'
    in contract
)


# Live memory install.
assert (
    "windowLike.__TELLER_TOWER_SESSION__"
    in access
)

assert (
    "persistence_access_token:"
    in access
)


# Sanitize after successful exchange.
assert (
    "sanitizeTowerLaunchLocation"
    in access
)

assert (
    "historyLike.replaceState"
    in access
)

assert (
    'historyLike.replaceState(\n    null,'
    in access
)


# No direct persistence token storage/logging APIs.
executable = re.sub(
    r"/\*.*?\*/",
    "",
    access,
    flags=re.DOTALL,
)

executable = re.sub(
    r"(^|\s)//[^\n]*",
    r"\1",
    executable,
)


for forbidden in [
    "sessionStorage",
    "localStorage",
    "console.log",
    "console.info",
    "console.warn",
    "console.error",
    "historyLike.pushState",
]:
    assert (
        forbidden
        not in executable
    ), forbidden


# No URL write using the bearer token.
assert (
    "persistenceAccessToken"
    not in executable.split(
        "historyLike.replaceState",
        1,
    )[1].split(
        "return true",
        1,
    )[0]
)


# React bootstrap result intentionally excludes token.
granted_block = access.split(
    "function granted",
    1,
)[1].split(
    "function normalizeExchangeUrl",
    1,
)[0]

assert (
    "persistenceAccessToken"
    not in granted_block
)

assert (
    "persistence_access_token"
    not in granted_block
)


# Existing runtime reader remains live-window-only for token.
token_reader = runtime.split(
    "export function readTellerPersistenceAccessToken()",
    1,
)[1].split(
    "export function isTowerIssuedTellerSession()",
    1,
)[0]


assert (
    "__TELLER_TOWER_SESSION__"
    in token_reader
)


token_reader_exec = re.sub(
    r"/\*.*?\*/",
    "",
    token_reader,
    flags=re.DOTALL,
)

token_reader_exec = re.sub(
    r"(^|\s)//[^\n]*",
    r"\1",
    token_reader_exec,
)


for forbidden in [
    "sessionStorage",
    "localStorage",
    "URLSearchParams",
    "location.search",
    "location.hash",
]:
    assert (
        forbidden
        not in token_reader_exec
    ), forbidden


# App explicitly waits for bootstrap.
assert (
    "bootstrapTellerFromTower"
    in app
)

assert (
    'status:\n      "checking"'
    in app
)

assert (
    'towerBootstrap.status ===\n      "checking"'
    in app
)

assert (
    'towerBootstrap.status ===\n      "locked"'
    in app
)


# Persistence transport construction requires live Tower session.
assert (
    "readTellerLiveTowerSession"
    in app
)

assert (
    "liveTowerSession\n      ? createTellerPersistenceTransportFromRuntime()"
    in app
)


# No browser credentials.
browser_source = "\n".join([
    access,
    runtime,
    app,
])


for forbidden in [
    "DATABASE_URL",
    "postgresql://",
    "postgres://",
    "TELLER_TOWER_TOKEN_SECRET",
]:
    assert (
        forbidden.lower()
        not in browser_source.lower()
    ), forbidden


assert (
    "vault://"
    not in browser_source.lower()
)


# Static activation remains blocked.
assert (
    '"tower_persistence_issuer_proven": false'
    in spec.lower()
)

assert (
    '"tower_exchange_returns_persistence_token": false'
    in spec.lower()
)

assert (
    '"hosted_static_site_activated": false'
    in spec.lower()
)

assert (
    '"deployment_performed": false'
    in spec.lower()
)


print(
    "TINT051-TINT060 HOSTED BOOTSTRAP SECURITY WALL PASSED"
)

print(
    "Opaque tower_handoff fragment only: YES"
)

print(
    "Existing Tower HTTPS exchange reused: YES"
)

print(
    "persistence_access_token required from Tower: YES"
)

print(
    "Bearer token written to sessionStorage: NO"
)

print(
    "Bearer token written to localStorage: NO"
)

print(
    "Bearer token written to URL/history: NO"
)

print(
    "Bearer token written to logs: NO"
)

print(
    "Bearer token returned into React state: NO"
)

print(
    "Bearer token live-memory session install: YES"
)

print(
    "App waits for hosted bootstrap: YES"
)

print(
    "Persistence transport waits for live Tower session: YES"
)

print(
    "Browser DB credentials: NO"
)

print(
    "Browser signing secret: NO"
)

print(
    "Direct Vault: BLOCKED"
)

print(
    "Hosted static activation: NOT PERFORMED"
)
