from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


WALLS = [
    "tools/teller_practical_use_certification_smoke_test_591_600.py",
    "tools/teller_production_validation_recovery_smoke_test_581_590.py",
    "tools/teller_production_records_search_smoke_test_571_580.py",
    "tools/teller_vendor_document_intake_smoke_test_561_570.py",
    "tools/teller_verified_scanner_autofill_smoke_test_551_560.py",
    "tools/teller_capture_scanner_smoke_test_541_550.py",
    "tools/teller_payroll_payment_intake_smoke_test_531_540.py",
    "tools/teller_people_employment_intake_smoke_test_521_530.py",
    "tools/teller_forms_engine_smoke_test_511_520.py",
    "tools/teller_production_runtime_smoke_test_501_510.py",
    "tools/teller_tower_request_handoff_smoke_test_451_460.py",
    "tools/teller_tower_request_queue_smoke_test_461_470.py",
    "tools/teller_tower_request_status_wiring_smoke_test_471_480.py",
    "tools/teller_tower_request_status_drawer_smoke_test_481_490.py",
    "tools/teller_workflow_safe_closeout_smoke_test_491_500.py",
]


def run(*args):
    result = subprocess.run(
        list(args),
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    if result.stdout.strip():
        print(
            result.stdout.rstrip()
        )

    if result.returncode != 0:
        raise RuntimeError(
            f"Certification command failed: {' '.join(args)}"
        )


print(
    "=" * 120
)

print(
    "THE TELLER — GP591–GP600 — FULL PRACTICAL-USE CERTIFICATION"
)

print(
    "=" * 120
)


print(
    "\n[1/3] EXECUTABLE PRACTICAL-USE SCENARIO\n"
)

run(
    "node",
    "tools/teller_practical_use_scenario_test_591_600.mjs",
)


print(
    "\n[2/3] COMPLETE REGRESSION WALL\n"
)

for wall in WALLS:
    print(
        f"\n→ {wall}"
    )

    run(
        "python",
        wall,
    )


print(
    "\n[3/3] PRODUCTION BUILD\n"
)

run(
    "npm",
    "run",
    "build",
)


print(
    "\n" + "=" * 120
)

print(
    "PASS — TELLER PRACTICAL-USE SOURCE LANE CERTIFIED"
)

print(
    "=" * 120
)

print(
    "Practical-use source = CERTIFIED"
)

print(
    "Deployment readiness = NOT CERTIFIED"
)

print(
    "Deployment authorization = NO"
)

print(
    "Production integrations = INCOMPLETE"
)

print(
    "Production repository = NOT CONNECTED"
)

print(
    "Production OCR = NOT CONNECTED"
)

print(
    "Payroll processor = NOT CONNECTED"
)

print(
    "Payment processor = NOT CONNECTED"
)

print(
    "Tower transport/API = NOT BUILT"
)

print(
    "Direct Vault = BLOCKED"
)
