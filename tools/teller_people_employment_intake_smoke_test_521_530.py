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
    "src/teller/people/tellerPeopleEmploymentForms.js",
    "src/teller/people/tellerPeopleRecordModel.js",
    "src/teller/people/tellerEmploymentIntake.js",
    "src/teller/people/TellerPeopleIntakePanel.jsx",
]

for path in required_files:
    require(
        (ROOT / path).exists(),
        f"Missing People Intake file: {path}"
    )


registry = read(
    "src/teller/forms/tellerFormRegistry.js"
)

people_forms = read(
    "src/teller/people/tellerPeopleEmploymentForms.js"
)

model = read(
    "src/teller/people/tellerPeopleRecordModel.js"
)

intake = read(
    "src/teller/people/tellerEmploymentIntake.js"
)

panel = read(
    "src/teller/people/TellerPeopleIntakePanel.jsx"
)

workspace = read(
    "src/teller/forms/TellerFormsWorkspace.jsx"
)

css = read(
    "src/teller/forms/tellerForms.css"
)


# GP521 / GP522
for marker in [
    "createBlankTellerPersonRecord",
    "createBlankTellerEmploymentRecord",
    "buildTellerPeopleEmploymentPreview",
    "session_memory_only",
]:
    require(
        marker in model,
        f"People/employment model missing {marker}"
    )


# GP523
for marker in [
    "TELLER_EMPLOYEE_SETUP_STEPS",
    "getTellerEmployeeSetupProgress",
    "new_hire_request",
    "employee_personal_profile",
    "employment_assignment_setup",
    "compensation_setup_request",
    "employment_document_checklist",
]:
    require(
        marker in intake,
        f"Employee setup planner missing {marker}"
    )


# GP524-528
new_form_ids = [
    "employee_personal_profile",
    "employment_assignment_setup",
    "compensation_setup_request",
    "employment_document_checklist",
    "final_pay_termination_request",
]

for form_id in new_form_ids:
    require(
        f'form_id:\n        "{form_id}"'
        in people_forms,
        f"New People form missing: {form_id}"
    )


# Registry integration
require(
    "TELLER_PEOPLE_EMPLOYMENT_FORMS"
    in registry,
    "People forms not imported into canonical registry."
)

require(
    "...TELLER_PEOPLE_EMPLOYMENT_FORMS"
    in registry,
    "People forms not spread into canonical registry."
)


# Practical person fields
for marker in [
    "legal_name",
    "personal_email",
    "phone",
    "address_line_1",
    "emergency_contact_name",
    "emergency_contact_phone",
]:
    require(
        marker in people_forms,
        f"Personal profile missing {marker}"
    )


# Practical employment fields
for marker in [
    "business_unit",
    "start_date",
    "job_title",
    "department",
    "employment_type",
    "manager_name",
    "pay_basis",
    "pay_rate",
    "pay_frequency",
]:
    require(
        marker in people_forms,
        f"Employment setup missing {marker}"
    )


# Official document workflow statuses
for marker in [
    "federal_withholding_status",
    "state_withholding_status",
    "employment_eligibility_status",
    "direct_deposit_status",
    "handbook_status",
    "policy_acknowledgement_status",
]:
    require(
        marker in people_forms,
        f"Document checklist missing {marker}"
    )


# Separation
for marker in [
    "separation_type",
    "last_day_worked",
    "separation_effective_date",
    "final_pay_timing_status",
    "deduction_or_property_review",
]:
    require(
        marker in people_forms,
        f"Final-pay/separation intake missing {marker}"
    )


# Sensitive raw data still blocked
for forbidden in [
    'field_id: "ssn"',
    'field_id: "social_security_number"',
    'field_id: "tin"',
    'field_id: "taxpayer_identification_number"',
    'field_id: "routing_number"',
    'field_id: "account_number"',
    'field_id: "document_number"',
]:
    require(
        forbidden not in people_forms,
        f"Forbidden raw sensitive field found: {forbidden}"
    )


# No official government form content copied
for forbidden in [
    "Form W-4 (2026)",
    "Form I-9",
    "Employee's Withholding Certificate",
    "Employment Eligibility Verification Department",
]:
    require(
        forbidden not in people_forms,
        f"Official-form content was embedded: {forbidden}"
    )


# GP529 UI
require(
    "TellerPeopleIntakePanel"
    in workspace,
    "People Intake panel not mounted in Forms workspace."
)

require(
    "Set up an employee"
    in panel,
    "People Intake progressive setup UI missing."
)

require(
    "Production record"
    in panel,
    "People Intake truth status missing."
)

require(
    "Not saved yet"
    in panel,
    "People Intake persistence truth missing."
)

require(
    "teller-people-intake"
    in css,
    "People Intake styling missing."
)


# No direct external actions
combined = "\n".join([
    people_forms,
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
]:
    require(
        forbidden not in combined,
        f"Forbidden direct external behavior found: {forbidden}"
    )


# No localStorage claim
require(
    "localStorage" not in model,
    "People record model must not store records in localStorage."
)


print(
    "GP521-GP530 PEOPLE + EMPLOYMENT INTAKE SMOKE TEST PASSED"
)

print(
    "Canonical person record model: present"
)

print(
    "Canonical employment relationship model: present"
)

print(
    "Progressive employee setup packet: present"
)

print(
    "New People/Employment forms: 5"
)

print(
    "Raw SSN/TIN/bank/document-number collection: blocked"
)

print(
    "Official government form content: not embedded"
)

print(
    "Production persistence claim: blocked"
)

print(
    "Direct Tower/Vault calls: not built"
)
