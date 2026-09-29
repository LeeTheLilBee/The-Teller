
export const TELLER_PACK_050A = {
  pack: "050A",
  name: "Secure Money Intelligence Foundation",
  scope: "money_only",
  status: "foundation_ready",
};

export const MONEY_STATUS = {
  NEEDS_REVIEW: "needs_review",
  READY: "ready",
  BLOCKED: "blocked",
  SENT: "sent",
  PROOF_MISSING: "proof_missing",
  PROOF_SEALED: "proof_sealed",
  TOWER_REQUIRED: "tower_required",
  ESCALATED: "escalated",
  SIGNATURE_REQUIRED: "signature_required",
  VIEW_ONLY: "view_only",
};

export const CONFIDENCE_LEVEL = {
  CONFIRMED: "confirmed",
  ESTIMATED: "estimated",
  NEEDS_PROOF: "needs_proof",
  MANUAL_ENTRY: "manual_entry",
  WAITING_ON_RECEIPT: "waiting_on_receipt",
  TOWER_GATED: "tower_gated",
};

export const VISIBILITY_LEVEL = {
  EMPLOYEE_ONLY: "employee_only",
  MANAGER_TEAM: "manager_team",
  OWNER_ONLY: "owner_only",
  TOWER_REQUIRED: "tower_required",
};

export const ESCALATION_CATEGORY = {
  PAY_ISSUE: "pay_issue",
  WRONG_HOURS: "wrong_hours",
  MISSING_PROOF: "missing_proof",
  PAYMENT_PROBLEM: "payment_problem",
  TOWER_CLEARANCE: "tower_clearance",
  OWNER_REVIEW: "owner_review",
  DOCUMENT_ISSUE: "document_issue",
  OTHER: "other",
};

export const tellerCopy = {
  en: {
    secure: "Secure",
    confirmed: "Confirmed",
    estimated: "Estimated",
    needsProof: "Needs proof",
    manualEntry: "Manual entry",
    waitingOnReceipt: "Waiting on receipt",
    towerGated: "Tower-gated",
    towerRequired: "Tower required",
    proofSealed: "Proof sealed",
    proofMissing: "Proof missing",
    signatureRequired: "Signature required",
    viewOnly: "View only",
    employeeOnly: "Employee-only",
    managerTeam: "Manager team",
    ownerOnly: "Owner-only",
    todayMoneyFocus: "Today's Money Focus",
    whySeeingThis: "Why am I seeing this?",
    secureDownload: "Secure download",
    secureDownloadBody: "You are about to view or download a sensitive payroll document. This access will be logged.",
    continue: "Continue",
    cancel: "Cancel",
    finalReview: "Final review",
    finalReviewBody: "Before this moves forward, The Teller will confirm the money action, save proof, and create a receipt.",
    sendToTower: "Send to The Tower",
    createReceipt: "Create receipt",
    escalate: "Escalate",
    calmMoneyMode: "Calm Money Mode",
    calmMoneyModeBody: "One task at a time. The highest-priority money item comes first.",
    accessReceipt: "Access receipt",
    documentVersion: "Document version",
    lastUpdated: "Last updated",
    nextReview: "Next review",
    source: "Source",
    confidence: "Confidence",
    visibility: "Visibility",
    actionRequired: "Action required",
  },
  es: {
    secure: "Seguro",
    confirmed: "Confirmado",
    estimated: "Estimado",
    needsProof: "Necesita comprobante",
    manualEntry: "Entrada manual",
    waitingOnReceipt: "Esperando recibo",
    towerGated: "Protegido por The Tower",
    towerRequired: "The Tower requerido",
    proofSealed: "Comprobante sellado",
    proofMissing: "Falta comprobante",
    signatureRequired: "Firma requerida",
    viewOnly: "Solo ver",
    employeeOnly: "Solo empleado",
    managerTeam: "Equipo del gerente",
    ownerOnly: "Solo dueña",
    todayMoneyFocus: "Enfoque de dinero de hoy",
    whySeeingThis: "¿Por qué veo esto?",
    secureDownload: "Descarga segura",
    secureDownloadBody: "Estás por ver o descargar un documento sensible de nómina. Este acceso será registrado.",
    continue: "Continuar",
    cancel: "Cancelar",
    finalReview: "Revisión final",
    finalReviewBody: "Antes de continuar, The Teller confirmará la acción de dinero, guardará el comprobante y creará un recibo.",
    sendToTower: "Enviar a The Tower",
    createReceipt: "Crear recibo",
    escalate: "Escalar",
    calmMoneyMode: "Modo de dinero calmado",
    calmMoneyModeBody: "Una tarea a la vez. El asunto de dinero más importante va primero.",
    accessReceipt: "Recibo de acceso",
    documentVersion: "Versión del documento",
    lastUpdated: "Última actualización",
    nextReview: "Próxima revisión",
    source: "Fuente",
    confidence: "Confianza",
    visibility: "Visibilidad",
    actionRequired: "Acción requerida",
  },
};

export function getCopy(language = "en") {
  return tellerCopy[language] || tellerCopy.en;
}

export function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

export function isTowerRequired(status) {
  return normalizeStatus(status).includes("tower") || status === MONEY_STATUS.TOWER_REQUIRED;
}

export function isSignatureRequired(status) {
  return normalizeStatus(status).includes("signature") || status === MONEY_STATUS.SIGNATURE_REQUIRED;
}

export function isProofSensitive(status) {
  const normalized = normalizeStatus(status);
  return normalized.includes("proof") || normalized.includes("receipt") || normalized.includes("sealed");
}

export function makeTraceId(prefix = "TELLER") {
  const seed = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${seed}`;
}

export function makeAccessReceipt({ actorId, action, target, category = "access", towerRequired = false }) {
  return {
    receiptId: makeTraceId("RCPT"),
    actorId,
    action,
    target,
    category,
    towerRequired,
    createdAt: new Date().toISOString(),
    status: towerRequired ? "queued_for_tower" : "recorded",
  };
}

export function buildSecurityChips(item = {}, language = "en") {
  const copy = getCopy(language);
  const chips = [];

  if (item.visibility === VISIBILITY_LEVEL.EMPLOYEE_ONLY) chips.push({ label: copy.employeeOnly, tone: "private" });
  if (item.visibility === VISIBILITY_LEVEL.MANAGER_TEAM) chips.push({ label: copy.managerTeam, tone: "team" });
  if (item.visibility === VISIBILITY_LEVEL.OWNER_ONLY) chips.push({ label: copy.ownerOnly, tone: "owner" });
  if (item.visibility === VISIBILITY_LEVEL.TOWER_REQUIRED || isTowerRequired(item.status)) chips.push({ label: copy.towerRequired, tone: "warning" });

  if (item.status === MONEY_STATUS.PROOF_SEALED) chips.push({ label: copy.proofSealed, tone: "good" });
  if (item.status === MONEY_STATUS.PROOF_MISSING) chips.push({ label: copy.proofMissing, tone: "warning" });
  if (item.status === MONEY_STATUS.SIGNATURE_REQUIRED || isSignatureRequired(item.status)) chips.push({ label: copy.signatureRequired, tone: "warning" });
  if (item.status === MONEY_STATUS.VIEW_ONLY) chips.push({ label: copy.viewOnly, tone: "neutral" });

  return chips;
}

export function confidenceLabel(confidence, language = "en") {
  const copy = getCopy(language);
  const normalized = normalizeStatus(confidence);

  if (normalized === CONFIDENCE_LEVEL.CONFIRMED) return copy.confirmed;
  if (normalized === CONFIDENCE_LEVEL.ESTIMATED) return copy.estimated;
  if (normalized === CONFIDENCE_LEVEL.NEEDS_PROOF) return copy.needsProof;
  if (normalized === CONFIDENCE_LEVEL.MANUAL_ENTRY) return copy.manualEntry;
  if (normalized === CONFIDENCE_LEVEL.WAITING_ON_RECEIPT) return copy.waitingOnReceipt;
  if (normalized === CONFIDENCE_LEVEL.TOWER_GATED) return copy.towerGated;

  return confidence || copy.estimated;
}

export function chooseTodayMoneyFocus(queue = []) {
  if (!Array.isArray(queue) || queue.length === 0) return null;

  const scoreItem = (item) => {
    let score = 0;

    if (item.status === MONEY_STATUS.BLOCKED) score += 80;
    if (item.status === MONEY_STATUS.TOWER_REQUIRED) score += 70;
    if (item.status === MONEY_STATUS.PROOF_MISSING) score += 60;
    if (item.status === MONEY_STATUS.NEEDS_REVIEW) score += 50;
    if (item.status === MONEY_STATUS.SIGNATURE_REQUIRED) score += 45;
    if (String(item.due || "").toLowerCase().includes("today")) score += 40;
    if (String(item.due || "").toLowerCase().includes("soon")) score += 20;
    if (item.priority) score += Number(item.priority) || 0;

    return score;
  };

  return [...queue].sort((a, b) => scoreItem(b) - scoreItem(a))[0];
}

export const defaultEmployeeDocuments = [
  {
    key: "w2",
    label: "W-2",
    version: "2025",
    status: MONEY_STATUS.VIEW_ONLY,
    visibility: VISIBILITY_LEVEL.EMPLOYEE_ONLY,
    source: "payroll_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    lastUpdated: "2026-01-31",
    nextReview: "2027-01-31",
  },
  {
    key: "w4",
    label: "W-4",
    version: "current",
    status: MONEY_STATUS.TOWER_REQUIRED,
    visibility: VISIBILITY_LEVEL.EMPLOYEE_ONLY,
    source: "employee_tax_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    lastUpdated: "2026-05-24",
    nextReview: "2026-12-31",
  },
  {
    key: "i9",
    label: "I-9",
    version: "on_file",
    status: MONEY_STATUS.VIEW_ONLY,
    visibility: VISIBILITY_LEVEL.EMPLOYEE_ONLY,
    source: "identity_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    lastUpdated: "2026-05-24",
    nextReview: "2027-05-24",
  },
  {
    key: "paystubs",
    label: "Pay stubs",
    version: "rolling",
    status: MONEY_STATUS.VIEW_ONLY,
    visibility: VISIBILITY_LEVEL.EMPLOYEE_ONLY,
    source: "payroll_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    lastUpdated: "2026-06-14",
    nextReview: "next_pay_cycle",
  },
  {
    key: "direct_deposit",
    label: "Direct deposit form",
    version: "current",
    status: MONEY_STATUS.TOWER_REQUIRED,
    visibility: VISIBILITY_LEVEL.EMPLOYEE_ONLY,
    source: "payment_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    lastUpdated: "2026-05-24",
    nextReview: "on_change",
  },
  {
    key: "handbook",
    label: "Employee handbook",
    version: "v2026.1",
    status: MONEY_STATUS.SIGNATURE_REQUIRED,
    visibility: VISIBILITY_LEVEL.EMPLOYEE_ONLY,
    source: "policy_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    lastUpdated: "2026-05-24",
    nextReview: "2027-01-01",
  },
];

export const defaultMoneyQueue = [
  {
    key: "payroll-readiness",
    lane: "Pay People",
    business: "SimpleePay",
    title: "Payroll run needs final readiness",
    amount: "$4.8k",
    due: "Today",
    status: MONEY_STATUS.NEEDS_REVIEW,
    source: "payroll_record",
    confidence: CONFIDENCE_LEVEL.NEEDS_PROOF,
    visibility: VISIBILITY_LEVEL.OWNER_ONLY,
    priority: 90,
  },
  {
    key: "handbook-signature",
    lane: "Sign Paperwork",
    business: "SimpleePay",
    title: "Employee handbook signature required",
    amount: "1 signature",
    due: "Soon",
    status: MONEY_STATUS.SIGNATURE_REQUIRED,
    source: "policy_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    visibility: VISIBILITY_LEVEL.EMPLOYEE_ONLY,
    priority: 78,
  },
  {
    key: "mrktrade-handoff",
    lane: "Tower Handoff",
    business: "MrkTrade",
    title: "Financial paperwork packet",
    amount: "$3.1k",
    due: "Protected",
    status: MONEY_STATUS.TOWER_REQUIRED,
    source: "manual_entry",
    confidence: CONFIDENCE_LEVEL.TOWER_GATED,
    visibility: VISIBILITY_LEVEL.TOWER_REQUIRED,
    priority: 72,
  },
];

export function buildFinalActionPreview(action = {}, language = "en") {
  const copy = getCopy(language);

  return {
    title: action.previewTitle || copy.finalReview,
    body: action.previewBody || copy.finalReviewBody,
    willMoveMoney: Boolean(action.willMoveMoney),
    willSaveProof: Boolean(action.willSaveProof),
    willCreateReceipt: true,
    willSendToTower: Boolean(action.willSendToTower || isTowerRequired(action.status)),
  };
}
