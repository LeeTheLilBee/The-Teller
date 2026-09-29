# The Teller — GP531–GP540
## Payroll + Payment Intake

This pack turns the production Forms Engine into a practical money-intake desk.

## Payroll intake

Teller can now prepare:

- payroll cycle setup
- payroll adjustments
- bonus / commission requests
- off-cycle pay requests
- payroll correction requests

These are workflow records only.

No payroll processor is connected.

## Payment intake

Teller now groups:

- invoice intake
- payment requests
- reimbursement requests
- payment exceptions
- refund / void / reversal requests

These are intake and review workflows only.

No payment processor is connected.

## Money truth

Teller does not claim:

- payroll was submitted
- payroll was processed
- a payment was sent
- a refund was sent
- a reversal was sent
- money moved

## Sensitive information

This pack does not collect:

- bank account numbers
- routing numbers
- SSNs
- TINs

## Refund / reversal boundary

The refund / reversal form requests review.

It does not execute a refund, void, or reversal.

## Persistence

Prepared packets remain session-memory workflows.

Production persistence is not connected yet.

## Locked architecture

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask. Tower must decide. Vault only answers Tower.
