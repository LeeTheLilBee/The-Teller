# The Teller / SimpleePay — Tower/Vault Handoff Wakeup

Locked doctrine:

Tower is the face.
Teller is the workflow.
Vault is the sealed memory.

Key rule:

Teller can ask.
Tower must decide.
Vault only answers Tower.

Correct flow:

1. Employee/vendor/customer/workflow need appears in Teller.
2. Teller creates a structured workflow request packet.
3. Teller sends request packet to Tower.
4. Tower checks permission, identity, clearance, step-up, owner/admin approval, and redaction rules.
5. Tower requests the allowed output from Vault.
6. Vault answers Tower only.
7. Tower returns allowed workflow result/status/proof to Teller.
8. Teller displays only the workflow-safe result.

Teller owns:

- employee document requests
- vendor document requests
- payroll proof requests
- onboarding packet requests
- agreement proof requests
- payment receipt requests
- workflow state
- workflow notes
- request reason
- requester role context
- business/entity context
- deadline/status
- final workflow-safe output received from Tower

Teller does not own:

- Vault identity clearance
- Vault permission enforcement
- Vault direct calls
- Vault preview protocol
- Vault download protocol
- Vault raw files
- Vault raw links
- Vault shared folders
- Vault external collaborator access
- Vault owner/admin override
- Vault redaction protocol

Teller must prevent:

- direct Vault browsing
- direct Vault download
- direct Vault preview
- direct Vault upload
- direct Vault restore/delete
- public links
- raw file URLs
- shared folders
- employee/vendor/customer access to Vault

Next Teller-facing corridor:

GP451–GP460:
ARCHIVE VAULT — TELLER TO TOWER REQUEST HANDOFF LAYER
