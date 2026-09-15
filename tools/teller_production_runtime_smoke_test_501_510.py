from pathlib import Path
import json
import re
import subprocess


ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


# GP501
tracked = subprocess.check_output(
    ["git", "ls-files", "node_modules"],
    cwd=ROOT,
    text=True,
).strip()

require(
    not tracked,
    "GP501 failed: node_modules is still tracked."
)


# GP502
package = json.loads(read("package.json"))

for name, version in package.get("dependencies", {}).items():
    require(
        version != "latest",
        f"GP502 failed: {name} still uses latest."
    )

    require(
        not version.startswith("^"),
        f"GP502 failed: {name} still uses caret range."
    )

    require(
        not version.startswith("~"),
        f"GP502 failed: {name} still uses tilde range."
    )


# GP503 / GP504 / GP506
app = read("src/App.jsx")

for forbidden in [
    "TowerBackupWorkspace",
    "EmployeeDocumentVaultPanel",
    "Dev test links",
    "teller_view",
]:
    require(
        forbidden not in app,
        f"Active App still contains {forbidden}"
    )

for required in [
    "EmployeeStandaloneWorkspace",
    "ManagerStandaloneWorkspace",
    "OwnerMoneyWorkspace",
    "readTellerTowerSession",
]:
    require(
        required in app,
        f"Active App missing {required}"
    )


session = read("src/teller/tellerRuntimeSession.js")

require(
    "import.meta.env.DEV" in session,
    "Development query override is not DEV-gated."
)

require(
    "__TELLER_TOWER_SESSION__" in session,
    "Tower window session intake missing."
)

require(
    "the_teller_tower_runtime_session_v1" in session,
    "Tower sessionStorage intake missing."
)


# GP507
employee = read(
    "src/teller/EmployeeStandaloneWorkspace.jsx"
)

require(
    "Maya J." not in employee,
    "Fake Maya J. runtime identity still active."
)

require(
    'getTellerRuntimeActor("employee")' in employee,
    "Employee runtime identity is not session-driven."
)


security = read(
    "src/teller/securityIntelligence.js"
)

require(
    re.search(
        r"export\s+const\s+defaultEmployeeDocuments\s*=\s*\[\s*\]\s*;",
        security,
    ),
    "defaultEmployeeDocuments is not empty."
)

require(
    re.search(
        r"export\s+const\s+defaultMoneyQueue\s*=\s*\[\s*\]\s*;",
        security,
    ),
    "defaultMoneyQueue is not empty."
)


# GP508
owner_data = read(
    "src/teller/ownerMoneyData.js"
)

owner = read(
    "src/teller/OwnerMoneyWorkspace.jsx"
)

fake_money = [
    "$4.8k",
    "$50.0k",
    "$3.1k",
    "$2.6k",
    "$740",
    "$8.1k",
    "$12.4k",
    "$850",
]

for marker in fake_money:
    require(
        marker not in owner_data,
        f"Fake owner data remains: {marker}"
    )

    require(
        marker not in owner,
        f"Fake owner UI data remains: {marker}"
    )

require(
    re.search(
        r"export\s+const\s+ownerMoneyQueue\s*=\s*\[\s*\]\s*;",
        owner_data,
    ),
    "ownerMoneyQueue is not empty."
)

require(
    "No live money data" in owner_data,
    "Owner empty-state truth labels missing."
)


# GP509
manager = read(
    "src/teller/ManagerStandaloneWorkspace.jsx"
)

bridge = read(
    "src/teller/managerOwnerBridge.js"
)

for source_name, source in [
    ("Owner", owner),
    ("Manager", manager),
]:
    require(
        "saveTowerAccessRequest" not in source,
        f"{source_name} still uses local Tower access plugin."
    )

    require(
        "?teller_view=tower" not in source,
        f"{source_name} still navigates to local Tower page."
    )

require(
    "Archive Vault placeholder" not in owner,
    "Archive Vault placeholder still active."
)

require(
    "local_handoff_until_tower_api" not in bridge,
    "Legacy bridge still claims future-API delivery mode."
)


# GP505 corridor preservation
corridor = [
    "src/teller/tellerTowerRequestHandoff.js",
    "src/teller/tellerTowerRequestQueue.js",
    "src/teller/tellerTowerRequestStatusWiring.js",
    "src/teller/TellerTowerRequestStatusDrawer.jsx",
    "tools/teller_tower_request_handoff_smoke_test_451_460.py",
    "tools/teller_tower_request_queue_smoke_test_461_470.py",
    "tools/teller_tower_request_status_wiring_smoke_test_471_480.py",
    "tools/teller_tower_request_status_drawer_smoke_test_481_490.py",
    "tools/teller_workflow_safe_closeout_smoke_test_491_500.py",
]

for path in corridor:
    require(
        (ROOT / path).exists(),
        f"GP451-GP500 corridor file missing: {path}"
    )


handoff = read(
    "src/teller/tellerTowerRequestHandoff.js"
)

require(
    "Teller can ask. Tower must decide. Vault only answers Tower."
    in handoff,
    "Locked Teller/Tower/Vault doctrine missing."
)


# GP481 drawer remains unmounted
for path in [
    "src/teller/EmployeeStandaloneWorkspace.jsx",
    "src/teller/ManagerStandaloneWorkspace.jsx",
    "src/teller/OwnerMoneyWorkspace.jsx",
    "src/teller/OwnerEscalationDock.jsx",
]:
    require(
        "<TellerTowerRequestStatusDrawer" not in read(path),
        f"GP481 drawer mounted unexpectedly in {path}"
    )


print(
    "GP501-GP510 TELLER PRODUCTION RUNTIME SMOKE TEST PASSED"
)
