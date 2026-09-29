from pathlib import Path
import re


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
    "src/teller/forms/tellerFormSchema.js",
    "src/teller/forms/tellerFormRegistry.js",
    "src/teller/forms/tellerFormValidation.js",
    "src/teller/forms/tellerFormState.js",
    "src/teller/forms/TellerFormRenderer.jsx",
    "src/teller/forms/TellerFormsWorkspace.jsx",
    "src/teller/forms/tellerForms.css",
]

for path in required_files:
    require(
        (ROOT / path).exists(),
        f"Missing forms engine file: {path}"
    )


schema = read(
    "src/teller/forms/tellerFormSchema.js"
)

registry = read(
    "src/teller/forms/tellerFormRegistry.js"
)

validation = read(
    "src/teller/forms/tellerFormValidation.js"
)

state = read(
    "src/teller/forms/tellerFormState.js"
)

renderer = read(
    "src/teller/forms/TellerFormRenderer.jsx"
)

workspace = read(
    "src/teller/forms/TellerFormsWorkspace.jsx"
)

app = read(
    "src/App.jsx"
)


# GP511
for marker in [
    "TELLER_FORM_FIELD_TYPES",
    "TELLER_FIELD_SENSITIVITY",
    "TELLER_FORM_STATUSES",
    "validateTellerFormDefinition",
]:
    require(
        marker in schema,
        f"GP511 missing {marker}"
    )


# GP512-514
form_ids = [
    "employee_contact_update",
    "emergency_contact_update",
    "missing_punch_request",
    "pay_question_request",
    "direct_deposit_change_request",
    "new_hire_request",
    "employee_change_request",
    "reimbursement_request",
    "vendor_setup_request",
    "invoice_intake",
    "payment_request",
]

for form_id in form_ids:
    require(
        f'form_id: "{form_id}"'
        in registry,
        f"Missing production form: {form_id}"
    )


require(
    'allowed_roles: ["employee", "manager", "owner"]'
    in registry,
    "Role-aware shared forms missing."
)

require(
    'allowed_roles: ["manager", "owner"]'
    in registry,
    "Manager/owner forms missing."
)


# No raw banking/tax identifiers
for forbidden in [
    'field_id: "routing_number"',
    'field_id: "account_number"',
    'field_id: "ssn"',
    'field_id: "social_security_number"',
    'field_id: "tin"',
    'field_id: "taxpayer_identification_number"',
]:
    require(
        forbidden not in registry,
        f"Forbidden raw sensitive field found: {forbidden}"
    )


# Practical new hire fields
for marker in [
    'field_id: "legal_name"',
    'field_id: "start_date"',
    'field_id: "job_title"',
    'field_id: "employment_type"',
    'field_id: "pay_basis"',
    'field_id: "pay_rate"',
]:
    require(
        marker in registry,
        f"New-hire registry missing {marker}"
    )


# Practical invoice fields
for marker in [
    'field_id: "vendor_name"',
    'field_id: "invoice_number"',
    'field_id: "invoice_date"',
    'field_id: "total"',
]:
    require(
        marker in registry,
        f"Invoice registry missing {marker}"
    )


# GP515
for marker in [
    "tellerConditionMatches",
    "isTellerFieldVisible",
    "isTellerFieldRequired",
    "validateTellerFormValues",
    "getTellerFormCompletion",
]:
    require(
        marker in validation,
        f"GP515 missing {marker}"
    )


# GP516
for marker in [
    "createTellerFormDraft",
    "evaluateTellerDraftStatus",
    "updateTellerDraft",
    "createTellerFormSubmissionPacket",
    "session_memory_only",
    "workflow_transport_connected",
    "vault_direct_access_allowed",
]:
    require(
        marker in state,
        f"GP516 missing {marker}"
    )


require(
    "localStorage" not in state,
    "Forms state engine must not persist records to localStorage."
)


# GP517
for marker in [
    "TellerField",
    "Prepare workflow",
    "Draft status",
    "required fields",
]:
    require(
        marker in renderer,
        f"GP517 renderer missing {marker}"
    )


# GP518
require(
    "Forms & Requests" in workspace,
    "Forms workspace title missing."
)

require(
    "listTellerFormsForRole" in workspace,
    "Forms workspace is not role-filtered."
)

require(
    "TellerFormsWorkspace" in app,
    "Forms workspace not mounted in App."
)

require(
    "+ New" in app,
    "Global + New button missing."
)


# GP519 / product boundary
for text in [
    schema,
    registry,
    validation,
    state,
    renderer,
    workspace,
]:
    require(
        "vault://" not in text.lower(),
        "Direct Vault URI found in Forms Engine."
    )

    require(
        "fetch(" not in text,
        "Forms Engine must not call remote APIs in this pack."
    )

    require(
        "axios." not in text,
        "Forms Engine must not call Axios in this pack."
    )


# No scanner pretending
require(
    "getUserMedia" not in workspace,
    "Scanner/camera was mounted too early."
)

require(
    "FileReader" not in workspace,
    "Document capture was mounted too early."
)


# GP501-510 boundary still held
for forbidden in [
    "TowerBackupWorkspace",
    "EmployeeDocumentVaultPanel",
    "Dev test links",
    "teller_view",
]:
    require(
        forbidden not in app,
        f"GP501-GP510 regression: {forbidden}"
    )


print(
    "GP511-GP520 TELLER FORMS ENGINE SMOKE TEST PASSED"
)

print(
    f"Production forms present: {len(form_ids)}"
)

print(
    "Role filtering: present"
)

print(
    "Raw bank/SSN/TIN collection: blocked"
)

print(
    "Persistence claim: session-memory only"
)

print(
    "Scanner/OCR: not mounted"
)

print(
    "Direct Tower/Vault calls: not built"
)
