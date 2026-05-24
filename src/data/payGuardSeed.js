export const securityDoors = [
  {
    id: "door-001",
    entityKey: "pay",
    doorType: "Export Control",
    title: "Payroll export door",
    status: "Guarded",
    sensitivity: "High",
    nextAction: "Owner step-up required before sensitive payroll export.",
  },
  {
    id: "door-002",
    entityKey: "skincare",
    doorType: "Worker Documents",
    title: "Contractor document door",
    status: "Guarded",
    sensitivity: "Sensitive",
    nextAction: "Only assigned admin or owner can view contractor agreement details.",
  },
  {
    id: "door-003",
    entityKey: "onthego",
    doorType: "Cash Handling",
    title: "Route cash-handling door",
    status: "Guarded",
    sensitivity: "High",
    nextAction: "Route worker access blocked until acknowledgment clears.",
  },
  {
    id: "door-004",
    entityKey: "safehaven",
    doorType: "Foundation Recipient Privacy",
    title: "Aid recipient record door",
    status: "Locked",
    sensitivity: "Recipient-sensitive",
    nextAction: "Recipient details redacted unless approved program clearance exists.",
  },
];

export const stepUpRequests = [
  {
    id: "step-001",
    entityKey: "pay",
    requestType: "Export release",
    title: "Sensitive payroll export",
    status: "Pending",
    requiredRole: "owner",
    reasonRequired: true,
    nextAction: "Owner must approve and provide a reason before export.",
  },
  {
    id: "step-002",
    entityKey: "safehaven",
    requestType: "Sensitive reveal",
    title: "Aid recipient detail reveal",
    status: "Protected",
    requiredRole: "program",
    reasonRequired: true,
    nextAction: "Program officer must justify recipient-sensitive reveal.",
  },
];

export const redactionRules = [
  {
    id: "redact-001",
    entityKey: "pay",
    fieldGroup: "Bank details",
    defaultState: "Masked",
    revealRule: "Owner step-up",
    status: "Active",
  },
  {
    id: "redact-002",
    entityKey: "pay",
    fieldGroup: "Tax identifiers",
    defaultState: "Masked",
    revealRule: "Owner or assigned payroll admin with receipt",
    status: "Active",
  },
  {
    id: "redact-003",
    entityKey: "safehaven",
    fieldGroup: "Recipient identity",
    defaultState: "Redacted",
    revealRule: "Program clearance + reason + audit receipt",
    status: "Locked",
  },
  {
    id: "redact-004",
    entityKey: "onthego",
    fieldGroup: "Route cash notes",
    defaultState: "Limited",
    revealRule: "Owner or assigned route manager",
    status: "Active",
  },
];

export const deniedActions = [
  {
    id: "deny-001",
    entityKey: "safehaven",
    actorRole: "Payroll Admin",
    attemptedAction: "Open recipient-sensitive aid packet",
    reason: "Role not scoped to foundation recipient records.",
    status: "Denied",
  },
  {
    id: "deny-002",
    entityKey: "onthego",
    actorRole: "Route Worker",
    attemptedAction: "View route cash report",
    reason: "Cash report requires manager or owner clearance.",
    status: "Denied",
  },
];

export const revealRequests = [
  {
    id: "reveal-001",
    entityKey: "pay",
    title: "Reveal masked payroll bank account",
    fieldGroup: "Bank details",
    status: "Pending",
    sensitivity: "High",
    nextAction: "Owner step-up and reason required.",
  },
  {
    id: "reveal-002",
    entityKey: "safehaven",
    title: "Reveal aid recipient contact details",
    fieldGroup: "Recipient identity",
    status: "Protected",
    sensitivity: "Recipient-sensitive",
    nextAction: "Program reason and audit receipt required.",
  },
];
