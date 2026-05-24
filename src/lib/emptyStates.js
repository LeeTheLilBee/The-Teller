const entityEmptyCopy = {
  world: {
    title: "Simplee World is the parent command view.",
    detail: "This view should summarize across assigned companies, not hold every raw record directly.",
    action: "Switch into a company lane when you need operational detail.",
  },
  pay: {
    title: "SimpleePay is ready for operating records.",
    detail: "People, payroll, proof, money flow, and security records will collect here as the company grows.",
    action: "Start with worker setup, payroll draft, or proof packet creation.",
  },
  skincare: {
    title: "SimpleeSkincare is ready for product-side operations.",
    detail: "Creator payouts, contractor records, inventory reserves, giving proof, and brand documents can live here.",
    action: "Start with contractor docs, creator payout review, or product-giving proof.",
  },
  observatory: {
    title: "The Observatory lane is ready for protected business operations.",
    detail: "Trading-product business records, access proof, education seats, and security receipts should stay scoped here.",
    action: "Start with business proof, security receipts, or access-support records.",
  },
  onthego: {
    title: "SimpleeOnTheGo is ready for route operations.",
    detail: "Route workers, cash-handling acknowledgments, ATM readiness, and route proof can live here.",
    action: "Start with route worker clearance or route cash-handling proof.",
  },
  property: {
    title: "SimpleeProperty is ready for property operations.",
    detail: "Property records, housing support, debt planning, vendor proof, and operating reserves can live here.",
    action: "Start with property documents or debt/reserve setup.",
  },
  laundromat: {
    title: "Luxe Laundromat is ready for store operations.",
    detail: "Worker lanes, vendor records, equipment debt, cash flow, and community giving proof can live here.",
    action: "Start with worker/vendor setup or equipment debt records.",
  },
  safehaven: {
    title: "SimpleeSafeHaven is a protected foundation lane.",
    detail: "Recipient-sensitive records, aid packets, restricted funds, and foundation proof should stay redacted by default.",
    action: "Start with foundation documents or protected aid proof.",
  },
};

const drawerEmptyCopy = {
  workerLanes: {
    title: "No workers in this lane yet.",
    detail: "Worker records will show onboarding status, clearance, documents, and next actions.",
    action: "Create the first worker profile later.",
  },
  docs: {
    title: "No documents in this lane yet.",
    detail: "Documents will show request status, sensitivity, expiration, and proof connections.",
    action: "Request or upload the first document later.",
  },
  payRun: {
    title: "No payroll run yet.",
    detail: "Payroll runs will show worker count, gross pay, exceptions, approval status, and seal readiness.",
    action: "Create the first payroll draft later.",
  },
  cashFlow: {
    title: "No money movement yet.",
    detail: "Money movement records will show reserves, blocked movements, debt pressure, and giving connections.",
    action: "Create a money movement or reserve bucket later.",
  },
  proof: {
    title: "No proof packet yet.",
    detail: "Proof packets will collect receipts, approvals, documents, redactions, and seal status.",
    action: "Create the first proof packet later.",
  },
  doors: {
    title: "No special security doors yet.",
    detail: "PayGuard will show protected doors, step-up requests, redaction rules, and denied actions.",
    action: "Add a security door or redaction rule later.",
  },
  calendar: {
    title: "No deadlines yet.",
    detail: "Calendar records will pull payroll dates, debt due dates, document expirations, and approval deadlines.",
    action: "Add dates through payroll, documents, approvals, or debt records.",
  },
};

export function getEmptyState(entityKey, drawerKey) {
  const entityCopy = entityEmptyCopy[entityKey] || entityEmptyCopy.pay;
  const drawerCopy = drawerEmptyCopy[drawerKey];

  if (drawerCopy) {
    return {
      title: drawerCopy.title,
      detail: `${drawerCopy.detail} ${entityCopy.detail}`,
      action: drawerCopy.action,
      entityTitle: entityCopy.title,
    };
  }

  return {
    title: entityCopy.title,
    detail: entityCopy.detail,
    action: entityCopy.action,
    entityTitle: entityCopy.title,
  };
}
