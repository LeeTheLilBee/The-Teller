# The Teller — GP521–GP530
## People + Employment Intake

This pack extends the production Forms Engine into a practical employee-setup workflow.

## Employee setup packet

1. New hire request
2. Personal profile
3. Employment assignment
4. Compensation setup
5. Employment document checklist

The packet is progressive rather than one giant employee form.

## People record model

Teller now knows the shape of:

- person identity
- contact information
- address
- emergency contact
- employment relationship
- business assignment
- job/team/manager
- compensation setup
- employment document workflow status

These remain preview/session-memory records until production persistence exists.

## New forms

- Employee personal profile
- Employment assignment setup
- Compensation setup request
- Employment document checklist
- Separation and final-pay request

## Official-form boundary

Teller does not reproduce current government tax or employment-eligibility forms in this pack.

Teller tracks workflow status around those forms.

Official form versions and legal requirements must be verified at the time those integrations are built.

## Sensitive information

This pack does not collect:

- SSNs
- TINs
- employment eligibility document numbers
- bank account numbers
- routing numbers

## Separation / final pay

The separation form records review inputs.

It does not claim Teller has determined lawful final-pay timing or deductions.

## Locked architecture

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask. Tower must decide. Vault only answers Tower.
