from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

component_path = ROOT / "src" / "teller" / "TellerTowerRequestStatusDrawer.jsx"
css_path = ROOT / "src" / "teller" / "tellerTowerRequestStatusDrawer.css"
data_path = ROOT / "data" / "teller_tower_request_status_drawer_gp481_490.json"

assert component_path.exists(), "Missing TellerTowerRequestStatusDrawer.jsx"
assert css_path.exists(), "Missing tellerTowerRequestStatusDrawer.css"
assert data_path.exists(), "Missing teller_tower_request_status_drawer_gp481_490.json"

component = component_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
data = json.loads(data_path.read_text(encoding="utf-8"))

required_component_markers = [
    "Teller can ask. Tower must decide. Vault only answers Tower.",
    "TellerTowerRequestStatusDrawer",
    "buildTellerTowerStatusDrawerProps",
    "getTellerTowerStatusDrawerReadiness",
    "buildWorkflowSafeStatusList",
    "buildWorkflowSafeStatusSummary",
    "assertTowerResultWorkflowSafe",
    "direct_tower_call_allowed: false",
    "direct_vault_access_allowed: false",
    "workflow_safe_status_only: true",
    "data-direct-tower-call-allowed=\"false\"",
    "data-direct-vault-access-allowed=\"false\"",
    "No raw Vault links, files, downloads, public links, or shared folders",
]

for marker in required_component_markers:
    assert marker in component, f"Missing component marker: {marker}"

required_css_markers = [
    ".teller-tower-status-drawer",
    ".teller-tower-status-drawer__panel",
    ".teller-tower-status-drawer__card",
    ".teller-tower-status-drawer__receipts",
]

for marker in required_css_markers:
    assert marker in css, f"Missing CSS marker: {marker}"

data_blob = json.dumps(data)

required_data_markers = [
    "workflow_safe_status_drawer_ready_unmounted",
    "live Employee page mount",
    "live Manager page mount",
    "live Owner page mount",
    "Tower API call",
    "Vault API call",
    "download links",
]

for marker in required_data_markers:
    assert marker in data_blob, f"Missing data marker: {marker}"

forbidden_runtime_patterns = [
    r"fetch\s*\(",
    r"axios\.",
    r"XMLHttpRequest",
    r"window\.open",
    r"createObjectURL",
]

for pattern in forbidden_runtime_patterns:
    assert not re.search(pattern, component), f"Forbidden runtime/direct call pattern: {pattern}"

forbidden_literals = [
    "vault://",
    "download_url:",
    "preview_url:",
    "raw_file_url:",
    "signed_url:",
    "temporary_url:",
    "shared_folder_url:",
]

combined = component + css
for literal in forbidden_literals:
    assert literal not in combined, f"Forbidden raw delivery literal present: {literal}"

# Confirm drawer component is not mounted into live pages.
live_pages = [
    ROOT / "src" / "teller" / "EmployeeStandaloneWorkspace.jsx",
    ROOT / "src" / "teller" / "ManagerStandaloneWorkspace.jsx",
    ROOT / "src" / "teller" / "OwnerMoneyWorkspace.jsx",
    ROOT / "src" / "teller" / "OwnerEscalationDock.jsx",
]

for page in live_pages:
    if page.exists():
        text = page.read_text(encoding="utf-8")
        assert "TellerTowerRequestStatusDrawer" not in text, (
            f"Drawer should not be mounted yet in live page: {page.name}"
        )

assert data["status"] == "workflow_safe_status_drawer_ready_unmounted"
assert "Tower API call" in data["not_built_here"]
assert "Vault API call" in data["not_built_here"]

print("GP481-GP490 TELLER STATUS DRAWER SMOKE TEST PASSED")
print("Workflow-safe status drawer component is ready.")
print("Drawer is not mounted into live pages.")
print("No visible UI clutter was added.")
print("No Tower API call is built here.")
print("No Vault access is built here.")
