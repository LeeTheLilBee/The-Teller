# The Teller — GP511–GP520
## Real Forms Engine + Production Form Registry

This pack installs the first real blank-form system in The Teller.

## Production behavior

The global `+ New` button opens Forms & Requests.

The visible form list is filtered by the Tower-issued Teller role.

Employee, Manager, and Owner receive different form sets.

Forms are schema-driven rather than hard-coded as separate one-off pages.

## Initial form registry

- Contact information update
- Emergency contact update
- Missing punch request
- Pay question
- Direct deposit change request
- New hire request
- Employee change request
- Reimbursement request
- Vendor setup request
- Invoice intake
- Payment request

## Draft truth

Drafts remain in React/session memory only.

Refreshing the Teller can discard them.

This pack does not claim production persistence.

## Sensitive-data boundary

This pack intentionally does not collect:

- full bank account numbers
- routing numbers
- SSNs
- TINs

The direct-deposit workflow starts the protected request without collecting raw bank credentials.

Future secure capture must respect Tower authority.

## Scanner boundary

Document slots exist as workflow metadata.

No scanner, upload, OCR, or document transport is mounted yet.

That work comes later.

## Locked doctrine

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask. Tower must decide. Vault only answers Tower.
