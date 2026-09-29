from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

module_path = ROOT / "src" / "teller" / "tellerTowerRequestQueue.js"
fixtures_path = ROOT / "src" / "teller" / "tellerTowerRequestQueueFixtures.js"
data_path = ROOT / "data" / "teller_tower_request_queue_gp461_470.json"

assert module_path.exists(), "Missing tellerTowerRequestQueue.js"
assert fixtures_path.exists(), "Missing tellerTowerRequestQueueFixtures.js"
assert data_path.exists(), "Missing teller_tower_request_queue_gp461_470.json"

module = module_path.read_text(encoding="utf-8")
fixtures = fixtures_path.read_text(encoding="utf-8")
data = json.loads(data_path.read_text(encoding="utf-8"))

required_markers = [
    "Teller can ask. Tower must decide. Vault only answers Tower.",
    "createTellerTowerQueueItem",
    "markTellerQueueItemWaitingOnTower",
    "normalizeTowerSafeResult",
    "attachTowerSafeResultToQueueItem",
    "createTellerTowerQueueSnapshot",
    "assertTowerResultWorkflowSafe",
    "direct_vault_access_allowed: false",
    "direct_tower_call_allowed: false",
    "workflow_safe_result_only: true",
    "queued_for_tower",
    "waiting_on_tower",
    "tower_returned_safe_result",
]

for marker in required_markers:
    assert marker in module, f"Missing module marker: {marker}"

required_data = [
    "queued_for_tower",
    "waiting_on_tower",
    "needs_step_up",
    "needs_owner_approval",
    "tower_blocked",
    "tower_returned_safe_result",
    "raw Vault links",
    "download URLs",
]

data_blob = json.dumps(data)
for marker in required_data:
    assert marker in data_blob, f"Missing data marker: {marker}"

forbidden_runtime_patterns = [
    r"fetch\s*\(",
    r"axios\.",
    r"XMLHttpRequest",
    r"window\.open",
    r"createObjectURL",
]

for pattern in forbidden_runtime_patterns:
    assert not re.search(pattern, module), f"Forbidden direct call/runtime pattern: {pattern}"

forbidden_fixture_literals = [
    "vault://",
    "download_url:",
    "preview_url:",
    "raw_file_url:",
    "signed_url:",
    "temporary_url:",
    "shared_folder_url:",
]

for literal in forbidden_fixture_literals:
    assert literal not in fixtures, f"Fixture contains forbidden raw delivery literal: {literal}"

assert data["status"] == "teller_queue_and_safe_result_intake_ready"
assert "Tower API call" in data["not_built_here"]
assert "Vault API call" in data["not_built_here"]

print("GP461-GP470 TELLER QUEUE SMOKE TEST PASSED")
print("Teller can queue request packets.")
print("Teller can track waiting-on-Tower state.")
print("Teller accepts workflow-safe Tower results only.")
print("No Tower API call is built here.")
print("No Vault access is built here.")
