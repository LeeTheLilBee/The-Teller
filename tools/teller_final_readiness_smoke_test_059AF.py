#!/usr/bin/env python3
"""
THE TELLER PACK 059A-F — FINAL READINESS SMOKE TEST

Run from project root:
python tools/teller_final_readiness_smoke_test_059AF.py
"""

from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TELLER = ROOT / "src" / "teller"
DATA = ROOT / "data"

failures = []

def read(path):
    if not path.exists():
        failures.append(f"Missing file: {path}")
        return ""
    return path.read_text(encoding="utf-8")

employee = read(TELLER / "EmployeeStandaloneWorkspace.jsx")
manager = read(TELLER / "ManagerStandaloneWorkspace.jsx")
owner = read(TELLER / "OwnerMoneyWorkspace.jsx")
owner_dock = read(TELLER / "OwnerEscalationDock.jsx")
tower = read(TELLER / "TowerBackupWorkspace.jsx")
bridge = read(TELLER / "managerOwnerBridge.js")

required_markers = {
    "Employee request confirmation": (employee, "requestSubmitConfirmation"),
    "Employee resolved records": (employee, "FinalReceiptViewer"),
    "Manager review handler": (manager, "decideEmployeeRequest"),
    "Manager escalation": (manager, "escalateEmployeeRequestToOwner"),
    "Owner dock": (owner, "OwnerEscalationDock"),
    "Owner final packet": (owner_dock, "createFinalResolutionPacket"),
    "Tower component": (tower, "Tower"),
    "Demo mode bridge note": (bridge, "PACK_059AF_DEMO_MODE_NOTE"),
}

for label, (text, marker) in required_markers.items():
    if marker not in text:
        failures.append(f"{label}: missing marker {marker}")

for forbidden in ["<RequestThreadPanel", "<WorkflowLifecyclePanel"]:
    if forbidden in tower:
        failures.append(f"Tower pre-clearance safety: forbidden render found: {forbidden}")

if 'import RequestThreadPanel from "./RequestThreadPanel.jsx";' in tower:
    failures.append("Tower pre-clearance safety: RequestThreadPanel import still present")

if 'import WorkflowLifecyclePanel from "./WorkflowLifecyclePanel.jsx";' in tower:
    failures.append("Tower pre-clearance safety: WorkflowLifecyclePanel import still present")

# Owner authority static hints. This is not real security, just a regression guard.
owner_lower = (owner + owner_dock + bridge).lower()
if "cannot revoke owner" not in owner_lower and "owner cannot be revoked" not in owner_lower and "protected owner" not in owner_lower:
    # Do not fail hard if language is absent, but warn.
    print("WARNING: Could not find explicit owner non-revocation language marker in code.")

readiness_path = DATA / "teller_beta_readiness_059AF.json"
if not readiness_path.exists():
    failures.append("Missing readiness JSON")
else:
    try:
        data = json.loads(readiness_path.read_text(encoding="utf-8"))
        if data.get("status") != "demo_ready_not_production_ready":
            failures.append("Readiness JSON status should be demo_ready_not_production_ready")
        if not data.get("not_production_payroll_yet"):
            failures.append("Readiness JSON missing not_production_payroll_yet list")
    except Exception as exc:
        failures.append(f"Readiness JSON invalid: {exc}")

feedback_path = TELLER / "tellerFeedbackLocal.js"
feedback = read(feedback_path)
for marker in ["saveTellerBetaFeedback", "readTellerBetaFeedback", "getTellerFeedbackSummary"]:
    if marker not in feedback:
        failures.append(f"Feedback utility missing {marker}")

if failures:
    print("FINAL READINESS SMOKE TEST FAILED")
    for failure in failures:
        print(" -", failure)
    sys.exit(1)

print("FINAL READINESS SMOKE TEST PASSED")
print("Tower clearance guard, route markers, readiness JSON, and feedback utility are present.")
