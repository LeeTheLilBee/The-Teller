from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

module_path = ROOT / "src" / "teller" / "tellerTowerRequestHandoff.js"
fixtures_path = ROOT / "src" / "teller" / "tellerTowerRequestHandoffFixtures.js"
data_path = ROOT / "data" / "teller_tower_request_handoff_gp451_460.json"

assert module_path.exists(), "Missing tellerTowerRequestHandoff.js"
assert fixtures_path.exists(), "Missing tellerTowerRequestHandoffFixtures.js"
assert data_path.exists(), "Missing teller_tower_request_handoff_gp451_460.json"

module = module_path.read_text(encoding="utf-8")
fixtures = fixtures_path.read_text(encoding="utf-8")
data = json.loads(data_path.read_text(encoding="utf-8"))

required_markers = [
    "Teller can ask. Tower must decide. Vault only answers Tower.",
    "createTellerTowerRequestPacket",
    "createTellerToTowerHandoffEnvelope",
    "assertNoDirectVaultAccess",
    "sanitizeTowerWorkflowResultForTeller",
    "attachTowerWorkflowSafeResult",
    "vault_direct_access_allowed: false",
    "tower_approval_required: true",
    "vault_answers_tower_only: true",
    "pending_tower_review",
    "requested_tower_decision",
]

for marker in required_markers:
    assert marker in module, f"Missing module marker: {marker}"

required_fields = [
    "request_id",
    "workflow_type",
    "requester_role",
    "requester_entity",
    "subject_person_or_vendor",
    "document_or_proof_type",
    "reason_for_request",
    "deadline",
    "sensitivity_level",
    "requested_output_type",
    "business_context",
    "teller_workflow_receipt_hash",
    "tower_approval_required",
]

for field in required_fields:
    assert field in module or field in json.dumps(data), f"Missing packet field: {field}"

forbidden_direct_access_patterns = [
    r"fetch\s*\(",
    r"axios\.",
    r"XMLHttpRequest",
    r"window\.open",
    r"createObjectURL",
]

for pattern in forbidden_direct_access_patterns:
    assert not re.search(pattern, module), f"Forbidden direct access pattern in module: {pattern}"

forbidden_literal_links = [
    "vault://",
    "raw_file_url:",
    "download_url:",
    "preview_url:",
    "shared_folder_url:",
]

for literal in forbidden_literal_links:
    assert literal not in fixtures, f"Fixture contains forbidden raw Vault literal: {literal}"

assert data["vault_direct_access_allowed"] is False
assert data["tower_approval_required"] is True
assert "Vault direct calls" in data["teller_does_not_own"]
assert "direct Vault download" in data["prevented_behaviors"]

print("GP451-GP460 SMOKE TEST PASSED")
print("Teller request packet contract exists.")
print("Tower approval is required.")
print("Direct Vault access remains blocked.")
print("Vault only answers Tower.")
