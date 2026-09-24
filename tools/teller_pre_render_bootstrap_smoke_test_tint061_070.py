
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

MAIN = ROOT / "src/main.jsx"
APP = ROOT / "src/App.jsx"
ACCESS = ROOT / "src/teller/towerAccess.js"
PRE = ROOT / "src/teller/tellerPreRenderBootstrap.js"
RUNTIME = ROOT / "src/teller/tellerRuntimeSession.js"

CONTRACT = (
    ROOT /
    "contracts/teller/teller_pre_render_bootstrap_contract_v2.json"
)

SPEC = (
    ROOT /
    "deploy/render/teller-static-pre-render-bootstrap-staging.json"
)


for path in [
    MAIN,
    APP,
    ACCESS,
    PRE,
    RUNTIME,
    CONTRACT,
    SPEC,
]:
    assert path.exists(), path


main = MAIN.read_text(encoding="utf-8")
app = APP.read_text(encoding="utf-8")
access = ACCESS.read_text(encoding="utf-8")
pre = PRE.read_text(encoding="utf-8")
runtime = RUNTIME.read_text(encoding="utf-8")
contract = CONTRACT.read_text(encoding="utf-8")
spec = SPEC.read_text(encoding="utf-8")


# Pre-React ordering.
assert "prepareTellerBeforeReactMount" in main
assert "await prepareTellerBeforeReactMount" in main
assert "createRoot(" in main

assert (
    main.index(
        "await prepareTellerBeforeReactMount"
    )
    <
    main.index(
        "createRoot("
    )
)

startup_window = main[
    main.index("await prepareTellerBeforeReactMount"):
    main.index("createRoot(")
]

assert "launch?.ready !==" in startup_window
assert "return;" in startup_window


# App no longer owns network/security bootstrap.
assert "bootstrapTellerFromTower" not in app
assert "towerBootstrap" not in app
assert "TellerOpeningScreen" not in app


# App runtime defense remains.
assert "readTellerLiveTowerSession" in app
assert "createTellerPersistenceTransportFromRuntime" in app
assert "liveTowerSession" in app
assert "towerIdentityKey" in app
assert "tower_identity_changed" in app


# Explicit v1/v2.
assert '"tower-teller-exchange.v1"' in access
assert '"tower-teller-exchange.v2"' in access
assert "TOWER_TELLER_PERSISTENCE_EXCHANGE_VERSION" in access
assert "requestedExchangeVersion" in access
assert "expectedExchangeVersion" in access
assert "tower_exchange_version_unsupported" in access

assert '"tower-teller-exchange.v1"' in contract
assert '"tower-teller-exchange.v2"' in contract
assert '"silently_redefined": false' in contract.lower()


# Production pre-render v2.
assert "TOWER_TELLER_PERSISTENCE_EXCHANGE_VERSION" in pre
assert "exchangeVersion:" in pre
assert "tower_handoff_required" in pre
assert "tower_live_persistence_session_missing" in pre


# Memory-only token.
assert "windowLike.__TELLER_TOWER_SESSION__" in access
assert "payload.persistence_access_token" in access
assert "__TELLER_TOWER_SESSION__" in runtime


browser_source = "\n".join([
    main,
    app,
    access,
    pre,
    runtime,
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


access_exec = re.sub(
    r"/\*.*?\*/",
    "",
    access,
    flags=re.DOTALL,
)

access_exec = re.sub(
    r"(^|\s)//[^\n]*",
    r"\1",
    access_exec,
)


for forbidden in [
    "sessionStorage",
    "localStorage",
    "console.log",
    "console.info",
    "console.warn",
    "console.error",
]:
    assert forbidden not in access_exec, forbidden


# Safe DOM construction.
assert "innerHTML" not in pre
assert ".textContent" in pre
assert "replaceChildren" in pre


# Activation still blocked.
assert '"tower_v2_issuer_proven": false' in spec.lower()
assert '"tower_v2_exchange_deployed": false' in spec.lower()
assert '"teller_static_site_activated": false' in spec.lower()
assert '"deployment_performed": false' in spec.lower()


print(
    "TINT061-TINT070 PRE-RENDER SECURITY WALL PASSED"
)

print(
    "Tower bootstrap before createRoot: YES"
)

print(
    "React mount on failed bootstrap: NO"
)

print(
    "App-side network bootstrap removed: YES"
)

print(
    "Historical exchange v1 retained: YES"
)

print(
    "Persistence exchange v2 explicit: YES"
)

print(
    "Production pre-render path uses v2: YES"
)

print(
    "Persistence bearer memory-only: YES"
)

print(
    "Browser persistence storage: NO"
)

print(
    "Browser database credentials: NO"
)

print(
    "Browser signing secret: NO"
)

print(
    "Direct Vault path: NO"
)

print(
    "Static Teller activation: NOT PERFORMED"
)
