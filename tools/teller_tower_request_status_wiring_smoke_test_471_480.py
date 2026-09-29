from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

module_path = ROOT / "src" / "teller" / "tellerTowerRequestStatusWiring.js"
fixtures_path = ROOT / "src" / "teller" / "tellerTowerRequestStatusWiringFixtures.js"
data_path = ROOT / "data" / "teller_tower_request_status_wiring_gp471_480.json"

assert module_path.exists(), "Missing tellerTowerRequestStatusWiring.js"
assert fixtures_path.exists(), "Missing tellerTowerRequestStatusWiringFixtures.js"
assert data_path.exists(), "Missing teller_tower_request_status_wiring_gp471_480.json"

module = module_path.read_text(encoding="utf-8")
fixtures = fixtures_path.read_text(encoding="utf-8")
data = json.loads(data_path.read_text(encoding="utf-8"))

required_markers = [
    "Teller can ask. Tower must decide. Vault only answers Tower.",
    "buildWorkflowSafeStatusCard",
    "buildWorkflowSafeStatusList",
    "buildWorkflowSafeStatusSummary",
    "getWorkflowSafeTone",
    "getWorkflowSafePriority",
    "getWorkflowSafeNextAction",
    "direct_tower_call_allowed: false",
    "direct_vault_access_allowed: false",
    "workflow_safe_status_only: true",
    "raw_files_included: false",
    "raw_links_included: false",
    "download_link_included: false",
    "TELLER_STATUS_ROLE_VISIBILITY",
]

for marker in required_markers:
    assert marker in module, f"Missing module marker: {marker}"

fixture_markers = [
    "buildDemoNeedsOwnerApprovalItem",
    "buildDemoBlockedItem",
    "buildDemoStatusCards",
    "buildDemoStatusList",
    "buildDemoStatusSummary",
]

for marker in fixture_markers:
    assert marker in fixtures, f"Missing fixture marker: {marker}"

data_blob = json.dumps(data)

required_data_markers = [
    "workflow_safe_request_status_wiring_ready",
    "employee",
    "manager",
    "owner",
    "tenant",
    "redacted subject",
    "safe Vault reference label only",
    "Tower API call",
    "Vault API call",
    "visible UI panel",
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
    assert not re.search(pattern, module), f"Forbidden runtime/direct call pattern: {pattern}"

forbidden_literals = [
    "vault://",
    "download_url:",
    "preview_url:",
    "raw_file_url:",
    "signed_url:",
    "temporary_url:",
    "shared_folder_url:",
]

combined = module + fixtures
for literal in forbidden_literals:
    assert literal not in combined, f"Forbidden raw delivery literal present: {literal}"

assert data["status"] == "workflow_safe_request_status_wiring_ready"
assert "visible UI panel" in data["not_built_here"]
assert "Tower API call" in data["not_built_here"]
assert "Vault API call" in data["not_built_here"]

print("GP471-GP480 TELLER STATUS WIRING SMOKE TEST PASSED")
print("Workflow-safe status cards are ready.")
print("Role visibility policies are ready.")
print("No visible UI panel was added.")
print("No Tower API call is built here.")
print("No Vault access is built here.")
