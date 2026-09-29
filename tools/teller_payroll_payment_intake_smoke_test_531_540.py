from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (
        ROOT / path
    ).read_text(
        encoding="utf-8"
    )


def require(condition, message):
    if not condition:
        raise AssertionError(message)


required_files = [
    "src/teller/money/tellerPayrollPaymentForms.js",
    "src/teller/money/tellerPayrollPaymentModel.js",
    "src/teller/money/tellerPayrollPaymentIntake.js",
    "src/teller/money/TellerPayrollPaymentPanel.jsx",
]

for path in required_files:
    require(
        (ROOT / path).exists(),
        f"Missing money-intake file: {path}"
    )


registry = read(
    "src/teller/forms/tellerFormRegistry.js"
)

workspace = read(
    "src/teller/forms/TellerFormsWorkspace.jsx"
)

forms = read(
    "src/teller/money/tellerPayrollPaymentForms.js"
)

model = read(
    "src/teller/money/tellerPayrollPaymentModel.js"
)

intake = read(
    "src/teller/money/tellerPayrollPaymentIntake.js"
)

panel = read(
    "src/teller/money/TellerPayrollPaymentPanel.jsx"
)

css = read(
    "src/teller/forms/tellerForms.css"
)


# GP531 / GP532
for marker in [
    "createBlankTellerPayrollIntakeRecord",
    "createBlankTellerPaymentIntakeRecord",
    "buildTellerPayrollPaymentPreview",
    "session_memory_only",
    "money_moved",
]:
    require(
        marker in model,
        f"Money model missing {marker}"
    )


# No processor claims
for marker in [
    "payroll_processor_connected: false",
    "payment_processor_connected: false",
    "money_moved: false",
]:
    require(
        marker in model,
        f"Money truth missing: {marker}"
    )


# GP533
for marker in [
    "TELLER_PAYROLL_INTAKE_ACTIONS",
    "TELLER_PAYMENT_INTAKE_ACTIONS",
    "getTellerPayrollIntakeStatus",
    "getTellerPaymentIntakeStatus",
]:
    require(
        marker in intake,
        f"Money intake planner missing {marker}"
    )


# GP534-537
new_form_ids = [
    "payroll_cycle_setup",
    "payroll_adjustment_request",
    "bonus_commission_request",
    "off_cycle_pay_request",
    "payroll_correction_request",
    "payment_exception_request",
    "refund_reversal_request",
]

for form_id in new_form_ids:
    require(
        form_id in forms,
        f"Missing new money form: {form_id}"
    )


# Reuse earlier real forms
for existing in [
    "invoice_intake",
    "payment_request",
    "reimbursement_request",
]:
    require(
        existing in registry,
        f"Existing money form lost: {existing}"
    )


# Registry integration
require(
    "TELLER_PAYROLL_PAYMENT_FORMS"
    in registry,
    "Payroll/payment forms not imported."
)

require(
    "...TELLER_PAYROLL_PAYMENT_FORMS"
    in registry,
    "Payroll/payment forms not spread into registry."
)


# Payroll practical fields
for marker in [
    "pay_period_start",
    "pay_period_end",
    "scheduled_payday",
    "pay_frequency",
    "adjustment_type",
    "earning_type",
    "requested_pay_date",
    "affected_payday",
    "issue_type",
]:
    require(
        marker in forms,
        f"Payroll intake missing {marker}"
    )


# Payment practical fields
for marker in [
    "payment_reference",
    "payee",
    "exception_type",
    "original_amount",
    "requested_amount",
    "request_type",
]:
    require(
        marker in forms,
        f"Payment intake missing {marker}"
    )


# No raw regulated identifiers / credentials
for forbidden in [
    'field_id:\n                "routing_number"',
    'field_id:\n                "account_number"',
    'field_id:\n                "ssn"',
    'field_id:\n                "tin"',
]:
    require(
        forbidden not in forms,
        f"Forbidden sensitive field found: {forbidden}"
    )


# No payment execution / processor calls
combined = "\n".join([
    forms,
    model,
    intake,
    panel,
])

for forbidden in [
    "fetch(",
    "axios.",
    "XMLHttpRequest",
    "window.open",
    "vault://",
    "stripe.",
    "paypal.",
]:
    require(
        forbidden.lower()
        not in combined.lower(),
        f"Forbidden direct execution behavior: {forbidden}"
    )


# No fake success states
for forbidden in [
    'payment_sent: true',
    'refund_sent: true',
    'reversal_sent: true',
    'payroll_processed: true',
    'payroll_submitted: true',
    'money_moved: true',
]:
    require(
        forbidden not in combined,
        f"False money-success state found: {forbidden}"
    )


# GP539 UI
require(
    "TellerPayrollPaymentPanel"
    in workspace,
    "Money intake panel not mounted."
)

require(
    "Payroll & Payments"
    in panel,
    "Payroll & Payments heading missing."
)

require(
    "Payroll processor"
    in panel,
    "Payroll processor truth missing."
)

require(
    "Payment processor"
    in panel,
    "Payment processor truth missing."
)

require(
    "Money moved"
    in panel,
    "Money-movement truth missing."
)

require(
    "Not connected"
    in panel,
    "Processor not-connected truth missing."
)

require(
    "teller-money-intake"
    in css,
    "Money intake styling missing."
)


# Do not create another app/dashboard
require(
    "TellerPayrollPaymentPanel"
    not in read("src/App.jsx"),
    "Money Intake must remain inside Forms & Requests, not App."
)


# Existing architecture retained
require(
    "TellerPeopleIntakePanel"
    in workspace,
    "People Intake panel was lost."
)


print(
    "GP531-GP540 PAYROLL + PAYMENT INTAKE SMOKE TEST PASSED"
)

print(
    "Canonical Payroll Intake model: present"
)

print(
    "Canonical Payment Intake model: present"
)

print(
    "New Payroll / Payment forms: 7"
)

print(
    "Existing invoice/payment/reimbursement forms: preserved"
)

print(
    "Payroll processor: not connected"
)

print(
    "Payment processor: not connected"
)

print(
    "Money movement: blocked"
)

print(
    "Raw bank/SSN/TIN collection: blocked"
)

print(
    "Direct Tower/Vault calls: not built"
)
