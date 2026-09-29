# The Teller — GP541–GP550
## Capture / Scanner Foundation

This pack installs Teller's first real document-capture surface.

## Global Scan action

`Scan` now lives beside `+ New` in the Teller header.

It opens the Capture drawer.

## Real browser intake

Capture supports:

- mobile/browser camera selection
- JPG
- PNG
- WEBP
- PDF
- maximum file size of 25 MB

## Local fingerprinting

Teller creates a SHA-256 fingerprint in the browser.

The fingerprint is used to detect repeated documents prepared during the current Teller session.

The raw file is not persisted.

## Classification

Teller may suggest a document type using:

- the user's explicit selection, or
- low-confidence filename heuristics

A classification suggestion is never accepted as truth automatically.

Human review is required.

## OCR boundary

The OCR adapter contract exists.

No OCR provider is configured.

Therefore:

- no OCR request is sent
- no document text is extracted
- no extracted fields are presented as truth
- no OCR provider receives document bytes

## Capture → Forms

Teller may suggest a role-safe form based on the confirmed document type.

Examples:

- invoice → Invoice Intake
- receipt → Reimbursement Request
- employee document → Employment Document Checklist
- vendor document → Vendor Setup
- payment proof → Payment Exception

This pack does not autofill the form and does not attach the raw document.

## Storage / transport

This pack does not:

- upload documents
- save document bytes to localStorage
- save document bytes to sessionStorage
- send documents to Tower
- send documents to Vault
- create public links
- claim production persistence

Prepared capture records are session-memory metadata only.

## Locked architecture

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask. Tower must decide. Vault only answers Tower.
