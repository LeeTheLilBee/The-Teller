# The Teller — GP551–GP560
## Scanner → Verified Form Autofill

This pack connects Teller Capture to the Forms Engine through a strict human-verification boundary.

## Extraction contract

A future OCR provider may return supported document fields.

Teller normalizes those fields into a provider-independent structure.

Unsupported or forbidden sensitive fields are discarded.

## Forbidden extracted values

The extraction system does not accept fields such as:

- SSN
- TIN
- bank account number
- routing number
- card number
- CVV
- passwords / PINs
- passport number
- driver's license number
- identity document number

## Document-specific extraction

Supported field families include:

### Invoice
- vendor
- invoice number
- invoice date
- due date
- subtotal
- tax
- total
- description

### Receipt
- merchant
- expense date
- amount
- business purpose

### Vendor document
- vendor name
- contact
- email
- phone

### Employee / tax document
- employee name only in this pack

### Payment proof
- payment reference
- payee
- amount

## Human verification

OCR/extraction never becomes Teller truth automatically.

Every mapped field starts pending.

The user must:

1. inspect the extracted value
2. correct it if needed
3. Accept or Reject it

Only accepted and verified values can enter an autofill packet.

## Autofill

The verified autofill packet contains:

- target Teller form
- accepted field values
- provenance
- capture ID
- fingerprint
- document type
- confidence
- human-verification receipt

It does not contain the raw document.

It does not submit the form.

It does not move money.

## Capture → Forms

When all mapped fields are reviewed:

Capture → Verified Autofill Packet → Forms & Requests → Draft

The user still reviews the complete Teller form before preparing the workflow.

## OCR provider truth

No OCR provider is configured by default.

Without a configured provider:

- no document fields are extracted
- no fake extraction appears
- no autofill is available

## Locked architecture

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask. Tower must decide. Vault only answers Tower.
