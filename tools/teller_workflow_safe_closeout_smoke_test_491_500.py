from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "teller"
DATA = ROOT / "data"
TOOLS = ROOT / "tools"

required_files = [
    SRC / "tellerTowerRequestHandoff.js",
    SRC / "tellerTowerRequestHandoffFixtures.js",
    DATA / "teller_tower_request_handoff_gp451_460.json",
    TOOLS / "teller_tower_request_handoff_smoke_test_451_460.py",

    SRC / "tellerTowerRequestQueue.js",
    SRC / "tellerTowerRequestQueueFixtures.js",
    DATA / "teller_tower_request_queue_gp461_470.json",
    TOOLS / "teller_tower_request_queue_smoke_test_461_470.py",

    SRC / "tellerTowerRequestStatusWiring.js",
    SRC / "tellerTowerRequestStatusWiringFixtures.js",
    DATA / "teller_tower_request_status_wiring_gp471_480.json",
    TOOLS / "teller_tower_request_status_wiring_smoke_test_471_480.py",

    SRC / "TellerTowerRequestStatusDrawer.jsx",
    SRC / "tellerTowerRequestStatusDrawer.css",
    DATA / "teller_tower_request_status_drawer_gp481_490.json",
    TOOLS / "teller_tower_request_status_drawer_smoke_test_481_490.py",

    DATA / "teller_workflow_safe_closeout_gp491_500.json",
    ROOT / "docs" / "teller" / "TELLER_WORKFLOW_SAFE_CLOSEOUT_GP491_500.md",
]

for path in required_files:
    assert path.exists(), f"Missing required closeout file: {path.relative_to(ROOT)}"

closeout = json.loads((DATA / "teller_workflow_safe_closeout_gp491_500.json").read_text(encoding="utf-8"))

assert closeout["pack_id"] == "GP491-GP500"
assert closeout["status"] == "teller_workflow_safe_corridor_closed_ready_to_push"
assert closeout["doctrine"]["key_rule"] == "Teller can ask. Tower must decide. Vault only answers Tower."
assert "Teller does not call Vault." in closeout["locked_rules"]
assert "Tower API call" in closeout["not_built_here"]
assert "Vault API call" in closeout["not_built_here"]

source_files = [
    SRC / "tellerTowerRequestHandoff.js",
    SRC / "tellerTowerRequestQueue.js",
    SRC / "tellerTowerRequestStatusWiring.js",
    SRC / "TellerTowerRequestStatusDrawer.jsx",
]

source_by_name = {
    path.name: path.read_text(encoding="utf-8")
    for path in source_files
}

combined = "\n".join(source_by_name.values())

required_markers = [
    "Teller can ask. Tower must decide. Vault only answers Tower.",
    "direct_vault_access_allowed: false",
    "workflow_safe_status_only: true",
    "assertNoDirectVaultAccess",
    "assertTowerResultWorkflowSafe",
    "TellerTowerRequestStatusDrawer",
]

for marker in required_markers:
    assert marker in combined, f"Missing closeout marker: {marker}"

forbidden_runtime_patterns = [
    r"fetch\s*\(",
    r"axios\.",
    r"XMLHttpRequest",
    r"window\.open",
    r"createObjectURL",
]

for pattern in forbidden_runtime_patterns:
    assert not re.search(pattern, combined), f"Forbidden direct call/runtime pattern: {pattern}"

# Important:
# Defensive scanner code is allowed to contain string literals like "vault://"
# because those strings are used to BLOCK raw delivery.
# This closeout test only blocks actual raw delivery fixture/object keys and live UI delivery patterns.
forbidden_delivery_patterns = [
    r"\bvault_url\s*:",
    r"\bvault_link\s*:",
    r"\braw_vault_url\s*:",
    r"\braw_file_url\s*:",
    r"\bdownload_url\s*:",
    r"\bpreview_url\s*:",
    r"\bshared_folder_url\s*:",
    r"\bexternal_collaborator_link\s*:",
    r"\bvault_file_path\s*:",
    r"\bvault_object_key\s*:",
    r"\bvault_storage_bucket\s*:",
    r"\bvault_raw_payload\s*:",
    r"\bvault_secret\s*:",
    r"\bvault_token\s*:",
    r"\bpublic_link\s*:",
    r"\bsigned_url\s*:",
    r"\btemporary_url\s*:",
    r"\bdownload_link\s*:",
    r"https?://[^\"']*(?:download|preview|signed|temporary|shared-folder|public-link)[^\"']*",
]

for pattern in forbidden_delivery_patterns:
    assert not re.search(pattern, combined), (
        f"Forbidden raw delivery pattern present outside defensive scanner allowance: {pattern}"
    )

# Confirm drawer component is still not mounted into live pages.
live_pages = [
    SRC / "EmployeeStandaloneWorkspace.jsx",
    SRC / "ManagerStandaloneWorkspace.jsx",
    SRC / "OwnerMoneyWorkspace.jsx",
    SRC / "OwnerEscalationDock.jsx",
]

for page in live_pages:
    if page.exists():
        text = page.read_text(encoding="utf-8")
        assert "TellerTowerRequestStatusDrawer" not in text, (
            f"Drawer should not be mounted yet in live page: {page.name}"
        )

print("GP491-GP500 TELLER CLOSEOUT SMOKE TEST PASSED")
print("Teller workflow-safe Tower request corridor is closed.")
print("No Tower API call is built here.")
print("No Vault access is built here.")
print("Drawer remains unmounted from live pages.")
print("No raw Vault delivery fields/URLs are allowed.")
