# The Teller — GP561–GP570
## Vendor + Document Intake

This pack makes Teller's vendor and document workflow practical.

## Vendor intake

Teller now supports:

- Vendor Setup
- Vendor Profile
- Vendor Payment Setup Request
- Invoice Intake

The Vendor Payment Setup request is a protected workflow request.

It does not collect:

- bank account numbers
- routing numbers
- TINs / EINs

Those details require a later protected production flow.

## Document intake

Teller now supports:

- Missing Document Request
- Replacement Document Request
- Document Verification Review

The verification workflow records human review status.

It does not create legal certification or Vault verification.

## Capture relationship

Capture remains separate from storage.

Capture may produce:

- capture ID
- fingerprint
- reviewed metadata
- verified extracted values

This pack does not claim the raw document is stored.

## Employee visibility

Employees can use document-request and replacement workflows.

Vendor administration remains Manager / Owner scoped.

Vendor Payment Setup is Owner-only and Tower-review protected.

## Storage truth

The document workflow model explicitly records:

- raw file saved here: false
- uploaded here: false
- Vault link present: false

## Locked architecture

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask. Tower must decide. Vault only answers Tower.
