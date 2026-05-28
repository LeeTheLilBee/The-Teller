#!/usr/bin/env python3
"""
THE TELLER PACK 058A-F — DAILY USE SMOKE TEST HELPER

This helper does static checks after the daily-use cleanup batch.
It does not replace browser testing, but it catches obvious regressions.

Run from project root:
python tools/teller_daily_use_smoke_test_058AF.py
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TELLER = ROOT / "src" / "teller"

checks = [
    ("Employee page", TELLER / "EmployeeStandaloneWorkspace.jsx", [
        "requestSubmitConfirmation",
        "setRequestSubmitConfirmation",
        "FinalReceiptViewer",
    ]),
    ("Manager page", TELLER / "ManagerStandaloneWorkspace.jsx", [
        "mgr-fast-review-strip",
        "decideEmployeeRequest",
    ]),
    ("Owner dock", TELLER / "OwnerEscalationDock.jsx", [
        "ownerDecide",
        "createFinalResolutionPacket",
    ]),
    ("Tower page", TELLER / "TowerBackupWorkspace.jsx", [
        "Tower",
    ]),
    ("Receipt viewer", TELLER / "FinalReceiptViewer.jsx", [
        "ReceiptWorkflowBadges",
        "getReceiptLocation",
    ]),
]

failures = []

for label, path, needles in checks:
    if not path.exists():
        failures.append(f"{label}: missing file {path}")
        continue

    text = path.read_text(encoding="utf-8")

    for needle in needles:
        if needle not in text:
            failures.append(f"{label}: missing expected marker {needle}")

tower_text = (TELLER / "TowerBackupWorkspace.jsx").read_text(encoding="utf-8")
for forbidden in ["<RequestThreadPanel", "<WorkflowLifecyclePanel"]:
    if forbidden in tower_text:
        failures.append(f"Tower page: forbidden pre-clearance render found: {forbidden}")

if failures:
    print("SMOKE TEST FAILED")
    for failure in failures:
        print(" -", failure)
    sys.exit(1)

print("SMOKE TEST PASSED")
print("Daily-use markers present, and Tower pre-clearance proof/thread panels are absent.")
